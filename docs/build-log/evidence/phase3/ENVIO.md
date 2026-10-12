# Envio — real Cloud deployment and empty application baseline

Status: READY for the user-approved Cloud gate, observed 2026-10-09. One actual development deployment is active and synced. This proves Cloud availability and the real empty FORK read model; first-event ingestion, root/fork lineage, live reorg behavior and indexing delay remain unmeasured until the next approved gate. No thesis, execution link or simulated event was submitted.

## Cloud deployment

- Organisation/indexer: anilkaracay / fork-social-indexer; development tier, EU region shown in the official dashboard.
- GitHub repository: private anilkaracay/fork-metropolis; only this repository was selected for the user-approved GitHub App installation.
- Deployment commit: d98ed3a138f46fe7937830bc6bb0c63000c342a8; dedicated envio branch, root indexer, config.yaml, auto-deploy disabled.
- HyperIndex 3.12.1; official Cloud CLI 1.0.0 is separate, pinned under ignored .tools. No application dependency upgrade.
- Canonical target: chain 10143, registry 0x1889a7216b1ecad9a44910dd0996834d0894b9e1, inclusive start block 69535255, derived from [deployment artifact](../../../../contracts/deployments/10143.json).
- GraphQL: https://indexer.dev.hyperindex.xyz/da86abe/v1/graphql. Discovered through official deployment endpoint CLI, not a guessed hostname. This is a public development deployment endpoint, not a promoted production endpoint.
- Build succeeded in 33.17 seconds; runtime error/warning query returned no entries. CLI and GraphQL _meta independently report HyperSync, correct chain/start block and caught-up head. Live baseline at 13:06:49Z: progress/source block 69547051, isReady=true, zero processed events. Dashboard shows Active / Synced 100%.

[Public machine-readable Cloud proof](envio-cloud.json). [Dashboard proof](envio-cloud-live.png).

The initial envio branch push preceded indexer creation; it registered no commits. Official deploy rejected that unregistered commit without creating a deployment. Pushing the subsequent evidence commit through the configured GitHub integration registered it as inactive; one explicit deployment then succeeded. No second indexer or unnecessary deployment was created. Local evidence/measurement commits after this deployment do not alter the running indexer; its config/schema/ABI/handlers are unchanged.

## Current official requirements checked on 2026-10-09

