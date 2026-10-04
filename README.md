# FORK - Metropolis Track 03 Build Specification

FORK is the social network where trading ideas evolve in public.

A trader publishes a thesis. Other traders discuss it, fork it, change risk parameters, execute their own version on Perpl, and build a verifiable reputation from the ideas they originate and improve.

Think GitHub for trading ideas, but designed as a social product rather than a developer tool.

## Primary hackathon target

- Event: Monad Metropolis 2026
- Primary track: 03 Social, Attention & Culture
- Track thesis: open social graphs, programmable incentives, and fast settlement should let communities create and capture value.
- Product position: trading is the shared social object; the product is not a generic trading terminal.
- Main prize target: Track 03 top 3
- Stretch target: Grand Champion

## Sponsor targets

Tier A, build from day one:

1. Privy - authentication plus embedded wallet signing for FORK contract transactions and Perpl API enrollment.
2. Envio - canonical indexer for the public thesis and fork graph, derived author stats, and feed aggregates.
3. Nansen - permitted external wallet PnL context in discovery/profile, separate from FORK-native reputation; no public labels or prohibited Smart Money data.

Tier B, product integration but bounty only if requirements are met:

4. Perpl - real execution partner. Claim the Perpl bounty only if the optional automation module reaches production-ready quality because the bounty specifically asks for a trading bot or automation system.

Do not distort the product to chase Track 01-only bounties.

## Core loop

Post Thesis -> Discuss -> Fork -> Modify -> Execute -> Verify Execution -> Build Graph Reputation

## Non-negotiable product primitives

- Thesis: a market view with explicit target, invalidation, leverage, and reasoning.
- Fork: create a new version that preserves attribution to its parent.
- Idea Tree: show the lineage from root idea through every fork.
- Verified Execution: connect a fork to a real Perpl order/fill.
- Reputation: distinguish original idea creation, useful improvements, and influence.

## Three-day scope

Ship a polished responsive web application on Monad Testnet and Perpl Testnet. The MVP must work end-to-end with live wallet signing, live contract transactions, live indexer data, and at least one real Perpl testnet execution.

No DMs, no token, no DAO, no NFT badges, no generic AI assistant, no cross-chain funding, no native mobile app, and no broad copy-trading product.

## Recommended repository layout

```text
/
  AGENTS.md
  README.md
  apps/
    web/
  contracts/
  indexer/
  packages/
    shared/
  docs/
  pnpm-workspace.yaml
```

Use a pnpm workspace. Do not add Turborepo unless build performance actually requires it.

## Read first

1. `docs/00_INDEX.md`
2. `docs/02_PRD.md`
3. `docs/07_TECH_ARCHITECTURE.md`
4. `docs/20_3_DAY_EXECUTION_PLAN.md`
5. `docs/21_CODEX_TASKS.md`
6. `docs/22_ACCEPTANCE_CRITERIA.md`

## Source-of-truth rule

If implementation and docs diverge, update the docs in the same pull request. `docs/29_DECISIONS.md` records every material architecture or product decision.

## Phase 1 foundation (2026-10-04)

The approved foundation is implemented; no deployment or authenticated integration exists yet. The dark shell at `/`, `/feed`, `/explore`, `/new`, and `/u/me` is explicitly a foundation preview, without simulated social activity. Activity and light theme are P1.

Prerequisites: Node `24.21.0`, pnpm `12.6.0`. Tool installer supports macOS arm64 (the official macOS Solidity binary needs Rosetta, available on the development machine) and Linux x64 (CI). Installs stay in ignored `.tools/`.

```sh
pnpm install --frozen-lockfile
pnpm tools:install
pnpm dev
```

No secrets are needed. Optional configuration is documented in `.env.example` and `apps/web/.env.example`. Future required secrets must be validated server-side only when their integrations are authorized.

Quality gates:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm abi:check
```

`pnpm perpl:context` explicitly fetches and validates only the official unauthenticated Perpl Testnet context. Unit tests use the dated real response fixture, not live network calls. No stale exchange/collateral IDs are used as runtime fallbacks.

Metadata/execution reference vectors are checked against independent Foundry cast output and Solidity equivalents. An execution reference is an identifier, not proof; complete immutable fill identity is required, and the authenticated verification relay remains a later live-test gate. See `docs/31_PHASE1_FOUNDATION.md` for exact boundaries and verification evidence.
