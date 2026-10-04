# Product Requirements Document

## 1. Goal

Ship a complete, polished, live MVP of FORK for Monad Metropolis Track 03 within three development days.

The MVP must prove one new product primitive: forkable trading theses with public provenance.

## 2. Primary user story

As a trader, I can publish a market thesis, see other people fork and modify it, execute my own fork, and build reputation from the ideas I create or improve.

## 3. MVP feature set

### P0 - must ship

#### Authentication and wallet

- Sign in with Privy using at least email and one social method.
- Automatically create or connect an EVM wallet.
- Show current wallet address in profile/settings.
- Support Monad Testnet.
- Use the same Privy wallet to sign FORK contract transactions and the Perpl API enrollment EIP-712 payload.

#### Feed

- Default feed is social, not market-terminal oriented.
- Feed cards show author, market, side, short reasoning, target, invalidation, leverage, age, fork count, comments count, execution status, and one primary `Fork` action.
- Feed sorting modes: Fresh, Most Forked, Smart Signal.
- Smart Signal may add permitted Nansen wallet PnL context when available; no missing-data penalty and deterministic social-only fallback.

#### Create thesis

Required fields:

- market: BTC, ETH, SOL, MON from Perpl Testnet-supported list
- side: long or short
- target price
- invalidation price
- leverage
- thesis text, max 500 chars

Optional fields:

- entry note
- tags, max 3

Create flow:

1. Validate locally.
2. Persist immutable metadata draft server-side and compute content hash.
3. Send `createThesis` transaction to FORK registry through Privy wallet.
4. Wait for transaction receipt.
5. Finalize metadata record against onchain thesis ID.
6. Show success state and route to thesis page.

#### Thesis detail

- Full thesis data
- Root author and direct parent when forked
- Comments
- Reactions: Agree, Challenge
- Fork button
- Execute button for the current user's own thesis/fork
- Idea Tree preview
- Verified execution badge when applicable

#### Fork

- Open fork composer prefilled from parent.
- User must change at least one of: side, target, invalidation, leverage, thesis text.
- UI visually highlights changed fields.
- Contract call stores parent thesis ID.
- Fork appears in Idea Tree after Envio indexes the event.

#### Challenge

Challenge is not a separate protocol primitive. It is a fork with side flipped and a `challenge` UI intent. This keeps the MVP simple and keeps provenance unified.

#### Perpl execution

- Enroll a Perpl API key client-side after one Privy EIP-712 authorization.
- Store the Perpl API token and Ed25519 private key only in browser IndexedDB.
- Fetch current market context.
- Execute a market order from a user's own thesis or fork.
- Show explicit order summary before submission.
- Receive fill/order updates through Perpl WebSocket.
- Use the constrained read-only relay to retrieve authoritative Perpl history independently; claims remain Attested until verification succeeds. Never receive the private signing key.
- Link the verified execution reference using `linkExecution`; only verified records count toward execution metrics. No closed-position PnL dependency.

#### Idea Tree

- Render root -> descendants as an interactive tree.
- Each node shows author, side, current state, fork count, and verified execution indicator.
- Selecting a node opens a side panel with changed fields relative to parent.
- Root path remains visible.

#### Profile and reputation

Show:

- handle and avatar
- wallet address
- Optional permitted Nansen wallet-performance context; no label badges
- Originality percentage and numerator/denominator (or Emerging)
- Contribution percentage and numerator/denominator (or Emerging)
- Influence: unique external forker count
- Executions Inspired: unique independently verified descendant execution count
- root theses count
- forks created
- verified executions
- descendants generated

Reputation must expose its exact graph formula and eligible sample size. Scope all counts to the active chain/registry; never imply Sybil resistance.

#### Comments and reactions

- Authenticated users can comment, max 280 chars.
- One Agree reaction per user per thesis.
- Challenge routes to challenge-fork composer.
- Comments and reactions are offchain in Postgres for speed. Thesis lineage remains onchain.

### P1 - ship if P0 is stable

- Activity page for forks, comments, reactions, and execution updates.
- Search by author, market, or thesis text.
- Shareable Open Graph thesis cards.
- Theme toggle with complete light mode.
- PWA manifest.

### P2 - only after submission-ready build

- Perpl automation module for bounty eligibility.
- Follow system.
- Saved theses.
- Cross-chain funding.
- Creator fee distribution.

## 4. Out of scope

- autonomous copy trading
- custody of user keys
- user-to-user DMs
- group chats
- portfolio management across exchanges
- advanced technical charting
- generic AI copilot
- native mobile apps
- custom token
- DAO
- NFTs

## 5. Core entities

- User
- Thesis
- ForkEdge
- ThesisMetadata
- Comment
- Reaction
- Execution
- AuthorStats
- NansenProfileSnapshot

## 6. Transparent P0 graph reputation

All metrics are scoped to chainId + registryAddress. Eligible roots/forks are canonical indexed authored theses in that namespace; no minimum age or execution requirement.

- Originality: roots with at least one direct fork from an external wallet / eligible roots authored.
- Contribution: authored forks with at least one direct fork from an external wallet / eligible authored forks.
- Below three eligible roots/forks, display Emerging; otherwise display percentage and numerator/denominator.
- Influence: raw distinct external wallets directly forking any thesis authored by the user.
- Executions Inspired: raw distinct independently verified executions on strict descendants of any authored thesis. Count each execution once per author even if several authored ancestors overlap; exclude that author's own executions.

Self-forks never improve these counts. Duplicate external-wallet activity cannot inflate thesis-level unique counts. Do not claim Sybil resistance. Realized PnL, open-trade profit and external Nansen performance are not FORK-native reputation.

## 7. Feed ranking

### Fresh

Reverse chronological by indexed creation time.

### Most Forked

Rank by distinct external wallets directly forking a thesis in the last 24h, then 7d, then indexed creation time and thesis ID descending. Self-forks and repeat wallets do not inflate either window. No undefined Wilson/log score.

### Smart Signal

Start with deterministic FORK social momentum using the same external-fork windows; optional permitted Nansen PnL context may provide a bounded positive discovery adjustment. Missing/stale/unavailable Nansen data receives no penalty. Preserve a deterministic social-only order when no enrichment exists. The adjustment and tie-breaking must be documented/tested before P15; it is not reputation.

### Execution states

Not executed; Attested (unverified claim); Verified execution after backend-retrieved authoritative evidence. Append Open/Closed only when authoritative position state supports it. Closed history is optional. No native close orders or PnL-based P0 scoring.

## 8. Moderation

- User can report thesis/comment.
- Hide content after configurable admin moderation flag.
- Contract event remains public; UI can hide metadata while showing `Content unavailable`.
- Block obvious spam at API layer with rate limits.

## 9. Performance targets

- Feed LCP under 2.5s on normal broadband.
- Primary interaction INP under 200ms where possible.
- App shell loads without waiting for Nansen.
- Envio-indexed thesis should appear in UI within 5 seconds of finality in normal conditions.
- Perpl fill status should update in near real time through WebSocket.

## 10. Quality bar

No mocked core data in the submitted build. Seed content is allowed only when clearly labeled `Demo seed` and never used to fake traction or execution.
