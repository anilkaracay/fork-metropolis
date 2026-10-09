# Secret scan — 2026-10-04

Gitleaks 8.30.1 official Darwin arm64 binary, SHA-256 verified. Reachable git history: 2 commits, zero findings. Current non-ignored source export: zero findings; ignored credential files were not read. Browser static build: three generic-api-key findings, all reviewed as public SDK identifiers, not FORK server secrets. No broad suppression/allowlist was added.

Two pk_-prefixed MoonPay publishable identifiers exactly match bundled Privy React 3.47.0 sources. The Amplitude project identifier exactly matches bundled Coinbase/Base Account SDK sources. Values are omitted from this report. Official docs explain [MoonPay publishable versus secret keys](https://support.moonpay.com/en/articles/694414-managing-your-api-keys-domains-and-webhooks) and [Amplitude client-side API initialization](https://www.amplitude.com/docs/sdks/analytics/browser/javascript-sdk).

No real server credentials were configured/confirmed. This scan does not prove absence of future injected secrets; repeat after the credentialed staging build. Rule-based scanning is bounded to inspected files/patterns. Redacted detailed scanner reports remain local under /private/tmp, not committed public evidence.

## Local PostgreSQL change

The generated local development credential files are gitignored and mode 0600. Exact-value checks found neither DATABASE_URL nor its password in Git changes or any of 201 production browser files. Redacted Gitleaks stdin scans of changed tracked content and the new Compose/setup script found no leaks. The standard PostgreSQL driver replaced the Neon SDK, and the unused optional SDK is absent from the application dependency graph. No credential value is stored in this evidence.

## Privy local preparation — 2026-10-06

Moved server environment validation out of the browser-imported shared schema into a server-only module. The new production build's 203 browser static files contain neither PRIVY_APP_SECRET nor the configured database URL/password. Privy secret value scanning remains pending because the credential is missing. Changed/new source passes exact local credential checks and redacted Gitleaks stdin scanning. Environment inspection reports presence only; credential files remain ignored and were not changed. Real tokens, wallet signatures and email are not present in evidence. Credentialed browser/build checks must be repeated after configuration; this preflight does not establish live authentication security.

## Credentialed Privy build — 2026-10-09

Both Privy credentials are now present in the ignored mode-0600 local environment. A fresh credentialed production build contains no PRIVY_APP_SECRET name or actual value, DATABASE_URL or database password across 203 browser static files. Exact-value checks of changed non-ignored source and safe evidence images pass; redacted Gitleaks scanning passes. Credential retrieval used the official dashboard Copy control, direct local file storage, clipboard clearing and no credential output. Saved dashboard/login images contain no secret values, tokens, signatures or user email. Real authenticated-session checks remain pending user login; these scans alone do not establish live token/wallet security.

After the real Google identity and signing check, the final timestamp-fix build passed the same exact credential checks across 203 browser static files and all non-ignored repository files. Changed/new source passed redacted Gitleaks. Live wrong-wallet/invalid-token probes passed; saved FORK result images show only generated handles, public wallets and status text. No Google chooser image or email-matching file was written; automatic approval review prevented those personal-data storage actions.
