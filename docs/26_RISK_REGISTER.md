# Risk Register

## Scoring

- Probability: Low / Medium / High
- Impact: Low / Medium / High / Critical

## R1 - Perpl setup takes too long

Probability: High
Impact: High

Cause:

Programmatic API enrollment, onchain exchange account, collateral, forwarding, and WebSocket auth are separate.

Mitigation:

- integrate Perpl public context early Day 2
- reserve 4-hour block
- prepare testnet wallet/collateral before coding
- use official docs/examples directly
- do not block social core on execution

Trigger:

No authenticated read by Day 2 hour 6.

Response:

Escalate to Perpl mentor/support immediately; preserve product and continue other work in parallel.

## R2 - execution verification without private API key is unclear

Probability: Medium
Impact: High

Mitigation:

- explicit P13-02 research task before implementation
- use approved constrained read-only proof relay; live-test before Verified claims
- never upload client private key as workaround
- if secure independent retrieval is unavailable, retain Attested without reputation/metric credit and continue social work

## R3 - Envio indexing lag/misconfiguration

Probability: Medium
Impact: High

Mitigation:

- deploy contract early Day 1
- simple schema/events
- start block exact
- pending local state after transaction

## R4 - product judged as Track 01 trading app

Probability: Medium
Impact: Critical

Mitigation:

- social navigation
- Feed/Fork/Tree first
- no exchange-style homepage
- pitch uses collaborative idea creation
- execution secondary
- real comments/community/reputation

## R5 - product looks generic/hackathon-grade

Probability: Medium
Impact: High

Mitigation:

- strict design system
- one signature Idea Tree interaction
- premium typography/spacing
- no generic crypto gradients
- reserve Day 3 visual pass

## R6 - no real community traction

Probability: Medium
Impact: High

Mitigation:

- recruit while building
- first 10 users by Day 2
- structured fork event Day 3
- show honest qualitative proof even if counts are small

## R7 - Nansen quota/endpoint limitations

Probability: Medium
Impact: Medium

Mitigation:

- cache
- permitted PnL context only; no prohibited labels
- absent context is valid for fresh wallets
- Smart Signal renormalization
- core reputation independent of Nansen

## R8 - Privy domain/custom-chain issue

Probability: Low-Medium
Impact: High

Mitigation:

- configure production domain early
- test Monad Testnet signing Day 1
- avoid server delegation in core MVP

## R9 - XSS compromises device-local Perpl key

Probability: Low
Impact: Critical

Mitigation:

- plain text user content
- strict CSP
- minimal third-party scripts
- IndexedDB narrow module
- dependency audit

## R10 - reputation gamed by self/sybil forks

Probability: High at scale
Impact: Medium for hackathon

Mitigation:

- exclude self-forks
- unique wallet counts
- transparent graph ratios/raw counts; separate verified Executions Inspired
- show sample sizes
- future sybil analysis, not opaque MVP penalties

## R11 - over-scoping bounty chase

Probability: High
Impact: High

Mitigation:

- Tier A only: Privy, Envio, Nansen
- Perpl execution is core, automation bounty stretch only
- no Dynamic/Mera/Aurora/Hunyuan unless P0 done

## R12 - last-minute dependency upgrade

Probability: Medium
Impact: High

Mitigation:

- lock versions by end Day 1
- only security/blocker upgrades after

## R13 - testnet instability

Probability: Medium
Impact: High

Mitigation:

- backup RPC if approved by network docs/resources
- preserve read-only demo data
- record technical demo before final hours
- never fake live transaction state

## R14 - metadata transaction race/orphan draft

Probability: Medium
Impact: Low

Mitigation:

- draft expiry
- finalize idempotency
- receipt verification
- recovery endpoint/button for user's successful tx if finalize call failed
