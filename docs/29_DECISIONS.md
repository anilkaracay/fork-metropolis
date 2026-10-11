# Decision Log

## D-052 — Approved Precision Social B1 landing and shared foundation

- Date: 2026-10-11
- Decision: the user approved Direction A and authorized B1 implementation, local production-build/browser QA, then the existing isolated Cherry deployment workflow.
- Scope: public landing at `/`, unchanged product entry `/feed`, shared restrained dark tokens, locally hosted Geist Sans/Mono, reusable controls/wordmark, and the genuine thesis #1 → fork #2 hero. One root layout and a social route group preserve all product/API URLs. Marketing reads a bounded projection of existing hash-validated public data and never initializes the simulated workspace.
- Functional safety: identity switching exposed an active-query race with `QueryClient.clear()`. Reset queries while preserving observers and clear mutation cache; keep the existing Privy verification and wallet architecture. Verify this with the existing social Playwright journey.
- Release gate: all required format/lint/types/unit/indexer/Foundry/ABI/build checks, production route isolation, real read smoke, six responsive widths, screenshots reviewed, secret/image scans, retained previous image and FORK-only database backup before cutover.
- Boundary: no application Idea Tree, composer, Feed or Profile redesign; no README rewrite, contract/reputation/backend architecture change, live publication or blockchain transaction. Perpl and Nansen remain deferred. B2 requires review of B1.

Add every material change as a new entry. Never silently change architecture in code.

## D-051 - Defer Perpl and audit one shared landing/product identity

Status: Explicit user priority change; Stage A research only
Date: 2026-10-11

PERPL: **BLOCKED / DEFERRED — EXTERNAL ORIGIN APPROVAL PENDING**. This supersedes D-050's requirement to wait for Perpl before presentation work. Preserve its implementation and historical evidence; no new enrollment, execution, Verified claim, reputation credit or Perpl bounty eligibility is authorized. Nansen remains deferred. Unavailable execution must be represented honestly without a broken action.

Stage A covers the live social application's visual audit, current official product/marketing references, two creative directions, exact shared design tokens, Idea Tree, a premium landing at the canonical root, safe route preservation, README/submission presentation and a bounded implementation plan. The landing is an addition to the same audit, not a separate brand or restarted research task. Use genuine thesis #1 and fork #2; never fabricate activity or execution.

Do not implement UI or routing changes, install dependencies, rewrite the README, deploy, alter production or contracts during Stage A. Stage B starts only after the user selects the art direction. Preserve existing deep links and authenticated social flows. Research output: [expanded art-direction report](assets/stage-a/art-direction-report.html).

## D-050 - Real Perpl gate stops at provider Origin approval

Status: Accepted scope; live execution blocked on provider approval
Date: 2026-10-11

The user approved one manual Testnet execution, authoritative GET-only verification, existing executionRef v1 encoding, author-only registry linking and Envio indexing. Preserve browser-local Ed25519 signing and the user-controlled Privy wallet. No bot, Nansen, submission polish or unrelated server changes are authorized.

Current official developer guides and live context confirm chain 10143, instance 12, exchange `0x1964c32f0be608e7d29302aff5e61268e72080cc`, 6-decimal AUSD at `0xa9012a055bd4e0edff8ce09f960291c09d5322dc`, 100 AUSD account-opening minimum and 10 AUSD subsequent-deposit minimum. Eight markets are open, including the four supported MVP symbols. The API README lists an inconsistent older collateral address; current Networks & Configuration agrees with runtime context. Resolve configuration dynamically. REST docs also support POST order submission; the FORK server relay stays GET-only.

Official enrollment requires a provider-whitelisted Origin for browser and backend calls. An unsigned fixture-public-key payload check returns HTTP 400 for `https://forktrades.xyz`; the identical request using Perpl's own Origin returns HTTP 200. That is only a diagnostic control, never a substitute enrollment Origin. Its typed data/MAC was discarded without logging/persistence; no private key, signature or enrollment was created. Official documentation directs integrations to ask Perpl for Origin approval; no self-service Origin registration API is documented. Stop here as explicitly requested.

