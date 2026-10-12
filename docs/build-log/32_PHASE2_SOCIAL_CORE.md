# Phase 2 — Social Core

Implemented locally on 2026-10-04. This phase stops before credentialed identity setup, contract/database/cloud deployment, Perpl enrollment/trading/independent verification, Nansen calls or sponsor polish.

## Run the complete local journey

```sh
pnpm install --frozen-lockfile
pnpm indexer:codegen
pnpm test:dev
```

Open http://127.0.0.1:3000. The banner explicitly identifies **Local test workspace · simulated confirmations**. Alice, Bora and Carol are isolated test identities; Carol is the test moderator. Publish with Alice, switch to Bora, fork and change a meaningful field, Agree/comment, inspect the tree and public profile.

The workspace applies committed SQL to an in-memory PGlite PostgreSQL database and submits synthetic creation receipts to actual Envio HyperIndex test handlers. Application authentication, drafts, hash checks, receipt validation, finalization, social writes and read composition use their normal interfaces. No contract is deployed, even locally. Restarting clears test data. `pnpm test:e2e` starts a fresh workspace automatically, with existing-server reuse allowed only through explicit FORK_E2E_REUSE_SERVER=1.

Production remains Neon/Postgres, real Privy token verification, Monad RPC receipts and a real Envio GraphQL reader. A missing environment produces actionable configuration errors, never fixture metrics. Public browsing works without Privy credentials when database/indexer configuration exists. An entirely unconfigured environment renders the app and configuration/retry states. Production rejects FORK_TEST_MODE. Test browser APIs also require loopback host and same-origin requests. Random per-run test tokens and bridge secret never become production credentials.

## Implemented subsystems

- **Database**: eight tables, two SQL migrations plus Drizzle journal/snapshot. Ownership FKs, immutable finalized metadata/evidence, composite namespaces, request/receipt keys, global fill identity uniqueness, persistent rate buckets. See 09_DATA_MODEL.md.
- **Identity**: current Privy React/Node SDK path, email/Google, embedded EVM wallet, selected primary wallet, Monad signing and typed-data adapter. Verified DID/authoritative linked wallets are the server trust boundary. See 14_PRIVY_INTEGRATION.md.
- **Indexer**: self-contained V3 project with standalone lockfile, seven entity types, real replay-safe handlers and exact memberships. ExecutionLinked remains an attestation. See 12_ENVIO_INDEXER.md.
- **Composition**: typed FeedThesis/ThesisDetail/ThesisTree/ProfileSummary; graph, metadata, verification and absent enrichment provenance are explicit. Unsafe numeric indexer scalars and foreign namespaces fail closed. Canonical uint32 market/leverage fields use Envio BigInt to avoid signed-Int overflow.
- **Product**: Feed, Explore, Create and Profile; root publish, meaningful fork/Challenge, detail, discussion, reporting, authorized moderation, transparent reputation and first-class responsive tree. Activity remains P1. No trading CTA or order endpoint.

## Publishing and recovery

Draft → Awaiting wallet → Submitted → Confirming → Confirmed / indexing → Published; recoverable errors expose Failed.

The server owns namespace, author and expected intent. It hashes Phase 1 canonical metadata and validates the canonical parent. A fork inherits market and requires direction, target, invalidation, leverage or reasoning change. Entry note/tags may change alongside a meaningful change. An opposite direction is a Challenge, not a separate primitive.

The wallet submits exact shared createThesis calldata. Real RPC verification checks chain, transaction target/from/input, receipt success, canonical block hash, exactly one matching registry event, event timestamp, author, parent, core and metadata hash. Missing receipts remain TX_PENDING; transport failures expose RPC_UNAVAILABLE. Draft time/expiry are checked against event time. Finalized content is immutable. A matching indexed hash and transaction resolves Published; a sent hash alone never does.

The composer stores draft/intent/form/request key and hash per selected wallet/parent. Refresh/retry checks the existing transaction rather than submitting again. Indexer lag retains Confirmed / indexing and recovery. If a real wallet fails to return a hash, it shows an uncertain-result warning and lets the user recover a hash from wallet activity. Known rejection, gas and chain errors have specific recovery actions. Later moderation of a valid draft's parent cannot strand its already-confirmed fork.

## Social state and moderation

Agree is idempotent per user/thesis and reversible. The browser optimistically updates and rolls back on failure. Comments are flat bounded safe text, author-attributed and timestamped; only their author can remove them. Reports have bounded reason/note, request-key validation and one reporter/thesis record. Admin authorization comes from server-only verified DID allowlists, never a browser admin flag.

Hide/unhide changes Postgres visibility and report state only. Feed/Explore omit hidden or corrupt content; detail/tree retain canonical authorship and lineage with an explicit unavailable/hidden state. Profiles count all canonical authored graph participation within the displayed wallet namespace, including roots whose metadata was moderated, without displaying hidden reasoning.

Rate limits are atomic PostgreSQL buckets shared across instances: draft 20/hour, finalization 60/minute, Agree 60/minute, comments 10/minute and 50/hour, report/profile 10/hour, relay preparation 10/minute. Database/network readers have bounded timeouts; mutation retries are explicit and idempotent. Retention pruning for historical rate buckets is a later operational task.

## Reputation and ranking

Originality = successfulRoots / eligibleRoots. A successful root has at least one direct child from a distinct external wallet. Contribution applies the same rule to authored forks. Below three eligible items, show Emerging; otherwise rounded percentage and raw numerator/denominator. Example fixture: 2/3 roots displays 67%; 1/4 forks displays 25%.

Influence = distinct external wallets directly forking any idea by the displayed author wallet, counted once across authored ideas. Self-wallet forks do not grant success or influence; repeated wallet forks do not inflate memberships. Metrics make no profitability or Sybil-resistance claim.

