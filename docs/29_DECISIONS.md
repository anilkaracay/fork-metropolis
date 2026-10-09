# Decision Log

Add every material change as a new entry. Never silently change architecture in code.

## D-001 - Primary track

Status: Accepted
Date: 2026-10-04

Decision:

FORK competes in Track 03 Social, Attention & Culture.

Reason:

Core value is collaborative social creation, public provenance, and reputation. Trading is execution/proof, not the product category.

## D-002 - Product primitive

Status: Accepted

Decision:

The core object is a forkable Thesis. Follow/copy-trader is not the core model.

## D-003 - Canonical provenance

Status: Accepted

Decision:

Author, parent, market, risk parameters, content hash, and creation time are recorded in FORKRegistry on Monad. Large social text remains offchain with hash anchoring.

## D-004 - Execution venue

Status: Accepted

Decision:

Perpl Testnet is the only execution venue in the hackathon MVP.

## D-005 - Wallet provider

Status: Accepted

Decision:

Use Privy as authentication + embedded EVM wallet + transaction/signing layer. Do not add Dynamic or Mera to the core build.

## D-006 - Indexer

Status: Accepted

Decision:

Envio HyperIndex is the canonical graph query layer.

## D-007 - Nansen role

Status: Accepted

Decision:

Nansen enriches discovery and profile context. It does not directly determine FORK reputation score.

## D-008 - Database

Status: Accepted

Decision:

Use Neon Postgres + Drizzle for metadata/comments/reactions/execution verification/cache.

## D-009 - Contract upgradeability

Status: Accepted

Decision:

No proxy/upgradeability in MVP. Redeploy if a critical contract bug is found.

## D-010 - Comments/reactions

Status: Accepted

Decision:

Comments and Agree reactions are offchain for three-day scope. Fork lineage remains onchain.

## D-011 - Challenge

Status: Accepted

Decision:

Challenge is UX around an opposite-side fork, not a separate protocol object.

## D-012 - Creator royalty

Status: Deferred

Decision:

Do not implement automatic creator royalty in MVP. Preserve builder-code path for future value attribution.

Reason:

Requires product/legal/economic design beyond the three-day safe scope.

## D-013 - Perpl bounty

Status: Accepted

Decision:

Perpl manual execution is core product integration. Do not claim the sponsor automation bounty unless Branch Watch reaches production-ready quality.

## Open decisions to resolve during implementation

### D-OPEN-01 - Perpl verification (resolved by D-017)

The approved constrained read-only relay is the implementation path. Live authenticated testing is still mandatory before any Verified claim. Failure remains Attested and does not block the social product.

### D-OPEN-02 - tree renderer

Choose CSS recursive tree vs React Flow after testing integration cost. Time-box to 2 hours.

### D-OPEN-03 - exact package versions (resolved by D-026)

Phase 1 pins compatible versions in exact manifests and the pnpm lockfile. D-026 records the TypeScript/ESLint compatibility constraints and the checksum-verified Foundry/Solidity tooling.

## D-014 - Nansen permitted context

Status: Accepted
Date: 2026-10-04

Decision:

Use only explicitly redistributable wallet PnL/PnL Summary context. No Address Labels, Smart Money labels/badges, or prohibited derived data. Server-only key, aggressive caching, no penalty for missing data, deterministic social-only fallback. Nansen remains external context and cannot affect FORK-native reputation. Check current terms for each exposed field.

## D-015 - Transparent P0 graph reputation

Status: Accepted
Date: 2026-10-04

Decision:

Originality = eligible roots with at least one external fork / eligible roots. Contribution = eligible authored forks with at least one external fork / eligible authored forks. Display Emerging below three eligible roots/forks; otherwise percentage with numerator/denominator. Eligible means canonical indexed roots/forks in the active registry namespace, with no age or execution prerequisite. External means a child author different from the thesis author. Influence = distinct external wallets directly forking any thesis by the user. Executions Inspired = distinct independently verified executions on strict descendants of any thesis by the user, counted once per author across overlapping ancestor paths. Self-fork edges never improve reputation; exclude the originating author's own executions from Executions Inspired. No Sybil-resistance claim, PnL component, log-normalized score or arbitrary 0–100 score.

