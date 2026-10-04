# Backend API — implemented Phase 2

Next App Router Node route handlers expose `/api`. Product UI depends on typed internal models, not raw Envio GraphQL. This document describes implemented endpoints; live execution, Nansen enrichment, search and a multi-service health claim are not implemented.

## Authentication and response boundaries

Authenticated requests send `Authorization: Bearer <Privy access token>` and `x-fork-wallet: <selected primary wallet>`. The server verifies the token, resolves authoritative DID and linked Ethereum wallets, synchronizes identity transactionally, and rejects any mutation whose submitted wallet is unlinked or differs from the selected primary wallet. Only POST session can explicitly select another linked wallet.

Every response has `{ok:true,data}` or `{ok:false,error:{code,message,recovery,requestId}}`, a request-ID header, and no-store caching. Error responses are sanitized, with a recovery action. JSON mutations are bounded to 16KB; unknown fields are rejected by strict input schemas. GET read retries are bounded; wallet sends and mutations are never automatically resent. UI recovery uses persisted request keys and transaction hashes.

## Public reads

| Endpoint | Result |
| --- | --- |
| GET /feed?mode=fresh\|most-forked\|smart-signal&offset=0 | 20 composed valid published ideas per page; candidates bounded to 500, transparent ranking text. |
| GET /explore | Composed discovery candidates, actual tags, explicit latest-500 scope. |
| GET /theses/:id | ThesisDetail, trusted/missing/integrity-mismatch/hidden metadata state, parent attribution/diff, 8 direct-child previews, latest 50 comments. |
| GET /theses/:id/tree | ThesisTree, root/selected IDs, ancestry, 250 nodes plus selected ancestors, explicit truncation. |
| GET /profiles/:handle | Identity, selected-wallet display, exact reputation aggregates and at most 100 recent authored ideas. |
| GET /context | Validated unauthenticated Perpl Testnet public context; local tests use the dated Phase 1 context fixture. |

Bare route IDs resolve within the configured chain/registry namespace. Corrupted metadata is never returned as trusted reasoning. Hidden content is excluded from Feed/Explore; graph nodes and authorship remain visible in lineage.

## Authenticated mutations and reads

| Endpoint | Input and behavior |
| --- | --- |
| POST /session | `{wallet}`; verified linked-wallet association and explicit primary selection. |
| GET /session | Returns synchronized application Session and server-derived isAdmin. |
| POST /profile | `{handle,displayName,bio?}`; lowercase 3–24 handle, reserved-name/uniqueness checks, name 1–60, bio ≤160. |
| POST /theses/draft | `{parentId,core:{marketId,side,targetPriceE8,invalidationPriceE8,leverageBps},metadata:{reasoning,entryNote?,tags},requestKey}`. Returns `{draftId,contentHash,intent,expiresAt}`. Canonical metadata hash, server-owned namespace and author, validated parent and inherited market, meaningful-change requirement. |
| POST /theses/finalize | `{draftId,txHash}`. Thesis ID comes from the validated receipt event, never the caller. Checks chain, target/author/exact calldata, success, canonical block, one matching event, hash/core/parent and draft timing. Returns `{thesisId,state}` with Published only for a matching indexed hash/transaction; otherwise Confirmed / indexing. |
| GET /theses/:id/agree | Personal agreement state. |
| PUT /theses/:id/agree | Idempotent Agree. |
| DELETE /theses/:id/agree | Reverse Agree. |
| POST /theses/:id/comments | `{body,requestKey}`; flat safe text, 1–280 characters, idempotent. |
| DELETE /comments/:uuid | Comment author only; soft delete. |
| POST /theses/:id/report | `{reason,note?,requestKey}`; one report per reporter/thesis, bounded text, rejects request-key reuse for another thesis. |
| GET /moderation | Server-authorized admin DIDs only, latest 100 open reports. |
| PUT /moderation/:id | `{hidden:boolean}`; hide/unhide finalized Postgres metadata, update report state; canonical graph unchanged. |
| POST /executions/relay | Strict proof/request boundary; returns 501 RELAY_NOT_ENABLED. No authenticated Perpl request, trade, enrollment or verified evidence write. |

Persistent atomic database limits: draft 20/hour; finalization 60/minute; Agree 60/minute; comments 10/minute and 50/hour; reports 10/hour; profile updates 10/hour; relay preparation 10/minute. Database statements have timeouts; failed mutations use explicit idempotent recovery rather than blind transport replay.

## Test-only routes

`test/identity`, `test/submit` and `test/reset` exist only for the explicit development test workspace on loopback, with same-origin browser access. Submitted synthetic confirmations pass through normal draft/finalization/composition code and actual Envio test handlers. Production rejects test configuration and returns 404 for test routes. Tests never grant production reputation credit.
