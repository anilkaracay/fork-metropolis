# Data Model

Implemented Phase 2 source: `packages/db/src/schema.ts`; committed SQL in `packages/db/migrations/`. Development uses local PostgreSQL 17; production later uses standard PostgreSQL through the same Drizzle/node-postgres adapter (D-039). Tests apply the same migrations to an isolated PGlite PostgreSQL instance. The local database uses the same three committed migrations; current live checks are recorded in the Phase 3 ledger.

## Authority and namespace

Envio owns canonical graph fields, edges and onchain aggregates. Postgres owns authenticated identity, reasoning metadata, social state and independently verified evidence. The small `intent` JSON object in a draft stores expected transaction parameters for receipt verification; it is not a second graph query layer.

All thesis-related rows use `(chain_id, registry_address, thesis_id)`. Addresses are lowercase checked hexadecimal text; thesis IDs use `numeric(20,0)` and checked uint64 bounds, never JavaScript numbers. Public `/t/:id` routes resolve within the server-configured chain and registry. Graph readers enforce the same namespace.

## Nine tables

| Table | Responsibility and constraints |
| --- | --- |
| users | UUID, unique verified Privy DID and lowercase handle, display name, bounded bio, primary wallet, timestamps. |
| wallets | Address primary key, user FK, embedded/external kind. Composite owner/address uniqueness and immutable ownership. |
| thesis_metadata | Author user and owned wallet FK, namespace, immutable finalized hash/reasoning/tags/note, request key, expected intent, parent ID, expiry, transaction hash, finalized timestamp, separate hidden flag. |
| comments | Namespaced finalized metadata FK, author FK, 1–280 characters, author/request-key uniqueness, visible/hidden/deleted state and timestamps. Author and thesis association cannot be reassigned. |
| reactions | Agree only. Composite namespace/user/type primary key. PUT inserts once; DELETE reverses it. |
| reports | Namespaced metadata FK, reporter FK, spam/abuse/misinformation/other, note up to 280 characters, one report per reporter/thesis and unique reporter/request key. |
| execution_evidence | Namespaced metadata FK and owned wallet FK, attested/verified state, unknown/open/closed position, complete authoritative venue/fill fields required for verified rows. No HTTP writer grants verification in Phase 2. |
| rate_buckets | User/action/window primary key, atomic conditional upsert, persistent across server instances. Indexed by window for later retention cleanup. |
| wallet_context_cache | Owned wallet FK, chain/wallet/window cache key, normalized permitted external summary, expiration and short refresh lease. No FORK-native metrics or raw upstream payload. |

The primary-wallet ownership FK is deferrable to permit atomic identity synchronization. Finalized content can only change its moderation flag and update timestamp; new reasoning requires another thesis. Drafts expire after 24 hours, assessed against canonical transaction creation time. Recovery after expiry still accepts a transaction created within its valid draft window.

A unique `(chain, registry, tx_hash)` prevents receipt reuse. Author/request-key uniqueness makes draft retries idempotent. Finalized rows cannot omit receipt or finalized timestamp, including through PostgreSQL NULL CHECK semantics.

## Evidence

`fill_identity` is a globally UNIQUE checked 32-byte hexadecimal text representation of the Phase 1 venue-bound hash. This replaces the spec's bytea representation without changing hash identity or uniqueness semantics. It is independent of registry/thesis and therefore cannot earn credit twice after redeployment. Attested rows must leave all authoritative fill/evidence fields NULL and position unknown; verified rows require complete identity, execution reference, payload and verification timestamp. Verified rows cannot be reassigned or rewritten.

Phase 2 browser fixtures create no verified evidence. Unit integration fixtures insert explicitly marked verified rows to test composition, matching link/author checks, strict descendant credit and overlapping-ancestor deduplication. These fixtures never enter production metrics.

## Migrations and verification

`0000_fuzzy_chronomancer.sql` is Drizzle's initial generated schema, with committed journal and snapshot. `0001_immutable_social_identity.sql` adds ownership/content/evidence triggers and the deferrable selected-wallet FK. The generated filename is retained for migration journal continuity.

`0002_windy_red_ghost.sql` adds the permitted external-context cache only. All three migrations are required by `/api/health/database`. The Phase 3 development smoke check executes real constraint assertions in one transaction and always rolls back its rows. It neither drops tables nor resets production data. See [migration and smoke commands](23_DEPLOYMENT_ENV.md).

`pnpm test:db` exercises uniqueness, ownership, case normalization, namespaces, receipt/request idempotency, comments, Agree, reports, NULL checks and fill reuse using real PostgreSQL constraints. `pnpm db:migrate` is an explicit live operation requiring the intended DATABASE_URL; it was not run in this phase.
