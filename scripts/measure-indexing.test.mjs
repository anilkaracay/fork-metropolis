import { describe, expect, it } from "vitest";
import { observeIndexing } from "./measure-indexing.mjs";

const proof = {
  chainId: 10143,
  registryAddress: "0xregistry",
  txHash: "0xtx",
  thesisId: "1",
  author: "0xauthor",
  contentHash: "0xcontent",
  blockNumber: "123",
  blockHash: "0xblock",
  createdAt: "10",
};
function clock() {
  let time = 11000;
  return {
    now: () => time,
    wait: async (ms) => {
      time += ms;
    },
  };
}
describe("read-only indexing observations (isolated, not live evidence)", () => {
  it("reports a late-start upper bound after pending receipt and graph visibility", async () => {
    let receipts = 0,
      queries = 0;
    const result = await observeIndexing({
      ...clock(),
      receipt: async () => (++receipts === 1 ? null : proof),
      graph: async () => (++queries === 1 ? [] : [proof]),
    });
    expect(receipts).toBe(2);
    expect(result.blockToObservedVisibilityUpperBoundMs).toBe(5000);
    expect(result.startedAfterReceiptBlock).toBe(true);
    expect(result.firstObservedVisibilityAt).toBe("1970-01-01T00:00:15.000Z");
  });
  it.each(["chainId", "registryAddress", "txHash", "contentHash", "blockHash"])(
    "rejects mismatching %s instead of recording fake latency",
    async (key) => {
      await expect(
        observeIndexing({
          ...clock(),
          receipt: async () => proof,
          graph: async () => [{ ...proof, [key]: "wrong" }],
        }),
      ).rejects.toThrow("INDEX_INTEGRITY");
    },
  );
  it("times out without manufacturing visibility", async () => {
    await expect(
      observeIndexing({
        ...clock(),
        timeoutMs: 4000,
        receipt: async () => proof,
        graph: async () => [],
      }),
    ).rejects.toThrow("INDEXING_TIMEOUT");
  });
  it("rejects duplicate visibility and future chain timestamps", async () => {
    await expect(
      observeIndexing({
        ...clock(),
        receipt: async () => proof,
        graph: async () => [proof, proof],
      }),
    ).rejects.toThrow("INDEX_INTEGRITY");
    const future = { ...proof, createdAt: "20" };
    await expect(
      observeIndexing({
        ...clock(),
        receipt: async () => future,
        graph: async () => [future],
      }),
    ).rejects.toThrow("CLOCK_SKEW");
  });
});
