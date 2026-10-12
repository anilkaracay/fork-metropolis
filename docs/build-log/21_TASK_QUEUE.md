# Task Queue

Use this file as the ordered implementation backlog. Do not start a later P0 task when an earlier prerequisite is broken.

## P00 - bootstrap

### P00-01 workspace

Phase 1 stops after foundation/shared/public context/registry/hash helpers and quality checks. No auth, DB implementation, Envio handlers, publishing UI, enrollment/trading, Nansen calls or deployment until review.

Create pnpm workspace with:

- `apps/web`
- `contracts`
- `indexer`
- `packages/shared`

Acceptance:

- root scripts: dev, lint, typecheck, test
- lockfile committed

### P00-02 environment schema

Create typed env validation for web server/client.

Acceptance:

- app fails fast on missing required server secrets
- no server secret included in client bundle

## P01 - contract

### P01-01 implement FORKRegistry

Use `08_SMART_CONTRACT_SPEC.md`.

### P01-02 Foundry tests

Complete all listed tests and fuzz cases.

### P01-03 deploy Testnet

Record address/tx/block in deployment docs.

## P02 - shared types

Create:

- contract ABI export
- chain config
- Zod thesis metadata schema
- content-hash canonicalizer
- execution-ref canonicalizer
- market types

Acceptance:

- hash test vectors shared across server/client

## P03 - database

### P03-01 Drizzle schema

Implement all P0 tables from data model.

### P03-02 migrations

Create idempotent migration workflow.

## P04 - Privy

### P04-01 provider and login

### P04-02 backend token verification

### P04-03 wallet transaction helper

### P04-04 typed-data signing adapter for Perpl

Do not hide provider-specific errors; map them.

## P05 - shell/design

### P05-01 semantic CSS variables

### P05-02 desktop/mobile app shell

### P05-03 reusable thesis card

### P05-04 error/empty/loading primitives

## P06 - thesis creation

### P06-01 draft API

### P06-02 composer form

### P06-03 contract transaction

### P06-04 finalize receipt verification

### P06-05 success/indexing state

## P07 - Envio

### P07-01 config + ABI

### P07-02 schema

### P07-03 handlers

### P07-04 local tests

### P07-05 Cloud deploy

### P07-06 web GraphQL client

## P08 - Feed

### P08-01 Envio feed query

### P08-02 metadata batch join

### P08-03 Fresh / Most Forked

### P08-04 responsive card polish

## P09 - Thesis detail

### P09-01 composed server read

### P09-02 provenance header

### P09-03 social actions layout

## P10 - Fork

### P10-01 fork prefill

### P10-02 diff calculation

### P10-03 at-least-one-change validation

### P10-04 contract submit

### P10-05 challenge intent

## P11 - Idea Tree

### P11-01 Envio tree query

### P11-02 desktop tree

### P11-03 mobile lineage fallback

### P11-04 node detail/diff

## P12 - social interactions

### P12-01 comments API/UI

### P12-02 agree reaction

### P12-03 reports/basic moderation

## P13 - Perpl

### P13-01 public context and market mapping

Use live `/v1/pub/context`; no static logic for limits.

### P13-02 resolve execution verification design

Research current Perpl endpoints and decide how backend can verify a user fill without receiving the private API signing key. Write decision before code.

### P13-03 IndexedDB credential module

### P13-04 API-key enrollment

### P13-05 exchange account detection/setup

### P13-06 order forwarding enable/revoke

### P13-07 signed WebSocket session

### P13-08 execution drawer

### P13-09 market order + fill state

### P13-10 verification + linkExecution

## P14 - reputation

### P14-01 AuthorStats query

### P14-02 transparent graph percentages and raw counts

Use D-015: external-child roots/forks ratios, Emerging below 3 eligible samples, raw Influence and deduplicated verified Executions Inspired. No PnL or arbitrary scores.

### P14-03 profile UI

## P15 - Nansen

### P15-01 server client and cache

### P15-02 permitted Monad PnL Summary schema/normalization (no labels)

### P15-03 interpreted external wallet-performance context where available

No missing-data penalty or assumption of history on a fresh wallet.

### P15-04 Smart Signal ranking/fallback

### P15-05 attribution copy

## P16 - Activity

Build simple event list only after core stable.

## P17 - quality

### P17-01 unit tests

### P17-02 API integration tests

### P17-03 Playwright

### P17-04 accessibility pass

### P17-05 mobile pass

### P17-06 performance pass

### P17-07 security pass

## P18 - launch/submission

### P18-01 analytics events

### P18-02 test group

### P18-03 metrics snapshot

### P18-04 README/submission copy

### P18-05 technical demo

### P18-06 pitch video

## Stretch only

### S01 Branch Watch automation

Only start when every P0 acceptance criterion passes.

If implemented, it must have:

- user-created bounded policy
- start/stop
- expiry
- max notional/leverage
- visible audit log
- safe failure
- production-ready reliability

Otherwise do not claim Perpl automation bounty.
