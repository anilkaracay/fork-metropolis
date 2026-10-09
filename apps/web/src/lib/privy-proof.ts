import type { Address } from "viem";
import { monadTestnet } from "@fork/shared";

// This payload grants no permission and is never accepted as an access token.
export function developmentTypedData(
  wallet: Address,
  nonce: string,
  issuedAt: number,
) {
  // Unix seconds fit exactly in a JSON number. Avoid BigInt.toJSON overrides
  // from browser tooling/extensions turning the RPC value into "123n".
  if (!Number.isSafeInteger(issuedAt) || issuedAt < 0 || issuedAt >= 2 ** 48)
    throw new RangeError("The proof timestamp must be safe Unix seconds.");
  return {
    domain: {
      name: "FORK Local Development Proof",
      version: "1",
      chainId: monadTestnet.id,
    },
    types: {
      DevelopmentProof: [
        { name: "wallet", type: "address" },
        { name: "nonce", type: "string" },
        { name: "issuedAt", type: "uint48" },
        { name: "purpose", type: "string" },
      ],
    },
    primaryType: "DevelopmentProof",
    message: {
      wallet,
      nonce,
      issuedAt,
      purpose: "Verify my wallet for a local FORK development check.",
    },
  } as const;
}