## D-016 - Execution status and trust

Status: Accepted
Date: 2026-10-04

Decision:

Separate Not executed, Attested, Verified / Open and Verified / Closed. Verified requires authoritative evidence retrieved by FORK backend directly from Perpl and validated against identity and thesis. Client claims, screenshots, arbitrary references and user signatures are not independent proof. Only verified executions affect execution-dependent metrics or Executions Inspired. A fill alone does not prove a position is still open: show Verified execution unless authoritative position data supports Open/Closed.

## D-017 - Constrained Perpl read-only verification

Status: Accepted
Date: 2026-10-04

Decision:

Browser prepares rapidly expiring authentication for fixed approved GET requests. Backend owns HTTPS host/path/method allowlists, forwards directly to official Perpl, validates ownership/account/market/side/time/nonzero fill, and stores normalized authoritative evidence. No trading body or arbitrary URL/method, no logged headers/signatures, no uploaded Ed25519 private key. Pagination requires fresh request proofs. This path must be live-tested. If impossible, retain Attested, exclude reputation credit, report the limitation and continue social development.

## D-018 - Execution reference identity

Status: Accepted
Date: 2026-10-04

Decision:

No mandatory positionId. Use documented immutable fill identity when complete; exact v1 ABI encoding and fail-closed requirements are defined in 08_SMART_CONTRACT_SPEC.md and D-024. Bind chain, registry, thesis, wallet, venue/account and execution evidence. Uniqueness of the underlying fill must be enforced independently of the thesis-bound reference.

## D-019 - P0 outcomes

Status: Accepted
Date: 2026-10-04

Decision:

Closed-position PnL and native closing/portfolio management are not P0. An open trade does not delay the MVP or imply profit. Closed state is optional only when authoritative position evidence is naturally available. Graph reputation has no outcome dependency.

## D-020 - P0 navigation

Status: Accepted
Date: 2026-10-04

Decision:

Feed, Explore, Create, Profile. Activity is P1 and has no dead navigation item in P0.

## D-021 - P0 theme

Status: Accepted
Date: 2026-10-04

Decision:

Polished accessible dark mode only. Complete light mode and switching are P1.

## D-022 - Deployment-scoped identity

Status: Accepted
Date: 2026-10-04

Decision:

All persisted thesis/graph/execution identities use chainId + normalized registryAddress + thesisId. Namespace author/membership aggregates as well. Bare thesisId is never globally unique. Execution evidence uniqueness is venue-scoped across registries so redeployment does not permit double credit.

## D-023 - Perpl bounty and foundation phase

Status: Accepted
Date: 2026-10-04

Decision:

Perpl is the execution dependency, not an automation-bounty optimization. No bot/autonomous copy trading in this phase. Branch Watch requires full P0 and a later decision. Phase 1 permits spec reconciliation, workspace/web foundation, shared primitives, public context, registry/tests and execution-ref helpers. No auth, DB implementation, Envio handlers, publishing UI, authenticated trading, Nansen calls or deployment until review.

## D-024 - Execution reference v1 ABI

Status: Accepted
Date: 2026-10-04

Decision:

Official Fill has acc, mkt, oid, t, l, s, optional p and at.txid/at.l; no mandatory stable fill ID or positionId. Prefer complete transaction hash + log index + account/order identity. Missing identity or unsafe JSON integers fail closed. Exact two-stage ABI definition in 08_SMART_CONTRACT_SPEC.md. A hash is an identifier, never proof; authenticated relay still needs live testing.

## D-025 - Metadata canonical representation

Status: Accepted
Date: 2026-10-04

Decision:

