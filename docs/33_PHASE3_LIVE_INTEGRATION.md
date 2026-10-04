# Phase 3 — Live Integration and Proof

Status: **in progress; blocked on human configuration, not live-complete**. No Phase 4 work, automation, order, product deployment or authenticated Privy/Neon/Envio/Perpl/Nansen product flow was performed. Only Monad public RPC and Perpl public context are genuinely live product observations. Test fixtures are not live integration evidence.

## Phase 3B — guided live unblock

Current step: **1 — repository and stable staging origin**. Do not proceed to Neon until this step is complete. Prior quality checks remain valid and were not repeated.

| Step 1 requirement | Observed state |
| --- | --- |
| Local branch/checkpoint | main, aaeaa0739f2a09f2e48bd58fa64a59816de15cb4; clean at entry. |
| GitHub authentication | GitHub CLI active account anilkaracay; network-enabled auth check succeeded. |
| Remote repository | origin points to https://github.com/anilkaracay/fork-metropolis.git; repository created under anilkaracay and verified PRIVATE. |
| Visibility instruction | User explicitly approved private anilkaracay/fork-metropolis after the original public proposal was blocked. Any later public visibility change is reserved to the user. |
| Creation/push | Complete: initial pushed main checkpoint a70352090f0cbddbfd416223bba4248828e88b1c matches local HEAD at verification. Subsequent ledger updates are pushed on main. No public publication occurred. |
| Vercel | CLI 62.2.0 installed in ignored .tools/vercel-cli without changing app dependencies. Non-interactive whoami returned Logged out. No project linked. .vercel/ is ignored to protect future local provider state. |
| Deployment configuration | Next.js monorepo apps/web, pinned Node 24.21.0/pnpm 12.6.0, Webpack; existing env examples inspected. No provider secrets configured. |
| Stable staging hostname | Not established; no project linked. |

Next single human action: run `.tools/vercel-cli/node_modules/.bin/vercel login` from /Users/anil/Desktop/fork-metropolis-spec, complete Vercel login/CLI authorization in the intended account, then confirm completion without sharing a token. After confirmation, verify the session and resume stable project linking/deployment. Do not use the CLI's temporary-deployment alternative; do not proceed to Step 2 yet.

## Baseline

Clean approved commit e87fc8256d2693bc2bb07d4d0cf50a47ef4b28af. All seven Phase 2 screenshots existed. Fresh baseline format/lint/typecheck/test/ABI/build passed: 157 root tests, 12 Envio tests, 28 Foundry tests and five browser journeys. Local production feed returned 200, test identity route 404 and unconfigured feed API actionable 503. Subsequent final validation is below.

## Gate ledger

| Gate | State | Evidence / dependency |
| --- | --- | --- |
| 0 Baseline | Passed | Clean reviewed commit, full fresh checks, seven screenshots, production test-route rejection. |
| 1 Neon | Prepared / blocked | Three committed migrations, health endpoint and rollback-safe seven-assertion smoke; DATABASE_URL confirmation absent. Local migrated PostgreSQL tests pass. |
| 2 Privy | Blocked | Real app ID/server secret/domain setup unconfirmed; no actual login/wallet/token/signature. Existing adapter/security tests pass with fixtures. |
| 3 Monad registry | Prepared / blocked | Public chain 10143 verified; reviewed compiled source/settings/ABI agree; 28 Foundry tests pass. Public funded human deployer not supplied. Read-only artifact recorder ready; no artifact/transaction created. |
| 4 Envio Cloud | Prepared / blocked | ENVIO_ custom variables fixed; standalone pnpm 10.32.0 install/typecheck/12 tests pass. Requires GitHub/Cloud access and actual contract address/start block. |
| 5 Vercel staging | Prepared / blocked | Strict live smoke available; local production smoke 3/3. Login/stable hostname/configuration pending; no URL deployed. |
| 6 Two real users | Blocked | Depends on Gates 1–5. No actual root/fork hashes or live graph/reputation. Five isolated browser tests are fixtures only. |
| 7 Perpl readiness | Partial live | Actual current public context saved; documentation funding/collateral discrepancy unresolved with sponsor. |
| 8 Origin/enrollment | Blocked | Stable Origin and team whitelisting pending. Per instruction, browser-local enrollment implementation waits for approval. No keys/accounts/collateral/forwarding verified. |
| 9 Authoritative verification | Blocked | No enrolled proof/account. Wallet/fills constrained read boundary tested; actual transport remains disabled. API log-index and lossless IDs must be checked with real evidence. No assertion that safe retrieval is impossible. |
| 10 One real order | Not permitted yet | Gates 8/9 have not passed; zero orders sent. |
| 11 Verified reputation | Blocked | No independent fill + real author link/indexed event. No verification or inspired credit invented. |
| 12 Nansen | Prepared / blocked | Policy rechecked; server-only permitted summary/cache/profile implementation and 12 tests pass; key/profile confirmation absent. No authenticated request. |
| 13 Smart Signal | Deferred live decision | Existing social formula retained; approved separate profile context implemented. No unmeasured ranking weight or native PnL reputation. |
| 14 Sponsor evidence | Partial | Truthful Privy/Envio/Nansen PARTIAL documents and Perpl NOT ELIGIBLE document. No readiness claim from fixtures. |

