# Security and Threat Model

## Security goals

1. FORK never has custody of the user's EVM private key.
2. FORK backend never receives the user's Perpl Ed25519 private key.
3. A user cannot finalize metadata for someone else's onchain thesis.
4. A user cannot mark an unverified execution as verified through the normal UI/API.
5. Offchain metadata tampering is detectable through the onchain content hash.
6. Sponsor API keys remain server-side.
7. Social abuse does not take down the product.

## Assets

- Privy user session
- embedded wallet signing authority
- device-local Perpl API secret
- Nansen API key
- Privy app secret/authorization keys
- database credentials
- Envio API token
- thesis metadata integrity
- reputation integrity

## Threats and mitigations

### T1 - stolen Perpl device key

Risk: attacker with browser storage access can submit trades under permitted scope.

Mitigations:

- keep key device-local
- never log/export it
- clear local credentials action
- Perpl user can revoke API key in Perpl interface
- API keys cannot withdraw according to Perpl docs
- optional short expiry when enrollment supports it

### T2 - malicious backend claims false thesis author

Mitigation:

- Envio/onchain author is canonical
- finalize endpoint verifies receipt/event against authenticated wallet

### T3 - metadata tampering

Mitigation:

- canonical content hash anchored onchain
- verify hash on read
- integrity mismatch hides content and logs high-severity event

### T4 - fake execution

Mitigation:

- server verifies fill against Perpl source before `verified=true`
- onchain executionRef alone never equals verified status
- UI joins both states

### T5 - replayed Perpl API request

Mitigation:

- follow Perpl timestamp and single-use nonce signing rules
- request helper creates new nonce every request
- maintain monotonic order request IDs

### T6 - XSS steals local Perpl key

This is a critical browser threat.

Mitigations:

- strict CSP
- no unsafe HTML rendering
- sanitize any rich text; preferably plain text only in MVP
- no third-party analytics script that can read origin storage unless essential
- dependencies kept minimal and audited
- do not store key in localStorage; use IndexedDB and a narrow module API

IndexedDB is not protection against same-origin XSS, so CSP and injection prevention are essential.

### T7 - CSRF on mutations

Privy bearer token authorization plus same-site cookie strategy if any cookies are used. Do not rely solely on cookies for API authorization.

### T8 - spam/sybil farming influence

Mitigations:

- exclude self-forks
- unique-wallet counts
- rate limits
- transparent graph-only P0 reputation; self/repeated-wallet activity excluded
- Executions Inspired counts only independent verified evidence, deduplicated per author
- no Sybil-resistance claim or Nansen-based penalty

### T9 - fake social traction

Product policy:

- seed/demo records clearly labeled
- do not count them in displayed traction metrics
- no synthetic comments presented as users

### T10 - malicious contract inputs

Contract validates existence/bounds. No external calls, no custody, no upgradeability.

### T11 - compromised server secret

Mitigations:

- secrets only in deployment secret manager
- least privilege
- rotate before submission if exposed
- never print environment dumps
- `.env*` ignored

## Privacy

Public by design:

- wallet address
- public handle
- thesis lineage
- onchain actions

Do not collect legal name, phone, or other identity data unless Privy handles it internally and FORK does not need it.

## Content security policy baseline

Start restrictive and add only required domains:

- self
- Privy domains required by SDK
- Monad RPC if browser direct RPC is used
- Perpl API/WS domains
- Envio GraphQL domain if browser calls directly

Prefer server proxy for Nansen so it is not in browser connect-src.

## Dependency security

Before final deploy:

- run package audit
- inspect critical high/critical advisories manually
- pin lockfile
- do not perform major dependency upgrades on final submission day

## Smart contract review checklist

- no external call
- no delegatecall
- no owner backdoor
- input bounds
- event correctness
- storage/packing review
- Foundry fuzz tests
- deploy only after clean test suite
