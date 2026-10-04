# Nansen Integration Specification

## Approved P0 role

Nansen supplies permitted EXTERNAL wallet PnL/PnL Summary context in discovery/profile, never FORK-native reputation. No Address Labels, Smart Money labels/badges, prohibited datasets or prohibited derived redistribution.

Sources checked 2026-10-04:

- https://docs.nansen.ai/guides/redistribution-guide
- https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance
- https://docs.nansen.ai/getting-started/authentication

Check current policy and endpoint schema for every exposed field. PnL/PnL Summary is explicitly allowed by the current redistribution table; this does not authorize prohibited labels or a Smart Money leaderboard.

## Server-only architecture

Browser -> FORK /api/nansen/profile/:address -> cache -> Nansen API. Key only on server. Never proxy raw payloads.

Normalized context: address, chain, permitted realized-wallet-performance summary when available, observation window/sample if provided, fetchedAt, status available/empty/unavailable. No labels or smartMoney field. Do not invent an upstream value or substitute FORK Perpl outcomes.

## Product experience

Optional wallet-performance context can add a bounded positive adjustment to Smart Signal discovery. Keep FORK social momentum primary; document exact adjustment before P15 implementation. Missing data never receives a penalty. Deterministic social-only fallback with stable tie-breaking. Profile may show interpreted permitted performance context separately from graph reputation; no fake credibility badge.

Fresh Privy wallets may have no historical activity. An empty result is valid; no assumption of existing PnL. Use a legitimate participant wallet with history to demonstrate real behavior, never borrowed attribution.

## Cache and credit policy

- cache successful/empty summaries at least 1 hour; longer if appropriate to their observation window
- short error cache and bounded retry policy to prevent storms
- no fetch per feed card render; preload a bounded set of addresses
- monitor plan entitlements/credit cost and implement a budget before broad refresh
- return permitted stale context or null on 401/402/403/429/5xx; app remains functional

## Attribution

Show Nansen attribution near interpreted context where policy requires; retain product attribution even for allowed fields. No claim that Nansen verifies FORK performance, execution or reputation.

## Acceptance and bounty evidence

- only permitted Monad PnL context is fetched/exposed
- server key never enters bundle/logs
- cache prevents repeated rendering calls
- real context changes a meaningful discovery/profile experience
- missing/empty/unavailable data has no penalty
- outage preserves deterministic social-only Feed/Profile
- no label/Smart Money badges or prohibited derived fields
- no realized-PnL component in P0 reputation

Phase 1 defines boundaries only: no Nansen network calls yet.
