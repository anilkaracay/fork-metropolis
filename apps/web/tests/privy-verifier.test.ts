import { generateKeyPairSync, sign } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { privyVerifier } from "../src/server/auth";

// Unit-only ephemeral JWT key. The real SDK verifies signatures/claims;
// only its authoritative user HTTP response is isolated. No live auth claim.
const transport = vi.hoisted(() => ({ key: "", response: {}, fetch: vi.fn() }));
vi.mock("@privy-io/node", async (importOriginal) => {
  const sdk = await importOriginal<typeof import("@privy-io/node")>();
  return {
    ...sdk,
    PrivyClient: class extends sdk.PrivyClient {
      constructor(options: ConstructorParameters<typeof sdk.PrivyClient>[0]) {
        super({
          ...options,
          jwtVerificationKey: transport.key,
          fetch: transport.fetch,
        });
      }
    },
  };
});
const appId = "unit-app",
  did = "did:privy:unit-user";
const embedded = `0x${"ab".repeat(20)}`,
  external = `0x${"cd".repeat(20)}`;
let key: ReturnType<typeof generateKeyPairSync>["privateKey"];
function token(claims: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ typ: "JWT", alg: "ES256" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "privy.io",
      aud: appId,
      sub: did,
      sid: "unit-session",
      iat: now,
      exp: now + 60,
      ...claims,
    }),
  ).toString("base64url");
  const input = `${header}.${payload}`;
  return `${input}.${sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}
beforeAll(() => {
  const pair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  key = pair.privateKey;
  transport.key = pair.publicKey
    .export({ type: "spki", format: "pem" })
    .toString();
});
beforeEach(() => {
  transport.response = {
    id: did,
    linked_accounts: [
      {
        type: "wallet",
        chain_type: "ethereum",
        address: embedded.toUpperCase().replace("0X", "0x"),
        wallet_client_type: "privy",
      },
      {
        type: "wallet",
        chain_type: "ethereum",
        address: external,
        wallet_client_type: "metamask",
      },
      { type: "wallet", chain_type: "solana", address: "unit-solana" },
      { type: "email", address: "private@example.invalid" },
    ],
  };
  transport.fetch.mockReset();
  transport.fetch.mockImplementation(async () =>
    Response.json(transport.response),
  );
});
describe("official Privy SDK verification boundary (unit JWTs only)", () => {
  it("verifies ES256 claims and retrieves authoritative EVM wallets without personal details", async () => {
    const identity = await privyVerifier(appId, "unit-secret").verify(token());
    expect(identity).toEqual({
      did,
      wallets: [
        { address: embedded, kind: "embedded" },
        { address: external, kind: "external" },
      ],
    });
    expect(transport.fetch).toHaveBeenCalledOnce();
    expect(String(transport.fetch.mock.calls[0]![0])).toContain(
      `/v1/users/${did}`,
    );
    expect(JSON.stringify(identity)).not.toContain("private@example.invalid");
  });
  it.each([
    ["expired", () => token({ exp: 1 })],
    ["wrong audience", () => token({ aud: "other-app" })],
    ["wrong issuer", () => token({ iss: "other-issuer" })],
    ["invalid", () => "not-a-jwt"],
    [
      "tampered",
      () => {
        const valid = token();
        return (
          valid.slice(0, valid.lastIndexOf(".") + 1) +
          Buffer.alloc(64).toString("base64url")
        );
      },
    ],
  ])("rejects %s tokens before fetching the user", async (_, makeToken) => {
    await expect(
      privyVerifier(appId, "unit-secret").verify(makeToken()),
    ).rejects.toMatchObject({
      code: "AUTH_INVALID",
      status: 401,
      message: "Your session has expired or is invalid.",
    });
    expect(transport.fetch).not.toHaveBeenCalled();
  });
  it("rejects a mismatch between the verified subject and authoritative user", async () => {
    transport.response = { id: "did:privy:other", linked_accounts: [] };
    await expect(
      privyVerifier(appId, "unit-secret").verify(token()),
    ).rejects.toMatchObject({ code: "AUTH_INVALID", status: 401 });
  });
  it("redacts upstream failures rather than exposing credentials or personal details", async () => {
    transport.fetch.mockImplementation(async () =>
      Response.json(
        { error: "private@example.invalid unit-secret" },
        { status: 400 },
      ),
    );
    await expect(
      privyVerifier(appId, "unit-secret").verify(token()),
    ).rejects.toMatchObject({
      code: "AUTH_UNAVAILABLE",
      status: 503,
      message: "Identity verification is temporarily unavailable.",
    });
  });
});
