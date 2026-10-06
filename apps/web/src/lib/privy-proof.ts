import type { Address } from "viem";
import { monadTestnet } from "@fork/shared";

// This payload grants no permission and is never accepted as an access token.
export function developmentTypedData(
  wallet: Address,
  nonce: string,
  issuedAt: bigint,
) {
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
        { name: "issuedAt", type: "uint256" },
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