- [Cloud deployment](https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment): supported HyperIndex versions, Node 24+, pnpm 10.32.0, monorepo root/config/branch, self-contained imports and ENVIO_-prefixed custom variables.
- [Official Cloud CLI](https://docs.envio.dev/docs/HyperIndex/envio-cloud-cli): browser login, repos, indexer settings/env, explicit commit deployment, logs/status, actual endpoint and security inspection.
- [Supported networks](https://docs.envio.dev/docs/HyperIndex/supported-networks): Monad Testnet 10143 HyperSync support; actual deployment confirms this source.
- [Configuration](https://docs.envio.dev/docs/HyperIndex/configuration-file): precise inclusive numeric start_block and official RPC fallback. Codegen-only zero sentinel is overridden by the actual Cloud environment.
- [HyperSync credentials](https://docs.envio.dev/docs/HyperSync/api-tokens): Cloud has provider-managed access; no separate local HyperSync token was generated.
- [Hosted GraphQL](https://docs.envio.dev/docs/HyperIndex/navigating-hasura): aggregate endpoints are not exposed. Use stored handler counters. [Endpoint/security features](https://docs.envio.dev/docs/HyperIndex/hosted-service-features) distinguish account credentials from optional endpoint access controls.

The user completed GitHub OAuth and scoped GitHub App approvals. The official CLI securely used the existing authenticated GitHub CLI session; account API access was checked, not inferred from exit code. Cloud CLI login/token may exit zero while printing authentication failures. Credentials remain outside the repository in a mode-0600 file under mode-0700 ~/.envio-cloud; no token value is recorded here. No billing or paid plan was changed.

## Live GraphQL and application

Unauthenticated HTTPS POST returned HTTP 200 without GraphQL errors. Introspection confirms all expected entities, namespace fields, numeric BigInt scalars, Thesis_bool_exp, limit/offset/order_by and AuthorStats_by_pk(id: String!). Existing application queries work unchanged; no Cloud compatibility patch to handlers/schema/read client was required.

Global limit:1 queries returned empty arrays for Thesis, ForkEdge, AuthorStats, MarketStats, ExecutionLink, ThesisExternalForker and AuthorExternalForker. Empty global first pages establish exact zero counts, not a truncated count estimate. No _aggregate query, fixture or synthetic live event was used.

Server-only FORK_ENVIO_URL is securely configured in ignored mode-0600 apps/web/.env.local; Next's installed @next/env loads the expected value. Database/Privy/registry settings are preserved. FORK_TEST_MODE is absent. Actual application HTTP reads pass for database health, all three Feed modes, Explore and the existing real account profile. Profile recent activity is empty; all raw reputation counters are zero, Originality/Contribution are Emerging and no verified execution credit exists. [Public application proof](envio-application.json).

The fresh local production build passed strict opt-in empty-index Playwright proof: Feed “The first idea starts with you.”, Explore “A conversation waiting to start.” and Profile “The next idea is unwritten.”. No test-workspace controls or fixture cards appear. [Feed](envio-empty-feed.png), [Explore](envio-empty-explore.png), [Profile](envio-empty-profile.png). Nansen credentials are absent; profile context remains disabled and no authenticated Nansen flow was run.

## Next-gate latency preparation

Run pnpm indexer:latency REAL_THESIS_TRANSACTION_HASH immediately once the next approved transaction is submitted. This read-only tool loads local server configuration, verifies actual Monad chain, successful canonical receipt and exactly one ThesisCreated event from the canonical registry, then polls the scoped live Thesis. It requires matching transaction, thesis, author, content hash, block hash/number and creation time before reporting visibility. It cannot sign, broadcast or write an event.

Output records canonical receipt block timestamp, measurement start, first observed GraphQL visibility, two-second polling interval and block-to-observed-visibility upper bound. Polling/network delay and late starts are explicitly included; this is not internal ingest latency. A three-minute timeout or mismatch fails without producing a fake observation. Eight isolated regression cases cover pending receipts, delayed visibility, namespace/transaction/content/block mismatches, timeout, duplicates and future clock timestamps. No real latency has been measured, because this gate publishes nothing.

## Quality and security

| Check | Result |
| --- | --- |
| pnpm format:check / lint / strict typecheck | PASS; zero lint warnings |
| pnpm test | 202 root + 12 handler + 28 Foundry tests passed; zero failed/skipped, three 256-run fuzz cases |
| pnpm abi:check | PASS; deployed artifact ABI SHA-256 matches indexer/shared copies |
| pnpm build | PASS; existing optional Privy Farcaster and ox Tempo worker warnings remain visible |
| Standalone Cloud-runtime frozen install / codegen / typecheck / tests | PASS using pnpm 10.32.0; 12/12 handler cases, no dependency changes |
| Cloud build / actual sync / live GraphQL baseline | PASS; real HyperSync source, correct namespace/start block, HTTP 200, all seven entities empty |
| Production Playwright | 4/4 passed against the fresh local production server and actual Cloud endpoint, including strict empty-index proof |
| Exact credential checks | PASS in 227 non-ignored files and 203 browser static files at scan time |
| Redacted Gitleaks current source / reachable history | Zero findings |

No Envio account token, PostgreSQL URL/password or Privy server secret appears in inspected source/evidence or browser files. Server secret variable names and the server-only GraphQL endpoint are absent from browser bundles. .env.local and .tools remain ignored/untracked. Actual endpoint security reports API-key protection disabled and no IP whitelist on the public development tier; the application sends no provider account token. Public blockchain data contains no email, Privy DID, session token or wallet private key. Handlers have no external/offchain identity ingest or secret logging. Scans are bounded to inspected files and rules, not a guarantee about uninspected future content. [Security scope](SECRET_SCAN.md).

Foundry's sandbox signature-cache write warning does not affect the passing tests/build; the two known SDK build warnings are unchanged. Standalone pnpm withholds esbuild postinstall by default; install/codegen/typecheck/tests and actual Cloud build all passed without a bypass.

## Files in this completion checkpoint

- Code/tooling: scripts/measure-indexing.mjs, scripts/measure-indexing.test.mjs, package.json, vitest.config.ts.
- Production smoke: apps/web/playwright.production.config.ts, apps/web/production-smoke/production.spec.ts.
- Documentation: indexer/README.md, docs/12_ENVIO_INDEXER.md, docs/23_DEPLOYMENT_ENV.md, docs/29_DECISIONS.md, docs/33_PHASE3_LIVE_INTEGRATION.md, docs/evidence/phase3/ENVIO.md, docs/evidence/phase3/SECRET_SCAN.md.
- Public evidence: docs/evidence/phase3/envio-cloud.json, envio-application.json, envio-cloud-live.png, envio-empty-feed.png, envio-empty-explore.png, envio-empty-profile.png (all six in docs/evidence/phase3).
- Local only, untracked: apps/web/.env.local and ignored .tools Cloud/preflight state; credential file outside the repository. No indexer runtime/config/schema/ABI/lockfile or Solidity change.

The final exact-value scan after saving all images also passes across 231 non-ignored files; its timestamp and zero findings are recorded in envio-cloud.json.

## Stop / next review

No human action is required for this completed gate. Stop before publishing. Next recommended integration, only after user review: real user A publishes the first root → measure real receipt-to-visibility observation → genuinely distinct user B forks it → Idea Tree and exact profile participation update. Funding/signatures will require the real users when that gate is authorized. No Nansen setup, Perpl enrollment/order, P1 feature, production hosting or Phase 4 work was started.
