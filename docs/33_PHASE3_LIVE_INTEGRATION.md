# Phase 3 — Live Integration and Proof

Status: **in progress; blocked on human configuration, not live-complete**. No Phase 4 work, automation, order, product deployment or authenticated Privy/Neon/Envio/Perpl/Nansen product flow was performed. Only Monad public RPC and Perpl public context are genuinely live product observations. Test fixtures are not live integration evidence.

## Phase 3B — guided live unblock

Current step: **Neon live development database**. Repository creation and main push are complete. The user superseded Vercel/stable-staging prerequisites: no Vercel login/project/deployment, no server deployment now. Prior passing checks were not repeated.

| Requirement | Observed state |
| --- | --- |
| Repository | Private anilkaracay/fork-metropolis; origin/main pushed and verified at 9d6e67ab552188c38ee1bc9d4ea949d025da896e before this documentation update. Public visibility remains a later user action. |
| Development origin | http://localhost:3000; provider localhost support must be verified before configuring origins. |
| Hosting plan | Later self-hosted standard Node.js, optional simple Docker container and reverse proxy under the user's final HTTPS domain. No deployment now. |
| Superseded Vercel work | Removed from critical path. CLI remains only in ignored local tools; no Vercel project or application dependency exists. No further Vercel login request. |
| Neon inspection | DATABASE_URL absent from process environment; apps/web/.env.local does not exist. No credential value was printed or connection attempted. |
| Neon setup target | Project fork-metropolis-dev; development branch fork-dev; database neondb; owner role neondb_owner; recommend Frankfurt aws-eu-central-1 for European development, nearer final-server region if different. Use direct connection with pooling OFF for current app/migration/smoke shared URL. |
| Perpl enrollment | BLOCKED BY STABLE ORIGIN until the final production HTTPS domain is available and approved. |
| Perpl real order / verified execution | BLOCKED BY ENROLLMENT; independent localhost gates continue. |

Updated order: Neon → verified Privy localhost configuration → Monad Testnet registry → Envio Cloud → real two-user localhost journey → authenticated Nansen → self-host production readiness → independent Perpl public/readiness work, then stop. No Phase 4.

Next single human action: create/select the Neon development resources above, copy the direct connection string from Connect (Connection pooling OFF), put it as DATABASE_URL in ignored apps/web/.env.local and confirm presence only. After confirmation, validate configuration/connection, apply committed migrations, check live health/schema, run always-rollback smoke and record actual region/database/migration results. No secret in chat.

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
| 5 Production readiness | Revised / pending | Existing local production smoke passed 3/3. Standard root build/start and optional Docker self-host readiness will be verified at the revised later step; no server deployment. |
| 6 Two real users | Blocked | Depends on live Neon/Privy/Monad/Envio; final domain is not a prerequisite. No actual root/fork hashes or live graph/reputation. Five isolated browser tests are fixtures only. |
| 7 Perpl readiness | Partial live | Actual current public context saved; documentation funding/collateral discrepancy unresolved with sponsor. |
| 8 Origin/enrollment | Blocked by stable Origin | Final production HTTPS domain and team whitelisting pending. Per instruction, browser-local enrollment implementation waits for approval. No keys/accounts/collateral/forwarding verified. |
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
| Fresh real localhost Privy journey | Pending credentials and verified localhost setup; stable staging requirement superseded |
| Live Neon / Envio / Perpl / Nansen integration | Blocked; not substituted by local tests |

Sandbox initially denied local browser server port bindings; reruns with authorized local-server access passed. Default sandbox Foundry cache writes warned; separate authorized run passed without warning. Build retains Privy's optional Farcaster import and ox Tempo dynamic worker warnings (D-034), no stubs/filtering/upgrades.

## Human actions and continuation

1. Put development DATABASE_URL, NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET into apps/web/.env.local from Neon Connect and the Privy app dashboard; confirm presence only. Do not paste values.
2. After Neon passes, configure Privy for verified localhost development support. GitHub is already private/pushed; server and final domain setup are deferred.
3. Supply public funded Monad Testnet deployer address and wallet type. Keep signing/private key local; obtain gas MON from Monad Testnet faucet.
4. After stable hostname exists, request exact Origin whitelisting/test collateral funding from Perpl via official Discord, giving public wallet/chain 10143/instance 12/exchange. Ask funding method for current AUSD contract; no secret or signature in support messages.
5. At Gate 12 put NANSEN_API_KEY into apps/web/.env.local from Nansen agent setup and confirm presence only. Verify plan/credit entitlement before expanding the default budget.
6. Participate in fresh-browser localhost email/Google auth and two distinct real identities/wallet signatures. Perpl enrollment/order/verification stay deferred until the final HTTPS domain exists.

Exact commands, sources and dependency sequence are in [deployment instructions](23_DEPLOYMENT_ENV.md). Sponsor records: [Privy](evidence/phase3/PRIVY.md), [Envio](evidence/phase3/ENVIO.md), [Nansen](evidence/phase3/NANSEN.md), [Perpl](evidence/phase3/PERPL.md). [Secret scan scope](evidence/phase3/SECRET_SCAN.md).

Phase 4 is not started. After remaining Phase 3 proof passes, consider final UX polish, reliability, traction, demo and submission only.
