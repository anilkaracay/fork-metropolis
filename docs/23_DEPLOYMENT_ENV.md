# Deployment and Environment

Phase 3 is authorized; authenticated infrastructure is not yet deployed. Use a Neon development branch, Monad Testnet and Perpl Testnet. Choose one stable HTTPS Vercel origin before Privy domain configuration or Perpl enrollment.

## Credentials and implemented variables

Put variables in ignored `apps/web/.env.local`, following `apps/web/.env.example`. Confirm presence before the agent uses them. Never paste values into chat. Configure corresponding server variables directly in Vercel. No wallet or Perpl Ed25519 private key belongs on a server.

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

Obtain DATABASE_URL from the development branch's [Neon Connect dialog](https://neon.com/docs/connect/connect-from-any-app), Privy ID/secret from the [application dashboard](https://dashboard.privy.io/), and Nansen key from [agent setup](https://app.nansen.ai/auth/agent-setup) when Gate 12 is ready. Never set FORK_TEST_MODE in production.

## Database migration and smoke

From the workspace root after confirming the intended development connection:

```sh
pnpm --filter @fork/db exec node --env-file=../../apps/web/.env.local --experimental-strip-types src/migrate.ts
FORK_DATABASE_SMOKE=development pnpm --filter @fork/db exec node --env-file=../../apps/web/.env.local --experimental-strip-types src/smoke.ts
```

Apply all three committed migrations; never schema push. The smoke checks namespace uniqueness, cross-registry coexistence, Agree idempotence, wallet association, comment ownership, report uniqueness and globally unique verified fills. Its transaction always rolls back, including on failure. It never deletes/resets application data. Select a development branch explicitly: the guard does not independently establish database environment.

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

## Stable Vercel staging

Use apps/web as the Next.js project root with workspace-aware install/build settings, committed root lockfile, pinned Node 24.21.0/pnpm 12.6.0 and Webpack production compilation. Verify provider runtime support and actual deployment logs before claiming success. No project/stable hostname has been selected yet. Set NEXT_PUBLIC_APP_URL to one stable HTTPS project/custom domain and register it with Privy and Perpl. Ephemeral previews are unsuitable for enrollment.

Configure Neon, Privy, registry and Envio first. Add Nansen only at Gate 12; never a Perpl server private key.

Local credential-free smoke, after build:

```sh
env -u NO_COLOR pnpm --filter @fork/web exec playwright test --config playwright.production.config.ts
```

Actual staging smoke after a real thesis exists:

```sh
FORK_SMOKE_ORIGIN=https://STABLE_HOST FORK_SMOKE_LIVE=1 FORK_SMOKE_THESIS_ID=REAL_THESIS_ID pnpm --filter @fork/web exec playwright test --config playwright.production.config.ts
```

Live mode requires successful health/data rather than accepting missing configuration. Both modes require test routes 404 and check public browsing, mobile overflow, unauthenticated writes and recovery/404 states. This suite does not substitute for two real fresh-browser Privy identities/signatures.

## Perpl Origin and funding

The [official integration instructions](https://github.com/PerplFoundation/api-docs/blob/main/integrations.md) require Origin whitelisting for payload/enroll. After selecting the stable origin, request registration from the Perpl team via [official Discord](https://discord.gg/perpl), supplying exact HTTPS origin, public Testnet wallet, chain/instance/exchange and account ID if already created. No secret/signature is required for that support request. Enrollment depends on team approval; no published timeline was found.

[Observed public context](evidence/phase3/public-readiness.json) specifies six-decimal Testnet AUSD, 100 AUSD opening collateral and 10 AUSD minimum deposit. API README collateral differs; fetch fresh context before approval/deposit. No official Testnet AUSD faucet was established in the inspected public UI/onboarding guides. Ask the Perpl team for its exact funding method for that collateral contract/public wallet. Do not substitute mainnet bridges/onramps. Monad faucet supplies gas MON, not AUSD.

After Origin approval, implement/test Gate 8 browser-local scoped Ed25519 enrollment and REST/WebSocket readiness. Gate 9 independently retrieves authoritative wallet/fill evidence before exactly one manually confirmed market order. No enrollment, deposit or trade has run.

## Evidence and secrets

Save public addresses/hashes, sanitized queries, timestamps and normalized permitted summaries only. Do not retain auth headers/tokens/emails/raw provider payloads as public evidence. Scan reachable git history, current source and compiled browser assets, and repeat after real credentialed builds. Scanner success is bounded by rules/files. Test adapters remain development-only and cannot grant production verification.
