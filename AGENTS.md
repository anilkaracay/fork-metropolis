# AGENTS.md - Codex Operating Rules for FORK

This repository is optimized for a three-day Monad Metropolis build. Prefer a smaller complete product over a broader incomplete product.

## Mission

Build FORK: a premium social network for collaborative trading ideas on Monad.

A user publishes a thesis, another user forks it, modifies it, executes the fork on Perpl, and the resulting lineage remains publicly attributable.

## Product constraints

- Primary track is Social, Attention & Culture.
- Never make the home experience look like a generic exchange terminal.
- Trading exists to validate social ideas, not to replace the social product.
- The P0 navigation is Feed, Explore, Create, Profile. Activity is P1.
- The hero interaction is Fork, not Buy, Sell, Long, or Short.
- Idea Tree is a first-class screen, not a hidden analytics view.

## Scope constraints

Do not implement without an explicit decision log entry:

- DMs or chat rooms
- project token
- DAO/governance
- NFT badges
- native iOS/Android
- generic AI assistant
- cross-chain deposits
- autonomous copy trading
- subscriptions
- advanced order types beyond what is needed for the demo

## Engineering principles

1. TypeScript strict mode everywhere in the web app and indexer.
2. Solidity contracts must have Foundry tests before deployment.
3. Never store wallet private keys or Perpl Ed25519 private keys on the server.
4. Nansen and other secret API keys are server-only.
5. All user-visible errors must have a recovery action.
6. Every network call gets timeout, retry policy, and structured error mapping.
7. All critical product flows get Playwright coverage.
8. Accessibility is part of definition of done: keyboard navigation, focus states, semantic labels, contrast.
9. Prefer deterministic simple code over abstraction-heavy frameworks.
10. Remove dead code before submission.

## Stack

- Web: Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui primitives, TanStack Query, viem.
- Auth/wallet: Privy React SDK.
- Database: Postgres on Neon, Drizzle ORM.
- Contracts: Solidity + Foundry.
- Indexing: Envio HyperIndex + GraphQL.
- Trading: Perpl REST + WebSocket APIs.
- Onchain intelligence: Nansen API through server-only routes.
- Deployment: self-hosted Node.js web behind a reverse proxy and HTTPS domain (later), Envio Cloud for indexer, Monad Testnet for contract. Development uses localhost; do not use Vercel.

Pin exact versions in the lockfile when implementation begins. Do not blindly upgrade dependencies during the final day.

## Required quality bar

A judge must be able to:

1. Sign in and receive/use an embedded EVM wallet.
2. Publish a thesis on Monad Testnet.
3. See it appear from Envio-backed data.
4. Open the thesis and see reasoning plus social actions.
5. Fork it and change at least target or leverage.
6. Execute the fork on Perpl Testnet.
7. Return to FORK and see a verified execution state.
8. Open the Idea Tree and see parent-child lineage.
9. Open a profile and understand Originality, Contribution, and Influence.

If any of these fail, stop feature work and fix the core flow. Exception under approved D-017: if secure independent Perpl retrieval is unavailable, report the limitation, keep execution Attested without credit, and continue the social product; never claim the Verified criterion passed.

## Commit discipline

Each task should end with:

- passing relevant tests
- no TypeScript errors
- no lint errors
- docs updated if behavior changed
- screenshots for visual changes when practical

## Design rule

The interface must look like a premium consumer product, not a hackathon dashboard. Avoid generic neon gradients, oversized crypto illustrations, noisy cards, excessive glassmorphism, and placeholder copy.
