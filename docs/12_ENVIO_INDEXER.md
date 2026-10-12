# Envio Indexer

Phase 2 implements a self-contained HyperIndex **3.12.1** project in `indexer/`. Its handlers import only `envio`; its ABI, config and schema stay inside that directory. An actual Cloud deployment is now active and synced against the canonical Monad Testnet registry. The genuine empty GraphQL/application baseline passes; live thesis/fork event ingestion remains pending the next user-approved gate.

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

### Backing entities

FORKBacking is the second indexed contract (D-056). Its events add three event logs and five aggregates in the same `chainId:registryAddress` namespace as the thesis graph:

- **Backing**, **Credit**, **Withdrawal**: one row per `Backed`, `Credited` and `Withdrawn` event, keyed by chain, block and log index.
- **ThesisBacking**: total backed, backing count, distinct backer count, the first ten distinct backers in arrival order, first and last backing time. It shares its id with the Thesis, and `Thesis.backing` exposes it as a virtual relation.
- **Supporter**: total backed, distinct theses backed and the number of theses where the wallet is an early supporter.
- **AuthorEarnings**: earned as author (role 0), earned from forks (roles 1 and 2), withdrawn and claimable.
- **LineageFlow**: the value that backing of one thesis has sent to one ancestor thesis, one row per pair.
- **BackingTotals**: totals for one registry and backing contract pair.

A backing contract is paired with its registry by position in `config.yaml`; an unpaired address stops the indexer. Roles come straight from the contract, which credits one address at most once per backing in its nearest role, so merged lineages need no special case in the handler: a self-fork produces no fork earnings and no flow. Distinct backers are detected from the contract's own arrival numbering instead of a membership entity.

Backing rows are keyed by block and log index, and HyperIndex processes each log once, so these handlers carry no replay guard. A `Backed` event for a thesis the registry never created, or a withdrawal larger than the indexed credits, fails closed.

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

`config.yaml` uses chain 10143, the official Monad Testnet RPC, `ENVIO_FORK_REGISTRY_ADDRESS` and `ENVIO_FORK_START_BLOCK`. Cloud custom variables require the `ENVIO_` prefix. Its zero address fallback permits code generation; `scripts/start.mjs` rejects absent/zero address and absent/zero deployment block before any live indexer can start. The backing contract adds `ENVIO_FORK_BACKING_ADDRESS` and `ENVIO_FORK_BACKING_START_BLOCK`, guarded the same way. The registry-only version passed standalone frozen installation, typecheck and its 12 handler tests with Cloud's documented pnpm 10.32.0; the version with backing has 26 handler tests and repeats the standalone check before its deployment.

`config.test.yaml` lists explicit synthetic registry addresses and is used only by handler simulations and `pnpm test:dev`. The localhost test bridge requires NODE_ENV=test and a random per-run secret. It invokes actual HyperIndex handlers; it is not a hand-written graph substitute. The Next local test adapter is separately restricted to development, an explicit test flag, loopback host and same-origin browser calls.

The production reader scopes GraphQL queries by chain/registry, validates scalars without losing uint64 precision, and composes typed application models. Feed candidates are bounded to 500; recent 7-day activity fails closed above 10,000 so displayed ranking does not silently become approximate. Tree views include 250 nodes plus selected ancestry, with truncation shown. Public profiles read exact indexed AuthorStats separately from their 100 recent ideas.

Standalone installation from this directory uses `pnpm --ignore-workspace install --frozen-lockfile` and the committed local lockfile; no workspace-only imports or inherited TypeScript config are required.

The real public development Cloud endpoint, namespace, generated schema and empty Feed/Explore/Profile reads are proven in [Envio evidence](build-log/evidence/phase3/ENVIO.md). No handler/config/schema change was needed. The read-only `pnpm indexer:latency REAL_THESIS_TRANSACTION_HASH` tool is ready for the next gate; no real delay is claimed before an actual thesis exists.
