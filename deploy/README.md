# FORK self-host operations

The canonical public origin is `https://forktrades.xyz`, served by the existing Cherry Caddy instance. The application remains bound to `127.0.0.1:13000`; PostgreSQL has no published host port. Only the dedicated FORK Caddy site was added. Nansen remains deferred; Perpl enrollment/trading requires a separate gate. Current public authentication proof is recorded in [the public deployment report](../docs/evidence/phase3/PUBLIC_DEPLOYMENT.md).

## Runtime decision

Use standard Next.js 16.3.8 `next start`, Node 24.21.0 and pnpm 12.6.0. The [official self-host guide](https://nextjs.org/docs/app/guides/self-hosting) supports the application's Node route handlers and normal Next runtime. Standalone tracing would add monorepo packaging work without being necessary for this single instance. The Docker build compiles the existing TS config to equivalent JavaScript, installs production dependencies separately and copies `.next`, public assets, workspace libraries and committed migration files. The production webpack alias replaces test-runtime imports with a fail-closed stub; no fixture files are copied to the runtime. The existing public market-context JSON is available only in the builder for TypeScript checking. Development retains its explicit Turbopack configuration.

## Environment classification

| Variable                                            | Timing / visibility                                 | Purpose                                                                         |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                               | Build-time public                                   | Metadata/canonical app URL; built as `https://forktrades.xyz` |
| `NEXT_PUBLIC_PRIVY_APP_ID`                          | Build-time public                                   | Privy frontend configuration and corresponding server verifier app ID           |
| `NODE_ENV`                                          | Runtime server; image defaults to production        | Enforces production behavior                                                    |
| `PORT`, `FORK_LISTEN_HOST`                          | Runtime server; image defaults 3000 / 0.0.0.0       | Container listen address; host publishing remains loopback-only                 |
| `NEXT_TELEMETRY_DISABLED`                           | Build/runtime tooling, non-secret                   | Disables Next telemetry                                                         |
| `DATABASE_URL`                                      | Runtime server-only secret                          | Dedicated standard PostgreSQL connection                                        |
| `PRIVY_APP_SECRET`                                  | Runtime server-only secret                          | Official identity verification                                                  |
| `FORK_ENVIO_URL`                                    | Runtime server-only configuration                   | Existing real indexed namespace reader                                          |
| `FORK_REGISTRY_ADDRESS`                             | Runtime server configuration                        | Actual Monad Testnet registry                                                   |
| `MONAD_RPC_URL`                                     | Runtime server configuration                        | Standard Monad Testnet RPC; retain current default if absent                    |
| `FORK_PHASE`                                        | Runtime server configuration                        | `live-integration`                                                              |
| `FORK_ADMIN_DIDS`                                   | Optional runtime server-only identity configuration | Absent at this gate; no admin identities transferred into configuration         |
| `NANSEN_API_KEY`, `FORK_NANSEN_DAILY_CREDIT_BUDGET` | Optional/deferred runtime server-only               | Not configured on cherry                                                        |
| `FORK_TEST_MODE`                                    | Development only                                    | Must be absent; production rejects it                                           |
| Perpl enrollment credentials                        | Deferred; not application-server credentials        | No wallet or Ed25519 private keys may be stored on the server                   |

Never supply server secrets as Docker build arguments, bake `.env` into the image, print `docker inspect` environment values, or print rendered Compose configuration. Use `docker compose config --quiet` for validation. Changing public environment values requires a fresh build; setting those values only at container runtime cannot update the browser bundle. See [Next environment semantics](https://nextjs.org/docs/app/guides/self-hosting#environment-variables) and [Docker build-secret guidance](https://docs.docker.com/build/building/secrets/).

## Isolated server layout

Deployment root: `/opt/fork-metropolis` (root-owned, mode 700). Files:

- `compose.yaml`, `ops.sh`: reviewed isolated configuration/operations.
- `image.env`: validated release tag `FORK_IMAGE`; no provider credentials.
- `config/app.env`: necessary runtime variables only, mode 600.
- `config/postgres.password`: generated dedicated database bootstrap password, mode 600; official PostgreSQL `_FILE` secret convention.
- `releases/`: image/version metadata and optional encrypted-transport image archive.
- `exports/`: restricted demo transfer input, mode 600; delete the FORK-specific input after successful verification when no longer needed.
- `backups/`: mode-600 PostgreSQL-native backups; directory mode 700.

Compose project is always `fork-metropolis-prod`. Its app and PostgreSQL use only its dedicated `private` bridge and `postgres_data` volume. No external networks, shared volumes, fixed container names or other project credentials. PostgreSQL 17.11 has no published host port. App publishes only `127.0.0.1:13000:3000`. The app runs UID 1000 with dropped capabilities, no-new-privileges, read-only root filesystem and bounded temporary/cache mounts. The official PostgreSQL entrypoint drops to its postgres user for the database process. CPU/memory and log rotation are bounded.

## Migration and deployment workflow

Run `sh /opt/fork-metropolis/ops.sh deploy`. It validates Compose quietly, waits for PostgreSQL health, runs the **same three committed Drizzle migrations** from the production image, then starts/waits for the app. Migration failure prevents the app startup command. No schema push, database reset or automatic rollback of data. Container readiness is `/api/health/database`: database connectivity and applied migrations only, with no Envio/Monad/Privy/Nansen/Perpl dependency.

For updates, build and smoke a new uniquely named image locally, transport it over SSH with `docker save`/`docker load`, record its ID, back up this database, update only this deployment's `image.env`, then run `deploy`. Never run global Docker prune or another project's Compose commands. Keep the previous image tag available for app rollback. Before migrations that might break the previous app, stop only this project's app and use a reviewed maintenance window.

## Real demo transfer

The [explicit manifest](../docs/evidence/phase3/self-host-transfer-manifest.json) lists every permitted column. `demo-transfer.mjs` scopes chain 10143 / the actual registry / thesis IDs 1 and 2, validates both content hashes, ownership, lineage and exact table/column sets. It exports only:

- 2 users, including necessary pseudonymous Privy DID and preserved user foreign keys; display name/bio are null in this actual source.
- 2 required public wallet/owner mappings.
- 2 finalized metadata rows, including public reasoning, intent, hashes and original timestamps.
- 1 Agree and 1 visible comment owned by User B on root #1.

The local database also has 9 rate-bucket rows; those are deliberately excluded. Drafts, cache, reports, executions, provider/social identities beyond the needed DID, emails, tokens, cookies, API secrets and private keys are excluded. There are no session/token/email columns in the transferred schema. Private row values never go into public evidence.

Produce/validate the manifest first, export to a new mode-600 ignored file, send it only over SSH, migrate the fresh destination, then run the image's `/app/deploy/demo-transfer.mjs import <private-file>`. The importer locks/checks all nine app tables are empty, inserts in dependency order (primary wallets assigned after wallet insertion), and commits only after exact-row verification. It has no overwrite/upsert/reset path. Use `verify` for subsequent read-only comparison. The local fresh-stack round trip is required before cherry import.

## Operations and recovery

From cherry:

```sh
sh /opt/fork-metropolis/ops.sh status
sh /opt/fork-metropolis/ops.sh logs
sh /opt/fork-metropolis/ops.sh restart
sh /opt/fork-metropolis/ops.sh backup
curl --fail http://127.0.0.1:13000/api/health/database
```

`restart` affects only this project's app/PostgreSQL, never the host. The named volume persists. Logs are bounded and application errors avoid raw driver/auth/provider payloads; inspect outputs before sharing them externally.

App rollback: set `FORK_IMAGE` to the retained prior validated tag and run `deploy` only if that image remains schema-compatible. Database rollback is a separate explicit recovery operation, never automatic. Back up the current FORK database first, stop only the FORK app, inspect the backup with `pg_restore --list`, and restore only to a **fresh isolated recovery database/volume** after review. `pg_restore --no-owner --no-privileges --exit-on-error --single-transaction` preserves the dump's application schema/data without importing other server roles. Verify constraints and counts, then point only FORK at the recovered database. Do not use `--clean`, drop an existing database, disable constraints or delete a volume as a shortcut. Full operational backups contain FORK business data and necessary pseudonymous identity mappings; keep them restricted and off public artifacts.

## Public HTTPS / Caddy cutover

Canonical origin: `https://forktrades.xyz`. Cloudflare apex A points to `5.199.166.2`; www CNAME points to the apex. Both remain DNS only. No Cloudflare login, proxy or DNS change was performed. Independent public resolver checks passed; no AAAA record is configured.

Cherry's active `/etc/caddy/Caddyfile` imports `/etc/caddy/conf.d/*.caddy`. The only added file is `/etc/caddy/conf.d/fork-metropolis.caddy`, copied from [the reviewed site definition](caddy/fork-metropolis.caddy). Apex reverse-proxies `127.0.0.1:13000`; www returns permanent 301 to `https://forktrades.xyz{uri}`. Caddy automatic HTTPS obtains and renews certificates; automatic HTTP redirects return 308. Paths/query strings are preserved. [Automatic HTTPS](https://caddyserver.com/docs/automatic-https), [redirect syntax](https://caddyserver.com/docs/caddyfile/directives/redir), [validation/reload commands](https://caddyserver.com/docs/command-line).

Before any reload:

```sh
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Reload only after validation succeeds. Never replace the main Caddyfile, restart unrelated services or format other projects' files. Cutover preserved the Caddy PID, all eight original config hashes, UFW and all 14 unrelated container identities/start times/bindings/networks. All 18 original public hostname responses matched the baseline.

Current release: `fork-metropolis:public-20261011a`; retained pre-cutover release: `fork-metropolis:selfhost-20261011b`. Only the existing build-time `NEXT_PUBLIC_APP_URL` changed. Runtime env/password files were byte-identical before/after. Public-origin changes require a fresh build, not a duplicate runtime variable.

Privy allowed web origins are exactly `http://localhost:3000` and `https://forktrades.xyz`. Google/Email and embedded-wallet settings remain unchanged; www needs no separate login origin because it redirects. The provider application remains in its existing development tier; no plan upgrade was requested. Existing optional Privy HttpOnly-cookie mode remains disabled; this cutover does not change the wallet/session architecture. The FORK application authenticates explicit bearer tokens plus linked primary wallet, not ambient application cookies. Anonymous HTTPS responses set no application auth cookie; untrusted-origin preflights receive no CORS permission. Do not add wildcard CORS. Any future cookie-authentication change requires explicit CSRF and cookie review. [Official Privy allowed-domain documentation](https://docs.privy.io/recipes/dashboard/allowed-domains).

For a public-routing rollback, remove **only** the FORK site file, validate the full remaining Caddy configuration, then gracefully reload. Do not remove other sites or Caddy certificate data. For app rollback, restore the retained pre-public `image.env` from `/opt/fork-metropolis/releases/pre-public-image.env` and run only this project's `deploy` after schema compatibility review. No migration changed during this cutover; the same three committed migrations were applied idempotently. Keep database rollback separate and restricted as documented above.

Public TLS/read smoke does not substitute for real Google login, unchanged DID/embedded wallet/primary wallet, production database association and logout/login persistence. See the current evidence report for completed versus pending proofs. No new thesis, fork, transaction, Perpl or Nansen activity is authorized by this runbook.
