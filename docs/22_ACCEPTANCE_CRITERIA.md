# Acceptance Criteria

## Authentication

PASS when:

- logged-out user can browse public thesis pages
- interaction triggers Privy auth
- fresh user can authenticate and has an EVM wallet
- backend verifies Privy access token
- profile identity maps to the same wallet used onchain

## Publish thesis

PASS when:

- required fields validate
- content hash is deterministic
- Privy wallet signs a real Monad Testnet transaction
- finalized metadata is verified against receipt/event
- thesis appears through Envio
- refresh/direct URL preserves state

## Fork

PASS when:

- parent fields prefill
- user must change at least one field
- changed fields are visually clear
- contract parentId is correct
- tree displays new edge
- public attribution is obvious

## Challenge

PASS when:

- Challenge opens fork composer with opposite side
- challenge remains a normal fork in data model
- UI marks it as opposing branch

## Idea Tree

PASS when:

- root plus at least 20 descendants renders without crash
- current node/path is identifiable
- node opens details and parent diff
- mobile has usable fallback
- tree data comes from Envio

## Comments/reactions

PASS when:

- auth enforced
- duplicate Agree is idempotent
- rate limits work
- optimistic UI reconciles on failure

## Perpl setup

PASS when:

- Ed25519 key is generated client-side
- private key is stored device-local and not sent to backend
- wallet signs Perpl enrollment payload
- API key works for authenticated read
- exchange account state is detected
- forwarding state is detected from current account data
- user can enable forwarding via wallet transaction

## Perpl execution

PASS when:

- execution drawer shows explicit market/side/size/leverage
- invalid sizes are blocked
- order submits over live testnet API/WS
- fill/failure is surfaced
- independently backend-retrieved authoritative fill can be linked to the correct namespaced thesis
- Attested claims are visibly distinct and excluded from execution metrics
- evidence uniqueness prevents reuse across theses/registries
- no other user's fill can verify for the thesis

## Privy bounty readiness

PASS when:

- Privy is used for auth and actual wallet signing
- contract transaction demonstrated
- Perpl EIP-712 enrollment signing demonstrated
- integration is visibly beyond login

## Envio bounty readiness

PASS when:

- live contract indexed
- non-trivial schema committed
- Idea Tree is Envio-powered
- feed fork counts are Envio-powered
- at least one derived author/market stat shown

## Nansen bounty readiness

PASS when:

- API key server-only
- Monad wallet context visible in product
- permitted Nansen PnL context changes discovery/profile behavior or Smart Signal ranking
- no prohibited labels/Smart Money badges
- missing context does not penalize a fresh wallet
- external performance never enters FORK-native reputation
- raw JSON is not the product
- failure does not break app

## Track 03 readiness

PASS when a judge can answer yes to all:

- Is social connection/community the core user value?
- Is the graph open and visible?
- Does participation create attributable value?
- Is Monad functionally important rather than decorative?
- Is the product inviting and social rather than a finance dashboard?
- Is there evidence of a real target community/test group?

## P0 profile reputation

PASS when roots/forks with external children ratios match canonical namespaced graph data, Emerging appears below 3 eligible samples, percentages show numerator/denominator, Influence is a raw distinct external-wallet count, and Executions Inspired deduplicates independently verified strict-descendant evidence. No self-fork inflation, realized-PnL score or Sybil-resistance claim. Open trades require no closed-PnL data.

P0 navigation is Feed/Explore/Create/Profile; Activity and full light theme are P1.

## Responsive quality

PASS when every P0 flow works at:

- desktop 1440x900
- laptop 1280x800
- mobile 390x844
- mobile 375x667

## Accessibility

PASS when:

- keyboard navigation reaches every P0 action
- visible focus states
- form errors associated with fields
- direction never relies only on color
- reduced motion supported

## Submission

PASS when:

- public repo accessible
- live app accessible without special local setup
- demo credentials/instructions are clear
- technical demo <= 3 minutes
- pitch <= 2 minutes
- no fake traction claims
- all claimed bounties are actually compliant
