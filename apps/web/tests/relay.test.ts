import { describe, expect, it } from "vitest";
import {
  canonicalRelayTarget,
  prepareReadOnlyRelay,
  relayLog,
} from "../src/server/perpl-relay";
const now = 1770000000000;
const input = {
  request: { endpoint: "fills", query: { count: 100, page: "next_page==" } },
  proof: {
    apiKey: "test-api-key",
    timestampMs: String(now),
    nonce: "one-use-nonce-1234",
    signature: "S".repeat(86),
  },
};
describe("read-only Perpl boundary, without transport", () => {
  it("constructs only the official testnet target and exact signed canonical path", () => {
    const r = prepareReadOnlyRelay(input, now);
    expect(r.url).toBe(
      "https://testnet.perpl.xyz/api/v1/trading/fills?count=100&page=next_page%3D%3D",
    );
    expect(r.method).toBe("GET");
    expect(r.body).toBeUndefined();
    expect(r.canonical.split("\n")).toEqual([
      "10143",
      "GET",
      r.target,
      String(now),
      input.proof.nonce,
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ]);
  });
  it("supports wallet reads without caller-controlled query", () => {
    expect(canonicalRelayTarget({ endpoint: "wallet" })).toBe(
      "/v1/trading/wallet",
    );
  });
  it.each(["url", "hostname", "method", "body"])(
    "rejects caller-controlled %s",
    (field) => {
      expect(() =>
        prepareReadOnlyRelay(
          {
            ...input,
            [field]:
              field === "body" ? { order: "buy" } : "https://evil.example",
          },
          now,
        ),
      ).toThrow();
      expect(() =>
        prepareReadOnlyRelay(
          { ...input, request: { ...input.request, [field]: "POST" } },
          now,
        ),
      ).toThrow();
    },
  );
  it.each(["orders", "withdraw", "enroll", "deposit"])(
    "rejects the %s endpoint",
    (endpoint) => {
      expect(() =>
        prepareReadOnlyRelay({ ...input, request: { endpoint } }, now),
      ).toThrow();
    },
  );
  it("requires fresh proofs for each canonical target and page", () => {
    for (const timestampMs of [now - 20001, now + 3001])
      expect(() =>
        prepareReadOnlyRelay(
          {
            ...input,
            proof: { ...input.proof, timestampMs: String(timestampMs) },
          },
          now,
        ),
      ).toThrow("expired");
    expect(() =>
      prepareReadOnlyRelay(
        { ...input, request: { endpoint: "fills", query: { count: 101 } } },
        now,
      ),
    ).toThrow();
    expect(() =>
      prepareReadOnlyRelay(
        {
          ...input,
          request: { endpoint: "fills", query: { page: "../../orders" } },
        },
        now,
      ),
    ).toThrow();
  });
  it("logs only an explicit allowlist, never a credential or signature", () => {
    const log = relayLog(input, "prepared");
    expect(log).toEqual({
      event: "perpl_read_boundary",
      result: "prepared",
      endpoint: "fills",
    });
    expect(JSON.stringify(log)).not.toContain(input.proof.apiKey);
    expect(JSON.stringify(log)).not.toContain(input.proof.signature);
    expect(relayLog({ headers: input.proof }, "rejected").endpoint).toBe(
      "invalid",
    );
  });
});
