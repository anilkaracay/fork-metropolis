# Deployment and Environment

## Environments

### local

- local Next.js
- local Postgres or dev Neon branch
- Anvil optional for fast contract iteration
- local Envio
- Perpl Testnet for integration

### staging

- Vercel preview/staging
- Neon staging branch
- Monad Testnet
- Perpl Testnet
- Envio development deployment

### production-hackathon

- stable Vercel production URL
- Neon production database
- Monad Testnet contract
- Perpl Testnet
- Envio Cloud production/development tier suitable for judging

Do not use Monad mainnet merely for prestige if it increases risk.

## Network constants

Verify before deployment against current official docs.

```text
Monad Testnet chain ID: 10143
Monad Testnet RPC: https://testnet-rpc.monad.xyz
Perpl Testnet REST: https://testnet.perpl.xyz/api
Perpl Testnet WS: wss://testnet.perpl.xyz
Perpl Testnet Exchange: 0x1964c32f0be608e7d29302aff5e61268e72080cc
Perpl Testnet collateral: 0xa9012a055bd4e0edff8ce09f960291c09d5322dc
```

## Environment variables

### public/client-safe

```text
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_FORK_REGISTRY_ADDRESS=
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=
NEXT_PUBLIC_PERPL_API_URL=https://testnet.perpl.xyz/api
NEXT_PUBLIC_PERPL_WS_URL=wss://testnet.perpl.xyz
NEXT_PUBLIC_PERPL_CHAIN_ID=10143
NEXT_PUBLIC_PERPL_EXCHANGE_ADDRESS=0x1964c32f0be608e7d29302aff5e61268e72080cc
```

### server-only

```text
DATABASE_URL=
PRIVY_APP_ID=
PRIVY_APP_SECRET=
NANSEN_API_KEY=
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
ENVIO_API_TOKEN=
SENTRY_DSN=                 # optional
ADMIN_WALLET_ALLOWLIST=     # required when P0 moderation is enabled
```

Do not create a server env var for user Perpl Ed25519 private keys.

### builder-code stretch

```text
PERPL_BUILDER_ID=
PERPL_MAX_BUILDER_FEE_PER_100K=0
```

Only set after Perpl registration and user consent design is implemented.

## Deployment order

1. create Neon database
2. run migrations
3. deploy FORKRegistry to Monad Testnet
4. verify/decode deployment and record block/address
5. deploy Envio indexer with address/start block
6. configure Privy production domain/origin
7. configure Vercel environment variables
8. deploy web
9. smoke public reads
10. smoke auth/write
11. smoke Perpl setup/execution
12. smoke Nansen enrichment

## Contract deployment record

Fill after deployment:

```text
FORKRegistry address: TBD
Deployment tx: TBD
Deployment block: TBD
Compiler: TBD
Foundry version: TBD
Git commit: TBD
Explorer URL: TBD
Source verified: TBD
```

## Database migration policy

- migration files committed
- never run destructive migration on final day without backup
- migration command is explicit in README
- preview/staging uses separate branch/database

## Domain/origin configuration

Perpl payload/enroll requires a whitelisted Origin for browser and backend requests. Privy also uses configured app domains.

Before final demo:

- production origin registered with Perpl (required for enrollment)
- production URL registered in Privy dashboard
- CSP updated for exact required endpoints

## CI commands

Root should support:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Contracts:

```text
node scripts/forge.mjs fmt --check
pnpm test:contracts
```

Indexer:

- codegen
- typecheck/build
- handler test/smoke

## Secret scan

Before making repo public/final:

- search git history for `.env`, API keys, private keys
- rotate any credential ever committed, even if deleted later
- verify screenshots/videos do not expose secrets
