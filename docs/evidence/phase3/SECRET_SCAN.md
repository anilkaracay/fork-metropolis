# Secret scan — 2026-10-04

Gitleaks 8.30.1 official Darwin arm64 binary, SHA-256 verified. Reachable git history: 2 commits, zero findings. Current non-ignored source export: zero findings; ignored credential files were not read. Browser static build: three generic-api-key findings, all reviewed as public SDK identifiers, not FORK server secrets. No broad suppression/allowlist was added.

Two pk_-prefixed MoonPay publishable identifiers exactly match bundled Privy React 3.47.0 sources. The Amplitude project identifier exactly matches bundled Coinbase/Base Account SDK sources. Values are omitted from this report. Official docs explain [MoonPay publishable versus secret keys](https://support.moonpay.com/en/articles/694414-managing-your-api-keys-domains-and-webhooks) and [Amplitude client-side API initialization](https://www.amplitude.com/docs/sdks/analytics/browser/javascript-sdk).

No real server credentials were configured/confirmed. This scan does not prove absence of future injected secrets; repeat after the credentialed staging build. Rule-based scanning is bounded to inspected files/patterns. Redacted detailed scanner reports remain local under /private/tmp, not committed public evidence.

## Local PostgreSQL change

The generated local development credential files are gitignored and mode 0600. Exact-value checks found neither DATABASE_URL nor its password in Git changes or any of 201 production browser files. Redacted Gitleaks stdin scans of changed tracked content and the new Compose/setup script found no leaks. The standard PostgreSQL driver replaced the Neon SDK, and the unused optional SDK is absent from the application dependency graph. No credential value is stored in this evidence.
