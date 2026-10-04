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
