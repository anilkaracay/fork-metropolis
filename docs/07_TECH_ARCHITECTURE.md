# Technical Architecture

## Architecture goal

Minimize moving parts while keeping the core provenance graph verifiable and the UX fast.

## System diagram

```text
Browser
  |
  |-- Privy auth + embedded wallet
  |-- Perpl Ed25519 keypair in IndexedDB
  |-- Perpl WebSocket for live execution
  |
Next.js web app on Vercel
  |
  |-- Server API routes
  |     |-- Privy access-token verification
  |     |-- Postgres metadata/comments/reactions
  |     |-- Nansen server-side API
  |     |-- Perpl verification REST calls
  |
  |-- Envio GraphQL client
  |
Monad Testnet
  |
  |-- FORKRegistry contract
  |-- Perpl contracts
  |
Envio HyperIndex
  |
  |-- Thesis/Fork/ExecutionLink events
  |-- derived AuthorStats/MarketStats/TreeEdge
  |
Neon Postgres
  |
  |-- immutable thesis metadata
  |-- social offchain data
  |-- verified execution records
  |-- Nansen cached snapshots
```

## Trust boundaries

### Onchain canonical

The following are canonical on Monad:

- thesis ID
- author wallet
- parent thesis ID
- market ID
- side
- target
- invalidation
- leverage
- content hash
- creation timestamp/block
- optional execution reference hash

### Offchain but authenticated

- thesis reasoning text and tags
- comments
- reactions
- profile display metadata
- verified Perpl fill details
- Nansen snapshots

Every offchain thesis metadata object is hashed before the onchain transaction. If content later differs, UI marks integrity failure.

## Why not put all text onchain

Three-day MVP priorities are UX, verifiable lineage, and live product quality. Large text storage adds gas and development complexity without improving the core proof. Content-hash anchoring preserves integrity while lineage stays onchain.

## Application stack

### Web

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui primitives, selectively used
- TanStack Query for server state
- viem for ABI encoding/chain reads where needed
- Zod for API and form validation
- React Hook Form for composers

### Database

- Neon Postgres
- Drizzle ORM
- SQL migrations committed to repo

### Contract

- Solidity 0.8.x current stable compiler supported by Foundry
- Foundry for build/test/deploy
- OpenZeppelin only where a proven primitive is needed; avoid upgradeability for MVP

### Indexer

- Envio HyperIndex
- GraphQL endpoint consumed by web server/client

### Trading

- Perpl REST for context/history/enrollment
- Perpl WebSocket for real-time trading and fill updates

### Wallet

- Privy React SDK for auth and embedded wallet transaction/message signing

### Intelligence

- Nansen REST API through server routes only

## Client/server responsibility

Client owns:

- wallet interaction
- Perpl Ed25519 key generation and signing
- Perpl WebSocket authenticated trading session
- optimistic UI
- theme and interaction state

Server owns:

- authenticated metadata mutations
- content hashing source of truth
- Perpl execution verification
- Nansen API calls/cache
- rate limiting
- moderation flags

Envio owns:

- onchain event ingestion
- canonical lineage graph query layer
- derived graph stats

## Data flow: create thesis

1. Client POSTs normalized metadata draft.
2. Server stores draft and returns keccak256 canonical UTF-8 content hash (shared version 1 canonicalizer).
3. Client sends contract transaction through Privy.
4. Client submits receipt/thesis ID to finalize endpoint.
5. Server verifies receipt against FORKRegistry event before finalizing.
6. Envio independently indexes event.
7. UI reads onchain graph from Envio and metadata from Postgres.

## Data flow: execute thesis

1. Client retrieves Perpl market/account context.
2. Client signs and submits Perpl order.
3. Client receives fill.
4. Client sends fresh proof for server-owned fixed read-only requests; no private key.
5. Server retrieves Perpl responses directly, verifies wallet/account/thesis relationship and reserves unique fill evidence. Unsuccessful verification remains Attested.
6. Server creates `execution` record with verified=true.
7. Server returns deterministic execution reference hash.
8. Client links hash onchain through FORKRegistry.
9. Envio indexes link.

## Caching

- Public feed Envio GraphQL: 3-5s stale time.
- Thesis metadata: long cache, invalidate on moderation changes only.
- Comments: 10s stale time with optimistic mutation.
- Nansen PnL profile: cache at least 1 hour; cache empty responses and errors briefly; no calls per feed card render.
- Perpl public market context: 15-30s cache; live price through WebSocket when execution drawer is open.

## Failure isolation

Nansen outage:

- core app still works
- omit unavailable optional wallet-performance context without penalty
- Smart Signal feed renormalizes without Nansen factor

Envio lag:

- after user transaction, temporarily show local pending object
- poll receipt and GraphQL for up to 20s
- offer `Refresh indexed state`

Perpl outage:

- social app remains usable
- execution action shows unavailable state

Postgres outage:

- onchain tree can still render basic nodes from Envio
- metadata/comments unavailable with explicit message

## No-upgrade MVP contract

Use an immutable deployed registry address. If a critical bug is discovered, deploy v2 and update app config. Avoid proxy risk and setup overhead in the hackathon build.