Keep v1 domains, ABI types and fields unchanged. Docs describe `at.l` as transaction-local log index and account/order IDs as uint64 numbers; receipt correspondence and lossless parsing must be validated with real authoritative evidence after approval. Static vectors are not live verification. The relay transport remains disabled. Current official Metropolis bounty still requires a production-ready bot/automation with real onchain activity: manual FORK execution is NOT ELIGIBLE. No automation is added for eligibility.

See [Perpl checkpoint](evidence/phase3/PERPL.md) for evidence and the single provider action. Resume this gate after Origin approval; final submission polish remains subsequent and unstarted.

## D-049 - Canonical public HTTPS cutover on cherry

Status: Accepted within the explicitly approved domain/HTTPS gate
Date: 2026-10-11

The user selected `https://forktrades.xyz` as the sole canonical production origin; `www.forktrades.xyz` permanently redirects to apex while preserving path/query. DNS is independently verified to cherry IPv4 `5.199.166.2`, with no apex AAAA, and remains DNS-only. Rebuild once with the existing public `NEXT_PUBLIC_APP_URL` rather than adding a duplicate runtime URL variable; preserve all current server-only env and database credentials. Use only a dedicated `/etc/caddy/conf.d/fork-metropolis.caddy` in the existing Caddy import organization, automatic HTTPS, full validation before graceful reload, and unchanged loopback app/database isolation. Keep the previous validated image/site baseline for rollback; never change unrelated sites or firewall.

After HTTPS is healthy, add only the apex origin to the existing Privy app while preserving localhost, Google/Email and user-controlled embedded EVM behavior. Prove actual existing-user Google auth, server-side identity/wallet association, logout/login persistence and normal API auth boundaries without new identity/publication/transaction. Existing explicit bearer + wallet auth remains the session mechanism; cookie/origin behavior must be observed over HTTPS before making claims. Public product/security and pre-existing-service checks and sanitized evidence are required. Do not start Perpl, resume Nansen or publish the submission in this gate.

## D-048 - Isolated private self-host preparation on cherry

Status: Accepted within the explicitly approved self-host gate
Date: 2026-10-11

Retain ordinary Next.js 16 `next start` rather than adding standalone tracing to the monorepo. Build with Node 24.21.0 and pnpm 12.6.0, frozen lockfile and public build variables only; install production dependencies in a separate stage and run as the unprivileged node user. Convert the existing TS Next config into equivalent JavaScript during build; do not copy application source, test artifacts or credentials to runtime. Keep the existing database/migration readiness endpoint independent of external providers.

The clean Docker build exposed an existing production import of test fixtures. Alias only that test-runtime import to a fail-closed stub during production webpack builds; development/test runtime remains unchanged. This removes fixture identities/simulated data from the production build without copying fixture files into the runtime image. One existing public market-context JSON is permitted in the builder for TypeScript checking only. An explicit empty Turbopack config retains the existing development/test compiler alongside the production webpack hook.

Use `/opt/fork-metropolis`, Compose project `fork-metropolis-prod`, its own bridge network and PostgreSQL 17.11 persistent volume. Publish only the app at `127.0.0.1:13000`; PostgreSQL has no host port. Never reuse other projects' databases, credentials, volumes or networks. Compare existing container start/port/network metadata, Caddy config hashes and service PID, and UFW state before/after. Docker's own firewall additions are expected for its new isolated bridge; no manual firewall or Caddy changes are authorized.

