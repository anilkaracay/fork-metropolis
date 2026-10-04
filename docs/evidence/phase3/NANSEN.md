# Nansen — PARTIAL

Policy rechecked 2026-10-04: only permitted PnL/PnL Summary scalar context; labels/Smart Money/token lists stripped. Fixed POST profiler/address/pnl-summary uses server-only apikey and persisted profile wallet. Mainnet external context is distinct from Testnet native reputation. Profile panel is implemented; social ranking remains unchanged.

Shared database cache, one-hour success/empty TTL, five-minute error TTL, refresh lease, global daily credit reservations (default 20, 10 per attempt) and zero billed retries are tested against migrated local PostgreSQL-compatible storage/mock HTTP. Twelve tests pass. No real key/request/response/context is confirmed.

Required evidence: real permitted response for actual participant profile wallet, empty/history behavior, shared cache reuse, credit/entitlement observation, outage recovery and visible contextual product treatment. No raw labels/keys/payloads. This is not bounty-ready.

Sources: [redistribution](https://docs.nansen.ai/guides/redistribution-guide), [endpoint](https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance), [credits](https://docs.nansen.ai/getting-started/credits).
