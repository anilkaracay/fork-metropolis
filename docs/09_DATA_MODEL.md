# Data Model

## Principle

Onchain data proves provenance. Postgres stores social content and enrichment. Envio derives graph structure and aggregate stats.

## Namespace and evidence constraints

Every thesis-related row (metadata, comments, reactions, executions, thesis reports) includes chain_id bigint + registry_address normalized lowercase address + thesis_id decimal ID. Replace bare thesis uniqueness/foreign keys with this composite namespace. Envio IDs, edges, author/market/membership aggregates are similarly namespace-scoped. API route IDs resolve against the configured namespace; cross-namespace queries must be explicit. Use lossless uint64 representation (numeric(20,0) or checked decimal strings), not JavaScript numbers.

Execution evidence has a globally unique fill_identity bytea as defined in docs/08, independent of thesis/registry, so the same venue fill cannot earn credit again after redeployment. Attested claims leave authoritative identity/evidence fields NULL and cannot reserve a fill identity. A verified row requires all authoritative identity fields via a CHECK constraint; fill_identity is assigned only after independent retrieval/validation. Per-thesis reference linkage remains unique within its namespace. Reserve evidence transactionally during verification.

## Postgres tables

### users

```text
id                  uuid pk
privy_did           text unique not null
wallet_address      text unique not null
handle              citext unique not null
display_name        text null
avatar_url          text null
bio                  text null
created_at           timestamptz not null
updated_at           timestamptz not null
```

Indexes:

- unique lower(handle)
- unique wallet_address
- privy_did

### thesis_metadata

```text
id                  uuid pk
thesis_id           numeric(20,0) null until finalized; composite namespace unique
author_user_id      uuid fk users
content_hash        bytea not null
reasoning           varchar(500) not null
entry_note          varchar(160) null
tags                text[] not null default '{}'
status              enum(draft, finalized, hidden) not null
tx_hash             text null
created_at           timestamptz not null
finalized_at         timestamptz null
```

Rules:

- finalized content is immutable except `status`
- any edit creates a new thesis/fork, not an update
- draft expires after 24h if not finalized

### comments

```text
id                  uuid pk
thesis_id           bigint not null
author_user_id      uuid fk users
body                 varchar(280) not null
status              enum(visible, hidden, deleted) not null
created_at           timestamptz not null
updated_at           timestamptz not null
```

MVP comments are flat, no threading.

### reactions

```text
thesis_id           bigint not null
user_id             uuid not null
type                 enum(agree) not null
created_at           timestamptz not null
primary key(chain_id, registry_address, thesis_id, user_id, type)
```

Challenge is a fork, not a reaction record.

### executions

```text
id                  uuid pk
thesis_id           numeric(20,0) not null; composite namespace unique
user_id             uuid not null
wallet_address      text not null
network             enum(perpl_testnet, perpl_mainnet) not null
market_id           int not null
order_id            bigint not null
position_id         numeric(20,0) null; optional display evidence only
account_id          numeric(20,0) null until independently verified
instance_id         int null until independently verified
exchange_address    text null until independently verified
transaction_hash    text null until independently verified
log_index           int null until independently verified
fill_identity       bytea unique null; required for verified, NULL for attested
verification_status enum(attested, verified) not null
position_state      enum(unknown, open, closed) not null default unknown
fill_timestamp_ms   bigint not null
side                 enum(long, short) not null
fill_size_raw       numeric not null
fill_price_raw      numeric not null
execution_ref       bytea unique not null
verified            boolean not null default false; must agree with verification_status
verification_error  text null
created_at           timestamptz not null
verified_at          timestamptz null
```

Never store Perpl Ed25519 private key or API-key signing secret here. Unverified reported fields are claims only and never receive evidence/reputation credit; verification updates are server-only. Immutable verified evidence cannot be reassigned to another thesis.

### nansen_profile_snapshots

```text
wallet_address      text not null
chain               text not null default 'monad'; primary key(chain, wallet_address)
pnl_summary_json     jsonb null; permitted normalized fields only
context_status       enum(available, empty, unavailable) not null
fetched_at           timestamptz not null
expires_at           timestamptz not null
last_error           text null
```

### reports

```text
id                  uuid pk
reporter_user_id    uuid not null
entity_type          enum(thesis, comment, user) not null
entity_id            text not null
reason               text not null
status               enum(open, reviewed, dismissed, actioned) not null
created_at           timestamptz not null
```

## Envio entities

Defined fully in `12_ENVIO_INDEXER.md`:

- Thesis
- ForkEdge
- Author
- AuthorStats
- MarketStats
- ExecutionLink

## Joining Envio and Postgres

Canonical key is `chainId + registryAddress + thesisId`, never bare thesisId.

Server response for a thesis is assembled from:

- Envio: core onchain fields and lineage
- Postgres: reasoning/tags/comments/execution verification
- Nansen cache: wallet context

Never trust Postgres author wallet over Envio author wallet. If mismatch occurs, treat record as integrity failure.

## Integrity verification

When reading finalized metadata:

1. canonicalize stored reasoning/tags/entry note
2. compute content hash
3. compare to Envio/onchain contentHash
4. if mismatch, do not render content as verified
5. log high-severity integrity event

## Retention

- finalized thesis metadata: permanent unless legally required to remove; removal changes visibility, not hash history
- drafts: 24h
- Nansen cache: refresh based on TTL, old records may remain for audit
- comments: soft delete
- logs: 14-30 days depending hosting limits
