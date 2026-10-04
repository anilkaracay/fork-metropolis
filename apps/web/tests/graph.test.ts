import { describe, expect, it } from "vitest";
import { normalizeGraph } from "../src/server/graph";
const raw = {
  chainId: 10143,
  registryAddress: `0x${"aa".repeat(20)}`,
  thesisId: "18446744073709551615",
  parentId: "0",
  rootId: "18446744073709551615",
  depth: 0,
  author: `0x${"11".repeat(20)}`,
  marketId: 16,
  side: "long",
  leverageBps: 20000,
  targetPriceE8: "7000000000000",
  invalidationPriceE8: "6000000000000",
  contentHash: `0x${"ab".repeat(32)}`,
  createdAt: "1770000000",
  blockNumber: "1",
  blockHash: `0x${"cd".repeat(32)}`,
  txHash: `0x${"ef".repeat(32)}`,
  directForkCount: 0,
  uniqueExternalForkers: 0,
};
describe("Envio scalar and schema boundary", () => {
  it("maps flat Envio entities into the strict application core model", () => {
    const n = normalizeGraph(raw);
    expect(n.core).toMatchObject({ marketId: 16, side: "long" });
    expect(n.thesisId).toBe(raw.thesisId);
    expect(n.executionRef).toBeNull();
    expect(n).not.toHaveProperty("marketId");
  });
  it("preserves valid uint32 values beyond signed GraphQL Int", () => {
    expect(
      normalizeGraph({
        ...raw,
        marketId: "4294967295",
        leverageBps: "4294967295",
      }).core,
    ).toMatchObject({ marketId: 4294967295, leverageBps: 4294967295 });
  });
  it("fails closed on unsafe numeric scalar decoding", () => {
    expect(() =>
      normalizeGraph({ ...raw, thesisId: Number(raw.thesisId) }),
    ).toThrow("unsafe integer");
  });
  it("does not trust malformed prices or address namespaces", () => {
    expect(() =>
      normalizeGraph({ ...raw, registryAddress: "not-an-address" }),
    ).toThrow();
    expect(() => normalizeGraph({ ...raw, targetPriceE8: "-1" })).toThrow();
  });
});
