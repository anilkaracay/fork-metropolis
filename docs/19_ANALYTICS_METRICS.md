# Analytics and Metrics

## Principle

Track behavior that proves the social loop. Do not optimize vanity page views for the hackathon.

## North-star demo metric

`Verified Fork Rate`

Definition:

```text
unique forks with verified Perpl execution / unique forks created
```

This measures whether social ideas turn into real action. Only independently verified backend-retrieved evidence qualifies; Attested/client claims never count. Scope numerator/denominator to the deployed chain/registry.

## Core product metrics

### Activation

- login completion rate
- percent of new users who open a thesis
- percent of new users who create a root or fork within first session

### Social creation

- root theses created
- forks created
- unique forkers
- external fork rate: forks by someone other than parent author
- comments per thesis
- agrees per thesis
- challenges per thesis

### Network depth

- average branch depth
- percent of roots with at least 1 fork
- percent of roots with at least 3 unique forkers
- maximum branch depth

### Execution

- Perpl setup completion rate
- execute-drawer open -> order submitted
- order submitted -> verified fill
- verified executed descendants per root

### Reputation

- users with enough data for Originality score
- users with enough data for Contribution score
- Influence: distinct external wallets forking authored theses
- Executions Inspired: unique independently verified executions on strict descendants, excluding author-owned executions and overlapping ancestor duplication
- no PnL-based reputation or Attested execution credit

### Retention proxy for hackathon

- users returning on a second calendar day
- users who fork more than once
- authors who receive a second external fork

## Traction numbers to show judges

Only show real observed data.

Ideal pre-submission targets, not guarantees:

- 20-50 real testers
- 30+ real theses
- 50+ real forks
- 10+ roots with an external fork
- 10+ verified Perpl testnet executions
- at least 3 branch trees with depth >= 2

If lower, show honest smaller numbers and qualitative feedback.

## Event taxonomy

```text
auth.login_started
auth.login_completed
profile.created
feed.viewed
thesis.composer_opened
thesis.published
thesis.viewed
thesis.agreed
thesis.commented
fork.started
fork.published
fork.challenge_started
tree.opened
perpl.setup_started
perpl.setup_completed
perpl.order_submitted
perpl.order_filled
perpl.order_failed
execution.verified
profile.reputation_viewed
share.thesis
```

## Event properties

Allowed:

- chainId
- registryAddress
- thesisId
- marketId
- side
- isFork
- branchDepth
- sourceSurface
- latency bucket
- error code

Avoid sending:

- full thesis reasoning
- auth tokens
- wallet secrets
- full Nansen raw data

## Dashboard

For three days, a simple admin SQL/route or analytics dashboard is enough.

Prepare one judge-facing metrics screenshot/card with:

- Traders
- Theses
- Forks
- Verified executions
- External fork rate

Mark demo/seed accounts separately and exclude from real-user numbers.