Run the same committed migrations before application startup; failure stops deployment. For real demo portability, a bounded transfer tool validates an explicit five-table manifest, anchored content hashes, ownership and namespace; excludes rate/cache/draft/provider/session data; imports only into an empty migrated database in one transaction and verifies every transferred row. Required pseudonymous Privy DID and user/wallet foreign keys remain server-only. Transport the restricted export and runtime configuration over SSH, retain mode-0600 files, and keep them outside image/source control. Public auth, DNS/Caddy/HTTPS cutover, Perpl and Nansen resumption remain separate reviewed gates.

## D-047 - Opt-in real-session social boundary verification

Status: Accepted implementation within the explicitly authorized two-user safety probes
Date: 2026-10-10

Extend the existing localhost-only development Privy proof page with a manually invoked check for already-published external root/own fork. All requests use the normal authenticated API and real browser session. Check consecutive Agree PUTs, wrong-wallet Agree rejection, cross-user finalized metadata rejection, malformed parent validation and same-hash finalization replay. No new mutation route, fixture, token extraction, identity impersonation, signing or blockchain submission is added. Before mutations, require a trusted same-namespace root/fork, distinct authors, own fork and an existing Agree. Return only public namespace/wallet/thesis IDs, counts and checked status codes; keep tokens in the existing session adapter and reject unexpected successes/outages. Production and test-workspace exclusions remain unchanged. Add positive-control and fail-closed regression cases plus opt-in real-fork production tree/mobile smoke. This is bounded verification tooling for the approved gate, not a product feature or visual redesign.

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

## D-043 - Accept the Google-proven localhost gate; defer Email/private-session proof

Status: Accepted by explicit user instruction
Date: 2026-10-09

After real Google login, authoritative server identity/wallet verification, real EIP-712 recovery and successful same-account logout/login persistence, the user explicitly requested continuing without the pending Email/OTP login in the prepared private Chrome window. Close the current localhost Privy gate as READY for the demonstrated Google path. Email/OTP and private-session login proof remain NOT TESTED / DEFERRED BY USER, never marked passing or inferred from Google authentication. Email remains enabled; do not introduce an auth bypass, testing token, fake wallet or weaken server checks.

Monad transaction submission remains READY / NEEDS TESTNET MON, consistent with the originally approved zero-balance exception; no transaction was sent. Invalid-token/wrong-wallet rejection has real evidence; expired-token rejection has isolated official SDK cryptographic coverage, not an expired live-session request. This acceptance does not establish bounty/production readiness or authorize FORKRegistry deployment, Envio, Nansen or Perpl. Return the gate result for review before the next integration.

## D-044 - Dedicated encrypted Foundry Testnet deployer

Status: Accepted implementation choice within the explicitly approved Monad deployment gate; deployed and source-verified
Date: 2026-10-09

Preserve the existing Foundry direct-deployment flow with a separate local Testnet-only deployer, rather than adding a Privy deployment UI or exporting an embedded-wallet key. The user explicitly authorized creating this wallet. Store its encrypted keystore and generated password only under ignored .tools/foundry/keystores with directory mode 0700 and file modes 0600; neither credential belongs to the application/server or git. Public address: 0x8EEACa7389758aa32fc672714565aA77503e2091. No deployment or privileged application signer is implied.

Current official Monad documentation supports Foundry 1.8+, chain 10143, https://testnet-rpc.monad.xyz and the current faucet https://faucet.monad.xyz. Keep reviewed Solidity 0.8.37, Prague and optimizer 200 unchanged. Prefer the officially documented Sourcify verification endpoint after deployment without modifying bytecode for verification. At 2026-10-09T12:01:45.473Z the official RPC confirmed chain 10143, a plain deployer EOA, pending nonce 0 and balance 0 MON. Stop for one faucet funding action; recommend 1 Testnet MON. Confirm balance before any deployment. See [Monad preflight evidence](evidence/phase3/MONAD.md).

