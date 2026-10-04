# Perpl Integration Specification

## Role in FORK

Perpl is the execution proof layer. FORK remains usable without trading, but a thesis becomes stronger when its author executes a version and links a verified fill.

## Networks

Use testnet for the hackathon build.

Live context observed 2026-10-04 (runtime must validate current configuration, never trust this snapshot blindly):

```text
Testnet REST: https://testnet.perpl.xyz/api
Testnet WS:   wss://testnet.perpl.xyz
Chain ID:     10143
RPC:          https://testnet-rpc.monad.xyz
Exchange:     0x1964c32f0be608e7d29302aff5e61268e72080cc
Collateral:   0xa9012a055bd4e0edff8ce09f960291c09d5322dc
```

Testnet market IDs currently documented:

```text
BTC 16
ETH 32
SOL 48
MON 64
ZEC 256
```

Do not hardcode the market list in UI logic. Load `/v1/pub/context` and map supported MVP symbols.

## Three separate setup requirements

Perpl API documentation makes these distinct:

1. API authentication: Ed25519 API key enrollment.
2. Exchange account: user must have onchain Perpl account with collateral.
3. Order forwarding: account must call `allowOrderForwarding(true)` for API/WebSocket trading.

FORK setup UX must check all three.

## Device-local key model

Generate Ed25519 key pair in browser with a vetted library such as `@noble/ed25519`.

Store in IndexedDB:

```text
network
walletAddress
apiKeyToken
ed25519PrivateKey
ed25519PublicKey
createdAt
```

Encrypt-at-rest in the browser only if implementation is reliable and does not introduce a fake security claim. At minimum rely on browser origin isolation and clearly label `Trading access is stored on this device`.

Never sync the Ed25519 private key to FORK backend.

## Programmatic enrollment

1. Generate Ed25519 key pair.
2. POST Perpl API-key payload with:
   - chain_id
   - wallet address
   - public key
   - scope_mask = trade/read
   - label = `FORK`
   - optional builder_id only after Perpl registers FORK
3. Receive EIP-712 typed_data + mac.
4. User signs typed_data through Privy embedded wallet.
5. Client creates Ed25519 proof-of-possession.
6. POST enrollment.
7. Save returned opaque API key token locally.

The wallet signature is one-time enrollment consent.

## Exchange account setup

If authenticated Perpl wallet snapshot indicates no exchange account:

- show `Create Perpl trading account`
- user must obtain testnet collateral first
- call Perpl Exchange `createAccount(uint256 amountCNS)` through Privy transaction signing

The exact collateral approval/deposit steps and token decimals must be implemented against the latest Perpl contract docs/ABI, not guessed.

## Enable order forwarding

After account creation, user calls:

```solidity
allowOrderForwarding(true)
```

through the Privy wallet.

Explain clearly:

- this permits Perpl exchange infrastructure to forward API orders
- it does not permit withdrawals through the API key
- user can revoke by setting false

Read current forwarding state from Perpl account `fw` in wallet/account stream rather than assuming setup succeeded.

## API request signing

Every authenticated request requires:

- X-API-Key
- X-API-Timestamp
- X-API-Nonce
- X-API-Signature

Signature covers canonical method/target/timestamp/nonce/body hash as documented by Perpl.

Implement one shared browser helper with tests. Never duplicate signing logic across components.

## Trading WebSocket

Connect to `/ws/v1/trading`.

State machine:

```text
disconnected
  -> connecting
  -> authenticating
  -> ready
  -> submitting_order
  -> order_acknowledged
  -> filled | partially_filled | failed | cancelled
```

Reconnect with exponential backoff and fresh auth nonce/signature.

## Market order policy

MVP supports only opening market orders from the execution drawer.

Inputs:

- thesis market
- thesis side
- user-entered notional/size
- thesis leverage
- max slippage using Perpl-supported field/default

Do not implement close, TP/SL automation, complex trigger orders, or leverage editing unless required to complete safe open-order flow.

## Request IDs

Perpl requires monotonically valid request IDs per account. Seed from account `lfr` and maintain device-local next request value. Preserve the original submission ID when reconciling/retrying an uncertain order under Perpl at-most-once rules; allocate a fresh ID only for a genuinely new order. Never blindly resubmit with a new ID.

## Builder code

Builder code is optional.

If Perpl registers FORK:

- bind API key to builder ID at enrollment
- set fee ceiling only with explicit user-visible consent
- start with zero builder fee for attribution if desired
- do not promise creator royalties in MVP

Future creator reward can be funded from builder revenue only after legal/product design review.

## Verification

Use D-017's constrained read-only relay: browser prepares fresh auth for a fixed approved GET target, backend forwards directly to official Perpl and receives its response. Server owns host/path/method/query allowlists; reject arbitrary targets/trading payloads. No private key upload or auth-header/signature logs. Pagination requires fresh proof.

Match authenticated FORK wallet/account, market/side, nonzero fill after thesis creation, canonical identity and uniqueness. Only authoritative independently retrieved evidence creates Verified and execution metric credit. Client claims remain Attested. Only after verification should the author link the reference. Exact fail-closed executionRef encoding is in docs/08; positionId is optional.

Live authenticated testing is mandatory. If this relay cannot work securely, report the limitation, preserve Attested without credit and continue social development. Closed outcomes/native close orders are not P0. Show Open/Closed only with authoritative position state; otherwise Verified execution.

## Enrollment Origin

Perpl requires whitelisted Origin for payload/enroll requests from browser or backend. Register stable local/staging/production origins before authenticated setup. Foundation-only Phase 1 does not enroll or trade.

## Optional Branch Watch automation - Tier B only

Purpose: satisfy Perpl automation bounty without turning FORK into copy trading.

Concept:

User opts into watching one root thesis and defines strict policy:

- allowed market
- max notional
- max leverage
- only direct children or selected author
- expiry time
- manual stop/revoke

Automation may prepare or execute a branch only within those rules.

Build only after P0 is complete. If it cannot meet production-ready safety, do not submit to Perpl bounty.

## Acceptance criteria

- user can enroll API key without leaving FORK
- private key never reaches backend logs/network
- account setup state is accurately detected
- forwarding permission is accurately detected
- one live Perpl Testnet market order fills from a FORK thesis
- UI surfaces failed order reason
- fill is linked to thesis only after verification path passes
