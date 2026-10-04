# Nansen Integration

## Approved context and policy

Checked 2026-10-04 against the [official redistribution guide](https://docs.nansen.ai/guides/redistribution-guide): PnL/PnL Summary is permitted. Address Labels, Smart Money/premium labels and prohibited derived redistribution are excluded. No raw upstream payload reaches clients. Attribution is retained near context even though permitted PnL redistribution does not require it.

Implemented server/context route/profile panel; authenticated Nansen calls have **not** run. Credential confirmation and live profile infrastructure are pending. Tests use explicit mock HTTP and real migrated PostgreSQL-compatible storage.

## Endpoint and provenance

POST https://api.nansen.ai/api/v1/profiler/address/pnl-summary uses server-only apikey header and `{chain:"monad", wallet_address, date:{from,to}}`. Wallet comes from the persisted profile, not arbitrary caller host/body/address. Current [endpoint documentation](https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance) uses wallet_address; address is deprecated.

Window: previous 30 complete UTC days. Nansen Monad history is **mainnet** context, separate from FORK Testnet reputation. Normalize only realized_pnl_usd, realized_pnl_percent (fraction), win_rate (fraction), traded_token_count and traded_times. Profile displays USD PnL, sales/token count and observation time. Strip unknown fields, including labels/token lists. Empty counts yield an empty summary rather than fabricated performance.

## Shared cache and budget

wallet_context_cache keys chain/wallet/window and stores normalized permitted summaries with a 30-second refresh lease. Atomic PostgreSQL advisory-lock reservations and daily buckets bound requests globally across users/instances. Success/empty cache: one hour. Error cache: five minutes. Same-window cached context is explicitly stale during outage. No key disables calls. DB failures, timeout, malformed responses and entitlement/upstream failures preserve Feed/Profile.

[Credit documentation](https://docs.nansen.ai/getting-started/credits) lists pnl-summary as 1 Pro / 10 Free credits. Conservatively reserve 10 per attempt, including failures; six-second timeout, zero automatic billed retries. Default FORK_NANSEN_DAILY_CREDIT_BUDGET=20 permits at most two uncached attempts/day globally. Set 0 to disable; verify plan before raising (maximum 1000). This limiter does not track actual provider consumption headers or other API users.

## Product and ranking

GET /api/profiles/:handle/context supplies a separate optional panel. Local test identities never call Nansen or display invented context. Missing context has no native reputation/discovery penalty.

Smart Signal retains D-031: unique external direct forkers in 24h, then 7d, then creation time/ID descending. No Nansen ranking weight. The approved contextual treatment preserves the social product; live discovery benefit remains unmeasured. No PnL, wallet size or profitability enters Originality, Contribution, Influence or Executions Inspired.

## Evidence still required

Confirmed server key, real profile wallet and permitted successful response must demonstrate actual empty/history context, cache reuse and outage/entitlement recovery. Code/fixtures alone do not establish bounty readiness.