D-044 completion: after explicit user funding confirmation, official RPC verified 5 MON. Exactly one direct deployment transaction succeeded; canonical receipt/code proof, initial-state reads and official Sourcify exact_match verification passed. The user-reviewed Solidity/config commit remains dfcc50f7b95bf6df035cf97c739b503493856797. The first verification request's native-platform compiler suffix was corrected to the same canonical compiler identifier without source/bytecode changes. Registry configuration is server-side in ignored .env.local. Stop before Envio review; see the completed Monad evidence.

## D-045 - Official Envio Cloud CLI and explicit deployment control

Status: Accepted and completed within the user-approved real Envio Cloud gate; actual Cloud deployment and empty application proof pass
Date: 2026-10-09

Current official Envio documentation provides the separate envio-cloud CLI for browser login, indexer/repository management, ENVIO_ environment configuration and commit-based deployment. Use pinned local tooling 1.0.0 under ignored .tools rather than requiring manual dashboard configuration or upgrading HyperIndex 3.12.1. Preserve standalone pnpm 10.32.0/Node 24 compatibility. Browser login approval and any unavoidable GitHub App authorization remain human actions; never ask for pasted tokens.

Use the canonical Monad deployment artifact to derive the real public registry/start-block variables. Prefer one development-tier public-event indexer, a dedicated envio branch and explicit commit deployment with auto-deploy disabled to avoid creating new indexer versions for unrelated documentation/web pushes. Confirm actual account settings before creation. Cloud indexers have provider-managed HyperSync access; do not generate an unnecessary HyperSync API token. Keep Cloud account credentials out of web environment, browser and git. No paid plan, billing change or thesis publication is authorized. Sources, preflight and pending live checks are in [Envio evidence](evidence/phase3/ENVIO.md).

D-045 completion: user-approved OAuth and repository-only GitHub App installation succeeded. One public development EU deployment is active/synced, version d98ed3a, with canonical chain/registry/start block and provider-managed HyperSync access. The initial pre-creation push registered no commit; a later evidence push registered the branch, then explicit deployment succeeded. Preserve the existing handler/config/schema and public GraphQL reader; actual generated types match. Prepare read-only two-second receipt/visibility polling, report an honest upper bound including late starts, and do not publish until review. Evidence and full checks are in the completed Envio report.

## D-046 - Public development observations for the real publishing journey

Status: Accepted implementation within the explicitly authorized real two-user gate; no publication yet
Date: 2026-10-09

Record actual product-path wall-clock observations before sending the first real transaction. Development-only diagnostics capture a strict public namespace/wallet/transaction/thesis correlation and first observed state timestamps. They never read or store Privy identity, token, email, cookie, signature, private key or server environment. They write no database row and are disabled in production and the isolated fixture workspace. Storage/clock diagnostics cannot interrupt the existing publication or recovery path.

T0 is observed when the real wallet adapter returns its submitted transaction hash; T1 is the successful authoritative finalize response (the server has independently verified the canonical successful receipt); T2 is the first trusted real Envio-backed detail response; T3 is the React effect after Published has rendered. These are measured local observations, including RPC/query polling and network delay, not internal consensus/indexer timestamps. Independently record canonical receipt/block data during validation. If an observation is missing after recovery, leave it missing; never infer or replace it. Refresh/repeated stages preserve the first timestamps and reject namespace changes. A strictly sanitized development DOM JSON node keeps the public record inspectable after route navigation without changing product UI. No transaction, signing bypass or provider setting is added.

Seven focused regression cases pass for replay/refresh, missing T0, wallet/registry/parent mismatch, backward clock, unexpected secret-bearing fields and production/test-workspace isolation. Format/lint/web strict typecheck pass. The actual User A session is hydrated and 5 Testnet MON is confirmed. Automatic approval review rejected the agent's prepared Publish on Monad click because it starts the real publication/wallet flow without action-specific content/payload consent; do not retry or bypass. The prepared concrete ETH LONG demo is handed to the user for that UI action, then the wallet approval remains human-controlled. No real latency is claimed until publication succeeds.
