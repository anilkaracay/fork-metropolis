# Deployment and Environment

Phase 3 is authorized; authenticated infrastructure is not yet deployed. Use local PostgreSQL for development, Monad Testnet and Perpl Testnet. Production later uses standard PostgreSQL on the user's server or another PostgreSQL host. Development uses http://localhost:3000. Verify official provider support before configuring localhost. Final hosting will use the user's server and stable HTTPS domain; no server deployment is authorized yet. Perpl enrollment waits for that final approved Origin.

## Credentials and implemented variables

The agent retrieves provider credentials through official tooling where supported and writes them securely to ignored `apps/web/.env.local`, following `apps/web/.env.example`. Human action is limited to unavoidable browser authorization, signatures or provider approvals. Never paste values into chat or print them in tooling output. Later inject corresponding server variables into the self-hosted Node.js process/container, outside source control. No wallet or Perpl Ed25519 private key belongs on a server.

Only NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_PRIVY_APP_ID are browser environment variables. Implemented server variables:

```text
DATABASE_URL
PRIVY_APP_SECRET
FORK_PHASE=live-integration
FORK_REGISTRY_ADDRESS
FORK_ENVIO_URL
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
FORK_ADMIN_DIDS=
NANSEN_API_KEY                    # optional, Gate 12
FORK_NANSEN_DAILY_CREDIT_BUDGET=20
```

