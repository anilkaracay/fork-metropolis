# Phase 3 — Live Integration and Proof

Status: **local PostgreSQL gate passed; overall Phase 3 remains in progress**. No Phase 4 work, trading automation, order, product deployment or authenticated Privy/Envio/Perpl/Nansen product flow was performed. The local standard PostgreSQL database is running and migrated; this is live local database evidence, not deployed production evidence. Other live product observations remain Monad public RPC and Perpl public context. Test fixtures are not live integration evidence.

## Phase 3B — automate-first live unblock

Current step: **local PostgreSQL reviewed and approved; Privy localhost dashboard configured, App Secret approval pending**. Repository creation and main push are complete. The user superseded Vercel/stable-staging prerequisites: no Vercel login/project/deployment, no server deployment now. On 2026-10-09 the user explicitly authorized computer use; the existing authenticated development app was configured and its public App ID securely written locally. The existing secret is masked/unretrievable; creating an additional persistent API credential requires action-time computer-use approval. No actual Privy login/wallet/signature proof exists yet; registry deployment remains unauthorized.

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

User authorized automate-first setup. Official Docker/PostgreSQL/Drizzle/node-postgres/pnpm documentation was checked before database changes. Standard TCP node-postgres replaces the Neon WebSocket adapter; unchanged Drizzle SQL migrations work with any compatible PostgreSQL host through DATABASE_URL. No Neon authentication or project creation continues. Database review is complete; the current authorized integration is Privy localhost only, through current official tooling.

## Baseline

Clean approved commit e87fc8256d2693bc2bb07d4d0cf50a47ef4b28af. All seven Phase 2 screenshots existed. Fresh baseline format/lint/typecheck/test/ABI/build passed: 157 root tests, 12 Envio tests, 28 Foundry tests and five browser journeys. Local production feed returned 200, test identity route 404 and unconfigured feed API actionable 503. Subsequent final validation is below.

## Gate ledger

| Gate | State | Evidence / dependency |
| --- | --- | --- |
| 0 Baseline | Passed | Clean reviewed commit, full fresh checks, seven screenshots, production test-route rejection. |
| 1 PostgreSQL | Passed locally | Healthy Compose PostgreSQL 17.11; ignored mode-0600 DATABASE_URL; three unchanged migrations, nine tables, actual HTTP health 200, ten rollback-only live assertions, zero retained fixtures. Production database is deferred. |
| 2 Privy | Configured / blocked | Dashboard Email/Google, EVM-only automatic wallets for all users and localhost:3000 configured. App ID and approved additional server secret PRESENT in ignored mode-0600 local environment; official SDK credential/settings check passes. Credentialed production smoke 3/3; live no-token/invalid-token rejection passes. Real login modal is open, awaiting user authentication; no actual wallet/token/signature proof. |
| 3 Monad registry | Prepared / blocked | Public chain 10143 verified; reviewed compiled source/settings/ABI agree; 28 Foundry tests pass. Public funded human deployer not supplied. Read-only artifact recorder ready; no artifact/transaction created. |
| 4 Envio Cloud | Prepared / blocked | ENVIO_ custom variables fixed; standalone pnpm 10.32.0 install/typecheck/12 tests pass. Requires GitHub/Cloud access and actual contract address/start block. |
| 5 Production readiness | Revised / pending | Existing local production smoke passed 3/3. Standard root build/start and optional Docker self-host readiness will be verified at the revised later step; no server deployment. |
| 6 Two real users | Blocked | Depends on live Privy/Monad/Envio; local PostgreSQL gate is passed; final domain is not a prerequisite. No actual root/fork hashes or live graph/reputation. Five isolated browser tests are fixtures only. |
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

Local PostgreSQL migrations are applied. No remote database deployment, registry or enrollment exists. No order/fillIdentity/executionRef/linkExecution transaction exists. Relay still returns RELAY_NOT_ENABLED and author attestation does not become Verified.

## Current database validation

