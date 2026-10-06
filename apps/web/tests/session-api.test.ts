import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { testDatabase } from "@fork/db/testing";
import type { Database } from "@fork/db";
import { handleApi } from "../src/server/api";
import { AppError } from "../src/server/errors";
vi.mock("server-only", () => ({}));
const runtime = vi.hoisted(() => ({
  identity: vi.fn(),
  social: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("../src/server/runtime", () => ({
  getIdentityRuntime: runtime.identity,
  getRuntime: runtime.social,
  testMode: () => false,
}));
const wallet = `0x${"12".repeat(20)}`,
  second = `0x${"34".repeat(20)}`,
  wrong = `0x${"56".repeat(20)}`;
let connection: { db: Database; close: () => Promise<void> };
const identity = {
  did: "did:privy:unit-session",
  wallets: [
    { address: wallet, kind: "embedded" },
    { address: second, kind: "external" },
  ],
};
function request(
  method: string,
  token?: string,
  selection?: string,
  headerWallet?: string,
) {
  return new Request("http://localhost:3000/api/session", {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(headerWallet ? { "x-fork-wallet": headerWallet } : {}),
      "content-type": "application/json",
    },
    ...(method === "POST"
      ? { body: JSON.stringify(selection ? { wallet: selection } : {}) }
      : {}),
  });
}
beforeAll(async () => {
  connection = await testDatabase(
    fileURLToPath(new URL("../../../packages/db/migrations", import.meta.url)),
  );
  runtime.identity.mockResolvedValue({
    db: connection.db,
    auth: { verify: runtime.verify },
    adminDids: new Set(),
  });
  runtime.verify.mockImplementation(async (token: string) => {
    if (token !== "unit-verified")
      throw new AppError(
        "AUTH_INVALID",
        "Your session has expired or is invalid.",
        401,
        "Sign in again.",
      );
    return identity;
  });
  runtime.social.mockRejectedValue(
    new Error("Registry and Envio are deliberately unavailable."),
  );
}, 20000);
afterAll(async () => connection.close());
describe("session API independence and ownership (isolated database/verifier)", () => {
  it("bootstraps and resumes a primary without registry/indexer prerequisites", async () => {
    const initial = await handleApi(request("POST", "unit-verified"), [
      "session",
    ]);
    expect(initial.status).toBe(200);
    const first = (await initial.json()).data.session;
    expect(first.wallet).toBe(wallet);
    const resumed = await handleApi(request("POST", "unit-verified"), [
      "session",
    ]);
    expect((await resumed.json()).data.session).toEqual(first);
    expect(runtime.social).not.toHaveBeenCalled();
  });
  it("only changes primary on explicit linked selection and rejects a forged address", async () => {
    const changed = await handleApi(request("POST", "unit-verified", second), [
      "session",
    ]);
    expect((await changed.json()).data.session.wallet).toBe(second);
    const forged = await handleApi(request("POST", "unit-verified", wrong), [
      "session",
    ]);
    expect(forged.status).toBe(403);
    expect((await forged.json()).error.code).toBe("WRONG_WALLET");
    const resumed = await handleApi(request("POST", "unit-verified"), [
      "session",
    ]);
    expect((await resumed.json()).data.session.wallet).toBe(second);
    expect(
      (
        await handleApi(request("GET", "unit-verified", undefined, wallet), [
          "session",
        ])
      ).status,
    ).toBe(403);
    expect(
      (
        await handleApi(request("GET", "unit-verified", undefined, second), [
          "session",
        ])
      ).status,
    ).toBe(200);
  });
  it("rejects missing/invalid tokens and unauthenticated writes before social setup", async () => {
    expect((await handleApi(request("POST"), ["session"])).status).toBe(401);
    expect(
      (await handleApi(request("POST", "invalid"), ["session"])).status,
    ).toBe(401);
    expect((await handleApi(request("POST"), ["theses", "draft"])).status).toBe(
      401,
    );
    expect(runtime.social).not.toHaveBeenCalled();
  });
  it("keeps test identity routes unavailable", async () => {
    expect(
      (await handleApi(request("POST"), ["test", "identity"])).status,
    ).toBe(404);
  });
});
