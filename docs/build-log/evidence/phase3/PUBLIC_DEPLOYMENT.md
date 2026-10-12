# Public deployment — READY

2026-10-11. The approved DOMAIN + HTTPS PUBLIC CUTOVER gate is complete: public HTTPS, real Privy Google production-origin authentication, unchanged existing identity/wallet and actual public product reads are proven. [Sanitized machine-readable proof](public-proof.json), [Caddy site](../../../../deploy/caddy/fork-metropolis.caddy), [operations/rollback runbook](../../../../deploy/README.md).

## 1. PUBLIC DEPLOYMENT STATUS

**READY for this bounded gate.** Application and dedicated PostgreSQL are healthy on Cherry. This is a Monad Testnet social demo; no execution or performance verification is claimed. No new thesis, fork, accepted social mutation or blockchain transaction was submitted. Perpl, Nansen and Phase 4 remain outside this gate.

## 2. FINAL URL

Canonical origin: **https://forktrades.xyz**. www permanently redirects to the apex, preserving path/query. The existing `NEXT_PUBLIC_APP_URL` was rebuilt as this HTTPS origin; the public Privy app ID stayed unchanged. No duplicate URL variable was introduced. Runtime `config/app.env` and database-password files remained byte-identical.

Release: `fork-metropolis:public-20261011a`; scanned local and loaded Cherry image ID `sha256:e94db4ea3b46e34ee5a1d887afe00d1d97f9e784b8d5f596a8e1fa5eb9394c76`. Node 24.21.0, PostgreSQL 17.11, existing standard Next runtime and frozen dependency versions remain unchanged.

## 3. DNS/TLS

Independent A resolution through both 1.1.1.1 and 8.8.8.8 returned Cherry **5.199.166.2**. www resolves through CNAME `forktrades.xyz` to the same address. No apex AAAA. The user-configured Cloudflare DNS-only records were sufficient; no Cloudflare login/change/proxy enablement occurred.

Caddy automatically obtained trusted **Let's Encrypt** certificates for both names. Hostname/chain verification passed without insecure flags. Both certificates expire **2027-01-09 08:56:41 UTC**. Caddy manages renewal; future renewal itself was not tested during this gate.

- Apex HTTP → HTTPS: **308**.
- www HTTPS → canonical apex HTTPS: **301**.
- www HTTP first upgrades to HTTPS (**308**), then redirects to apex (**301**).
- `/t/1?proof=1` retained its path and query through redirects.
- Public HTTPS Feed: **200**, trusted certificate validation passed.

## 4. CADDY

Added only `/etc/caddy/conf.d/fork-metropolis.caddy` under the existing main Caddyfile wildcard import. Apex `reverse_proxy 127.0.0.1:13000`; www `redir https://forktrades.xyz{uri} permanent`. No main configuration replacement, unrelated site edit or Caddy service restart.

