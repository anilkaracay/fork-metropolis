import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { keccak256, parseTransaction, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

vi.mock("server-only", () => ({}));
const { rpcBalances, rpcFaucet } = await import("../src/server/faucet-chain");

// A local JSON-RPC endpoint standing in for Monad Testnet. Nothing leaves this process.
const GWEI = 1_000_000_000n;
const hex = (value: bigint | number) => `0x${value.toString(16)}`;
let server: Server,
  url: string,
  calls: { method: string; params: unknown[] }[],
  node: {
    chainId: number;
    balance: bigint;
    pendingNonce: number;
    minedNonce: number;
    sendError: string | null;
    receipts: Map<string, "0x1" | "0x0">;
  };
beforeEach(async () => {
  calls = [];
  node = {
    chainId: 10143,
    balance: 5n * 10n ** 18n,
    pendingNonce: 7,
    minedNonce: 6,
    sendError: null,
    receipts: new Map(),
  };
  server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const { id, method, params } = JSON.parse(body) as {
        id: number;
        method: string;
        params: unknown[];
      };
      calls.push({ method, params });
      const reply = (
        result: unknown,
        error?: { code: number; message: string },
      ) =>
        response
          .writeHead(200, { "content-type": "application/json" })
          .end(
            JSON.stringify(
              error
                ? { jsonrpc: "2.0", id, error }
                : { jsonrpc: "2.0", id, result },
            ),
          );
      if (method === "eth_chainId") return reply(hex(node.chainId));
      if (method === "eth_getBalance") return reply(hex(node.balance));
      if (method === "eth_getTransactionCount")
        return reply(
          hex(params[1] === "pending" ? node.pendingNonce : node.minedNonce),
        );
      if (method === "eth_maxPriorityFeePerGas") return reply(hex(2n * GWEI));
      if (method === "eth_getBlockByNumber")
        return reply({ baseFeePerGas: hex(100n * GWEI), number: "0x1" });
      if (method === "eth_sendRawTransaction")
        return node.sendError
          ? reply(null, { code: -32000, message: node.sendError })
          : reply(keccak256(params[0] as Hex));
      if (method === "eth_getTransactionReceipt") {
        const status = node.receipts.get(params[0] as string);
        return reply(
          status
            ? {
                status,
                transactionHash: params[0],
                blockNumber: "0x1",
                blockHash: `0x${"00".repeat(32)}`,
                transactionIndex: "0x0",
                cumulativeGasUsed: "0x5208",
                gasUsed: "0x5208",
                effectiveGasPrice: hex(102n * GWEI),
                from: `0x${"00".repeat(20)}`,
                to: `0x${"00".repeat(20)}`,
                contractAddress: null,
                logs: [],
                logsBloom: `0x${"00".repeat(256)}`,
                type: "0x2",
              }
            : null,
        );
      }
      reply(null, { code: -32601, message: "Method not found" });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(() => new Promise((resolve) => server.close(resolve)));

const recipient = `0x${"12".repeat(20)}` as const;
const DRIP = 200_000_000_000_000_000n;

describe("faucet signer for Monad Testnet", () => {
  it("signs a plain transfer with exactly 21,000 gas at the pending nonce, without sending it", async () => {
    const key = generatePrivateKey(),
      faucet = rpcFaucet(key, url);
    const signed = await faucet.sign(recipient, DRIP);
    const transaction = parseTransaction(signed.raw as Hex);
    expect(transaction).toMatchObject({
      chainId: 10143,
      type: "eip1559",
      to: recipient,
      value: DRIP,
      gas: 21_000n,
      nonce: 7,
      maxPriorityFeePerGas: 2n * GWEI,
    });
    expect(transaction.data ?? "0x").toBe("0x");
    expect(signed).toMatchObject({
      nonce: 7,
      hash: keccak256(signed.raw as Hex),
    });
    expect(calls.some((c) => c.method === "eth_sendRawTransaction")).toBe(
      false,
    );
    expect(JSON.stringify(calls)).not.toContain(key.slice(2));
  });

  it("refuses to sign or report funds for any other chain", async () => {
    node.chainId = 143;
    const faucet = rpcFaucet(generatePrivateKey(), url);
    await expect(faucet.sign(recipient, DRIP)).rejects.toThrow(
      "The faucet only signs for Monad Testnet.",
    );
    await expect(faucet.funds()).rejects.toThrow();
  });

  it("reports the faucet balance and the most one transfer can cost", async () => {
    const key = generatePrivateKey(),
      funds = await rpcFaucet(key, url).funds();
    expect(funds.balance).toBe(5n * 10n ** 18n);
    // viem sets the fee ceiling above the base fee; the bound is 21,000 gas at that ceiling.
    expect(funds.transferFee % 21_000n).toBe(0n);
    expect(funds.transferFee).toBeGreaterThanOrEqual(21_000n * 102n * GWEI);
    expect(calls.find((c) => c.method === "eth_getBalance")?.params[0]).toBe(
      privateKeyToAccount(key).address,
    );
  });

  it("broadcasts the stored transfer and treats a duplicate as delivered", async () => {
    const faucet = rpcFaucet(generatePrivateKey(), url);
    const { raw } = await faucet.sign(recipient, DRIP);
    await faucet.broadcast(raw);
    expect(
      calls.filter((c) => c.method === "eth_sendRawTransaction"),
    ).toMatchObject([{ params: [raw] }]);
    node.sendError = "already known";
    await expect(faucet.broadcast(raw)).resolves.toBeUndefined();
    node.sendError = "nonce too low";
    await expect(faucet.broadcast(raw)).rejects.toThrow();
  });

  it("maps receipts to arrived, reverted or not yet known", async () => {
    const faucet = rpcFaucet(generatePrivateKey(), url);
    const hash = `0x${"ab".repeat(32)}`;
    expect(await faucet.receipt(hash)).toBeNull();
    node.receipts.set(hash, "0x1");
    expect(await faucet.receipt(hash)).toBe("success");
    node.receipts.set(hash, "0x0");
    expect(await faucet.receipt(hash)).toBe("reverted");
    expect(await faucet.minedNonce()).toBe(6);
  });

  it("reads any wallet balance without a key", async () => {
    node.balance = 123n;
    expect(await rpcBalances(url).balanceOf(recipient)).toBe(123n);
  });
});
