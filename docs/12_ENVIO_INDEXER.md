# Envio Indexer

Phase 2 implements a self-contained HyperIndex **3.12.1** project in `indexer/`. Its handlers import only `envio`; its ABI, config and schema stay inside that directory. No deployment or live event ingestion has occurred.

Current V3 conventions use `indexer.onEvent` in autodiscovered `src/handlers/`, generated `.envio` types and `createTestIndexer()` simulations. These replace older generated-module handler registration examples. See D-028 and the [official handler documentation](https://docs.envio.dev/docs/HyperIndex/event-handlers), [testing documentation](https://docs.envio.dev/docs/HyperIndex/testing) and [configuration reference](https://docs.envio.dev/docs/HyperIndex/configuration-file).

## Canonical entities

The executable schema is `indexer/schema.graphql`.

- **Thesis**: chain/registry/ID, parent/root/depth, immutable author/core/hash, creation block/hash/transaction/time, optional executionRef, raw directForkCount and uniqueExternalForkers.
- **ForkEdge**: namespaced immutable parent/child IDs and authors, creation time.
- **AuthorStats**: eligibleRoots, successfulRoots, eligibleForks, successfulForks, influence and linkedExecutionCount.
- **ThesisExternalForker**: one membership per namespaced parent and external wallet, first fork time.
- **AuthorExternalForker**: one membership per namespaced author and external forker wallet.
- **MarketStats**: root/fork/thesis/link counts and latest activity time.
- **ExecutionLink**: one namespaced thesis link with author, reference, transaction and block.

Canonical market/leverage uint32 fields use BigInt storage, because their maximum exceeds signed GraphQL Int; application normalization preserves their exact safe-number values. IDs include chain and normalized registry. Membership entities make unique counts exact. There is no approximate descendant counter, bounded ancestor counter or mysterious received-fork score. Full lineage derives from parent edges plus root/depth.

## Handler behavior

ThesisCreated creates an immutable thesis once, obtains its parent or rejects an orphan, derives root/depth, and updates author/market creation counts. A child increments the parent's raw direct count. Self-forks remain visible graph nodes and eligible authored forks but grant no success or influence to the parent author. An external wallet creates a per-parent membership once. The first external membership makes that root/fork successful. Author-level membership counts Influence once across all that author's directly forked ideas.

ExecutionLinked indexes a reference once and increments explicitly named **linked** counts. It never grants Verified status or Executions Inspired. The application joins independently verified Postgres evidence, matching reference and canonical author, before displaying verified state.

Creation and execution-link handlers have existing-entity replay guards. HyperIndex handles preloading and rollback of its entity state. Tests repeat semantic events at later simulated blocks because the V3 test runner requires monotonically advancing block ranges; guards prevent double counting. Live chain reorg behavior has not been exercised.

## Local checks and live boundary

```sh
pnpm indexer:codegen
pnpm test:indexer
pnpm --filter @fork/indexer typecheck
```

`config.yaml` uses chain 10143, the official Monad Testnet RPC, `ENVIO_FORK_REGISTRY_ADDRESS` and `ENVIO_FORK_START_BLOCK`. Cloud custom variables require the `ENVIO_` prefix. Its zero address fallback permits code generation; `scripts/start.mjs` rejects absent/zero address and absent/zero deployment block before any live indexer can start. Standalone frozen installation, typecheck and 12 handler tests also pass with Cloud's documented pnpm 10.32.0.

`config.test.yaml` lists explicit synthetic registry addresses and is used only by handler simulations and `pnpm test:dev`. The localhost test bridge requires NODE_ENV=test and a random per-run secret. It invokes actual HyperIndex handlers; it is not a hand-written graph substitute. The Next local test adapter is separately restricted to development, an explicit test flag, loopback host and same-origin browser calls.

The production reader scopes GraphQL queries by chain/registry, validates scalars without losing uint64 precision, and composes typed application models. Feed candidates are bounded to 500; recent 7-day activity fails closed above 10,000 so displayed ranking does not silently become approximate. Tree views include 250 nodes plus selected ancestry, with truncation shown. Public profiles read exact indexed AuthorStats separately from their 100 recent ideas.

Standalone installation from this directory uses `pnpm --ignore-workspace install --frozen-lockfile` and the committed local lockfile; no workspace-only imports or inherited TypeScript config are required.

The real Cloud GraphQL endpoint and deployed registry will be checked in the next authorized integration phase.
