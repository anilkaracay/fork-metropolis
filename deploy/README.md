# FORK private self-host operations

This gate runs only at `127.0.0.1:13000` on cherry. The existing Caddy, firewall and other projects remain unchanged. Nansen is deferred; Perpl enrollment/trading and public authentication require later review.

## Runtime decision

Use standard Next.js 16.3.8 `next start`, Node 24.21.0 and pnpm 12.6.0. The [official self-host guide](https://nextjs.org/docs/app/guides/self-hosting) supports the application's Node route handlers and normal Next runtime. Standalone tracing would add monorepo packaging work without being necessary for this single instance. The Docker build compiles the existing TS config to equivalent JavaScript, installs production dependencies separately and copies `.next`, public assets, workspace libraries and committed migration files. The production webpack alias replaces test-runtime imports with a fail-closed stub; no fixture files are copied to the runtime. The existing public market-context JSON is available only in the builder for TypeScript checking. Development retains its explicit Turbopack configuration.

## Environment classification

| Variable                                            | Timing / visibility                                 | Purpose                                                                         |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                               | Build-time public                                   | Metadata/canonical app URL; currently localhost, rebuild for final HTTPS domain |
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

## Later domain / Caddy cutover — not executed

Cherry's active Caddyfile is `/etc/caddy/Caddyfile`, importing `/etc/caddy/conf.d/*.caddy`. Preserve all existing imports/sites.

After the user provides and approves `fork.<domain>`:

1. Add DNS A to `5.199.166.2`; add AAAA only after verifying the server's IPv6 route. Verify resolution.
2. Rebuild the validated image with `NEXT_PUBLIC_APP_URL=https://fork.<domain>` and the same public Privy app ID, then update only FORK.
3. Add that exact HTTPS origin in Privy via its official authenticated tooling and verify required auth settings.
4. Prepare a **new** `/etc/caddy/conf.d/fork-metropolis.caddy` site file:

   ```caddyfile
   fork.<domain> {
       reverse_proxy 127.0.0.1:13000
   }
   ```

5. Validate the full existing Caddy config before reloading the existing service. Keep `13000` loopback-only. Caddy supplies automatic HTTPS and forwarded host/protocol headers. Verify certificate, redirects, static assets, API routes and the intended hostname through HTTPS.
6. Run fresh real browser login/wallet and public read smoke. Auth uses bearer tokens rather than an application auth cookie; verify Privy's secure session storage and cookie behavior on HTTPS. The app has no production cookie session requiring a new cookie flag. Test routes remain 404; JSON authenticated mutations require the real bearer/wallet, and external-site CORS must not be broadened. Review Origin handling before any future cookie-based mutation support.
7. Request Perpl approval for the final stable HTTPS Origin only in its separate gate. No tunnel or raw private endpoint substitutes for it.

No DNS, Caddy site, certificate, Privy production origin or Perpl action is part of the current private deployment.
