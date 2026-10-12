# Nansen — PARTIAL

## Current decision — intentionally DEFERRED, 2026-10-10

User reviewed this gate and deferred further authentication attempts. Status: **PARTIAL / BLOCKED BY PROVIDER ACCOUNT ACCESS**. Retain the adapter, cache, fallbacks, tests and existing evidence. Resume only if API-key access becomes available and the user authorizes resumption. No authenticated evidence or READY bounty claim exists. The earlier API-key handoff below is historical and is no longer the current human action. The next authorized gate is self-host preparation on `cherry`; Perpl and domain cutover remain unauthorized.

## Authenticated Phase 3B gate — BLOCKED, 2026-10-10

The real two-user social gate is approved. This gate is limited to authenticated, permitted Nansen context; Perpl, hosting and Phase 4 remain out of scope. `NANSEN_API_KEY` is MISSING in both `apps/web/.env.local` and the inspected process environment. No authenticated Nansen request has been made, no HTTP/data/credit result has been claimed, and sponsor readiness remains PARTIAL.

Current official documentation was opened directly, rather than relying on older search excerpts:

- [Authentication](https://docs.nansen.ai/getting-started/authentication): server-side `apikey` header; read-only `data` permission is sufficient. Key provisioning requires an authenticated account; the official [agent setup](https://app.nansen.ai/auth/agent-setup) still requires user sign-in.
- [PnL Summary schema and freshness](https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance): `POST /api/v1/profiler/address/pnl-summary`, `wallet_address`, `chain: monad`, ISO date range. `address` is now a deprecated alias. The existing adapter uses the correct preferred field. Upstream summary caching can lag by about an hour.
- [Supported chains](https://docs.nansen.ai/reference/chains): Monad is supported for Profiler PnL. This is mainnet context, separate from FORK Testnet activity.
- [Current credits](https://docs.nansen.ai/getting-started/credits): PnL Summary is listed as **1 credit on both Free and Pro**. The existing adapter conservatively reserves 10 per attempt (default daily cap 20); its older Free-tier comment is outdated. Align accounting and observe safely allowlisted cost/used/rate-limit headers after credentials are available. Never expose account balance headers in product responses.
- [Redistribution](https://docs.nansen.ai/guides/redistribution-guide): address PnL/PnL Summary is allowed without additional permission. Keep only aggregate scalar fields, exclude labels, Smart Money, token details and leaderboards, and visibly credit Nansen in the product.

Implementation inspection: server-only adapter, Zod scalar validation, 30 complete UTC-day window, 6-second upstream timeout, no billed retries, shared PostgreSQL cache (success/empty 1 hour, error 5 minutes), refresh lease and serialized daily credit reservations. Only normalized context is persisted. The existing public profile-context route resolves the persisted primary wallet; the upstream body contains wallet, chain and dates, without email, Privy identity or FORK user ID. Client environment exposes only the explicitly allowed app URL and Privy public app ID. `.env.local` is gitignored, untracked and mode 600.

The Profile context panel is already separate from the four FORK reputation metrics; no-data and unavailable copy are distinct and neither creates a zero-PnL score. Smart Signal remains social-only: unique external direct forkers in 24h, then 7d, then newest and thesis ID. No ranking or reputation change was made. Real useful/empty response validation, partial response handling, explicit timeout coverage, complete API/UI fallback evidence and production smoke remain pending; current mocked coverage is not live sponsor proof.

Automation blocker: both official agent setup and the linked official login page display `Cannot initialize the Privy provider with an invalid Privy app ID`. The official API settings page links to that same login flow and has no authenticated session. This is the Nansen website's provider initialization error, not FORK's Privy configuration. [Page-only error screenshot](nansen-setup-blocked.png) contains no credentials or account identity. The login tab is retained for handoff. No authentication bypass or key creation was attempted.

Fresh validation at this handoff: `pnpm exec vitest run apps/web/tests/nansen.test.ts` passed all 12 adapter/cache tests; `git diff --check` passed. Exact configured credential scan passed across 268 non-ignored files and 203 browser assets; server configuration was absent from browser assets. A Nansen-key exact-value scan is not possible while the key is missing. No application source changed. These checks do not substitute for the full authenticated gate's quality suite.

Human action: provision the Nansen read-only API key through [official API settings](https://app.nansen.ai/api?tab=api) and configure `NANSEN_API_KEY` locally in `apps/web/.env.local`; never send it in chat. Resume only after credentials are available. Full quality gate and real endpoint evidence are deferred at the user's explicit missing-key stop condition. Next recommended integration after this gate is reviewed: **Perpl prerequisite work**, not executed here.

## Earlier implementation checkpoint — 2026-10-04

Policy rechecked 2026-10-04: only permitted PnL/PnL Summary scalar context; labels/Smart Money/token lists stripped. Fixed POST profiler/address/pnl-summary uses server-only apikey and persisted profile wallet. Mainnet external context is distinct from Testnet native reputation. Profile panel is implemented; social ranking remains unchanged.

Shared database cache, one-hour success/empty TTL, five-minute error TTL, refresh lease, global daily credit reservations (default 20, 10 per attempt) and zero billed retries are tested against migrated local PostgreSQL-compatible storage/mock HTTP. Twelve tests pass. No real key/request/response/context is confirmed.

Required evidence: real permitted response for actual participant profile wallet, empty/history behavior, shared cache reuse, credit/entitlement observation, outage recovery and visible contextual product treatment. No raw labels/keys/payloads. This is not bounty-ready.

Sources: [redistribution](https://docs.nansen.ai/guides/redistribution-guide), [endpoint](https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance), [credits](https://docs.nansen.ai/getting-started/credits).
