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
