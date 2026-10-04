import { describe, expect, it, vi } from "vitest";
import fixture from "./fixtures/perpl-context-2026-10-04.json";
import {
  fetchPerplPublicContext,
  resolveMvpContext,
  PERPL_TESTNET_CONTEXT_URL,
  PublicContextError,
} from "../src/perpl-context.ts";

const response = () => new Response(JSON.stringify(fixture), { status: 200 });
describe("validated public context", () => {
  it("resolves the real observed deployment and collateral", () => {
    const context = resolveMvpContext(fixture);
    expect(context.chainId).toBe(10143);
    expect(context.instanceId).toBe(12);
    expect(context.exchangeAddress).toBe(
      "0x1964c32f0be608e7d29302aff5e61268e72080cc",
    );
    expect(context.collateral).toEqual({
      address: "0xa9012a055bd4e0edff8ce09f960291c09d5322dc",
      symbol: "AUSD",
      decimals: 6,
    });
    expect(context.minAccountOpenAmount).toBe("100000000");
    expect(Object.values(context.markets).map((market) => market.id)).toEqual([
      16, 32, 48, 64,
    ]);
  });
  it("maps IDs dynamically rather than accepting old IDs", () => {
    const changed = structuredClone(fixture);
    changed.markets.find((market) => market.symbol === "ETH")!.id = 33;
    expect(resolveMvpContext(changed).markets.ETH.id).toBe(33);
  });
  it("rejects wrong chain with recovery", () => {
    const changed = structuredClone(fixture);
    changed.chain.chain_id = 143;
    try {
      resolveMvpContext(changed);
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(PublicContextError);
      expect(error).toMatchObject({
        code: "PERPL_WRONG_CHAIN",
        retryable: false,
      });
      expect((error as PublicContextError).recovery).toContain("Retry");
    }
  });
  it.each(["missing", "closed", "duplicate"])(
    "fails closed for a %s required market",
    (state) => {
      const changed = structuredClone(fixture);
      const market = changed.markets.find((market) => market.symbol === "MON")!;
      if (state === "missing")
        changed.markets = changed.markets.filter((item) => item !== market);
      if (state === "closed") market.config.is_open = false;
      if (state === "duplicate") changed.markets.push(structuredClone(market));
      expect(() => resolveMvpContext(changed)).toThrow(/MON/);
    },
  );
  it.each([
    "missing collateral",
    "wrong instance",
    "duplicate collateral",
    "zero exchange",
  ])("rejects %s", (state) => {
    const changed = structuredClone(fixture);
    if (state === "missing collateral") changed.tokens = [];
    if (state === "wrong instance") changed.instances[0]!.id = 99;
    if (state === "duplicate collateral")
      changed.tokens.push(structuredClone(changed.tokens[0]!));
    if (state === "zero exchange")
      changed.instances[0]!.address = "0x" + "0".repeat(40);
    expect(() => resolveMvpContext(changed)).toThrow(PublicContextError);
  });
  it("rejects malformed JSON shape", () => {
    expect(() => resolveMvpContext({ chain: fixture.chain })).toThrow(
      PublicContextError,
    );
  });
});

describe("public fetch timeout/retry mapping", () => {
  it("preserves timeout mapping when headers arrive but body reading expires", async () => {
    const slowBody = response();
    vi.spyOn(slowBody, "json").mockRejectedValue(
      new DOMException("body timeout", "TimeoutError"),
    );
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(slowBody);
    await expect(
      fetchPerplPublicContext({ fetch: fetcher, retryDelayMs: 0 }),
    ).rejects.toMatchObject({ code: "PERPL_TIMEOUT" });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("uses only the fixed unauthenticated GET endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response());
    await fetchPerplPublicContext({ fetch: fetcher });
    expect(fetcher).toHaveBeenCalledWith(
      PERPL_TESTNET_CONTEXT_URL,
      expect.objectContaining({
        method: "GET",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetcher.mock.calls[0]![1]).not.toHaveProperty("headers");
  });
  it("retries transient server failure once when recovered", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(response());
    await expect(
      fetchPerplPublicContext({ fetch: fetcher, retryDelayMs: 0 }),
    ).resolves.toHaveProperty("chainId", 10143);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("caps transient retries at three attempts", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 429 }));
    await expect(
      fetchPerplPublicContext({ fetch: fetcher, retryDelayMs: 0 }),
    ).rejects.toMatchObject({ code: "PERPL_UNAVAILABLE", retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("does not retry permanent HTTP or invalid JSON responses", async () => {
    const unavailable = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 403 }));
    await expect(
      fetchPerplPublicContext({ fetch: unavailable }),
    ).rejects.toMatchObject({ code: "PERPL_UNAVAILABLE", retryable: false });
    expect(unavailable).toHaveBeenCalledTimes(1);
    const malformed = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not json"));
    await expect(
      fetchPerplPublicContext({ fetch: malformed }),
    ).rejects.toMatchObject({ code: "PERPL_INVALID_CONTEXT" });
    expect(malformed).toHaveBeenCalledTimes(1);
  });
  it("maps expired network operations to timeout", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    await expect(
      fetchPerplPublicContext({ fetch: fetcher, retryDelayMs: 0 }),
    ).rejects.toMatchObject({ code: "PERPL_TIMEOUT" });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("attaches a real short timeout signal", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener(
            "abort",
            () => reject(init!.signal!.reason),
            { once: true },
          );
        }),
    );
    await expect(
      fetchPerplPublicContext({
        fetch: fetcher,
        timeoutMs: 10,
        retryDelayMs: 0,
      }),
    ).rejects.toMatchObject({ code: "PERPL_TIMEOUT" });
  });
});
