# Frontend Specification

## Framework rules

- Next.js App Router
- TypeScript strict mode
- Server Components by default
- Client Components only for interactive wallet, forms, tree, real-time data, and optimistic social actions
- TanStack Query for client-side asynchronous state that needs retries/invalidation
- Zod schema shared with API where practical

## Route specifications

### `/`

Logged out:

- compact hero
- three-step explanation: Publish -> Fork -> Prove
- live public thesis preview if data exists
- CTA `Enter FORK`
- one sentence on Monad/Perpl, no infrastructure wall of text

Logged in:

- redirect to `/feed`

### `/feed`

Desktop:

- left nav
- center feed
- right rail: Forking now / Emerging contributors

Mobile:

- top brand/header
- single feed column
- bottom nav

Filters:

- Fresh
- Most Forked
- Smart Signal

Feed uses cursor pagination or infinite query. Do not load all history.

### `/new`

Composer may be full page on mobile and modal/sheet on desktop.

Fields show live reference price from Perpl public market stream where available.

Preview card updates as user types.

Transaction state machine:

```text
editing -> saving_draft -> awaiting_signature -> pending_chain -> indexing -> success
                                                       -> failed
```

Every state has visible copy.

### `/t/[id]`

Server render public metadata/core if possible for shareability.

Client islands:

- reactions
- comments
- execution drawer
- Envio indexing refresh

### `/t/[id]/fork`

Prefill parent values.

Use a `Changes from parent` block at top. Submit disabled until at least one qualifying field changes.

Challenge mode uses `?intent=challenge` and preflips direction.

### `/t/[id]/tree`

Required controls:

- center on current
- go to root
- select node
- fork selected branch

Do not spend more than 2 hours on elaborate graph physics.

### `/u/[handle]`

Server-render basic user profile.

Load Envio stats and Nansen context independently to prevent waterfall.

### `/activity` (P1 only)

List recent personal events only after P0 is complete; no P0 Activity nav item.

### `/settings`

Sections:

- Account
- Wallet
- Trading on this device
- Theme (P1 only; P0 is dark)

Trading section shows:

- Perpl credential status
- network
- created timestamp if locally stored
- `Re-enroll` / `Remove local trading key`

## Component inventory

P0:

- AppShell
- SideNav
- MobileNav
- ThesisCard
- AuthorChip
- DirectionBadge
- RiskParameterRow
- ForkCount
- VerifiedExecutionBadge
- ReputationMetric (transparent graph percentages/samples and raw counts)
- NansenPerformanceContext (permitted PnL only; no labels)
- ThesisComposer
- ForkDiff
- TransactionProgress
- ExecutionDrawer
- IdeaTree
- IdeaTreeNode
- CommentComposer
- CommentList
- EmptyState
- ErrorState
- SkeletonCard

## State management

Do not add Redux.

Use:

- URL state for feed filters and selected explore filters
- local React state for modals/drawers
- TanStack Query for remote state
- Privy hooks for auth/wallet state
- IndexedDB helper for Perpl device credentials

## Error UX

### Contract transaction rejected

`Transaction was not signed. Your thesis was not published.`

Action: Return to composer.

### Envio delay

`Your thesis is onchain. We are waiting for the social graph to catch up.`

Action: Refresh indexed state; show explorer link.

### Perpl unavailable

`Trading is temporarily unavailable. Your thesis is safe and can still be forked.`

### Nansen unavailable

No blocking toast. Hide enrichment and log telemetry.

## Optimistic updates

Allowed:

- comment submit
- agree reaction

Not allowed as final truth:

- thesis creation
- fork creation
- execution verification

These require authoritative confirmation.

## Data fetching strategy

Feed:

- Envio graph query + metadata batch endpoint
- never make one metadata request per card if a batch route can avoid N+1

Profile:

- Envio AuthorStats
- Postgres public profile
- Nansen cached context parallelized

Tree:

- one Envio root-descendants query or a bounded recursive query shape

## Responsive requirements

Every P0 route must be fully usable at 375px width.

Execution drawer on mobile becomes bottom sheet.

Tree on mobile may use indented lineage list if the desktop graph is not usable at narrow width. Functionality beats visual parity.

## SEO/share

Public thesis pages generate:

- title: `ETH Long by @anil | FORK`
- description from truncated reasoning
- Open Graph card with market, side, target, author, fork count

Do not expose private wallet data beyond the public address already associated with the profile.

## Bundle discipline

- lazy-load tree/graph library
- avoid charting library unless needed
- no large animation framework for simple transitions
- analyze bundle before final deploy
