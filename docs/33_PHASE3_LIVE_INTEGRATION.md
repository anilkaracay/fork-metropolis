# Phase 3 — Live Integration and Proof

Status: **local PostgreSQL passed; Privy localhost READY for the user-approved Google scope; Monad Testnet registry deployed and source-verified; overall Phase 3 remains in progress**. Real Google authentication, embedded Ethereum identity sync, authoritative backend verification, EIP-712 recovery and wallet persistence pass. D-043 defers Email/OTP/private-session login by explicit user choice. The real registry deployment and public Envio Cloud empty baseline are complete. No Phase 4, order, production web deployment, real thesis/fork publication or authenticated Perpl/Nansen product flow was performed. Test fixtures are not live integration evidence.

## Phase 3B — automate-first live unblock

Current step: **Envio Cloud READY with real empty application proof; stop for review before the real two-user journey**. Both Privy credentials were securely configured after concrete user approval; official SDK settings verification passes. One real Google user and embedded EVM wallet are persisted locally, actual token/wrong-wallet checks and signing pass, and logout/login preserves the primary. The wallet has zero MON, so the approved transaction readiness exception applies. Email/OTP and private-session login remain untested and explicitly deferred (D-043). No Vercel or server deployment.

| Requirement | Observed state |
| --- | --- |
| Repository | Private anilkaracay/fork-metropolis; origin/main previously pushed and verified; this database change is a local review checkpoint. Public visibility remains a later user action. |
| Development origin | http://localhost:3000; Privy's current official allowed-URLs documentation explicitly supports localhost with a port. |
| Hosting plan | Later self-hosted standard Node.js, optional simple Docker container and reverse proxy under the user's final HTTPS domain. No deployment now. |
| Superseded Vercel work | Removed from critical path. CLI remains only in ignored local tools; no Vercel project or application dependency exists. No further Vercel login request. |
| Database plan | D-039 supersedes Neon. Local Docker Compose PostgreSQL now; standard PostgreSQL on the user's server/another host later. No Neon API/project/SDK dependency or browser approval is required. |
| Local database | Official postgres:17-bookworm; actual server 17.11 (Debian 17.11-1.pgdg12+2); fork_dev database/user; healthy; 127.0.0.1:5432 only; one named persistent volume; unrelated container on 55432 untouched. Docker Desktop started automatically. |
| Credential configuration | Generated development password file .env.postgres.password and apps/web/.env.local, both mode 0600 and gitignored. DATABASE_URL validates and is server-only; no credential value was printed. |
| Migrations/schema | Three committed migrations applied unchanged; all nine expected public tables and migration journal verified. No schema push. |
| Live local checks | HTTP GET /api/health/database returned 200 with ready/applied; ten rollback-only constraint assertions passed, zero retained smoke rows. Includes wallet uniqueness/reassignment/selected-wallet association/metadata ownership, namespace uniqueness/cross-registry coexistence, reaction idempotency, comment ownership, report uniqueness, fillIdentity uniqueness. |
| Perpl enrollment | BLOCKED BY STABLE ORIGIN until the final production HTTPS domain is available and approved. |
| Perpl real order / verified execution | BLOCKED BY ENROLLMENT; independent localhost gates continue. |

Updated order: local PostgreSQL → verified Privy localhost configuration → Monad Testnet registry → Envio Cloud → real two-user localhost journey → authenticated Nansen → self-host production readiness → independent Perpl public/readiness work, then stop. No Phase 4.

User authorized automate-first setup. Official Docker/PostgreSQL/Drizzle/node-postgres/pnpm documentation was checked before database changes. Standard TCP node-postgres replaces the Neon WebSocket adapter; unchanged Drizzle SQL migrations work with any compatible PostgreSQL host through DATABASE_URL. No Neon authentication or project creation continues. Database and the Google-based Privy reviews are complete. The explicitly authorized Monad registry gate is complete and approved; the real Envio Cloud gate is now authorized.

## Baseline

Clean approved commit e87fc8256d2693bc2bb07d4d0cf50a47ef4b28af. All seven Phase 2 screenshots existed. Fresh baseline format/lint/typecheck/test/ABI/build passed: 157 root tests, 12 Envio tests, 28 Foundry tests and five browser journeys. Local production feed returned 200, test identity route 404 and unconfigured feed API actionable 503. Subsequent final validation is below.

## Gate ledger

