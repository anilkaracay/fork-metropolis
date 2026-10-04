# Research Sources

Verified primarily on 2026-10-04. Re-check all provider docs before production launch because APIs can change.

## Monad Metropolis

Official public page:

- https://monad.xyz/developers/hackathons/metropolis

Key verified public facts:

- build window Sep 1-Oct 13, 2026
- four tracks
- Track 03 Social, Attention & Culture
- Track 03 public framing: open social graphs, programmable incentives, fast settlement
- Track 03 best fit: teams that have grown a community, not only built one
- Track 03 prize pool $30,000 split evenly among 3 teams
- Grand Champion $25,000
- sponsor bounties awarded on top

Portal-derived research snapshot used for deeper track/bounty criteria:

- https://github.com/Blockchain-Oracle/senryo

Important caveat: the senryo repository is a participant research repository that captured logged-in portal content. Re-check the live portal at submission time for final wording and eligibility.

## Perpl

Official/public developer docs:

- https://github.com/PerplFoundation/api-docs
- https://github.com/PerplFoundation/api-docs/blob/main/integrations.md
- https://github.com/PerplFoundation/api-docs/blob/main/authentication.md
- https://github.com/PerplFoundation/api-docs/blob/main/websocket.md
- https://github.com/PerplFoundation/api-docs/blob/main/rest-endpoints.md
- https://github.com/PerplFoundation/api-docs/blob/main/types.md
- https://github.com/PerplFoundation/perpl-docs

Key verified facts:

- REST for public/history/auth flows
- WebSocket for real-time/trading
- API keys use Ed25519 and wallet-authorized enrollment
- private Ed25519 key should never leave client
- trading via API also requires exchange account and order-forwarding permission
- testnet chain ID 10143
- testnet endpoints documented in Perpl README
- builder codes can attribute routed order volume and optionally builder fee

## Envio

Official docs:

- https://docs.envio.dev/docs/quickstart
- https://docs.envio.dev/llms.txt

Key verified facts:

- HyperIndex turns onchain events into structured DB/GraphQL API
- HyperSync is underlying high-performance data layer
- current docs recommend Node.js 22+ in recent examples
- Envio supports EVM chains and derived entities/handlers

## Privy

Official docs:

- https://docs.privy.io/llms.txt
- https://docs.privy.io/authentication
- https://docs.privy.io/authentication/user-authentication/access-tokens
- https://docs.privy.io/wallets/connectors/usage/connect-or-create
- https://docs.privy.io/guide/react/wallets/embedded/prompts/transact
- https://docs.privy.io/security/wallet-infrastructure/policy-and-controls

Key verified facts:

- supports embedded EVM wallets
- React SDK can send transactions
- access tokens are signed JWTs for backend auth verification
- wallet infrastructure supports granular controls/policies if later delegation is needed

Typed-data implementation must be confirmed against the current Privy wallet/provider API during integration.

## Nansen

Official docs:

- https://docs.nansen.ai/
- https://docs.nansen.ai/api/overview
- https://docs.nansen.ai/api/profiler/address-labels
- https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance
- https://docs.nansen.ai/api/smart-money

Key verified facts:

- Monad is listed as supported for address labels
- Monad is listed for profiler PnL endpoints
- Monad is listed among Smart Money-supported chains in current docs
- public label/Smart Money redistribution is prohibited; do not implement those displays
- use only explicitly permitted PnL/PnL Summary context, separate from FORK-native reputation
- policy source: https://docs.nansen.ai/guides/redistribution-guide

## Monad network

Developer portal:

- https://developers.monad.xyz/

Verified testnet chain ID shown by portal: 10143.

Use provider-specific latest RPC URLs from current docs at implementation/deployment time.

## Research policy

When docs conflict:

1. live official provider docs
2. live hackathon portal
3. official GitHub repository
4. captured participant research
5. secondary articles

Record any material change in `29_DECISIONS.md`.

## Phase 2 implementation references checked 2026-10-04

Only official documentation/repos and installed SDK declarations were used for implementation-critical choices:

- [Privy React setup](https://docs.privy.io/basics/react/setup), [access-token verification](https://docs.privy.io/authentication/user-authentication/access-tokens), [authoritative user query](https://docs.privy.io/user-management/users/managing-users/querying-users).
- [Drizzle + Neon](https://orm.drizzle.team/docs/get-started/neon-new), [Drizzle PGlite](https://orm.drizzle.team/docs/get-started/pglite-new), [transactions](https://orm.drizzle.team/docs/transactions).
- [Envio V3 handlers](https://docs.envio.dev/docs/HyperIndex/event-handlers), [test runner](https://docs.envio.dev/docs/HyperIndex/testing), [configuration](https://docs.envio.dev/docs/HyperIndex/configuration-file).
- [Next asynchronous route handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route); installed Next 16.3.8 App Router/error/CLI guides also checked, including supported Webpack build flag.
- [viem receipt source](https://github.com/wevm/viem/blob/main/src/actions/public/getTransactionReceipt.ts), with installed transaction/receipt/provider declarations checked.
- [Perpl REST endpoints](https://github.com/PerplFoundation/api-docs/blob/main/rest-endpoints.md), [request authentication](https://github.com/PerplFoundation/api-docs/blob/main/authentication.md). Verification relay is code-only; no authenticated request.

No new Nansen or hackathon eligibility claims were made during this implementation phase. The semantic HTML/CSS tree needs no additional tree library.

## Phase 3 verification — 2026-10-04

- Neon Connect: https://neon.com/docs/connect/connect-from-any-app — development connection acquisition; no live database accessed.
- Privy React/Node setup: https://docs.privy.io/basics/react/setup and https://docs.privy.io/basics/nodeJS-node/setup — existing pinned SDK setup; authenticated wallet testing pending.
- Monad Foundry: https://docs.monad.xyz/guides/deploy-smart-contract/foundry — chain 10143, Monad-compatible Foundry; no deployment yet.
- Envio hosted deployment: https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment — project-root/config selection, pnpm 10.32.0 and ENVIO_ custom variables. Standalone compatibility tested.
- Perpl integration/auth/REST/types: https://github.com/PerplFoundation/api-docs — fresh public context observed separately in evidence/phase3/public-readiness.json. README collateral differs from current context. Public onboarding funding guide names mainnet routes; no Testnet AUSD funding method established. Official UI links https://discord.gg/perpl for human sponsor coordination. Do not assume a faucet or approval timeline.
- Nansen redistribution: https://docs.nansen.ai/guides/redistribution-guide — PnL/PnL Summary permitted; labels/Smart Money excluded.
- Nansen schema: https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance — wallet_address request, Monad mainnet, flat scalar summary.
- Nansen credits: https://docs.nansen.ai/getting-started/credits — pnl-summary 1 Pro / 10 Free; conservative reservation implemented.
- Gitleaks: https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1 — official Darwin arm64 archive verified SHA-256 b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5, local ignored scanner.

Hackathon sponsor-track portal URLs could not be retrieved through the research tool. No new prize/eligibility claim is inferred. The approved Perpl automation requirement remains unsatisfied by manual execution.
