import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schema as s } from "@fork/db";
import { testDatabase } from "@fork/db/testing";
import { nansenContext, normalizeNansen } from "../src/server/nansen";
vi.mock("server-only", () => ({}));
let connection: Awaited<ReturnType<typeof testDatabase>>;
let userId: string;
const wallet = `0x${"11".repeat(20)}`;
const now = new Date("2026-10-04T15:00:00Z");
const summary = {
  realized_pnl_usd: 42,
  realized_pnl_percent: 0.1,
  win_rate: 0.5,
  traded_token_count: 2,
  traded_times: 4,
  address_labels: ["never-expose"],
  top5_tokens: [{ token_symbol: "not-redistributed" }],
};
beforeEach(async () => {
  connection = await testDatabase(
    fileURLToPath(new URL("../../../packages/db/migrations", import.meta.url)),
  );
  const [user] = await connection.db
    .insert(s.users)
    .values({ privyDid: randomUUID(), handle: "realuser" })
    .returning();
  userId = user!.id;
  await connection.db
    .insert(s.wallets)
    .values({ address: wallet, userId, kind: "embedded" });
});
afterEach(async () => {
  await connection.close();
});
describe("permitted optional Nansen context", () => {
  it("returns only allowed scalar summary fields, with explicit mainnet/window provenance", () => {
    const value = normalizeNansen(summary, wallet, now);
    expect(value.chain).toBe("monad-mainnet");
    expect(value.window).toEqual({
      from: "2026-09-04T00:00:00.000Z",
      to: "2026-10-04T00:00:00.000Z",
    });
    expect(value.summary?.realizedPnlUsd).toBe(42);
    expect(JSON.stringify(value)).not.toContain("never-expose");
    expect(JSON.stringify(value)).not.toContain("not-redistributed");
  });
  it("missing credentials never cause an upstream call or synthetic history", async () => {
    const fetcher = vi.fn();
    const result = await nansenContext(
      connection.db,
      undefined,
      20,
      fetcher,
      () => now,
    )(userId, wallet);
    expect(result.status).toBe("disabled");
    expect(result.summary).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses the fixed official endpoint and a shared one-hour cache across service instances", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(summary));
    const read = () =>
      nansenContext(
        connection.db,
        "test-key",
        20,
        fetcher,
        () => now,
      )(userId, wallet);
    expect((await read()).status).toBe("available");
    expect((await read()).summary?.sales).toBe(4);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, request] = fetcher.mock.calls[0]!;
    expect(url).toBe(
      "https://api.nansen.ai/api/v1/profiler/address/pnl-summary",
    );
    expect(request.method).toBe("POST");
    expect(request.redirect).toBe("error");
    expect(JSON.parse(request.body)).toEqual({
      chain: "monad",
      wallet_address: wallet,
      date: {
        from: "2026-09-04T00:00:00.000Z",
        to: "2026-10-04T00:00:00.000Z",
      },
    });
    expect((await connection.db.select().from(s.rateBuckets))[0]?.count).toBe(
      10,
    );
  });
  it("fresh-wallet empty history is cached without fabricating a zero-performance score", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ ...summary, traded_token_count: 0, traded_times: 0 }),
      );
    const read = nansenContext(
      connection.db,
      "test-key",
      20,
      fetcher,
      () => now,
    );
    const result = await read(userId, wallet);
    expect(result.status).toBe("empty");
    expect(result.summary).toBeNull();
    await read(userId, wallet);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([401, 402, 403, 429, 500])(
    "HTTP %i preserves fallback and error-cache without billed retries",
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(
          new Response("sensitive upstream error", { status }),
        );
      const read = nansenContext(
        connection.db,
        "test-key",
        20,
        fetcher,
        () => now,
      );
      const result = await read(userId, wallet);
      expect(result.status).toBe("unavailable");
      expect(result.summary).toBeNull();
      expect(JSON.stringify(result)).not.toContain("sensitive");
      await read(userId, wallet);
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("stale permitted context survives a real adapter outage without changing reputation fields", async () => {
    let current = now;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(summary))
      .mockRejectedValue(new Error("private-header"));
    const read = nansenContext(
      connection.db,
      "test-key",
      20,
      fetcher,
      () => current,
    );
    await read(userId, wallet);
    current = new Date(now.getTime() + 3600001);
    const result = await read(userId, wallet);
    expect(result.stale).toBe(true);
    expect(result.summary?.realizedPnlUsd).toBe(42);
    expect(result).not.toHaveProperty("reputation");
  });
  it("global daily reservations prevent a third billed refresh across instances", async () => {
    let current = now;
    const fetcher = vi.fn().mockResolvedValue(Response.json(summary));
    const read = () =>
      nansenContext(
        connection.db,
        "test-key",
        20,
        fetcher,
        () => current,
      )(userId, wallet);
    await read();
    current = new Date(now.getTime() + 3600001);
    await read();
    current = new Date(now.getTime() + 7200002);
    expect((await read()).stale).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("malformed response and insufficient budget fail closed without exposing raw data", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ arbitrary: "secret" }));
    expect(
      (
        await nansenContext(
          connection.db,
          "test-key",
          9,
          fetcher,
          () => now,
        )(userId, wallet)
      ).status,
    ).toBe("unavailable");
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      (
        await nansenContext(
          connection.db,
          "test-key",
          20,
          fetcher,
          () => now,
        )(userId, wallet)
      ).summary,
    ).toBeNull();
  });
});
