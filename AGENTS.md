# AGENTS.md: Operating rules for FORK

FORK was built for Monad Metropolis. Prefer a smaller complete product over a broader incomplete one.

## Mission

Build FORK: a premium social network for collaborative trading ideas on Monad.

A user publishes a thesis. Another user forks it and changes it. Anyone can back an idea with MON, and the backing is split between its author and the authors of the ideas it grew from. The lineage and the value that moved along it stay publicly attributable.

## Product constraints

- Primary track is Social, Attention & Culture.
- Never make the home experience look like a generic exchange terminal.
- Trading is the subject of the ideas. The product is the social graph around them.
- The navigation is Feed, Explore, Create, Profile.
- The hero interaction is Fork. Back is the second action. Neither is Buy, Sell, Long or Short.
- Idea Tree is a first-class screen, not a hidden analytics view.

## Scope constraints

Do not implement without an explicit decision log entry in `docs/29_DECISIONS.md`:

- trade execution or order placement of any kind (Perpl execution is deferred, D-017 and D-055)
- external wallet analytics (Nansen enrichment is deferred)
- DMs or chat rooms
- project token
- DAO/governance
- NFT badges
- native iOS/Android
- generic AI assistant
- cross-chain deposits
- autonomous copy trading
- subscriptions
- any change to the deployed, non-upgradeable `FORKRegistry` or to existing theses

## Engineering principles

1. TypeScript strict mode everywhere in the web app and indexer.
2. Solidity contracts must have Foundry tests before deployment.
3. Never store a user's wallet private key or any trading signing key on the server. The only key the server holds is the testnet welcome faucet key (D-057): server-only, testnet-only, never logged, never used on behalf of a user wallet.
4. Privy secrets, the faucet key, database credentials and any provider API keys are server-only. Never print or commit them.
5. All user-visible errors must have a recovery action.
6. Every network call gets timeout, retry policy, and structured error mapping.
7. All critical product flows get Playwright coverage.
8. Accessibility is part of definition of done: keyboard navigation, focus states, semantic labels, contrast.
9. Prefer deterministic simple code over abstraction-heavy frameworks.
10. Remove dead code before submission.

## Stack

- Web: Next.js App Router, TypeScript, React, Tailwind CSS, TanStack Query, viem, Motion.
- Auth/wallet: Privy React SDK in the browser, Privy Node SDK for server-side verification.
- Database: standard PostgreSQL via node-postgres and Drizzle ORM. Local Docker Compose for development; self-hosted or standard PostgreSQL host in production. No provider-specific SDK.
- Contracts: Solidity + Foundry. `FORKRegistry` holds theses and lineage; `FORKBacking` holds backing, the lineage split and claimable balances.
- Indexing: Envio HyperIndex + GraphQL, over both contracts.
- Deployment: self-hosted Node.js web behind a reverse proxy and HTTPS domain, Envio Cloud for the indexer, Monad Testnet for contracts. Development uses localhost; do not use Vercel.

Versions are pinned in the lockfile. Do not upgrade dependencies without a reason recorded in the decision log.

## Infrastructure workflow

Use automate-first setup: check current official documentation, prefer official CLIs/APIs/local tooling, use existing authenticated sessions and perform authorized non-sensitive setup. Ask only for unavoidable human approval/login, wallet signatures, funding or provider actions. Retrieve and write secrets locally where official tooling supports it; never print or commit them. Development database is local PostgreSQL; do not fall back to Neon. No paid services.

Ask the owner before: deploying any contract, redeploying the Envio indexer, deploying to the production server, changing DNS or the reverse proxy, or pushing to main. Work on branches and open pull requests.

## Required quality bar

A first-time visitor must be able to:

1. Sign in with Google or email and receive an embedded EVM wallet.
2. Receive the welcome drip of testnet MON, or be told plainly why not and what to do instead.
3. Choose a handle.
4. Publish a thesis on Monad Testnet.
5. See it appear from Envio-backed data.
6. Open the thesis and see reasoning plus social actions.
7. Fork it and change at least target or leverage.
8. Back an idea, see who receives what before signing, and see the measured confirmation time afterwards.
9. Open the Idea Tree and see parent-child lineage and the value that moved along it.
10. Open a profile and understand Originality, Contribution, Influence, earnings and early support.
11. Withdraw earned MON.

If any of these fail, stop feature work and fix the core flow.

## Writing rules

- Never invent users, activity, metrics, partnerships or performance. Any number in public copy comes from a measurement that was run, with the method recorded in `docs/`.
- Speak about confirmation time and gas units. Never describe transactions as cheap or nearly free in money terms: testnet MON has no price (D-058).
- No em dashes or en dashes in copy, docs, comments or commit messages, and no hyphen standing in for one. Use a colon, a comma, a middle dot or separate sentences.
- Copy is confident, short and human. No filler phrases, placeholder copy or defensive disclaimers.

## Commit discipline

Each task should end with:

- passing relevant tests
- no TypeScript errors
- no lint errors
- docs updated if behavior changed
- screenshots for visual changes when practical

## Design rule

The interface must look like a premium consumer product, not a hackathon dashboard. Avoid gradient blobs, neon glow, glassmorphism, emoji, oversized crypto illustrations, three-card icon grids, noisy cards and centered-everything layouts (D-059).