Executions Inspired = distinct independently verified fill identities on strict descendants of authored ideas, deduplicated across overlapping ancestry. Exclude the author's own wallet/user executions. Require canonical descendant author and executionRef to match stored verified evidence. Author links alone earn zero. Browser fixtures show zero; isolated integration tests explicitly insert verified fixtures to prove ancestor deduplication and self-execution exclusion.

Fresh sorts creation timestamp then thesis ID descending. Most Forked and Phase 2 Smart Signal share a deliberate social-only tuple: unique external direct forkers in the last 24h descending, then last 7d descending, then creation timestamp and ID descending. No secret weights or Nansen inputs. Window membership counts come from actual indexed activity; candidate loading is bounded to 500, 20 per page. Activity above 10,000 in seven days fails closed rather than displaying an approximate ranking.

Explore counts, contributors and most-forked summaries describe the latest-500 discovery window. Its tags are actual metadata; BTC/ETH/SOL/MON IDs come from validated public context. Profiles separate exact AuthorStats totals from at most 100 recent items. Verified-evidence credit fails closed above its 500-evidence/250-ancestry read limits.

## Tree and visual checks

Desktop uses a branching semantic list with connectors, clear selected node/ancestry, author, direction, concise changes and direct navigation/fork links. Mobile uses stacked nodes with capped indentation and bottom navigation. No graph framework. Tree views show 250 branch nodes plus selected ancestry and declare truncation.

Playwright checks root only, one child, depth four, 21 descendants, long username/reasoning, mixed long/short branches, mobile overflow, navigation, optimistic rollback, profile editing and keyboard focus. Captured review artifacts in `docs/assets/phase2/`: feed-desktop.png, feed-mobile.png, detail.png, fork-composer.png, tree-desktop.png, tree-mobile.png and profile.png. All visible data is test-workspace data, not claims of live executions.

## Perpl relay boundary — code only

Strict inputs construct only GET wallet/fills paths on the official Testnet origin. No caller URL, host, method, body, trading or withdrawal endpoint is accepted. Expiry is 20 seconds past/3 seconds future; canonical signature binds chain/method/exact path and query/timestamp/nonce/empty-body hash. Logging exposes endpoint/result only. Normalization and verifier interfaces are prepared; no transport, account enrollment or verified evidence write runs. API returns 501 RELAY_NOT_ENABLED. Each pagination request will need a fresh proof in Phase 3; the future transport must consume/reject reused nonces according to Perpl authorization semantics.

## Validation

Final gates passed on 2026-10-04: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm abi:check`, `pnpm build`, and `env -u NO_COLOR pnpm test:e2e`. `pnpm test` passed 157 Vitest tests across 12 files (including all 13 database constraint tests and 12 relay-boundary tests), 12 real Envio handler tests, and 28 Foundry tests. Playwright passed all five browser journeys. The separate pinned `.tools/foundry/forge test --root contracts --use /Users/anil/Desktop/fork-metropolis-spec/.tools/solc-0.8.37` also passed all 28 Solidity tests, including three 256-run fuzz cases. No tests failed or were skipped. CI is configured to run the same gates and install Chromium; remote CI has not been run.

Production loopback smoke checks also passed: `/feed` returned 200 without credentials, `/api/test/identity` returned 404, and `/api/feed` returned an actionable 503 CONFIGURATION_REQUIRED. The smoke server was stopped afterward. Workspace and standalone indexer dependency peer checks pass. `git diff --check` passes.

Production build uses Next's documented Webpack compiler because Turbopack production compilation cannot bind its internal port in this environment. Development remains Turbopack. Build succeeds without secrets; remaining warnings are unsuppressed upstream SDK warnings described below.

## Known boundaries and warnings

- Privy email/Google login, embedded-wallet signing, live Monad receipt ingestion, Neon networking/migration and Cloud GraphQL shapes need credentialed integration validation. They are implemented but have not been exercised live.
- No live Perpl evidence exists. Reorg recovery of a previously finalized publication and high-volume retention/indexer operations need live-phase verification. Bounded reads fail closed; they do not silently claim exactness beyond their limits.
- Webpack warns about Privy's optional @farcaster/mini-app-solana import. Installed SDK source checks the Farcaster environment and catches its absence. FORK config enables Ethereum/Monad email/Google, not this optional feature.
- Webpack warns about ox Tempo VirtualMaster's dynamic worker_threads import through Privy/x402/viem's chain barrel. FORK does not use Tempo. No stubs, warning filters or broad dependency upgrades were added to hide it.
- Current supported Privy dependencies include 17 deprecated transitive packages; standalone Envio includes two. ESLint 9's deprecated maintenance line is retained for compatible Next lint peers. Workspace and standalone peer checks pass. Native keccak installation initially emitted macOS target-version linker notices; subsequent installed-package tests/builds pass.

These are genuine integration/SDK limits, not permission requests. No deployment or credential setup has been performed.

## Next recommended phase, after review

Review this social core, then authorize live Testnet identity/registry/indexer/database integration and one manually confirmed Perpl execution with independent evidence verification. Inputs: Privy App ID/server secret plus allowed local origin/email/Google setup; Neon dev DATABASE_URL; a client-held funded Monad Testnet deployer/wallet; deployment registry address/start block and Envio GraphQL endpoint after authorized deployment; Perpl Testnet account/enrollment and AUSD test collateral. Private EVM/Ed25519 keys stay client-held. Nansen enrichment and web publishing remain separately scoped work.

Official SDK references and material deviations are in 28_RESEARCH_SOURCES.md and D-028 through D-035 in 29_DECISIONS.md.