Version 1 metadata has fixed key order version, reasoning, tags, entryNote. Omitted/blank entryNote becomes null. Trim outer text whitespace, preserve internal whitespace and Unicode bytes (no Unicode normalization). Tags are trimmed, lowercased, nonempty, sorted by code-point order, deduplicated, then limited to three unique tags. Tags are ASCII [a-z0-9][a-z0-9-]{0,23}. Reject control characters except TAB/LF/CR; cap raw input at 32 tags before deduplication. Server and browser share canonical UTF-8 keccak256 vectors.

## Changelog - 2026-10-04 / approved audit resolutions

Removed prohibited Nansen redistribution and realized-PnL reputation; separated claims from independent evidence; chose the constrained verification path, scoped identities, dark-only P0 and updated navigation. These changes reduce three-day delivery risk and keep reputation social and objectively inspectable. Phase 1 remains foundation-only. D-024/D-025 document the immutable evidence and canonicalization implementation choices.

## D-026 - Foundation tooling and packaging

Status: Accepted
Date: 2026-10-04

Decision:

Pin Node 24.21.0, pnpm 12.6.0, Next 16.3.8/React 19.3.0, TypeScript 6.0.3 and ESLint 9.39.5 within the current parser/plugin peer ranges rather than incompatible newer majors. Tailwind 4.3.3 uses its PostCSS plugin; viem 2.57.2, Zod 4.6.5 and Vitest 5.0.3 support the foundation. Exact versions and integrity hashes are in pnpm-lock.yaml. Foundry 1.8.4 and solc 0.8.37 are installed locally under ignored .tools with verified official SHA-256 manifests. Monad execution and Prague bytecode target are explicit. ABI copies are generated and checked; indexer remains self-contained. No later-phase SDKs/services are installed yet.

## D-027 - Deterministic social ranking baseline

Status: Accepted implementation choice for the approved social-first scope
Date: 2026-10-04

Decision:

Replace the undefined Wilson/log Most Forked formula with distinct external direct-forker counts in 24h, then 7d, then creation time/thesis ID descending. This supplies a deterministic social momentum baseline without invented reputation scores. Optional permitted Nansen performance adjustment remains bounded, positive and separately specified/tested during P15; missing context receives no deduction. No ranking implementation is included in Phase 1.

## D-028 - Supported Phase 2 SDK conventions

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

Use Privy React 3.47.0 and current Node SDK @privy-io/node 0.35.0. Resolve the DID from verified access tokens, then fetch authoritative linked wallets; product services depend on AuthVerifier rather than SDK internals. Use Envio 3.12.1 V3 `indexer.onEvent`, autodiscovered handlers and createTestIndexer, replacing the prior generated-module examples. Keep Envio fully inside its project directory. Drizzle 0.45.3/kit 0.31.11 remain stable pinned releases; Neon 1.2.0 Pool supports the interactive identity transaction and deferrable selected-wallet ownership FK. Next 16 asynchronous route params and viem receipt/event APIs follow current official docs. Documentation references are in 32_PHASE2_SOCIAL_CORE.md.

## D-029 - Isolated PostgreSQL and real handler test workspace

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

No database URL or live identity credentials are available. Apply committed PostgreSQL migrations to PGlite 0.5.8 for tests and the explicit local test workspace. Production architecture remains Neon/Postgres. Simulate receipt confirmation only in development with an explicit flag and random per-run test secret; feed resulting events into actual Envio test handlers. No local contract deployment. Production rejects the flag, live indexer startup rejects test/zero registry configuration, test browser APIs require loopback/same-origin, and all screens display a test-workspace banner. Tests never create production metrics. Do not claim live Privy, RPC receipt, Neon, GraphQL Cloud or Perpl verification validation.

## D-030 - Dependency compatibility and exact pins

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

Use TypeScript 5.9.3 across the workspace: current Privy transitive Solana packages require TypeScript ^5, superseding the TypeScript 6 pin in D-026. Keep Next/React/Tailwind/viem/Zod versions from Phase 1. Pin TanStack Query 5.104.1 and Playwright 1.63.0. Override compatible use-sync-external-store 1.7.0 (React 19 support) and abitype 1.2.3 (Zod 3/4 support), and unify React/ReactDOM 19.3.0; peer checking must pass. Disable Reown's optional install version check and ws native accelerators, retain the JavaScript fallback, and permit required keccak build. Report upstream SDK deprecations rather than upgrading unrelated majors.

