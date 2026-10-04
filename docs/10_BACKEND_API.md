# Backend API Specification

All endpoints live under `/api` in Next.js route handlers unless later extracted.

## Authentication

Authenticated requests send Privy access token in:

```text
Authorization: Bearer <privy_access_token>
```

Server verifies token with Privy server SDK before user lookup. Never trust wallet address supplied by the client without matching it to the authenticated Privy user.

## Common response envelope

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "THESIS_NOT_FOUND",
    "message": "This thesis could not be found.",
    "requestId": "..."
  }
}
```

Do not leak upstream secrets or raw stack traces.

## POST /api/profile

Create/update basic profile.

Request:

```json
{
  "handle": "anil",
  "displayName": "Anil"
}
```

Validation:

- handle 3-24 chars
- `[a-z0-9_]` only
- reserved handles rejected

## POST /api/theses/draft

Auth required.

Request:

```json
{
  "reasoning": "Breakout above prior resistance...",
  "entryNote": "Wait for confirmation",
  "tags": ["breakout", "momentum"]
}
```

Response:

```json
{
  "draftId": "uuid",
  "contentHash": "0x..."
}
```

Server canonicalizes and hashes content.

Rate limit: 20/hour/user.

## POST /api/theses/finalize

Auth required.

Request:

```json
{
  "draftId": "uuid",
  "txHash": "0x...",
  "thesisId": "42"
}
```

Server:

1. fetches receipt via Monad RPC
2. confirms transaction succeeded
3. decodes ThesisCreated from configured FORKRegistry
4. confirms thesis ID, author wallet, and content hash match authenticated user and draft
5. finalizes metadata

Never finalize based only on client-provided fields.

## GET /api/theses/:id

Public.

Returns composed view:

```json
{
  "core": {},
  "metadata": {},
  "author": {},
  "social": {
    "commentCount": 0,
    "agreeCount": 0
  },
  "execution": null,
  "nansenContext": null
}
```

Core onchain fields should come from Envio, with RPC fallback only when indexing lag is explicitly handled.

## GET /api/theses/:id/comments

Public, paginated cursor.

## POST /api/theses/:id/comments

Auth required.

Request body:

```json
{"body":"I agree with the setup but would use a tighter invalidation."}
```

Rate limit:

- 10/minute/user
- 50/hour/user

## PUT /api/theses/:id/reactions/agree

Auth required. Idempotent upsert.

## DELETE /api/theses/:id/reactions/agree

Auth required. Idempotent delete.

## POST /api/executions/verify

Auth required. Resolve chain/registry/thesis namespace server-side. Client supplies selected evidence identifiers and fresh rapidly expiring proof(s) for server-owned fixed read-only GET request targets. The server fixes official Perpl host, method, path and permitted query shape; caller cannot choose a URL/method or send trading payloads. Never log authentication material or receive the private Ed25519 key. Each paginated request needs its own fresh proof.

Server directly retrieves Perpl wallet and fill/order evidence, checks authenticated wallet and account ownership, market/side/thesis relationship, nonzero fill after thesis creation, complete immutable fill identity, and transactional evidence uniqueness. Success returns verified=true, executionRef and normalized authoritative evidence. Only then offer author linkExecution.

Failure returns an explicit recovery action and Attested/unverified status; user JSON or signatures alone never set verified=true. Keep Attested out of execution-dependent metrics. No required positionId or closed-position PnL. This relay must be live-tested during P13 before any Verified product claim.

## GET /api/nansen/profile/:address

Public app endpoint, server-to-server upstream.

Behavior:

- validate EVM address
- read cache
- if fresh, return cache
- if stale, fetch permitted Nansen PnL summary only for chain `monad`
- store normalized context
- strip irrelevant/raw fields before returning to client

Rate limit upstream refresh per address to protect credits.

## GET /api/search

Query params:

- `q`
- `market`
- `type=thesis|user|all`

MVP can use Postgres text search for metadata/users and merge with Envio IDs.

## POST /api/reports

Auth required. Creates moderation report.

## GET /api/health

Public minimal health:

```json
{
  "status": "ok",
  "db": "ok",
  "envio": "ok",
  "rpc": "ok",
  "perpl": "ok"
}
```

Do not expose secret values, versions with known vulnerabilities, or internal hostnames.

## Error codes

At minimum:

- AUTH_REQUIRED
- AUTH_INVALID
- VALIDATION_FAILED
- RATE_LIMITED
- THESIS_NOT_FOUND
- DRAFT_NOT_FOUND
- DRAFT_HASH_MISMATCH
- TX_NOT_FOUND
- TX_REVERTED
- TX_EVENT_MISMATCH
- ENVIO_UNAVAILABLE
- PERPL_UNAVAILABLE
- PERPL_VERIFICATION_FAILED
- NANSEN_UNAVAILABLE
- INTEGRITY_MISMATCH
- INTERNAL_ERROR

## Rate limiting

Use a simple provider compatible with Vercel, or Postgres-backed limits if no additional service is desired. Core requirement is predictable abuse control, not sophistication.

## Request tracing

Generate `x-request-id` for each mutation. Include it in structured logs and error responses.
