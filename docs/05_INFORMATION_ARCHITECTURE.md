# Information Architecture

## Primary navigation

Desktop left rail, mobile bottom bar:

1. Feed
2. Explore
3. Create
4. Profile

Primary global CTA: `Post thesis`.

Do not use `Markets`, `Trade`, or `Portfolio` as top-level navigation. That would position FORK as a finance terminal instead of a social network.

## Routes

```text
/                       landing or authenticated feed redirect
/feed                   social thesis feed
/explore                market, author, and thesis discovery
/t/[thesisId]           thesis detail
/t/[thesisId]/tree      full Idea Tree
/new                    root thesis composer
/t/[thesisId]/fork      fork composer
/activity               personal activity (P1 only; no P0 navigation item)
/u/[handle]             public profile
/settings               account and device trading settings
/api/*                   server endpoints
```

## Feed information hierarchy

A card must be readable in this order:

1. Who posted it
2. What the market view is
3. Why they believe it
4. What changed socially since posting
5. Primary action: Fork

Recommended card structure:

```text
@anil                          8m
ETH LONG                        + verified state when proven
Breakout above prior resistance with...
Target 4350   Invalid 4020   3x
38 forks   12 comments   17 verified descendants
[Agree] [Challenge] [Fork]
```

Execution should be a secondary action on the detail page, not the largest feed button.

## Thesis detail sections

1. Header and author
2. Thesis parameters
3. Reasoning
4. Parent/root provenance if forked
5. Social actions
6. Execution state
7. Idea Tree preview
8. Comments
9. Related branches

## Explore

Sections:

- Forking now
- Original alpha
- Smart signals
- Markets: BTC, ETH, SOL, MON
- Emerging contributors

Avoid a dense token-price dashboard.

## Activity (P1)

Events:

- someone forked your thesis
- someone challenged your thesis
- comment on your thesis
- execution verification complete
- branch outcome update

For P1, activity can poll server-side DB plus Envio rather than use push notifications.

## Profile

Above the fold:

- avatar, handle, wallet short form
- Optional permitted external Nansen PnL context
- Originality/Contribution percentage and numerator/denominator (Emerging below 3), raw Influence and Executions Inspired
- root theses, forks, verified executions

Then:

- Originals
- Forks
- Activity (P1 only)

## Empty states

Feed empty:

`No theses yet. Publish the first idea and give the network something to fork.`

Tree without descendants:

`No branches yet. Be the first to fork this thesis.`

Profile without enough score data:

`Emerging. Percentages appear after 3 eligible roots or forks; show the sample count.`

## URL shareability

Every thesis and profile route must work when opened directly while logged out. Public pages render read-only and invite sign-in only at interaction time.
