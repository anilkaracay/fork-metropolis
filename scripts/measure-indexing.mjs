import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

// A polling observation is an upper bound, never the indexer's internal ingest time.
export async function observeIndexing({
  receipt,
  graph,
  now = Date.now,
  wait = pause,
  intervalMs = 2000,
  timeoutMs = 180000,
}) {
  const startedAt = now();
  let proof;
  while (now() - startedAt < timeoutMs) {
    proof ??= await receipt();
    if (proof) {
      const rows = await graph(proof);
      if (rows.length > 1) throw new Error("INDEX_INTEGRITY");
      if (rows.length) {
        const row = rows[0];
        for (const key of [
          "chainId",
          "registryAddress",
          "txHash",
          "thesisId",
          "author",
          "contentHash",
          "blockNumber",
          "blockHash",
          "createdAt",
        ])
          if (
            String(row[key]).toLowerCase() !== String(proof[key]).toLowerCase()
          )
            throw new Error("INDEX_INTEGRITY");
        const firstObservedAt = now();
        const delayMs = firstObservedAt - Number(proof.createdAt) * 1000;
        if (delayMs < 0) throw new Error("CLOCK_SKEW");
        return {
          chainId: proof.chainId,
          registryAddress: proof.registryAddress,
          transactionHash: proof.txHash,
          thesisId: proof.thesisId,
          blockNumber: proof.blockNumber,
          receiptBlockTimestamp: new Date(
            Number(proof.createdAt) * 1000,
          ).toISOString(),
          measurementStartedAt: new Date(startedAt).toISOString(),
          firstObservedVisibilityAt: new Date(firstObservedAt).toISOString(),
          blockToObservedVisibilityUpperBoundMs: delayMs,
          pollingIntervalMs: intervalMs,
          startedAfterReceiptBlock: startedAt > Number(proof.createdAt) * 1000,
          interpretation:
            "Upper bound from canonical block time to first local observation; includes polling, network and any late start. Not internal indexer latency.",
        };
      }
    }
    await wait(intervalMs);
  }
  throw new Error("INDEXING_TIMEOUT");
}

async function main() {
  const [hash] = process.argv.slice(2);
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash ?? ""))
    throw new Error("TRANSACTION_HASH_REQUIRED");
  const web = createRequire(`${root}apps/web/package.json`);
  createRequire(web.resolve("next/package.json"))("@next/env").loadEnvConfig(
    `${root}apps/web`,
    true,
    { info() {}, error() {} },
  );
  if (process.env.FORK_TEST_MODE) throw new Error("TEST_MODE_FORBIDDEN");
  const deployment = JSON.parse(
    readFileSync(`${root}contracts/deployments/10143.json`, "utf8"),
  );
  const endpoint = process.env.FORK_ENVIO_URL;
  if (
    !endpoint ||
    new URL(endpoint).protocol !== "https:" ||
    new URL(endpoint).username ||
    new URL(endpoint).password
  )
    throw new Error("CLOUD_ENDPOINT_REQUIRED");
  const {
    createPublicClient,
    http,
    decodeEventLog,
    TransactionReceiptNotFoundError,
  } = createRequire(`${root}packages/shared/package.json`)("viem");
  const client = createPublicClient({
    transport: http(
      process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz",
      { timeout: 5000, retryCount: 1, retryDelay: 250 },
    ),
  });
  if ((await client.getChainId()) !== deployment.chainId)
    throw new Error("WRONG_CHAIN");
  const abi = JSON.parse(
    readFileSync(`${root}indexer/abi/FORKRegistry.json`, "utf8"),
  );
  const result = await observeIndexing({
    async receipt() {
      let receipt;
      try {
        receipt = await client.getTransactionReceipt({ hash });
      } catch (error) {
        if (error instanceof TransactionReceiptNotFoundError) return null;
        throw error;
      }
      if (
        receipt.status !== "success" ||
        receipt.to?.toLowerCase() !== deployment.registryAddress ||
        receipt.blockNumber < BigInt(deployment.deploymentBlock)
      )
        throw new Error("INVALID_CREATION_RECEIPT");
      const block = await client.getBlock({ blockNumber: receipt.blockNumber });
      if (block.hash !== receipt.blockHash)
        throw new Error("NONCANONICAL_RECEIPT");
      const events = receipt.logs
        .filter(
          (log) => log.address.toLowerCase() === deployment.registryAddress,
        )
        .flatMap((log) => {
          try {
            return [
              decodeEventLog({
                abi,
                eventName: "ThesisCreated",
                data: log.data,
                topics: log.topics,
                strict: true,
              }),
            ];
          } catch {
            return [];
          }
        });
      if (
        events.length !== 1 ||
        events[0].args.createdAt !== block.timestamp ||
        events[0].args.author.toLowerCase() !== receipt.from.toLowerCase()
      )
        throw new Error("INVALID_CREATION_EVENT");
      return {
        chainId: deployment.chainId,
        registryAddress: deployment.registryAddress,
        txHash: receipt.transactionHash,
        thesisId: String(events[0].args.thesisId),
        author: events[0].args.author,
        contentHash: events[0].args.contentHash,
        createdAt: String(block.timestamp),
        blockNumber: String(receipt.blockNumber),
        blockHash: block.hash,
      };
    },
    async graph(proof) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            redirect: "error",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              query:
                "query Visibility($where: Thesis_bool_exp!) { Thesis(where: $where, limit: 2) { chainId registryAddress txHash thesisId author contentHash createdAt blockNumber blockHash } }",
              variables: {
                where: {
                  chainId: { _eq: proof.chainId },
                  registryAddress: { _eq: proof.registryAddress },
                  thesisId: { _eq: proof.thesisId },
                },
              },
            }),
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) throw new Error("GRAPH_UNAVAILABLE");
          const body = await response.json();
          if (body.errors?.length || !Array.isArray(body.data?.Thesis))
            throw new Error("GRAPH_UNAVAILABLE");
          return body.data.Thesis;
        } catch {
          if (attempt === 1) throw new Error("GRAPH_UNAVAILABLE");
        }
        await pause(250);
      }
    },
  });
  console.log(JSON.stringify(result, null, 2));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch(() => {
    // Provider errors can include credentials. Never print them.
    console.error(
      "Measurement failed. Check the real thesis transaction, canonical chain, Cloud health and local clock, then retry the SAME hash. This tool never signs or broadcasts.",
    );
    process.exitCode = 1;
  });
