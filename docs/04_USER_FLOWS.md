# User Flows

## Flow A - first session

1. User lands on `/`.
2. Hero explains `Publish a thesis. Fork an idea. Trade your version.`
3. User selects `Enter FORK`.
4. Privy login appears.
5. User authenticates by email or social method.
6. Embedded EVM wallet is available.
7. App checks Monad Testnet chain support.
8. If profile is incomplete, user chooses handle and optional display name.
9. User lands on Feed.

Failure states:

- Privy unavailable -> show retry and status message; browsing public feed remains available.
- Wallet creation delayed -> show progress, never infinite spinner.
- Handle conflict -> inline error with alternatives.

## Flow B - publish root thesis

1. User selects `Post thesis`.
2. Composer asks market, side, target, invalidation, leverage, and reasoning.
3. UI validates logical constraints.
4. User previews share card.
5. Server stores immutable metadata draft and returns content hash.
6. Privy wallet sends `createThesis` to FORKRegistry.
7. UI shows pending transaction state with explorer link.
8. After receipt, backend finalizes metadata against onchain thesis ID.
9. Envio indexes event.
10. Thesis page loads with `Original` badge.

Validation examples:

- leverage must be within Perpl market limits returned by context
- long target should normally exceed reference price and invalidation be below it; allow override only with explicit warning
- short target should normally be below reference price and invalidation above it
- reasoning 10-500 characters

## Flow C - fork thesis

1. User opens a thesis.
2. User selects `Fork`.
3. Composer preloads parent values.
4. Changed values are visually marked.
5. At least one field must change.
6. User submits.
7. Contract emits ThesisCreated with parent ID; Envio derives the fork edge.
8. Envio updates Idea Tree.
9. New thesis detail displays `Forked from @handle #ID`.

## Flow D - challenge thesis

1. User selects `Challenge`.
2. App opens fork composer.
3. Side is pre-flipped.
4. User must provide own reasoning.
5. Submission uses the normal fork contract path.
6. UI renders an `Opposing branch` label.

No separate challenge contract logic is required.

## Flow E - first Perpl connection

1. User owns a thesis or fork and selects `Execute`.
2. App detects no local Perpl credential.
3. Browser generates Ed25519 key pair locally.
4. App requests Perpl enrollment payload.
5. Privy wallet signs returned EIP-712 payload.
6. Browser creates proof-of-possession and submits enrollment.
7. Opaque API key plus Ed25519 private key are stored in IndexedDB on this device only.
8. UI confirms `Trading enabled on this device`.

Never upload the Ed25519 private key to FORK servers.

## Flow F - execute fork

1. User selects `Execute` on own thesis.
2. Drawer shows market, side, current price, notional, leverage, estimated fees, thesis target/invalidation, and risk warning.
3. User enters size.
4. Client validates against Perpl market context and free collateral.
5. User confirms.
6. Client submits signed order through Perpl WebSocket.
7. UI listens for order/fill update.
8. On fill, client sends non-secret fill identifiers to FORK verification endpoint.
9. Server queries Perpl history and verifies owner/market/side/time.
10. Server independently retrieves evidence through the fixed read-only relay and validates it. If unsuccessful, retain Attested without execution/reputation credit; never accept client JSON as proof.
11. User signs `linkExecution` with the exact server-returned executionRef bytes32; do not hash it again.
12. Envio indexes execution link.
13. Thesis node gains `Verified` state.

## Flow G - inspect Idea Tree

1. User selects `View tree`.
2. Envio-backed query returns root, edges, descendant stats.
3. Tree centers the current node.
4. User selects any node.
5. Detail rail shows author, changes from parent, reasoning, execution state, and basic result.
6. `Fork this branch` is always visible for active public nodes.

## Flow H - profile

1. User opens profile.
2. App loads Envio AuthorStats first.
3. App loads Nansen context asynchronously.
4. Profile shows Originality/Contribution percentages and samples (Emerging below 3), raw Influence and Executions Inspired; no realized-PnL scores.
5. Each card has formula tooltip and sample size.
6. P0 tabs: Originals, Forks. Activity is P1.

Nansen failure must not block profile rendering.

## Flow I - comment/reaction

1. Authenticated user submits comment or Agree.
2. Request includes Privy access token.
3. Server verifies token, rate limit, ownership mapping.
4. Mutation writes to Postgres.
5. Optimistic UI updates, then reconciles.

## Flow J - recovery

Perpl credentials lost on a new device:

- user can still access FORK identity through Privy
- existing social provenance remains visible
- trading setup must be re-enrolled with a new Perpl API key
- UI clearly says credentials are device-local by design