## D-031 - Phase 2 social ranking and responsive tree

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

Implement D-027's tuple exactly: unique external direct forkers in 24h descending, then 7d descending, then creation time and thesis ID descending. Smart Signal deliberately uses the same social-only baseline as Most Forked in Phase 2; there are no hidden weights, fabricated Nansen inputs or profitability scores. Fresh uses only creation time/ID. Membership uniqueness excludes self forks and deduplicates a wallet within each time window. Ranking candidates and Explore counts explicitly describe the latest 500 indexed ideas. Explore lists actual metadata tags and four supported markets from context, not synthetic market statistics.

Use a semantic HTML/CSS tree with native links: desktop branching hierarchy and scrollable canvas; mobile stacked branches with capped visual indentation. No graph-library dependency. Selected ancestry remains visible, authorship and changed fields appear on each node, and bounds are explicitly shown.

## D-032 - Persistence, trust and moderation

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

Use eight tables only. Normalize addresses/handles through application validation plus SQL checks; represent content/fill hashes as checked hexadecimal text instead of bytea, preserving the same bytes and global fill uniqueness. Split moderation hidden flag from publication status. Finalized metadata, wallet ownership and verified evidence are immutable; only metadata visibility changes through server-authorized moderator DIDs. Agree supports idempotent PUT and reversal by DELETE. Sensitive mutation rate limits use atomic PostgreSQL buckets across instances. Draft/request keys and confirmation checks are idempotent. Browser refresh retains intent/transaction hash and resumes verification without a second send. A parent hidden after valid drafting cannot strand a confirmed fork; the parent graph and finalized metadata are immutable.

## D-033 - Perpl read boundary only

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

Code accepts only server-owned GET /v1/trading/wallet and /v1/trading/fills targets at official Testnet origin. Strict schemas reject caller URL/hostname/method/body or trading endpoints. Proofs are valid at most 20 seconds old and 3 seconds future, within Perpl's documented 30-second window. Canonical signing preserves exact query order/encoding. Logging exposes an explicit endpoint/result allowlist. The API returns RELAY_NOT_ENABLED after boundary validation; no transport, enrollment, orders or verified evidence writer runs. Normalizer/verifier interfaces remain interfaces until the next approved live integration phase.

## D-034 - Supported production compiler and upstream warnings

Status: Accepted implementation choice within approved Phase 2
Date: 2026-10-04

Use Next's documented `next build --webpack` production compiler. Turbopack production compilation fails its internal local-port binding under this development environment; changing dependencies or relaxing product controls is unnecessary. Development retains Turbopack. Webpack produces a working credential-free production build and exposes two upstream warnings: Privy 3.47.0 optionally imports @farcaster/mini-app-solana behind a Farcaster-environment check and catches its absence; Privy's x402 dependency imports viem's Tempo chain bundle, whose ox VirtualMaster worker uses a dynamic node:worker_threads import. FORK config enables email/Google and Ethereum/Monad, not Farcaster/Solana/Tempo. Leave these warnings visible and document them; do not add unsupported wallet features, alias modules to stubs, filter warnings or blindly upgrade SDKs. Real Privy signing still needs credentialed verification in the next approved phase.

Pin React/ReactDOM 19.3.0 explicitly for Envio's terminal/runtime transitive peers and commit indexer/pnpm-lock.yaml for standalone installation; this fixes a React/ReactDOM peer mismatch in standalone resolution without changing handler semantics.

## D-035 - Lossless canonical uint32 indexing

Status: Accepted correctness fix within approved Phase 2
Date: 2026-10-04

