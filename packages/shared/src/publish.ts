import { encodeFunctionData, type Hex } from "viem";
import { forkRegistryAbi } from "./registry.ts";
import type { ThesisCore } from "./thesis.ts";
/** Public transaction intent, with no transport or credentials. */
export type PublishIntent = {
  chainId: number;
  registryAddress: string;
  parentId: string;
  authorWallet: string;
  core: ThesisCore;
  contentHash: string;
};
export function creationCalldata(intent: PublishIntent): Hex {
  return encodeFunctionData({
    abi: forkRegistryAbi,
    functionName: "createThesis",
    args: [
      BigInt(intent.parentId),
      intent.core.marketId,
      intent.core.side === "long" ? 0 : 1,
      intent.core.leverageBps,
      BigInt(intent.core.targetPriceE8),
      BigInt(intent.core.invalidationPriceE8),
      intent.contentHash as Hex,
    ],
  });
}