| Gate | State | Evidence / dependency |
| --- | --- | --- |
| 0 Baseline | Passed | Clean reviewed commit, full fresh checks, seven screenshots, production test-route rejection. |
| 1 PostgreSQL | Passed locally | Healthy Compose PostgreSQL 17.11; ignored mode-0600 DATABASE_URL; three unchanged migrations, nine tables, actual HTTP health 200, ten rollback-only live assertions, zero retained fixtures. Production database is deferred. |
| 2 Privy | Ready under D-043 | Dashboard Email/Google, EVM-only automatic wallets for all users and localhost:3000 configured. App ID and approved additional server secret PRESENT in ignored mode-0600 local environment; official SDK credential/settings check passes. Credentialed production smoke 3/3; live no-token/invalid-token rejection passes. Real Google login, authoritative DID/embedded-wallet association, PostgreSQL sync, live wrong-wallet/token boundaries and EIP-712 recovery pass. Primary wallet has zero Testnet MON (adapter READY). Same-account Google logout/login preserves the same primary and fresh backend verification passes. Email/OTP and private-session login are explicitly deferred by user, not passed (D-043). |
| 3 Monad registry | Ready / deployed and verified | Dedicated local encrypted Testnet deployer funded after user action; exactly one real direct deployment. Canonical source/config/ABI/creation/runtime proof matches reviewed dfcc50f commit. Receipt/block/getters pass; official Sourcify exact_match. Server registry configuration securely written. [Monad evidence](evidence/phase3/MONAD.md). |
| 4 Envio Cloud | Ready / deployed, empty baseline | One actual public development EU deployment d98ed3a, correct canonical chain/address/start block, HyperSync caught up, GraphQL HTTP 200 and seven zero entities. Server FORK_ENVIO_URL securely configured; real Feed/Explore/Profile zero activity passes. Full quality/security and strict production smoke 4/4; no actual event ingestion or latency claimed. [Envio evidence](evidence/phase3/ENVIO.md). |
| 5 Production readiness | Revised / pending | Existing local production smoke passed 3/3. Standard root build/start and optional Docker self-host readiness will be verified at the revised later step; no server deployment. |
| 6 Two real users | Awaiting explicit review / not executed | Local PostgreSQL, Google-scoped Privy, real Monad registry and actual Cloud empty read model pass. Final domain is not a prerequisite. No actual root/fork hashes or live event/reputation journey yet. Receipt/visibility observation prepared; fixture journeys remain isolated tests only. |
| 7 Perpl readiness | Partial live | Actual current public context saved; documentation funding/collateral discrepancy unresolved with sponsor. |
| 8 Origin/enrollment | Blocked by stable Origin | Final production HTTPS domain and team whitelisting pending. Per instruction, browser-local enrollment implementation waits for approval. No keys/accounts/collateral/forwarding verified. |
| 9 Authoritative verification | Blocked | No enrolled proof/account. Wallet/fills constrained read boundary tested; actual transport remains disabled. API log-index and lossless IDs must be checked with real evidence. No assertion that safe retrieval is impossible. |
| 10 One real order | Not permitted yet | Gates 8/9 have not passed; zero orders sent. |
| 11 Verified reputation | Blocked | No independent fill + real author link/indexed event. No verification or inspired credit invented. |
| 12 Nansen | Prepared / blocked | Policy rechecked; server-only permitted summary/cache/profile implementation and 12 tests pass; key/profile confirmation absent. No authenticated request. |
| 13 Smart Signal | Deferred live decision | Existing social formula retained; approved separate profile context implemented. No unmeasured ranking weight or native PnL reputation. |
| 14 Sponsor evidence | Partial | Truthful Privy sponsor proof PARTIAL (local Google gate READY), Envio/Nansen PARTIAL documents and Perpl NOT ELIGIBLE document. No readiness claim from fixtures. |

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

Local PostgreSQL migrations are applied. No remote database deployment or Perpl enrollment exists; the real Monad Testnet registry is recorded in canonical public evidence. No order/fillIdentity/executionRef/linkExecution transaction exists. Relay still returns RELAY_NOT_ENABLED and author attestation does not become Verified.

## Current database validation

[Local PostgreSQL evidence](evidence/phase3/local-postgres.json): 174 unit tests passed, including 13 database constraint tests plus the expanded rollback smoke on isolated PGlite; strict workspace typecheck, lint and format passed; root production build and ABI check passed. The actual Docker PostgreSQL service passed ten live constraint assertions and schema/migration verification. Both development and production HTTP health returned 200. Zero smoke rows remain. The unchanged committed migration files use the standard node-postgres adapter. The frozen lockfile was accepted; offline installation encountered an uncached package, so a frozen online installation was used to restore dependencies, and pnpm why shows no Neon SDK dependency. No database credentials appeared in 201 production browser files or Git changes; Gitleaks found no leaks in changed/new source. The temporary app servers were stopped; PostgreSQL remains running.

The build retains the two existing upstream SDK warnings; Foundry's sandbox signature-cache warning did not fail compilation. No Privy setup/authentication or other integration continued. Review this database result before proceeding.

## Phase 3 validation (baseline plus current database checks)

