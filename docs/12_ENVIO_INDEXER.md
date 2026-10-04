# Envio Indexer Specification

## Goal

Envio is the canonical query layer for FORK's onchain social graph. It must power real product features, not exist only for a bounty checkbox.

## Indexed contract

- Network: Monad Testnet, chain ID 10143
- Contract: FORKRegistry
- Start block: deployment block

## Events

- ThesisCreated
- ExecutionLinked

## Namespace and reputation membership

All entity IDs include chainId + registryAddress. Thesis/edge/link identities add thesisId; author/market aggregates include the same deployment namespace. Add rootId and depth to Thesis. Add membership entities for per-thesis external forkers and author-level distinct external forkers; event processing must not count self/repeated wallets. Originality/Contribution derive from roots/forks with at least one external child. Influence is a raw distinct-wallet count. Executions Inspired requires a database join to independently verified execution evidence on strict descendants, deduplicated per originating author and excluding that author's own executions. LinkedExecutionCount alone is not verified credit.

## GraphQL entities

```graphql
type Thesis {
  id: ID!
  thesisId: BigInt!
  author: String!
  parentId: BigInt!
  marketId: Int!
  side: String!
  leverageBps: Int!
  targetPriceE8: BigInt!
  invalidationPriceE8: BigInt!
  contentHash: String!
  createdAt: BigInt!
  blockNumber: BigInt!
  txHash: String!
  executionRef: String
  isRoot: Boolean!
  directForkCount: Int!
  descendantCount: Int!
}

type ForkEdge {
  id: ID!
  parentId: BigInt!
  childId: BigInt!
  parentAuthor: String!
  childAuthor: String!
  createdAt: BigInt!
}

type AuthorStats {
  id: ID!
  address: String!
  rootCount: Int!
  forkCount: Int!
  receivedForkCount: Int!
  uniqueExternalForkers: Int!
  linkedExecutionCount: Int!
}

type MarketStats {
  id: ID!
  marketId: Int!
  thesisCount: Int!
  rootCount: Int!
  forkCount: Int!
  linkedExecutionCount: Int!
}

type ExecutionLink {
  id: ID!
  thesisId: BigInt!
  author: String!
  executionRef: String!
  blockNumber: BigInt!
  txHash: String!
}
```

If HyperIndex schema syntax requires adjustments, preserve the semantic model.

## Handler: ThesisCreated

On every event:

1. Create Thesis entity.
2. Mark `isRoot = parentId == 0`.
3. Create/update author stats.
4. Create/update market stats.
5. If fork:
   - create ForkEdge
   - increment parent directForkCount
   - increment ancestor descendantCount up to bounded depth
   - increment original and intermediate author received-fork stats as defined

### Descendant aggregation strategy

Do not perform unbounded recursive database walks in a handler.

MVP options, ordered by preference:

1. Maintain `rootId` and `depth` on Thesis and only increment root/parent aggregate counters.
2. Compute full descendant count in GraphQL/server layer from edges for small graphs.
3. Add a bounded ancestor path array only if Envio schema supports it cleanly.

Choose the simplest implementation that keeps Idea Tree correct. Exact descendant counters are less important than canonical edges.

Recommended additional Thesis fields:

```text
rootId
Depth
```

## Handler: ExecutionLinked

- create ExecutionLink
- set Thesis.executionRef
- increment AuthorStats.linkedExecutionCount
- increment MarketStats.linkedExecutionCount

Note: Envio knows a link exists, not whether FORK server verified the Perpl fill. Product UI joins executionRef against Postgres verification state.

## Queries required by app

### Feed

Need:

- latest theses
- filter root/fork/market
- order by createdAt
- directForkCount

### Idea Tree

Need all edges/nodes for one root ID.

Request should be bounded. For hackathon demo, cap tree at 250 nodes and show a continuation indicator if larger.

### Profile

Need:

- AuthorStats by address
- theses by author

### Explore

Need:

- market stats
- most-forked recent roots
- authors with received-fork activity

## Bounty-quality requirements

Envio must visibly drive:

1. Idea Tree
2. Feed fork counts
3. Profile graph statistics

At least one derived/aggregated entity must be used in the UI.

## Development workflow

- use Node.js version supported by current Envio docs; recent docs recommend Node 22+
- keep `ENVIO_API_TOKEN` outside git
- run codegen after ABI/schema changes
- local dev must start indexer plus database successfully
- deploy final indexer to Envio Cloud

## Monitoring

Track:

- indexer head lag
- handler errors
- GraphQL latency
- deployment commit SHA

App health endpoint should mark Envio degraded when query fails, but public onchain read fallback can keep basic thesis pages alive.

## Acceptance tests

1. Root thesis event creates one Thesis and correct AuthorStats/MarketStats.
2. Fork event creates parent-child edge.
3. Multiple forks produce deterministic tree.
4. ExecutionLinked attaches to correct thesis.
5. Reprocessing does not duplicate entities.
6. App can render a 20-node seeded test tree from GraphQL.
7. GraphQL result IDs match onchain IDs exactly.
