import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  encodeAbiParameters,
  encodeEventTopics,
  TransactionReceiptNotFoundError,
  type Hex,
} from "viem";
import {
  creationCalldata,
  forkRegistryAbi,
  type PublishIntent,
} from "@fork/shared";
import { rpcReceipts } from "../src/server/receipt";
const rpc = vi.hoisted(() => ({
  getTransactionReceipt: vi.fn(),
  getTransaction: vi.fn(),
  getChainId: vi.fn(),
  getBlock: vi.fn(),
}));
vi.mock("viem", async (original) => ({
  ...(await original<typeof import("viem")>()),
  createPublicClient: () => rpc,
}));
const wallet = `0x${"11".repeat(20)}` as const,
  registry = `0x${"aa".repeat(20)}` as const,
  hash = `0x${"ab".repeat(32)}` as Hex,
  blockHash = `0x${"cd".repeat(32)}` as Hex;
const intent: PublishIntent = {
  chainId: 10143,
  registryAddress: registry,
  parentId: "0",
  authorWallet: wallet,
  contentHash: hash,
  core: {
    marketId: 16,
    side: "long",
    leverageBps: 20000,
    targetPriceE8: "70000",
    invalidationPriceE8: "60000",
  },
};
const topics = encodeEventTopics({
  abi: forkRegistryAbi,
  eventName: "ThesisCreated",
  args: { thesisId: 1n, author: wallet, parentId: 0n },
});
const data = encodeAbiParameters(
  [
    { type: "uint32" },
    { type: "uint8" },
    { type: "uint32" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes32" },
    { type: "uint64" },
  ],
  [16, 0, 20000, 70000n, 60000n, hash, 1770000000n],
);
const log = { address: registry, data, topics };
const receipt = {
  status: "success",
  transactionHash: hash,
  blockNumber: 1n,
  blockHash,
  logs: [log],
};
const tx = {
  chainId: 10143,
  from: wallet,
  to: registry,
  input: creationCalldata(intent),
};
beforeEach(() => {
  rpc.getTransactionReceipt.mockResolvedValue(receipt);
  rpc.getTransaction.mockResolvedValue(tx);
  rpc.getChainId.mockResolvedValue(10143);
  rpc.getBlock.mockResolvedValue({ hash: blockHash, timestamp: 1770000000n });
});
describe("viem receipt verification with encoded ABI logs", () => {
  it("accepts only the exact transaction and canonical creation event", async () => {
    expect(
      await rpcReceipts("http://not-contacted").creation(hash, intent),
    ).toMatchObject({
      author: wallet,
      thesisId: "1",
      parentId: "0",
      contentHash: hash,
      blockHash,
    });
  });
  it("rejects the wrong RPC chain", async () => {
    rpc.getChainId.mockResolvedValue(1);
    await expect(
      rpcReceipts("http://not-contacted").creation(hash, intent),
    ).rejects.toMatchObject({ code: "WRONG_CHAIN" });
  });
  it.each(["to", "from", "input"])(
    "rejects mismatched transaction %s",
    async (field) => {
      rpc.getTransaction.mockResolvedValue({
        ...tx,
        [field]: field === "input" ? "0x" : `0x${"22".repeat(20)}`,
      });
      await expect(
        rpcReceipts("http://not-contacted").creation(hash, intent),
      ).rejects.toMatchObject({ code: "TX_EVENT_MISMATCH" });
    },
  );
  it("rejects a reverted receipt", async () => {
    rpc.getTransactionReceipt.mockResolvedValue({
      ...receipt,
      status: "reverted",
    });
    await expect(
      rpcReceipts("http://not-contacted").creation(hash, intent),
    ).rejects.toMatchObject({ code: "TX_REVERTED" });
  });
  it("rejects noncanonical receipt blocks", async () => {
    rpc.getBlock.mockResolvedValue({
      hash: `0x${"ee".repeat(32)}`,
      timestamp: 1770000000n,
    });
    await expect(
      rpcReceipts("http://not-contacted").creation(hash, intent),
    ).rejects.toMatchObject({ code: "TX_REORG" });
  });
  it("rejects another registry’s event and duplicate matching events", async () => {
    for (const logs of [[{ ...log, address: wallet }], [log, log]]) {
      rpc.getTransactionReceipt.mockResolvedValue({ ...receipt, logs });
      await expect(
        rpcReceipts("http://not-contacted").creation(hash, intent),
      ).rejects.toMatchObject({ code: "TX_EVENT_MISMATCH" });
    }
  });
  it("requires creation timestamp to match its canonical block", async () => {
    rpc.getBlock.mockResolvedValue({ hash: blockHash, timestamp: 1770000001n });
    await expect(
      rpcReceipts("http://not-contacted").creation(hash, intent),
    ).rejects.toMatchObject({ code: "TX_EVENT_MISMATCH" });
  });
  it("distinguishes pending receipts from unavailable RPC", async () => {
    rpc.getTransactionReceipt.mockRejectedValue(
      new TransactionReceiptNotFoundError({ hash }),
    );
    await expect(
      rpcReceipts("http://not-contacted").creation(hash, intent),
    ).rejects.toMatchObject({ code: "TX_PENDING" });
    rpc.getTransactionReceipt.mockRejectedValue(new Error("network timeout"));
    await expect(
      rpcReceipts("http://not-contacted").creation(hash, intent),
    ).rejects.toMatchObject({ code: "RPC_UNAVAILABLE" });
  });
});
