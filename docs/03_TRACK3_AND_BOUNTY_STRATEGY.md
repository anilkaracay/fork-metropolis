# Track 03 and Bounty Strategy

Verified research date: 2026-10-04.

## Track 03 fit

Monad describes Track 03 as Social, Attention & Culture and emphasizes:

- open social graphs
- programmable incentives
- fast settlement
- communities creating and capturing value
- teams that have grown a community, not only built one

FORK must therefore be presented as a social network for collaborative idea creation, not as a trading terminal with comments.

## Product-to-track mapping

| Track requirement | FORK implementation |
|---|---|
| Open social graph | Public root/fork lineage stored onchain and indexed by Envio |
| Social participation | Publish, comment, agree, challenge, fork |
| Community value creation | Useful theses and improvements create downstream verified activity |
| Value capture | Attribution, reputation, and later builder-fee sharing |
| Fast settlement | Monad records social provenance quickly; Perpl executes on Monad |
| Community proof | Recruit a real seed group and show real usage metrics |

## Main-track judging coverage

Track-page rubric captured from the Metropolis portal should be treated as a design checklist:

- Technical Execution: the core social provenance mechanism must work onchain.
- Design & Craft: the product must feel like a native social product, not token-gated finance UI.
- Originality & Track Insight: participation must create verifiable value; the chain cannot be decorative.
- Founder & Market Readiness: clearly identify trading communities and why they migrate from X/Telegram/Discord.
- Traction & Path Forward: show real users, even a small test group, plus an acquisition plan.

The general rules also reportedly score Product Quality & Completeness, Technical Excellence, Monad Integration, Track Fit & Problem Relevance, and Innovation & Impact. Build for both rubrics.

## Bounty targets

### Tier A - commit now

#### Privy - $5,000 single prize

Requirement: integration must go beyond authentication.

FORK usage:

- embedded EVM wallet
- signing FORK contract transactions
- signing Perpl EIP-712 API-key enrollment authorization
- optional transaction sponsorship if configured and reliable

This is a core product dependency, not a bounty-only feature.

#### Envio - $1,000 single prize

Requirement: HyperIndex/HyperSync/HyperRPC must drive a real feature; captured judging language emphasizes meaningful use, non-trivial schema design, and derived/aggregated entities.

FORK usage:

- index ThesisCreated (forks derived from parentId) and ExecutionLinked
- build canonical Idea Tree queries
- derive unique forkers, descendants, author influence, market activity
- power Feed and Profile stats from GraphQL

The app should not rebuild these aggregates client-side from raw RPC logs.

#### Nansen - $5,000 pool, top prize $2,000

Requirement: product experience powered by Nansen data/API/MCP/CLI, not a raw-data display.

FORK usage:

- Permitted Monad wallet PnL/PnL Summary context only
- No Address Labels, Smart Money labels/badges or prohibited redistribution
- External context remains separate from graph reputation
- feed ranking input
- profile context badge

Nansen must affect discovery or reputation context. A standalone `Nansen data` tab is not enough.

### Tier B - integrate, claim only if complete

#### Perpl API - $5,000 pool, two winners

Official short requirement: production-ready trading bot or automation system on Perpl.

Core FORK uses Perpl for manual execution, which is valuable to the product but does not automatically satisfy this bounty.

Claim only if P0 is stable and the team implements `Branch Watch`, a bounded automation module described in `13_PERPL_INTEGRATION.md` with explicit user rules, revocation, limits, and production-ready behavior.

Do not misrepresent manual execution as bounty compliance.

### Do not target in the 3-day core build

- Kuru bounties: Track 01 only.
- Agora Mobile Trading: Track 01 only.
- Perpl Analytics/Risk Tool: Track 01 only.
- MetaMask Agent Wallet Plugin: Track 01 only.
- Agora Cross-Border: Track 02 only.
- Hunyuan: Track 03 compatible but credit-only and would add AI scope. Only add if a genuinely useful multimodal feature emerges after P0 is complete.
- Mera: do not combine with Privy because its UX bounty expects Mera as the entire account layer.
- Dynamic: do not duplicate wallet infrastructure with Privy.
- Aurora: useful later, not worth core-path risk in a three-day build.

## Bounty submission evidence

Privy:

- screen recording of login -> embedded wallet -> contract transaction -> Perpl typed-data signing
- architecture note explaining wallet ownership and signing path

Envio:

- public indexer config/schema/handlers
- GraphQL queries used by Feed, Idea Tree, Profile
- derived entities visible in product

Nansen:

- code showing server-only API calls
- product screens where Nansen context changes ranking/permitted performance context
- graceful fallback behavior

Perpl if claimed:

- live automation demo
- explicit policy/risk bounds
- start/stop/revoke flow
- evidence that it is production-ready, not a cron-script demo

## Submission integrity

Never claim a bounty solely because its SDK appears in package.json. Sponsor judging reportedly weights adherence to published requirements most heavily. Build evidence into the product and demo.