The **entire** `/etc/caddy/Caddyfile` validated successfully before a successful graceful reload. Original Caddy PID stayed unchanged. Automatic HTTPS behavior follows [official Caddy documentation](https://caddyserver.com/docs/automatic-https); commands and permanent redirect semantics were checked against the [CLI](https://caddyserver.com/docs/command-line) and [redir reference](https://caddyserver.com/docs/caddyfile/directives/redir).

## 5. PRODUCT SMOKE

Actual public APIs and real browser screens passed, with no fixture fallback:

| Public read | Proven result |
| --- | --- |
| Feed | All three rankings contain real #1/#2, trusted metadata |
| Explore | ETH has two ideas/two contributors, root has one external forker |
| Thesis #1 | User A original, target 4200, leverage 2×, one Agree and one existing User B comment |
| Thesis #2 | User B fork, parent #1, changed target 4400, leverage 3× and reasoning |
| Idea Tree | Root #1 → child #2; two visible nodes; root/child navigation and mobile layout pass |
| User A | One original, one influence; Emerging labels; zero execution credit |
| User B | One contribution, zero influence; Emerging labels; zero execution credit |
| Envio | Actual graph provenance is Envio; both metadata content hashes are trusted |
| Monad | Chain 10143 and existing registry bytecode read successfully; no transaction |

Both ideas still display **Not executed**. Nansen profile context remains explicitly disabled/deferred. Seven actual HTML screens returned 200 without test-workspace content.

## 6. PRIVY PRODUCTION AUTH

The existing authenticated dashboard allowed automatic addition of exactly **https://forktrades.xyz**. **http://localhost:3000** remains allowed. Official SDK settings re-read confirms those two origins, Google/Email enabled and unchanged enforced wallet UI. www needs no separate authentication origin because it redirects. [Official allowed-origin documentation](https://docs.privy.io/recipes/dashboard/allowed-domains).

The user completed the first Google account selection, avoiding accidental creation of a new identity. Real User A (`u_4dcde4749ffd`) authenticated on public HTTPS. The actual server verified its Privy access token, fetched the authoritative linked wallets, and matched the existing DID, user foreign key, embedded/primary wallet and production PostgreSQL association. Private DID/user identifiers were compared in memory and are omitted here.

Public existing wallet: **0xe281d002b4c2d0cf2cc2edfd1b3b57045101aba4**. After observed logout, Sign in returned and an unauthenticated mutation again returned **401 AUTH_REQUIRED**. A second real Google login selected exactly the same server-verified Google account; its existing DID/user/embedded/primary wallet mapping matched again. Authenticated User A controls and profile were observed after hydration and the final refresh/navigation.

A bounded 90-second, FORK-only loopback diagnostic observer held the real session token solely in memory. It stopped before the normal HTTPS negative checks; no packet file, token file, raw header output, browser-state extraction or production test route was introduced. For both real sessions:

- Selecting User B's actual wallet with User A's token: **403 WRONG_WALLET**.
- Agree mutation with that mismatched token/wallet: **403 WRONG_WALLET** before the social operation.
- Missing-token mutation: **401 AUTH_REQUIRED**.
- Correct-wallet authenticated read: **200**.

All five transferred table row sets still match the original exact export after authentication and negative checks: two users/two wallets/two finalized metadata rows/one reaction/one comment. No new identity or wallet was created.

The Privy application retains its existing **development provider tier**, including its dashboard-displayed 150-user limit. No paid upgrade was requested or performed. Google production-origin proof is complete; earlier user-deferred Email/OTP/private-session proof is not claimed.

## 7. SECURITY

- Application host binding remains **127.0.0.1:13000**, one loopback listener; external connection attempts to 13000 fail.
- FORK PostgreSQL has **no host port**, only its own private Docker network/volume. External 5432 connection attempt fails.
- App UID 1000, read-only root, all capabilities dropped and no-new-privileges preserved. PostgreSQL process UID 999.
- `.env`, `.env.local`, nested environment paths and production dev/test routes return **404**; unauthenticated mutations return **401**.
- Anonymous HTTPS responses set no application authentication cookie. The app's explicit bearer/linked-wallet authentication is not an ambient cookie session. Untrusted-origin preflight returns 204 with **no Access-Control-Allow-Origin** permission.
- Only `privy-session`/`privy-token` cookie **names** were observed. The pinned SDK cookie writer uses **SameSite=Strict** and **Secure on the canonical HTTPS origin**, verified from SDK source; this is source verification, not a dump of browser cookie flags/values. Existing optional Privy **HttpOnly mode remains disabled**, as observed in the dashboard; no HttpOnly wallet-isolation claim is made.
- All **203 actually deployed browser assets** were checked against actual production database/provider credentials and private identity values: absent. Server-only env names were absent. The canonical origin was verified in the compiled Next server metadata bundle.
- The image scan checked 22 layers/98,026 files/history/config and excluded private env, exports, test fixtures, SSH material and evidence. Runtime secrets are injected only at startup.
- Private environment/export/backup files remain mode 600 under the restricted FORK root; application/database logs contain no configured credential/private identity values. `.env.local` and ignored proof inputs remain untracked. All 299 versionable files pass the exact configured-credential/private-identity scan; staged Gitleaks finds no leaks.

## 8. EXISTING SERVER SAFETY

All **14 unrelated containers** retain the same IDs, states, start timestamps, port bindings and network names. All **eight original Caddy files** retain their hashes; only the FORK site was added. Caddy stays active with the same PID; UFW rules are unchanged. The **18 original HTTPS hostname response results** matched their pre-cutover baseline, including pre-existing unavailable observations; unrelated hostnames are omitted from public evidence. No unrelated database, site, container or deployment was changed.

A dedicated FORK PostgreSQL custom-format backup was taken before the image update. Prior validated image and pre-public `image.env` remain available for the isolated rollback described in the runbook.

## 9. TEST RESULTS

Fresh workspace format/lint/strict typecheck/test/ABI/build passed: **221 unit + 12 Envio + 28 Foundry tests**. Existing nonfatal optional upstream SDK build warnings remain unchanged. No dependency upgrade or schema push.

New public-origin image local production Playwright: **4 passed**, one obsolete empty-index case skipped. Public HTTPS production Playwright: **4 passed**, same explicit skip. Both include the actual fork/changed-fields/two-node desktop and mobile lineage flow, production route isolation and live service reads. The prior private gate's five critical isolated journeys remain the unchanged application-code baseline, not a newly claimed public auth test.

Three committed migrations were run idempotently; nine app tables, 53 constraints and four non-internal triggers remain. **Ten rollback-only live constraint checks** pass, including namespace uniqueness, reaction idempotency, wallet ownership/association, comment ownership and fillIdentity uniqueness. Exact real demo preservation, database HTTP health, trusted image identity, TLS/redirects/public isolation and actual two-session authentication proofs pass.

## 10. EVIDENCE

[Sanitized JSON](public-proof.json), [Feed](public-feed.png), [Explore](public-explore.png), [root #1 and existing comment](public-thesis-1.png), [fork #2 and changes](public-thesis-2.png), [desktop Tree](public-tree.png), [mobile Tree](public-tree-mobile.png), [User A](public-profile-a.png), [User B](public-profile-b.png), [first auth](public-auth-before.png), [logout](public-signed-out.png), [same identity after relogin](public-auth-after.png), [Privy origins/settings](public-privy-origins.png).

Screenshots contain public handles/wallet presentation and product/provider configuration only. No email, token, DID, user UUID, password, key or full DATABASE_URL is included. Temporary diagnostic inputs/logs/image archive remain ignored and are not deployment evidence.

## 11. HUMAN ACTION REQUIRED

**None.** The initial existing-account Google selection was completed. The public HTTPS/real Google authentication/product gate is ready for user review.

## 12. NEXT RECOMMENDED STEP

After review, authorize the bounded **Perpl real execution gate**, using `https://forktrades.xyz` as its stable Origin. Sponsor enrollment/funding/order approval and independent execution verification remain to be resolved in that separate gate. No Perpl or Nansen call/enrollment/order was started here. Under D-017, execution must remain Attested without credit when secure independent retrieval is unavailable; this gate does not claim Verified execution.