Privy localhost preflight (2026-10-06): local account bootstrap is independent of registry/Envio, primary selection is persisted and explicit, and real signing checks are prepared outside product navigation. Fresh format/lint/typecheck/full test/build checks pass: 188 root unit / 12 indexer / 28 contract tests. Fresh production browser smoke passes 3/3, including the new development proof page's production 404. Browser scan of 203 static files and changed-source credential/Gitleaks checks pass; the missing Privy credential prevents a value scan or any real auth/signing evidence. The earlier counts below remain the approved database baseline. Update 2026-10-09: both real Privy credentials are now securely configured, official SDK settings verification passes, root tests pass 192/192, credentialed build and production smoke pass 3/3, and exact browser/source secret scans pass. Live localhost unauthenticated/invalid-token requests return 401 and database health returns 200. Final real Google auth, signing and logout/login persistence now pass; final root suite is 194 tests, indexer 12, contracts 28, credentialed production smoke 3/3. D-041 fixes production streaming status, D-042 fixes real signing timestamp serialization, and D-043 explicitly defers Email/private-session proof by user choice. [Current Privy preflight evidence](evidence/phase3/PRIVY.md).

| Check | Result |
| --- | --- |
| pnpm format:check | Passed |
| pnpm lint | Passed; zero warnings |
| pnpm typecheck | Passed; all strict workspaces |
| pnpm test | Passed: 174 root / 12 Envio / 28 Foundry |
| Database tests | Passed: 13 constraints + rollback smoke (expanded to ten assertions, zero retained fixtures) |
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
| Real localhost Privy journey | Google/auth/wallet/signature/persistence passes. Email/OTP/private-session login untested and deferred by user (D-043); stable staging prerequisite superseded |
| Live local PostgreSQL | Passed: migration journal, nine tables, HTTP health and ten rollback-only assertions |
| Live Envio / Perpl / Nansen integration | Envio Cloud empty baseline now passes; actual event journey, Perpl and authenticated Nansen remain pending |

Sandbox initially denied local browser server port bindings; reruns with authorized local-server access passed. Default sandbox Foundry cache writes warned; separate authorized run passed without warning. Build retains Privy's optional Farcaster import and ox Tempo dynamic worker warnings (D-034), no stubs/filtering/upgrades.

## Current Monad validation — 2026-10-09

[Monad evidence](evidence/phase3/MONAD.md) records the real deployment, official-source verification and independent read proof. Source and Foundry config match reviewed dfcc50f7b95bf6df035cf97c739b503493856797 unchanged. The canonical artifact is contracts/deployments/10143.json. Exactly one deployment; no thesis or execution link was published.

All postdeployment commands passed: format, lint, strict typecheck, test (194 root / 12 indexer / 28 Foundry, three 256-run fuzz cases), ABI and production build. Production Playwright passed 3/3 for isolation/recovery. Known SDK build warnings remain visible. Secret checks passed for source/history, deployment records and 203 browser files; encrypted local credentials and .env.local stay ignored/untracked. This does not establish an Envio-backed social journey.

## Human actions and continuation

The Monad deployment gate is complete; no funding or signing action remains. The user approved this result and authorized Envio Cloud. GitHub App approval, actual deployment and genuine empty application reads now pass. Stop for review before real thesis/fork publication, authenticated Nansen or Perpl orders. GitHub remains private, and server/domain work stays deferred. Email/OTP/private-session Privy proof remains user-deferred under D-043. Later Perpl enrollment still needs the final stable HTTPS Origin and sponsor approval.

Exact commands, sources and dependency sequence are in [deployment instructions](23_DEPLOYMENT_ENV.md). Sponsor records: [Privy](evidence/phase3/PRIVY.md), [Envio](evidence/phase3/ENVIO.md), [Nansen](evidence/phase3/NANSEN.md), [Perpl](evidence/phase3/PERPL.md). [Secret scan scope](evidence/phase3/SECRET_SCAN.md).

Phase 4 is not started. After remaining Phase 3 proof passes, consider final UX polish, reliability, traction, demo and submission only.

## Current Envio validation — 2026-10-09

Actual Cloud build/sync and seven globally empty entities pass. The real server read model returns HTTP 200 for all Feed rankings, Explore and the existing account Profile, with zero activity/counters and honest Emerging labels. No fixture fallback or event injection. Postdeployment format/lint/strict typecheck/ABI/build pass, 202 root + 12 handler + 28 contract tests pass, standalone Cloud-runtime frozen install/typecheck/12 tests pass and production Playwright passes 4/4 including strict real empty-index assertions. Eight root cases cover the new read-only observation tool; real latency remains unmeasured. Source/history Gitleaks and exact local-credential checks across 227 non-ignored files/203 browser files at scan time pass. Existing SDK/sandbox warnings are recorded without suppression. See completed [Envio report](evidence/phase3/ENVIO.md). The deployment commit precedes the local evidence/measurement update; indexer code is unchanged.
