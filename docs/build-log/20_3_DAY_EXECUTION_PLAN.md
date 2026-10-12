# Three-Day Execution Plan

## Operating rule

The product must be submission-ready at the end of Day 2. Day 3 is for integration hardening, polish, traction, and recording. Do not plan to finish the core product in the final hours.

Assume one strong developer. Parallelize research and code generation, but keep one person accountable for integration decisions.

## Day 1 - Core social product and onchain provenance

### Hour 0-1 - repository bootstrap

- initialize pnpm workspace
- create Next.js app
- configure TypeScript strict, lint, formatting
- configure Tailwind/design tokens
- create contracts Foundry project
- create indexer directory
- commit `.env.example` placeholders without secrets
- add CI command script

Exit criteria:

- web boots
- Foundry test boots
- lint/typecheck commands exist

### Hour 1-3 - FORKRegistry

- implement contract exactly from spec
- implement Foundry tests
- deploy local anvil
- generate ABI/shared types

Exit criteria:

- all contract tests pass
- create/fork/link execution covered

### Hour 3-5 - auth, DB, app shell

- Privy provider/login
- user sync endpoint
- Standard PostgreSQL + Drizzle schema/migrations (D-039)
- dark-only app shell with Feed/Explore/Create/Profile navigation
- public/private route behavior

Exit criteria:

- fresh user logs in and profile row is created
- public page remains viewable logged out

### Hour 5-8 - create thesis + live Monad Testnet deployment

- thesis composer
- canonical metadata hashing
- draft/finalize APIs
- deploy FORKRegistry to Monad Testnet
- wire Privy transaction signing
- receipt verification

Exit criteria:

- real Testnet root thesis created from UI
- finalized metadata hash matches onchain event

### Hour 8-11 - Envio

- configure deployed contract/start block
- schema/entities
- handlers
- deploy indexer
- wire Feed from Envio + metadata batch

Exit criteria:

- real Testnet thesis appears through Envio-backed feed

### Hour 11-13 - fork flow

- thesis detail
- fork composer
- diff UI
- create real fork from second account
- tree data query

Exit criteria:

- root -> child appears correctly from live Envio

### Hour 13-14 - Day 1 hardening

- fix P0 errors
- commit clean state
- document deployment address
- run smoke test from incognito

Day 1 must end with a real social provenance product even if trading is not connected yet.

## Day 2 - Execution, reputation, sponsor integrations

### Hour 0-2 - Idea Tree + profile

- premium tree/list UI
- author profile
- Envio AuthorStats
- graph Originality/Contribution percentages and sample counts, raw Influence/Executions Inspired; no PnL scoring

Exit criteria:

- tree and profile usable desktop/mobile

### Hour 2-4 - social layer

- comments
- agree reaction
- challenge->fork intent
- rate limits

Exit criteria:

- product feels social without Perpl

### Hour 4-8 - Perpl setup

- fetch public context
- local Ed25519 key generation/storage
- programmatic API key enrollment
- Privy typed-data signing
- detect/create exchange account
- detect/enable forwarding

This block has the highest integration risk. If blocked for >60 minutes by undocumented behavior, use official Perpl web-created API key for internal testing while continuing to fix programmatic setup. Do not expose a fake success path.

Exit criteria:

- one browser session authenticated to Perpl trading API
- account `fw=true`

### Hour 8-10 - Perpl execution

- execution drawer
- live market state
- signed WebSocket session
- market order
- fill state
- failure mapping

Exit criteria:

- real testnet order executed from FORK

### Hour 10-11 - execution verification/link

- server/client verification path per current Perpl capabilities
- executionRef
- linkExecution transaction
- Envio execution link

Exit criteria:

- thesis displays verified execution and tree node updates

### Hour 11-12 - Nansen

- server API client
- cache
- permitted PnL Summary context only, no labels
- interpreted external profile context
- Smart Signal ranking factor/fallback

Exit criteria:

- visible product behavior changes when context exists
- app works when Nansen is forced to fail

### Hour 12-14 - responsive polish and E2E

- mobile pass
- Playwright critical paths
- errors/empty/loading states
- fix all P0/P1 demo-path bugs

Day 2 must end with a complete submission-capable product.

## Day 3 - Quality, traction, submission

### Hour 0-2 - security and reliability

- CSP
- secret scan
- dependency audit
- verify no Perpl private key leaves browser
- timeouts/retries
- API rate limits

### Hour 2-4 - premium visual pass

- spacing/typography
- card hierarchy
- Idea Tree signature quality
- dark only; full light/theme switching is P1
- transitions
- real mobile device test

### Hour 4-6 - real user test group

- invite 10-20 first-wave testers immediately
- observe onboarding/fork flow
- record friction
- fix only repeated P0/P1 friction

### Hour 6-8 - expand test group and collect proof

- aim for 20-50 total testers if network allows
- seed real prompts, not fake activity
- capture metrics
- collect 3 short user quotes with permission

### Hour 8-10 - bounty evidence

- Privy flow capture
- Envio architecture/query evidence
- Nansen product behavior evidence
- decide whether Perpl bounty requirement is actually met
- do not claim Perpl bounty if automation was not built

### Hour 10-11 - submission copy

- project description
- problem
- why Monad
- Track 03 fit
- sponsor fields
- GitHub README finalization

### Hour 11-12 - record technical demo

Maximum 3 minutes per captured portal requirement.

Record after a full smoke test. Prefer one clean take over heavy editing.

### Hour 12-13 - record pitch

Maximum 2 minutes.

### Hour 13-14 - final go/no-go

Run `30_DEFINITION_OF_DONE.md` top to bottom.

Freeze code after final passed smoke unless fixing a blocker.

## If schedule slips

Cut in this order:

1. PWA
2. Activity page (P1)
3. search sophistication
4. full light mode/theme switching (P1)
5. Nansen secondary UI details, keep one core use
6. comments threading, already out of scope
7. Perpl bounty automation

Never cut:

- root thesis
- fork
- Idea Tree
- Privy wallet signing
- Envio live graph
- one real Perpl execution if technically possible
- mobile usability
- working production link
