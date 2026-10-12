# Security and Threat Model

## Security goals

1. FORK never has custody of the user's EVM private key.
2. FORK backend never receives the user's Perpl Ed25519 private key.
3. A user cannot finalize metadata for someone else's onchain thesis.
4. A user cannot mark an unverified execution as verified through the normal UI/API.
5. Offchain metadata tampering is detectable through the onchain content hash.
6. Sponsor API keys remain server-side.
7. Social abuse does not take down the product.
8. Backed MON can only leave FORKBacking to the address it was credited to.
9. The only server-held key is the testnet welcome faucet; it never signs for users and never for another network.

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
- unwithdrawn backing credits held by FORKBacking

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

FORKRegistry validates existence/bounds. No external calls, no custody, no upgradeability.

### T11 - compromised server secret

Mitigations:

- secrets only in deployment secret manager
- least privilege
- rotate before submission if exposed
- never print environment dumps
- `.env*` ignored

### T12 - backing funds and lineage credits

FORKBacking holds native MON between `back` and `withdraw`. It has no owner, admin, fee or upgrade path, so there is no privileged key to steal.

Risks and mitigations:

- Reentrancy on withdrawal: the balance is cleared before the send. A nested `withdraw` reverts with `NothingToWithdraw`; tests cover the uncaught and the caught case with other authors' credits present.
- A recipient that rejects MON: payments are pull based, so it cannot block a backing or another author's withdrawal. Only its own credits stay unclaimed.
- Accounting drift: the author's credit is the remainder, so credits sum to the amount sent. A stateful invariant checks that the contract balance equals the sum of unwithdrawn credits.
- Wrong lineage: authorship and ancestry come only from the immutable registry address fixed at deployment. The deployment script checks that address against the recorded registry code before sending.
- Unbounded work: at most three registry reads per backing, no loops over user data.
- Forced MON: there is no `receive`. MON forced in by other means never enters the accounting and is not recoverable.
- Sybil backing: one person can back from several wallets, including their own thesis from a second address, and can fill the ten early positions at no net cost beyond gas because the value returns to them as author. Totals and early status are presented as volume and chronology, not as independent endorsement, and never feed reputation metrics.
- Self-fork farming: an address in several roles of one lineage is credited once in its nearest role, so forking your own idea does not create income labelled as earned from forks.
- Regulatory framing: testnet MON has no monetary value. Product copy must not describe backing as an investment or promise a return.

### T13 - welcome faucet

The server holds one hot key: a dedicated Monad Testnet account that sends each new user one welcome drip of 0.2 testnet MON (D-057). It is the only signing key the server has. It is not a user key, it has no role in any contract and it cannot move user funds.

Assets at risk: the testnet MON in the faucet account, and the availability of onboarding without a public faucet visit. Testnet MON has no monetary value.

Risks and mitigations:

- Key disclosure: the key is read only from the server environment (`FORK_FAUCET_PRIVATE_KEY`), is absent from the browser schema, is never logged and is never returned by any route. The log line for a drip carries the user id, wallet, state and transaction hash only. Exposure loses at most the balance of that one account; recovery is to move the remaining MON, generate a new key and redeploy the variable.
- Wrong network: the signer checks the RPC's chain id and signs only for chain 10143, whatever `MONAD_RPC_URL` says. The key must never be reused on another network.
- Draining by one person: a drip requires a Privy-verified session and the session's primary wallet. One row per user and one row per wallet are enforced by unique constraints, wallets cannot change owner, and a wallet that already holds 0.2 MON gets nothing. Creating many accounts still needs a distinct verified identity each time and is bounded by the daily cap.
- Draining by many: at most 15 drips are reserved per UTC day, counted under a database advisory lock so concurrent requests cannot exceed it. The most the faucet can send in a day is about 3.04 MON.
- Double payment: the signed transfer is stored before it is broadcast. Retries, concurrent requests and crashes can only resend the same transfer. A second transfer is signed only after the first is proven dead (reverted, or its nonce consumed by another transaction).
- Partial failure: nothing is signed unless the faucet covers the drip plus its gas. An empty faucet returns a stated "empty" state with the public faucet as the way forward; publishing then fails with the existing gas guidance, never silently.
- Request floods: the drip route is behind the same authentication as every mutation and a per-user limit of 6 requests per hour. Status reads send nothing.
- Nonce races: sends are serialized in the single application process. Running several application instances against one faucet key is not supported and would need a shared lock first.
- Griefing the cap: verified accounts created only to use up the day's 15 drips deny the drip to later users that day. They still get the stated daily-limit message and the public faucet link. This is accepted for a testnet build.

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

- no external call in FORKRegistry; in FORKBacking only read-only registry lookups and one send to the caller in `withdraw`, after its balance is cleared
- no delegatecall
- no owner backdoor
- input bounds
- event correctness
- storage/packing review
- Foundry fuzz tests
- deploy only after clean test suite