Run pnpm db:up to generate local development credentials and configure DATABASE_URL securely. The application uses [node-postgres through Drizzle](https://orm.drizzle.team/docs/get-started-postgresql), with no provider-specific SDK or network transport. Verify current official tooling before each subsequent service setup. The local Privy Google gate is READY under D-043; Email/OTP/private-session proof is deferred by user, not passed. Nansen setup remains deferred until its gate is authorized. Never set FORK_TEST_MODE in production.

## Database migration and smoke

The minimal Compose service uses the [official PostgreSQL image](https://hub.docker.com/_/postgres), pinned to stable major 17 (Bookworm), one persistent named volume, healthcheck, restart unless-stopped and only 127.0.0.1:5432 exposure. No other service is added. The existing unrelated PostgreSQL container on port 55432 is untouched. Docker Desktop was installed but stopped; the official CLI started it successfully.

```sh
pnpm db:up
pnpm db:migrate
pnpm db:smoke
pnpm db:logs
pnpm db:down
```

pnpm db:up generates a 32-byte random development password in gitignored .env.postgres.password and writes DATABASE_URL to gitignored apps/web/.env.local, both mode 0600. Compose mounts the password as a [file secret](https://docs.docker.com/compose/how-tos/use-secrets/), rather than an environment value. Repeated startup reuses credentials and preserves other environment variables; an existing non-local URL is never overwritten. db:down preserves the named volume; do not remove it or regenerate its password to reset data. Startup waits for health for up to 60 seconds; retry after starting Docker Desktop or freeing port 5432 if needed.

Migrations load apps/web/.env.local when present; an injected process DATABASE_URL takes precedence, so the same pnpm db:migrate command works on a future production server. TLS follows the supplied standard PostgreSQL connection configuration; local loopback development uses plain TCP. Keep production credentials injected server-side. Never schema push: apply the three committed SQL migrations unchanged. The five-connection Pool retains five-second connection and eight-second query/statement timeouts. Failed mutations are not automatically retried; recovery instructs the caller to retry explicitly, avoiding duplicate writes.

The development smoke checks wallet uniqueness/immutable ownership/selected-wallet association/metadata ownership, namespace uniqueness, cross-registry coexistence, Agree idempotence, comment ownership, report uniqueness and globally unique verified fills. All ten checks run in one transaction that always rolls back, including on failure. No application data is deleted or reset. The development guard does not independently establish the target environment; never run this fixture smoke on production.

GET /api/health/database runs SELECT 1 and checks the migration journal. Missing configuration or unavailable/incomplete migrations returns 503 with recovery and no driver details. Successful database health alone does not establish Privy/Envio readiness.

## Contract deployment and proof

Run pnpm test:contracts before deployment. Pinned Foundry 1.8.4/solc 0.8.37 use Monad network mode, Prague and optimizer 200. FORKRegistry has no constructor arguments or owner/admin role. Confirm chain 10143 and sufficient MON at the human-held public deployer address. Follow the [official Monad Foundry guide](https://docs.monad.xyz/guides/deploy-smart-contract/foundry); signing stays in a human-held wallet/encrypted keystore. Gas MON comes from [Monad Testnet](https://testnet.monad.xyz).

After successful direct deployment:

```sh
node scripts/registry-proof.mjs REAL_DEPLOYMENT_TX_HASH REVIEWED_FULL_GIT_COMMIT
```

This read-only tool checks reviewed source/config, compiled source hash/settings/ABI, chain, transaction, canonical receipt/block and exact creation/runtime bytecode before exclusively writing contracts/deployments/10143.json. It never signs/broadcasts or overwrites existing evidence. Explorer verification is initially not-attempted; update only after actual verification. Set FORK_REGISTRY_ADDRESS afterward.

## Envio Cloud

Follow the [hosted deployment guide](https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment). Connect the intended GitHub repository, choose indexer as project root, config.yaml and the reviewed branch. Custom Cloud variables require ENVIO_ prefix:

```text
ENVIO_FORK_REGISTRY_ADDRESS=REAL_DEPLOYED_ADDRESS
ENVIO_FORK_START_BLOCK=REAL_DEPLOYMENT_BLOCK
```

Cloud documents Node 24/pnpm 10.32.0. The standalone frozen lockfile, typecheck and 12 handler tests pass with that version; web retains pnpm 12.6.0. Never deploy config.test.yaml. Set FORK_ENVIO_URL to the actual GraphQL endpoint. The current reader expects a public endpoint; private-tier authentication needs a reviewed server-only header configuration before use.

Measure receipt-confirmed time to first matching scoped GraphQL visibility. Preserve Confirmed / indexing until queryable. Record actual root/fork/link transactions. Handler simulations do not satisfy live proof.

## Local development and later self-hosting

Vercel is removed from the critical path. GitHub origin is private anilkaracay/fork-metropolis; the user will make it public before submission. No Vercel login/project/deployment is required. Use http://localhost:3000 now. Privy's current official documentation supports this exact localhost origin including its port; verified settings, secure credential status, real Google signing/persistence and the user-deferred Email test are in [Privy evidence](evidence/phase3/PRIVY.md).

Final architecture: HTTPS domain → reverse proxy → standard Node.js Next.js application → standard PostgreSQL and existing Envio/Monad/Privy/Nansen/Perpl services. Docker plus Caddy/Nginx may be prepared later, without deploying the user's server. No Edge-only API, proprietary hosting feature, Redis, queue or Kubernetes is required. Self-host readiness will add/verify root pnpm start alongside pnpm build; this new readiness check has not run yet. Existing web start is standard next start, and the local production runner has passed prior smoke.

Local production smoke after build:

```sh
env -u NO_COLOR pnpm --filter @fork/web exec playwright test --config playwright.production.config.ts
```

Strict live smoke can target the local production Node server after a real indexed thesis exists:

```sh
FORK_SMOKE_ORIGIN=http://localhost:3000 FORK_SMOKE_LIVE=1 FORK_SMOKE_THESIS_ID=REAL_THESIS_ID pnpm --filter @fork/web exec playwright test --config playwright.production.config.ts
```

Start that production server separately. Live mode requires actual health/data and a real thesis, unlike credential-free recovery smoke. Final HTTPS-domain smoke uses the same portable test configuration later. Neither smoke replaces two genuinely distinct fresh-browser Privy identities/signatures.

## Perpl Origin and funding

The [official integration instructions](https://github.com/PerplFoundation/api-docs/blob/main/integrations.md) require Origin whitelisting for payload/enroll. After selecting the stable origin, request registration from the Perpl team via [official Discord](https://discord.gg/perpl), supplying exact HTTPS origin, public Testnet wallet, chain/instance/exchange and account ID if already created. No secret/signature is required for that support request. Enrollment depends on team approval; no published timeline was found.

[Observed public context](evidence/phase3/public-readiness.json) specifies six-decimal Testnet AUSD, 100 AUSD opening collateral and 10 AUSD minimum deposit. API README collateral differs; fetch fresh context before approval/deposit. No official Testnet AUSD faucet was established in the inspected public UI/onboarding guides. Ask the Perpl team for its exact funding method for that collateral contract/public wallet. Do not substitute mainnet bridges/onramps. Monad faucet supplies gas MON, not AUSD.

Enrollment is explicitly blocked by the final stable HTTPS Origin; real orders and verified executions are blocked by enrollment. Do not substitute a temporary tunnel or preview URL. Continue independent localhost gates first. After final Origin approval, implement/test Gate 8 browser-local scoped Ed25519 enrollment and REST/WebSocket readiness. Gate 9 independently retrieves authoritative wallet/fill evidence before exactly one manually confirmed market order. No enrollment, deposit or trade has run.

## Evidence and secrets

Save public addresses/hashes, sanitized queries, timestamps and normalized permitted summaries only. Do not retain auth headers/tokens/emails/raw provider payloads as public evidence. Scan reachable git history, current source and compiled browser assets, and repeat after real credentialed builds. Scanner success is bounded by rules/files. Test adapters remain development-only and cannot grant production verification.
