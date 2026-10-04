// Explicitly isolated handler harness. This process is never the live indexer.
import { createServer } from "node:http";
import { createTestIndexer } from "envio";
if (process.env.NODE_ENV !== "test" || !process.env.FORK_TEST_SECRET)
  throw new Error(
    "The test indexer requires NODE_ENV=test and a per-run test secret.",
  );
let graph = createTestIndexer();
const secret = process.env.FORK_TEST_SECRET;
let queue: Promise<unknown> = Promise.resolve();
const server = createServer(async (req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.headers.authorization !== `Bearer ${secret}`) {
    res.writeHead(403).end('{"error":"Forbidden"}');
    return;
  }
  try {
    if (req.method === "GET" && req.url === "/graph") {
      const nodes = await graph.Thesis.getAll(),
        stats = await graph.AuthorStats.getAll();
      res.end(
        JSON.stringify({ nodes, stats }, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );
      return;
    }
    let body = "";
    for await (const chunk of req) {
      body += String(chunk);
      if (body.length > 16000) throw new Error("Too large");
    }
    if (req.method === "POST" && req.url === "/reset") {
      await queue;
      graph = createTestIndexer();
      res.end("{}");
      return;
    }
    if (req.method !== "POST" || req.url !== "/simulate") {
      res.writeHead(404).end("{}");
      return;
    }
    const input = JSON.parse(body) as {
      chainId: number;
      registryAddress: `0x${string}`;
      txHash: string;
      blockNumber: string;
      blockHash: string;
      thesisId: string;
      parentId: string;
      author: `0x${string}`;
      contentHash: string;
      createdAt: number;
      core: {
        marketId: number;
        side: "long" | "short";
        leverageBps: number;
        targetPriceE8: string;
        invalidationPriceE8: string;
      };
    };
    if (
      input.chainId !== 10143 ||
      !/^0x[0-9a-f]{40}$/.test(input.registryAddress)
    )
      throw new Error("Invalid test namespace");
    queue = queue
      .catch(() => undefined)
      .then(() =>
        graph.process({
          chains: {
            10143: {
              simulate: [
                {
                  contract: "FORKRegistry",
                  event: "ThesisCreated",
                  srcAddress: input.registryAddress,
                  block: {
                    number: Number(input.blockNumber),
                    hash: input.blockHash,
                  },
                  transaction: { hash: input.txHash },
                  params: {
                    thesisId: BigInt(input.thesisId),
                    parentId: BigInt(input.parentId),
                    author: input.author,
                    marketId: BigInt(input.core.marketId),
                    side: input.core.side === "long" ? 0n : 1n,
                    leverageBps: BigInt(input.core.leverageBps),
                    targetPriceE8: BigInt(input.core.targetPriceE8),
                    invalidationPriceE8: BigInt(input.core.invalidationPriceE8),
                    contentHash: input.contentHash,
                    createdAt: BigInt(input.createdAt),
                  },
                },
              ],
            },
          },
        }),
      );
    await queue;
    res.end("{}");
  } catch {
    res.writeHead(500).end('{"error":"Test handler failed"}');
  }
});
server.listen(
  Number(process.env.FORK_TEST_INDEXER_PORT ?? 4319),
  "127.0.0.1",
  () => console.log("Isolated Envio handler harness ready."),
);
