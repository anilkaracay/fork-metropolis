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

## Phase 2 social core (2026-10-04)

The local social journey is implemented: identity → publish → second-user fork → changed fields → Idea Tree → Agree/comments → transparent profile reputation. No deployment, credentialed wallet session or authenticated Perpl execution has occurred.

Prerequisites: Node `24.21.0`, pnpm `12.6.0`. Foundry installer supports macOS arm64 and Linux x64; tool files stay in ignored `.tools/`.

```sh
pnpm install --frozen-lockfile
pnpm tools:install
pnpm indexer:codegen
pnpm test:dev
```

Open http://127.0.0.1:3000 and use the labelled test identities. This explicit local workspace applies real PostgreSQL migrations with PGlite and invokes actual Envio test handlers, with simulated receipts. It needs no credentials and cannot be enabled in production. Production architecture remains Privy, Neon/Postgres, Monad RPC and Envio. `pnpm dev` runs the real integration path and shows actionable configuration states when integrations are absent; variables are documented in `apps/web/.env.example`.

Quality gates:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm abi:check
pnpm build
pnpm test:e2e
```

On macOS Playwright uses installed Google Chrome; on Linux install Chromium with `pnpm --filter @fork/web exec playwright install --with-deps chromium`. `pnpm test:db` and `pnpm test:indexer` run focused suites. `pnpm test:contracts` uses pinned local Foundry/solc. `pnpm perpl:context` is the explicitly opt-in unauthenticated public context check; unit/browser tests use the dated context fixture.

See [Phase 2 implementation and boundaries](docs/32_PHASE2_SOCIAL_CORE.md), [decisions](docs/29_DECISIONS.md), and [review screenshots](docs/assets/phase2/). Phase 1 metadata/execution-reference vectors and contract evidence remain in [the foundation report](docs/31_PHASE1_FOUNDATION.md).

## Phase 3 live integration (authorized, in progress)

Database health, rollback-safe constraint smoke, strict production/staging browser smoke, Envio Cloud configuration compatibility, read-only contract proof recording and permitted server-only Nansen profile context are prepared. Only public Monad RPC/Perpl context were checked live. No authenticated deployment, real user transaction or trade has occurred; credential/account confirmation is pending.

Use [deployment instructions](docs/23_DEPLOYMENT_ENV.md) for exact environment variables, migration/smoke commands and stable-Origin setup. Put secrets only in ignored apps/web/.env.local or the provider's server settings and confirm presence without sharing values. Never supply wallet or Perpl private keys. [Phase 3 gate ledger and evidence](docs/33_PHASE3_LIVE_INTEGRATION.md) distinguish local fixture checks from missing live proof. No Phase 4 work is started.
