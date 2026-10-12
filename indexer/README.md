# FORK graph indexer

A self-contained Envio HyperIndex 3.12.1 project. It turns the events of two contracts on Monad Testnet into one graph: who published and forked which idea, and how backing flows along that lineage.

Everything the indexer needs is inside this directory: config, schema, ABIs and handlers. There are no runtime imports above it.

## Contracts and events

| Contract | Event | What the handler derives |
| --- | --- | --- |
| `FORKRegistry` | `ThesisCreated` | The thesis, its root and depth, the fork edge to its parent, exact distinct external forkers per thesis and per author, market counts |
| `FORKRegistry` | `ExecutionLinked` | The author's own link claim, counted as a link and never as a verified execution |
| `FORKBacking` | `Backed` | The backing itself, per-thesis totals and early supporters, per-wallet supporter totals, overall totals |
| `FORKBacking` | `Credited` | Each author's earnings by role, and the value flowing from a backed thesis to each ancestor |
| `FORKBacking` | `Withdrawn` | The withdrawal, and the author's withdrawn and claimable balances |

Handlers: [`src/handlers/registry.ts`](src/handlers/registry.ts) and [`src/handlers/backing.ts`](src/handlers/backing.ts). Schema: [`schema.graphql`](schema.graphql). Config: [`config.yaml`](config.yaml).

## Entities

Lineage, from the registry:

| Entity | One row per | Notable fields |
| --- | --- | --- |
| `Thesis` | thesis | `parentId`, `rootId`, `depth`, `author`, onchain parameters, `directForkCount`, `uniqueExternalForkers`, virtual `backing` |
| `ForkEdge` | parent to child link | both thesis ids and both authors |
| `AuthorStats` | author | eligible and successful roots and forks, `influence`, `linkedExecutionCount` |
| `ThesisExternalForker` | thesis and external wallet | makes the distinct forker count exact |
| `AuthorExternalForker` | author and external wallet | makes `influence` exact across an author's ideas |
| `MarketStats` | market | thesis, root, fork and link counts |
| `ExecutionLink` | linked thesis | the reference the author linked |

Backing, from the backing contract:

| Entity | One row per | Notable fields |
| --- | --- | --- |
| `Backing` | `Backed` event | `backer`, `amount`, `backerIndex`, `early`, `firstByBacker`, links to `Thesis`, `ThesisBacking` and `Supporter` |
| `Credit` | `Credited` event | `recipient`, `role`, `amount`, the backed thesis and the credited thesis |
| `Withdrawal` | `Withdrawn` event | `account`, `amount` |
| `ThesisBacking` | backed thesis | `totalBacked`, `backingCount`, `backerCount`, `earlyBackers`, `firstBackedAt`, `lastBackedAt` |
| `Supporter` | backing wallet | `totalBacked`, `thesesBacked`, `earlySupportCount` |
| `AuthorEarnings` | credited author | `earnedAsAuthor`, `earnedFromForks`, `withdrawn`, `claimable` |
| `LineageFlow` | backed thesis and ancestor thesis | `amount`, `role`, `recipient`, `creditCount` |
| `BackingTotals` | registry and backing contract pair | `totalBacked`, `supporterCount`, `thesesBacked`, `sentToAncestors`, `totalWithdrawn` |

How the two contracts meet:

- Every id starts with `chainId:registryAddress`, so the same thesis number on another registry is a different thesis. Backing entities use the same namespace, and `ThesisBacking` shares its id with its `Thesis`, so one query can read a thesis together with its backing.
- A `FORKBacking` contract reads exactly one registry. `config.yaml` lists the backing contracts in the same order as their registries, and the handler pairs them by position. An unpaired backing address stops the indexer instead of guessing.
- `Credited` has role 0 for the backed thesis's own author, 1 for the parent author and 2 for the grandparent author. Role 0 adds to `earnedAsAuthor`. Roles 1 and 2 add to `earnedFromForks` and to a `LineageFlow` row. The contract never credits one address in two roles of the same backing, so a self-fork produces no fork earnings and no flow.
- The contract numbers a thesis's distinct backers in arrival order. A `Backed` event whose `backerIndex` is past the indexed `backerCount` is that wallet's first backing of the thesis, which keeps `backerCount`, `thesesBacked` and `earlySupportCount` exact without a membership table.
- `AuthorEarnings.claimable` mirrors `FORKBacking.claimable(wallet)`. A withdrawal larger than the indexed credits stops the indexer.

Example query, a thesis with its backing and where that backing went:

```graphql
query ThesisWithBacking($id: String!) {
  Thesis_by_pk(id: $id) {
    thesisId
    author
    parentId
    backing {
      totalBacked
      backerCount
      earlyBackers
    }
  }
  LineageFlow(where: { sourceThesis_id: { _eq: $id } }) {
    creditedThesisId
    recipient
    role
    amount
  }
}
```

## Run the checks

From the workspace root:

```sh
pnpm indexer:codegen
pnpm test:indexer
pnpm --filter @fork/indexer typecheck
```

`pnpm test:indexer` selects `config.test.yaml` and runs 26 handler tests on Envio's own test indexer: 12 for the registry and 14 for backing, including every merged-role case, the early supporter boundary, repeat backings, withdrawals, contract pairing and a check that backing never changes fork or reputation aggregates. The test configuration uses synthetic addresses and is never used for a live indexer.

`src/test-server.ts` is a localhost harness for the web app's isolated end to end workspace. It needs `NODE_ENV=test` and a per-run secret, feeds simulated events to the real handlers and is never part of a live indexer.

## Live configuration

| Variable | Value |
| --- | --- |
| `ENVIO_FORK_REGISTRY_ADDRESS` | `registryAddress` from `contracts/deployments/10143.json` |
| `ENVIO_FORK_START_BLOCK` | `deploymentBlock` from the same file |
| `ENVIO_FORK_BACKING_ADDRESS` | `backingAddress` from `contracts/deployments/10143.backing.json` |
| `ENVIO_FORK_BACKING_START_BLOCK` | `deploymentBlock` from the same file |

Envio Cloud only accepts custom variables that start with `ENVIO_`. The zero-address defaults in `config.yaml` exist for code generation; `pnpm --filter @fork/indexer dev` refuses to start live indexing until both addresses and both start blocks are set.

The Cloud indexer is deployed from the dedicated `envio` branch by explicit commit, with auto-deploy off, on the free development tier. The deployment that is live at the time of writing indexes the registry only; the version in this directory, with `FORKBacking`, goes live with the next approved deployment. Deployment steps and the current endpoint are in [`docs/23_DEPLOYMENT_ENV.md`](../docs/23_DEPLOYMENT_ENV.md), and the design notes are in [`docs/12_ENVIO_INDEXER.md`](../docs/12_ENVIO_INDEXER.md).
