// Explicitly isolated handler harness. This process is never the live indexer.
import { createServer } from "node:http";
import { createTestIndexer } from "envio";
if (process.env.NODE_ENV !== "test" || !process.env.FORK_TEST_SECRET)
  throw new Error(
    "The test indexer requires NODE_ENV=test and a per-run test secret.",
  );
let graph = createTestIndexer();
const secret = process.env.FORK_TEST_SECRET;
type Address = `0x${string}`;
type Simulated = NonNullable<
  NonNullable<Parameters<typeof graph.process>[0]["chains"][10143]>["simulate"]
>;
type ThesisInput = {
  kind?: "thesis";
  chainId: number;
  registryAddress: Address;
  txHash: string;
  blockNumber: string;
  blockHash: string;
  thesisId: string;
  parentId: string;
  author: Address;
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
type Mined = {
  chainId: number;
  backingAddress: Address;
  txHash: string;
  blockNumber: string;
  timestamp: number;
};
// One Backed event followed by its Credited events, as FORKBacking emits them.
type BackingInput = Mined & {
  kind: "backing";
  thesisId: string;
  backer: Address;
  amount: string;
  backerIndex: number;
  early: boolean;
  credits: {
    recipient: Address;
    creditedThesisId: string;
    role: number;
    amount: string;
  }[];
};
type WithdrawalInput = Mined & {
  kind: "withdrawal";
  account: Address;
  amount: string;
};
const address = (value: string) => {
  if (!/^0x[0-9a-f]{40}$/.test(value)) throw new Error("Invalid test address");
};
function events(
  input: ThesisInput | BackingInput | WithdrawalInput,
): Simulated {
  if (input.kind === "backing" || input.kind === "withdrawal") {
    address(input.backingAddress);
    const mined = {
      srcAddress: input.backingAddress,
      block: { number: Number(input.blockNumber), timestamp: input.timestamp },
      transaction: { hash: input.txHash },
    };
    if (input.kind === "withdrawal")
      return [
        {
          contract: "FORKBacking",
          event: "Withdrawn",
          ...mined,
          params: { account: input.account, amount: BigInt(input.amount) },
        },
      ];
    return [
      {
        contract: "FORKBacking",
        event: "Backed",
        ...mined,
        params: {
          thesisId: BigInt(input.thesisId),
          backer: input.backer,
          amount: BigInt(input.amount),
          backerIndex: BigInt(input.backerIndex),
          early: input.early,
        },
      },
      ...input.credits.map((credit) => ({
        contract: "FORKBacking" as const,
        event: "Credited" as const,
        ...mined,
        params: {
          recipient: credit.recipient,
          sourceThesisId: BigInt(input.thesisId),
          creditedThesisId: BigInt(credit.creditedThesisId),
          role: BigInt(credit.role),
          amount: BigInt(credit.amount),
        },
      })),
    ];
  }
  address(input.registryAddress);
  return [
    {
      contract: "FORKRegistry",
      event: "ThesisCreated",
      srcAddress: input.registryAddress,
      block: { number: Number(input.blockNumber), hash: input.blockHash },
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
  ];
}
let queue: Promise<unknown> = Promise.resolve();
const server = createServer(async (req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.headers.authorization !== `Bearer ${secret}`) {
    res.writeHead(403).end('{"error":"Forbidden"}');
    return;
  }
  try {
    // Bigint columns travel as decimal strings.
    const send = (value: unknown) =>
      res.end(
        JSON.stringify(value, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );
    if (req.method === "GET" && req.url === "/graph")
      return send({
        nodes: await graph.Thesis.getAll(),
        stats: await graph.AuthorStats.getAll(),
      });
    // Kept apart from /graph so ordinary thesis reads stay as light as before.
    if (req.method === "GET" && req.url === "/backing")
      return send({
        thesisBackings: await graph.ThesisBacking.getAll(),
        backings: await graph.Backing.getAll(),
        credits: await graph.Credit.getAll(),
        withdrawals: await graph.Withdrawal.getAll(),
        supporters: await graph.Supporter.getAll(),
        earnings: await graph.AuthorEarnings.getAll(),
        flows: await graph.LineageFlow.getAll(),
        totals: await graph.BackingTotals.getAll(),
      });
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
    const input = JSON.parse(body) as
      ThesisInput | BackingInput | WithdrawalInput;
    if (input.chainId !== 10143) throw new Error("Invalid test namespace");
    const simulate = events(input);
    queue = queue
      .catch(() => undefined)
      .then(() => graph.process({ chains: { 10143: { simulate } } }));
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