## Actual public observations

[public-readiness.json](evidence/phase3/public-readiness.json), observed 2026-10-04T18:32:38.350Z:

- Monad RPC: chain 10143.
- Perpl Testnet instance 12, exchange 0x1964c32f0be608e7d29302aff5e61268e72080cc.
- Collateral AUSD 0xa9012a055bd4e0edff8ce09f960291c09d5322dc, six decimals. Opening amount 100 AUSD; deposit minimum 10 AUSD.
- BTC 16 / ETH 32 / SOL 48 / MON 64 all open.
- Public API docs charge each order against request allowance and return 429; no universal numeric request-rate ceiling established in inspected sources.

No authenticated wallet/account/fill context was fetched. README collateral differs from live context. No official Testnet AUSD faucet was established from inspected public onboarding/UI; ask the team rather than bridge mainnet funds.

## Implementation changes

Added database health and always-rollback development smoke; migration errors redact driver detail. Third additive migration adds a normalized external-wallet cache. Corrected Cloud ENVIO_ variables without changing dependencies. Added strict production/staging Playwright suite and server runner. Added read-only deployment proof recorder with reviewed source/bytecode/receipt checks; it cannot sign/broadcast and writes only after actual proof. Implemented permitted mainnet Nansen scalar profile context, server-only key, shared cache/lease/global credit reservations, six-second timeout and zero billed retries. Native graph/reputation/ranking remain social.

No live Neon migrations, provider project, registry or enrollment exists. No order/fillIdentity/executionRef/linkExecution transaction exists. Relay still returns RELAY_NOT_ENABLED and author attestation does not become Verified.

## Final local validation

| Check | Result |
| --- | --- |
| pnpm format:check | Passed |
| pnpm lint | Passed; zero warnings |
| pnpm typecheck | Passed; all strict workspaces |
| pnpm test | Passed: 174 root / 12 Envio / 28 Foundry |
| Database tests | Passed: 13 constraints + rollback smoke (seven assertions, zero retained fixtures) |
| Nansen tests | Passed: 12, mocked HTTP / migrated local PostgreSQL only |
| Database-health tests | Passed: four, explicit mocked connection only |
| pnpm abi:check | Passed |
| pnpm build | Passed, two known upstream SDK warnings retained |
| Production Playwright | Passed 3/3, actual local production build without credentials |
| Social Playwright | Passed 5/5, isolated development workspace only |
| Separate pinned Foundry | Passed 28/28, three 256-run fuzz cases, no warning outside sandbox |
| Envio Cloud runtime compatibility | Passed frozen standalone install/typecheck/12 tests with pnpm 10.32.0 |
| Reviewed compiled contract | Source/config/hash/compiler/settings/ABI match approved commit; no deployment tested |
| Secret scan | Git/current source clean; browser three reviewed public SDK identifiers, no FORK credential detected |
| Production test adapters | identity/submit/reset 404; test flag rejected in production tests |
| Live staging URL / fresh Privy journey | Blocked; no configured staging origin/credentials |
| Live Neon / Envio / Perpl / Nansen integration | Blocked; not substituted by local tests |

Sandbox initially denied local browser server port bindings; reruns with authorized local-server access passed. Default sandbox Foundry cache writes warned; separate authorized run passed without warning. Build retains Privy's optional Farcaster import and ox Tempo dynamic worker warnings (D-034), no stubs/filtering/upgrades.

## Human actions and continuation

1. Put development DATABASE_URL, NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET into apps/web/.env.local from Neon Connect and the Privy app dashboard; confirm presence only. Do not paste values.
2. Complete the current Vercel CLI login, then establish a stable HTTPS project hostname. GitHub origin now exists as private anilkaracay/fork-metropolis; Envio authorization remains a later sequential step.
3. Supply public funded Monad Testnet deployer address and wallet type. Keep signing/private key local; obtain gas MON from Monad Testnet faucet.
4. After stable hostname exists, request exact Origin whitelisting/test collateral funding from Perpl via official Discord, giving public wallet/chain 10143/instance 12/exchange. Ask funding method for current AUSD contract; no secret or signature in support messages.
5. At Gate 12 put NANSEN_API_KEY into apps/web/.env.local from Nansen agent setup and confirm presence only. Verify plan/credit entitlement before expanding the default budget.
6. Participate in fresh-browser email/Google auth and two distinct real identities/wallet signatures, then exactly one manual order only after enrollment/independent verification pass.

Exact commands, sources and dependency sequence are in [deployment instructions](23_DEPLOYMENT_ENV.md). Sponsor records: [Privy](evidence/phase3/PRIVY.md), [Envio](evidence/phase3/ENVIO.md), [Nansen](evidence/phase3/NANSEN.md), [Perpl](evidence/phase3/PERPL.md). [Secret scan scope](evidence/phase3/SECRET_SCAN.md).

Phase 4 is not started. After remaining Phase 3 proof passes, consider final UX polish, reliability, traction, demo and submission only.