Envio Thesis.marketId/leverageBps and MarketStats.marketId use BigInt storage, not signed GraphQL Int: the contract permits uint32 values through 4294967295, beyond 2147483647. The typed application normalizes these safely into checked uint32 numbers. Add a real-handler maximum-value regression case and read-model scalar test. Keep lineage IDs/prices in their existing lossless representations. This prevents a valid public registry event from overflowing a canonical indexer field.

## D-036 - Envio Cloud environment compatibility

Status: Accepted implementation choice within approved Phase 3
Date: 2026-10-04

Use ENVIO_FORK_REGISTRY_ADDRESS and ENVIO_FORK_START_BLOCK for live indexer configuration: Cloud only accepts custom ENVIO_-prefixed variables. Require a nonzero address and positive deployment block. Keep the standalone lockfile/dependencies unchanged; isolated frozen installation, typecheck and 12 tests pass with Cloud pnpm 10.32.0. The web workspace retains 12.6.0. No deployment is implied.

## D-037 - Permitted Nansen profile context and bounded credit use

Status: Accepted implementation choice within approved Phase 3 Gates 12–13
Date: 2026-10-04

Keep Smart Signal's existing social tuple; do not introduce unmeasured ranking enrichment. Offer separately labeled Monad mainnet PnL context on a real wallet profile, never Testnet/native reputation. Rechecked policy explicitly permits PnL/PnL Summary; strip labels and unknown payload fields. Add one dedicated shared cache table (superseding D-032's eight-table limit solely for this approved integration). Reserve Free-tier 10 credits per attempt across instances/users, default budget 20/day, one-hour success/empty cache, five-minute error cache and no billed retries. Disabled/outage states cannot break social data. Actual provider proof remains pending; fixture success is not live evidence.

## D-038 - Localhost integration and later self-hosting

Status: Explicit user decision, supersedes Vercel staging prerequisite
Date: 2026-10-04

Use http://localhost:3000 for independent development/live gates after checking each provider's official localhost support. Repository stays private until the user's later pre-submission visibility change. Remove Vercel login/project/deployment from the critical path. Final hosting is standard Node.js on the user's server behind a reverse proxy and stable HTTPS domain, optionally simple Docker; no server deployment yet, no proprietary hosting features or new services. Perpl enrollment is blocked by final approved stable Origin, and real orders/verified executions by enrollment; no tunnel/preview workaround. Revised order is Neon, Privy localhost, Monad, Envio, two real users, Nansen, self-host readiness, independent Perpl public readiness. Stop before Phase 4.

## D-039 - Local provider-agnostic PostgreSQL and automate-first setup

Status: Explicit user decision, supersedes Neon in D-008/D-028/D-029/D-038 and prior setup instructions
Date: 2026-10-04

Use local PostgreSQL via a single Docker Compose service for development; later supply a standard PostgreSQL URL for the user's own server or another standard host. Keep the three committed Drizzle migrations unchanged. Replace the Neon WebSocket SDK with pinned pg 8.23.1 and @types/pg 8.23.1 through Drizzle's node-postgres adapter, retaining bounded connection/query timeouts and redacted errors. Remove the obsolete optional Neon peer resolution from the lockfile and use pnpm ignoredOptionalDependencies to exclude the unused provider SDK. No Neon API, provider project or login approval is needed. Historical phase reports describe the previous plan, not the current architecture.

Compose uses official postgres:17-bookworm, persistent named volume, TCP healthcheck, localhost-only port 5432 and restart unless-stopped. Generate local development credentials into ignored mode-0600 files, mount the password as a Compose secret and never log or commit it. Add minimal db:up/down/logs/migrate/smoke commands. Automate safe setup and use current official CLI/API tooling for each future service; human action is limited to genuinely unavoidable authorizations/signatures/funding. Stop after local database migration and live checks; Privy requires the user's review of the database result first.

## D-040 - Independent Privy account bootstrap and explicit primary wallet

Status: Accepted implementation choice within the user-approved Privy localhost gate
Date: 2026-10-06

