# Self-host preparation on cherry — READY

2026-10-11. This is the historical completed private self-host preparation gate. The later approved public HTTPS/domain-auth cutover is now documented in [the public deployment report](PUBLIC_DEPLOYMENT.md). The user's approved scope was completed with no new blockchain transaction and no Nansen, Perpl or Phase 4 work. [Machine-readable public proof](self-host-proof.json), [explicit transfer manifest](self-host-transfer-manifest.json), [operations and cutover runbook](../../../../deploy/README.md).

## 1. Self-host status

**READY.** App and its isolated database are healthy on cherry. No human action is blocking this gate.

## 2. Local Docker

Use ordinary Next.js 16.3.8 `next start`; standalone tracing adds unnecessary workspace packaging complexity. The current [official self-host guide](https://nextjs.org/docs/app/guides/self-hosting) supports the normal Node runtime. Node **24.21.0**, pnpm **12.6.0**, frozen lockfile, multistage build and separately installed production workspace dependencies. Linux/amd64 runtime was validated locally on the Mac before deployment; native builder compilation avoids slow emulated compilation while target-platform dependencies remain amd64.

Final release: `fork-metropolis:selfhost-20261011b`; image ID `sha256:43abe373f8baa8de5b44fe52fdc0d1db7f829c815a85f4ed5b71b6279407154a`. Cherry's loaded identity exactly matches the scanned local image. Public build-time variables only; runtime secrets never entered Docker build arguments/context. The production-only webpack alias replaces test-runtime imports with a fail-closed stub. The existing public market-context fixture is builder-only for TypeScript checking and absent from runtime. Explicit `turbopack: {}` retains the existing development/test compiler; five isolated critical browser journeys passed after this compatibility fix.

A fresh isolated local PostgreSQL clone applied the committed migrations, imported the exact demo, rejected repeated import without overwriting anything, passed ten rollback-only constraints, and preserved the imported rows exactly. Final image product/API and desktop/mobile production Playwright smoke passed. At the already-approved `localhost:3000` origin, the containerized production image hydrated the existing real Privy Google session and rendered User B's authenticated profile. `localhost:13000` was correctly rejected by Privy's existing origin policy; no provider settings were changed. Public-host authentication remains untested until the HTTPS cutover.

Local production screenshots: [Feed](self-host-local-feed.png), [root-author profile](self-host-local-profile.png), [real hydrated auth](self-host-local-auth.png). These are local image proof, not screenshots of a public cherry site.

## 3. Cherry deployment

- Host: `5.199.166.2`, authorized SSH user `root`; existing local SSH identity authenticates non-interactively with strict known-host checking.
- Root: `/opt/fork-metropolis`, mode 700, isolated config/releases/exports/backups/ops directories.
- Compose project: `fork-metropolis-prod`.
- App host publish: **`127.0.0.1:13000:3000`**; no IPv6 or public wildcard listener on port 13000.
- App readiness: HTTP 200, database ready, migrations applied. Both services healthy after the controlled restart.
- Image starts normal Next on configurable container port 3000 / host `0.0.0.0` inside its private network; host publishing remains strictly loopback.

## 4. PostgreSQL

Official `postgres:17.11-bookworm`; actual server **17.11 (Debian 17.11-1.pgdg12+2)**. Database/user `fork_prod`; dedicated generated server-local password, never printed. No database host port. Dedicated network `fork-metropolis-prod_private`, named volume `fork-metropolis-prod_postgres_data`. PostgreSQL process UID 999; app UID 1000. No existing PostgreSQL 14/16 resource, credential, volume or network was reused. App/database use standard PostgreSQL and unchanged Drizzle migrations, with no provider-specific SDK or assumptions.

## 5. Migrations and constraints

Three exact committed migrations applied; rerunning deployment remained idempotent at three journal entries. Nine public application tables, 53 constraints and four non-internal triggers verified. No schema push, reset, disable-constraint or destructive shortcut.

Ten live checks passed in both the fresh local clone and cherry, within transactions that always rolled back: wallet uniqueness, immutable wallet ownership, selected-wallet association, metadata wallet ownership, namespace uniqueness, distinct-registry namespace coexistence, reaction idempotency, comment ownership, report uniqueness and fillIdentity uniqueness. Read-only exact-row comparison passed after the constraint run and restart. No simulated publication, identity, social or execution rows persisted.

## 6. Demo transfer

The explicit five-table/column manifest was produced and validated before export/transport. A purpose-built scoped export was chosen over a full database dump to omit unnecessary rate-bucket/private operational data. Source snapshot was repeatable-read/read-only; private JSON mode 600, SSH transport, destination-only restricted export. The importer locks and requires all nine destination application tables to be empty, inserts in dependency order, recomputes anchored content hashes and validates ownership/namespace, then verifies every field before committing. It has no overwrite/upsert/reset path.

Final exact transferred rows:

| Table | Rows | Real meaning |
| --- | ---: | --- |
| users | 2 | Necessary existing User A/B pseudonymous Privy DID and preserved identity/FK mappings; actual display name/bio null |
| wallets | 2 | Required public embedded EVM wallet/owner mappings |
| thesis_metadata | 2 | Finalized root #1 and fork #2, anchored content hashes, intent/reasoning/tags/public receipts and original timestamps |
| reactions | 1 | User B Agree on root #1 |
| comments | 1 | User B visible comment on root #1 |

Intentionally excluded: all nine rate-bucket rows present at manifest time; cache, drafts, reports, execution evidence, access tokens, session cookies, email/social-provider details, API credentials and private keys. Destination rate_buckets, wallet_context_cache, reports, execution_evidence and drafts each verified zero. Actual DID/user UUID values are absent from public evidence; new self-host artifacts also omit transferred row/request identifiers; only required mappings exist in restricted database/export/backup storage.

## 7. Product smoke

Server-local HTTP checks passed before and after restart: Fresh/Most Forked/Smart Signal Feed each contain trusted #1/#2 from actual Envio; root #1 and fork #2 read correctly; selected fork #2 tree contains the two nodes with root #1 and parent-child lineage; seven product HTML screens return 200 without test banners. Both public profiles retain exact FORK-native reputation: A has one successful root and Influence 1; B has one eligible fork and Influence 0; both remain Emerging and have zero verified execution credit. Root's one Agree and one visible comment with B's public wallet persist.

Envio reads succeed from cherry through the actual app and report `graph: envio`. Independent Monad RPC read succeeds for chain 10143. Database readiness depends only on app/database/migrations, not external providers. Nansen context reports disabled/deferred. Dev page/test mutation routes return 404; unauthenticated publication returns 401. No new wallet signature/order/transaction was attempted. Server-local HTML/API checks do not substitute for a later real HTTPS browser login.

## 8. Restart and backup

One controlled restart of only FORK app/PostgreSQL completed; both returned healthy. Same named volume, exact metadata/identity/social rows and repeated product smoke passed. No whole-server reboot or destructive migration replay.

Thin ops wrapper supports deploy/status/logs/restart/backup. An actual PostgreSQL custom-format backup was created mode 600 under the restricted FORK backup directory; `pg_restore --list` verified its application data and migration journal. Restore documentation requires a fresh isolated recovery database/volume and explicit review, with no `--clean`, database drop or volume deletion shortcut. Prior validated image is retained for schema-compatible application rollback.

## 9. Existing server safety

Read-only before/after comparison passed for all **14 pre-existing containers**: same IDs, states, start timestamps, published port bindings and attached network names. Existing PostgreSQL containers remained untouched. All **eight Caddy config files** retain their hashes; service active/PID unchanged. UFW status and verbose rules hash unchanged. Existing ports/routes 80/443 untouched. Docker's managed nftables metadata changed as expected when adding FORK's dedicated bridge and loopback publish; no manual firewall mutation was made. Only isolated FORK deployment paths/resources were created/updated by this gate.

## 10. Later domain cutover

The exact existing convention is `/etc/caddy/Caddyfile` importing `/etc/caddy/conf.d/*.caddy`. After separate approval: choose the domain and point DNS A to cherry; rebuild the image with that final public HTTPS app URL; authorize the exact Privy origin; add only `/etc/caddy/conf.d/fork-metropolis.caddy` with `reverse_proxy 127.0.0.1:13000`; validate the full existing config then reload Caddy; verify automatic HTTPS, redirects/headers/assets/API, fresh browser auth/wallet and secure session/origin behavior. Keep the raw port loopback-only. Perpl stable-Origin approval belongs to its later gate. [Current runbook](../../../../deploy/README.md#public-https--caddy-cutover). None of these public-cutover actions was executed.

## 11. Security

App runs non-root with read-only root, dropped capabilities and no-new-privileges; bounded tmp/cache, CPU/memory and rotating logs. Database has no published host port and shares only FORK's dedicated bridge. Production env/password/image metadata/private export and backup files verified mode 600 beneath a mode-700 root. No SSH or Foundry private material was copied.

Final image scan covered **22 layers, 98,026 files and 203 browser static assets**: exact configured credentials absent from all layers/history/config; server-only env names absent from browser assets; excluded private/test/evidence material absent; bundled production stub present. Image ID is identical on cherry. Actual server database/provider credential and transferred private identity values were checked against stdout/stderr of both service logs and were absent. No test mode/admin DID/Nansen key in server configuration. A versionable-file scan also checks actual local credentials and transferred private identifiers; no values are printed, and environment/export/deployment config files are gitignored.

## 12. Quality results

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm abi:check`, `pnpm build`: **passed after the final code change**. 221 unit tests, 12 Envio handler tests and 28 Foundry tests. Five critical isolated Playwright journeys passed; final real production smoke four passed, one obsolete empty-index case deliberately skipped because two real theses now exist. Local/cherry ten-constraint rollback checks, local Docker/real-data clone, image scan, server health/live reads/restart/persistence/backup/isolation checks passed. Shell syntax and `git diff --check` pass. Existing nonfatal optional Privy build/dependency warnings remain; dependency versions were not upgraded.

## 13. Files changed

Dockerfile, .dockerignore, .gitignore, root package scripts, Next config and production test-runtime stub; deploy compose/start/health/demo-transfer/ops/runbook; six safe-transfer regression tests; D-048 decision and deployment/live-gate documentation; this report/public JSON/manifest and three local proof screenshots. The prior approved Nansen-deferred documentation/screenshot is preserved as its historical provider-access checkpoint. Generated secrets/exports/image archives/raw logs stay ignored and uncommitted. Existing Phase 2 screenshots were restored after the test runner generated review captures.

## 14. Human action required

**None for this completed gate.** Review before public cutover. No account access, password, private key or manual SSH editing is requested.

## 15. Next recommended gate

**DOMAIN + HTTPS CUTOVER.** Do not execute until reviewed. Public authentication is not claimed passed on cherry. Perpl remains gated by stable HTTPS Origin; Nansen remains deferred.
