import "server-only";
import {
  createPublicClient,
  http,
  keccak256,
  TransactionReceiptNotFoundError,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "@fork/shared";
import { TRANSFER_GAS, type BalanceReader, type FaucetChain } from "./faucet";

const client = (rpcUrl: string) =>
  createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl, { timeout: 5000, retryCount: 1, retryDelay: 250 }),
  });

export function rpcBalances(rpcUrl: string): BalanceReader {
  const rpc = client(rpcUrl);
  return {
    balanceOf: (address) => rpc.getBalance({ address: address as Address }),
  };
}

/** Testnet-only hot wallet. The key never leaves this module and is never logged. */
export function rpcFaucet(privateKey: Hex, rpcUrl: string): FaucetChain {
  const rpc = client(rpcUrl),
    account = privateKeyToAccount(privateKey);
  let checked = false;
  // Refuses to sign for any chain other than Monad Testnet, whatever the RPC URL says.
  async function testnet() {
    if (checked) return;
    if ((await rpc.getChainId()) !== monadTestnet.id)
      throw new Error("The faucet only signs for Monad Testnet.");
    checked = true;
  }
  return {
    balanceOf: (address) => rpc.getBalance({ address: address as Address }),
    async funds() {
      await testnet();
      const [balance, fees] = await Promise.all([
        rpc.getBalance({ address: account.address }),
        rpc.estimateFeesPerGas(),
      ]);
      return { balance, transferFee: TRANSFER_GAS * fees.maxFeePerGas };
    },
    async sign(to, value) {
      await testnet();
      const [nonce, fees] = await Promise.all([
        rpc.getTransactionCount({
          address: account.address,
          blockTag: "pending",
        }),
        rpc.estimateFeesPerGas(),
      ]);
      // Monad charges the full gas limit, so a plain transfer gets exactly 21,000.
      const raw = await account.signTransaction({
        chainId: monadTestnet.id,
        type: "eip1559",
        to: to as Address,
        value,
        nonce,
        gas: TRANSFER_GAS,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      return { hash: keccak256(raw), raw, nonce };
    },
    async broadcast(raw) {
      try {
        await rpc.sendRawTransaction({ serializedTransaction: raw as Hex });
      } catch (error) {
        // The node already has this exact transfer: that is the outcome we want.
        if (/already known|already imported/i.test(String(error))) return;
        throw error;
      }
    },
    async receipt(hash) {
      try {
        const receipt = await rpc.getTransactionReceipt({ hash: hash as Hex });
        return receipt.status === "success" ? "success" : "reverted";
      } catch (error) {
        if (error instanceof TransactionReceiptNotFoundError) return null;
        throw error;
      }
    },
    minedNonce: () =>
      rpc.getTransactionCount({ address: account.address, blockTag: "latest" }),
  };
}