Bootstrap account sessions using only standard PostgreSQL and Privy's real verifier, independently of undeployed registry/Envio configuration. Keep the existing isolated development test workspace separate; no test verifier enters live or production account paths. Privy's Node SDK verifies the access token and fetches the authoritative user by verified subject before accepting linked Ethereum wallets. Store only the existing DID, wallet addresses/kinds and generated profile handle; discard email/social account details.

On first synchronization choose an embedded EVM wallet first, then the lexicographically lowest normalized address within its kind. Persist this primary and preserve it across subsequent login/account ordering changes. Changing primary requires an explicit linked-wallet selection. If the stored primary becomes unlinked, reject synchronization until an explicit valid selection; never silently fall back. Mutations still require the selected address to match the authenticated DID's current linked wallets and stored primary.

Use the pinned React SDK's documented Ethereum-only appearance, automatic embedded Ethereum wallet creation for all users, Email/Google login and Monad Testnet chain 10143. Google uses Privy's supported default development OAuth credentials initially. Move secret environment validation into a server-only module so even server credential names do not enter the shared browser schema.

Provide an opt-in /dev/privy page restricted to non-test localhost development and returning 404 in production. It uses the existing real viem/Privy provider adapter for a harmless EIP-712 proof, public-address recovery and at most one attempted zero-value self transaction per mounted check. An empty balance reports READY / NEEDS TESTNET MON without sending. It is outside product navigation and contains no fake wallet/key, token logging, signature persistence, contract deployment or trade. Actual credentialed proof remains pending; isolated SDK JWT/database tests do not satisfy live evidence.

Current official documentation describes app creation/configuration through the dashboard. The installed official Node SDK app-settings API is read-only and requires app credentials already; no documented app-bootstrap CLI/API was established. Follow the user's explicit dashboard handoff rule after completing local preparation. Sources and exact settings are recorded in [Privy evidence](evidence/phase3/PRIVY.md).

## D-041 - Development signing proof rejected before response streaming

Status: Accepted security fix within the approved Privy localhost gate
Date: 2026-10-09

The first build with a real public Privy App ID exposed a production smoke regression: /dev/privy returned HTTP 200 instead of 404 when the provider/layout streamed before page-level notFound(). Next 16.3.8's installed official not-found documentation explicitly describes HTTP 200 for streamed not-found responses. Keep page-level checks and add the documented src/proxy.ts convention, narrowly matched to /dev/privy, to reject non-development, fixture-workspace or non-loopback URL/Host requests with a no-store 404 before rendering. This guard neither authenticates users nor alters normal product/API requests. Add isolation regression tests and retain the actual credentialed production smoke assertion; no failure suppression or dependency upgrade.

The opt-in local proof also checks real-session security boundaries using the existing API: missing/invalid tokens, wrong-wallet reads/explicit selection, and unchanged primary after rejection. Rejected probe addresses are request inputs only; no fixture identity/wallet or test key is created. Typed-data and transaction proof still use the real selected wallet adapter and require real login. Live expired-token evidence is not manufactured; the official SDK expiry check is covered separately by isolated cryptographic unit tests.

## D-042 - JSON-safe timestamp for the real development signing proof

Status: Accepted fix observed during the approved live Privy gate
Date: 2026-10-09

A real Google-authenticated embedded EVM wallet reached Privy's signing modal, but the provider rejected the proof timestamp as an n-suffixed string (Cannot convert ...n to a BigInt). Replacing the development-only timestamp with safe numeric Unix seconds allowed the same real viem/Privy adapter to sign successfully and recover the selected primary address. Use a range-checked uint48 for this development proof so the schema's inferred TypeScript primitive and JSON numeric representation agree without losing precision. The origin of the n-suffixed serialization override was not established; no extension or SDK was disabled or upgraded.

Two regression tests verify equal EIP-712 hashing for equivalent numeric/BigInt values, reject invalid/out-of-range timestamps, and inspect the real viem RPC request while a BigInt.toJSON override is present. String fields ending in n remain unchanged. No signing bypass, fake live wallet, server private key, persisted signature or transaction was introduced. The real final uint48 payload was signed and recovered successfully after the change.
