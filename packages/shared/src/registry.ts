import abi from "./abi/FORKRegistry.json" with { type: "json" };
import type { Abi } from "viem";

// Generated from the tested Solidity artifact; pnpm abi:check prevents drift.
export const forkRegistryAbi: Abi = abi as Abi;