[Local PostgreSQL evidence](evidence/phase3/local-postgres.json): 174 unit tests passed, including 13 database constraint tests plus the expanded rollback smoke on isolated PGlite; strict workspace typecheck, lint and format passed; root production build and ABI check passed. The actual Docker PostgreSQL service passed ten live constraint assertions and schema/migration verification. Both development and production HTTP health returned 200. Zero smoke rows remain. The unchanged committed migration files use the standard node-postgres adapter. The frozen lockfile was accepted; offline installation encountered an uncached package, so a frozen online installation was used to restore dependencies, and pnpm why shows no Neon SDK dependency. No database credentials appeared in 201 production browser files or Git changes; Gitleaks found no leaks in changed/new source. The temporary app servers were stopped; PostgreSQL remains running.

The build retains the two existing upstream SDK warnings; Foundry's sandbox signature-cache warning did not fail compilation. No Privy setup/authentication or other integration continued. Review this database result before proceeding.

## Phase 3 validation (baseline plus current database checks)

Privy localhost preflight (2026-10-06): local account bootstrap is independent of registry/Envio, primary selection is persisted and explicit, and real signing checks are prepared outside product navigation. Fresh format/lint/typecheck/full test/build checks pass: 188 root unit / 12 indexer / 28 contract tests. Fresh production browser smoke passes 3/3, including the new development proof page's production 404. Browser scan of 203 static files and changed-source credential/Gitleaks checks pass; the missing Privy credential prevents a value scan or any real auth/signing evidence. The earlier counts below remain the approved database baseline. Update 2026-10-09: both real Privy credentials are now securely configured, official SDK settings verification passes, root tests pass 192/192, credentialed build and production smoke pass 3/3, and exact browser/source secret scans pass. Live localhost unauthenticated/invalid-token requests return 401 and database health returns 200. Actual user authentication/signing remains pending; see D-041 for the production streaming-response fix. [Current Privy preflight evidence](evidence/phase3/PRIVY.md).

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
| Fresh real localhost Privy journey | Credentials/settings ready; user login pending in the open real SDK modal. Normal unauthenticated Chrome tab is not verified incognito proof; stable staging requirement superseded |
| Live local PostgreSQL | Passed: migration journal, nine tables, HTTP health and ten rollback-only assertions |
| Live Envio / Perpl / Nansen integration | Blocked; not substituted by fixture tests |

Sandbox initially denied local browser server port bindings; reruns with authorized local-server access passed. Default sandbox Foundry cache writes warned; separate authorized run passed without warning. Build retains Privy's optional Farcaster import and ox Tempo dynamic worker warnings (D-034), no stubs/filtering/upgrades.

## Human actions and continuation

1. Current next action: complete Email/OTP sign-in in the opened localhost Privy modal. The approved additional App Secret and public App ID are securely configured; dashboard settings and official SDK checks pass. No secret in chat. Then verify real wallet persistence, authoritative token/DID/wallet ownership, typed-data signing, PostgreSQL sync and security; stop for review.
2. GitHub is already private/pushed; server and final domain setup are deferred. Contract/Envio/Nansen/Perpl work waits until the relevant gate is authorized after review.
3. Supply public funded Monad Testnet deployer address and wallet type. Keep signing/private key local; obtain gas MON from Monad Testnet faucet.
4. After stable hostname exists, request exact Origin whitelisting/test collateral funding from Perpl via official Discord, giving public wallet/chain 10143/instance 12/exchange. Ask funding method for current AUSD contract; no secret or signature in support messages.
5. At Gate 12 use official tooling to retrieve/configure NANSEN_API_KEY securely where supported; request browser approval only if unavoidable. Verify plan/credit entitlement before expanding the default budget.
6. Participate in fresh-browser localhost email/Google auth and two distinct real identities/wallet signatures. Perpl enrollment/order/verification stay deferred until the final HTTPS domain exists.

Exact commands, sources and dependency sequence are in [deployment instructions](23_DEPLOYMENT_ENV.md). Sponsor records: [Privy](evidence/phase3/PRIVY.md), [Envio](evidence/phase3/ENVIO.md), [Nansen](evidence/phase3/NANSEN.md), [Perpl](evidence/phase3/PERPL.md). [Secret scan scope](evidence/phase3/SECRET_SCAN.md).

Phase 4 is not started. After remaining Phase 3 proof passes, consider final UX polish, reliability, traction, demo and submission only.
