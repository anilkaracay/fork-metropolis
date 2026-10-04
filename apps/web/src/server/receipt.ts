import {
  createPublicClient,
  http,
  decodeEventLog,
  TransactionReceiptNotFoundError,
  TransactionNotFoundError,
  type Address,
  type Hex,
} from "viem";
import {
  forkRegistryAbi,
  monadTestnet,
  thesisCoreSchema,
  type ThesisCore,
  creationCalldata,
  type PublishIntent,
} from "@fork/shared";
import { AppError, assert } from "./errors";

export type { PublishIntent } from "@fork/shared";
export type CreationEvidence = {
  chainId: number;
  registryAddress: string;
  txHash: string;
  author: string;
  thesisId: string;
  parentId: string;
  contentHash: string;
  core: ThesisCore;
  blockNumber: string;
  blockHash: string;
  createdAt: number;
  success: boolean;
};
export interface ReceiptSource {
  creation(hash: string, intent: PublishIntent): Promise<CreationEvidence>;
}
export function validateCreation(
  event: CreationEvidence,
  intent: PublishIntent,
  hash: string,
) {
  assert(
    event.success,
    "TX_REVERTED",
    "The transaction reverted.",
    409,
    "Review the thesis and submit a new transaction.",
  );
  assert(
    event.chainId === intent.chainId &&
      event.registryAddress.toLowerCase() === intent.registryAddress &&
      event.txHash.toLowerCase() === hash.toLowerCase(),
    "TX_NAMESPACE_MISMATCH",
    "This receipt belongs to another chain, registry or transaction.",
  );
  assert(
    event.author.toLowerCase() === intent.authorWallet,
    "WRONG_WALLET",
    "The transaction author does not match your selected wallet.",
    403,
    "Switch back to the wallet that created this draft.",
  );
  assert(
    event.contentHash.toLowerCase() === intent.contentHash,
    "DRAFT_HASH_MISMATCH",
    "The transaction content does not match this draft.",
  );
  assert(
    event.parentId === intent.parentId &&
      JSON.stringify(thesisCoreSchema.parse(event.core)) ===
        JSON.stringify(thesisCoreSchema.parse(intent.core)),
    "TX_EVENT_MISMATCH",
    "The transaction parameters do not match this draft.",
  );
  return event;
}
export function rpcReceipts(url: string): ReceiptSource {
  const rpc = createPublicClient({
    chain: monadTestnet,
    transport: http(url, { timeout: 5000, retryCount: 1, retryDelay: 250 }),
  });
  return {
    async creation(hash, intent) {
      let receipt, tx, chain;
      try {
        [receipt, tx, chain] = await Promise.all([
          rpc.getTransactionReceipt({ hash: hash as Hex }),
          rpc.getTransaction({ hash: hash as Hex }),
          rpc.getChainId(),
        ]);
      } catch (error) {
        if (
          !(error instanceof TransactionReceiptNotFoundError) &&
          !(error instanceof TransactionNotFoundError)
        )
          throw new AppError(
            "RPC_UNAVAILABLE",
            "Receipt verification is temporarily unavailable.",
            503,
            "Check the same transaction again after the RPC recovers; do not submit again.",
          );
        throw new AppError(
          "TX_PENDING",
          "The transaction is not confirmed yet.",
          202,
          "Wait a moment and check the same transaction again.",
        );
      }
      assert(
        chain === intent.chainId && tx.chainId === intent.chainId,
        "WRONG_CHAIN",
        "The RPC transaction is on the wrong chain.",
      );
      assert(
        receipt.status === "success",
        "TX_REVERTED",
        "The transaction reverted.",
        409,
        "Review the thesis and submit again.",
      );
      assert(
        tx.to?.toLowerCase() === intent.registryAddress &&
          tx.from.toLowerCase() === intent.authorWallet &&
          tx.input.toLowerCase() === creationCalldata(intent).toLowerCase(),
        "TX_EVENT_MISMATCH",
        "The transaction target, author or input differs from this intent.",
      );
      const block = await rpc.getBlock({ blockNumber: receipt.blockNumber });
      assert(
        block.hash === receipt.blockHash,
        "TX_REORG",
        "This receipt is not in the current canonical block.",
        409,
        "Wait and retry receipt verification.",
      );
      const events = receipt.logs
        .filter((log) => log.address.toLowerCase() === intent.registryAddress)
        .flatMap((log) => {
          try {
            const decoded = decodeEventLog({
              abi: forkRegistryAbi,
              eventName: "ThesisCreated",
              data: log.data,
              topics: log.topics,
              strict: true,
            });
            return [decoded];
          } catch {
            return [];
          }
        });
      assert(
        events.length === 1,
        "TX_EVENT_MISMATCH",
        "Expected one thesis creation event from the configured registry.",
      );
      const args = events[0]!.args as unknown as {
        thesisId: bigint;
        author: Address;
        parentId: bigint;
        marketId: number;
        side: number;
        leverageBps: number;
        targetPriceE8: bigint;
        invalidationPriceE8: bigint;
        contentHash: Hex;
        createdAt: bigint;
      };
      assert(
        args.createdAt === block.timestamp,
        "TX_EVENT_MISMATCH",
        "The creation time differs from its canonical block.",
      );
      return validateCreation(
        {
          chainId: chain,
          registryAddress: intent.registryAddress,
          txHash: receipt.transactionHash,
          author: args.author.toLowerCase(),
          thesisId: String(args.thesisId),
          parentId: String(args.parentId),
          contentHash: args.contentHash.toLowerCase(),
          core: {
            marketId: Number(args.marketId),
            side: Number(args.side) === 0 ? "long" : "short",
            leverageBps: Number(args.leverageBps),
            targetPriceE8: String(args.targetPriceE8),
            invalidationPriceE8: String(args.invalidationPriceE8),
          },
          blockNumber: String(receipt.blockNumber),
          blockHash: receipt.blockHash,
          createdAt: Number(args.createdAt),
          success: true,
        },
        intent,
        hash,
      );
    },
  };
}
