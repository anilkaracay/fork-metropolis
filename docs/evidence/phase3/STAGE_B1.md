# Stage B1 — Precision Social landing and shared foundation

Observed 2026-10-11. Approved direction: A — Precision Social / Product First, with limited editorial composition from B. Scope follows D-052.

## 1. Stage B1 status

**READY.** The approved landing is live at [forktrades.xyz](https://forktrades.xyz). Local production build, exact production image, public browser tests and inspected desktop/mobile screenshots passed. B2 is not started.

## 2. Design system

Canvas `#0B0D10`, surface `#12161B`, text `#F2F4F2`, accent `#B1D6AC`; supporting surface `#191F25`, muted text `#A5ADA7`, border `#303731`. Geist Sans and Geist Mono are self-hosted official variable WOFF2 files, with recorded provenance and distributed OFL license. No font CDN or new dependency.

Shared wordmark, button geometry, numeric type and focus treatment are reusable. Landing controls use 44px touch targets, 6px button radii, restrained 10px node radii and a 2px focus ring with 3px offset. CSS respects reduced motion. Existing app page layouts were preserved; the foundation updates colors/type/buttons without redesigning Feed or Profile.

## 3. Landing

The five completed sections are: “Trading ideas evolve here.”; “Post. Fork. Improve.”; “Every idea has a lineage.”; “Built on Monad.”; “Good ideas deserve a history.”

Explore/Enter FORK open `/feed`; How it works and Idea lineage navigate to page sections. Original/fork, authors, composer and Idea Tree links open existing product paths. Mobile navigation closes on selection, Escape and outside interaction, with focus returning to its trigger. The private GitHub repository is intentionally not linked.

## 4. Idea Lineage hero

A bespoke React/CSS/SVG two-node composition connects real Thesis #1 to Fork #2. Default selection is the fork; keyboard or pointer selection reveals the corresponding real reasoning and detail link. Authorship stays independently clickable.

The server reads only IDs 1 and 2 through the existing Envio-backed graph and hash-validated PostgreSQL metadata. It checks trusted content, namespace, parent/root, ETH long and the actual values: target $4,200 → $4,400; leverage 2× → 3×; invalidation $3,600 unchanged. Only a bounded public projection reaches the client. Private identity/database fields are excluded. A failed or mismatched read gives an honest unavailable state with recovery, never invented nodes or activity. Test-mode data is explicitly excluded from marketing.

## 5. Routing

`/` is the server-rendered marketing landing. Product providers and shell are scoped to `(social)`; `/feed` remains product entry. A signed-in user can view public marketing content without an auth redirect.

Preserved: `/feed`, `/explore`, `/new`, `/t/[id]`, `/t/[id]/fork`, `/t/[id]/tree`, `/u/[handle]`, `/u/me`, moderation and all existing API paths. Product page moves were unchanged-file route-group moves. Production `/dev/privy` and test APIs still return 404.

## 6. Responsive QA

| Width | Composition and review                                                                                       | Result |
| ----- | ------------------------------------------------------------------------------------------------------------ | ------ |
| 1440  | Two-column hero, intentional two-line headline, staggered connected nodes; full-page section rhythm reviewed | Passed |
| 1280  | Two-column hero with tightened scale; headline, node labels and CTAs reviewed                                | Passed |
| 1024  | Narrow desktop composition; CTA and parameter wrapping reviewed                                              | Passed |
| 768   | Deliberate stacked composition; readable full-width lineage and section order                                | Passed |
| 390   | Stacked mobile hero, vertical lineage, mobile menu and comparison; full page inspected                       | Passed |
| 375   | Smallest requested viewport; headline, CTA targets, footer and node bounds reviewed                          | Passed |

Local screenshots cover all six sizes. Public Playwright repeats all six overflow/navigation checks; public manual screenshots cover 1440, 1280 and 390. No horizontal overflow. Keyboard node selection, visible focus, menu dismissal and reduced motion passed. Visual review caught inherited global main padding; marketing now overrides it within its own scope. No clipping or misaligned connector remained in the final public captures.

## 7. Performance

Actual 1280px fresh desktop Chrome observations:

| Origin           | TTFB    | FCP     | LCP     | Observed CLS | JS transferred |
| ---------------- | ------- | ------- | ------- | ------------ | -------------- |
| Local production | 135ms   | 184ms   | 184ms   | 0            | 152,802 bytes  |
| Public HTTPS     | 1,047ms | 1,920ms | 1,920ms | 0            | 152,801 bytes  |

Each observed two local font resources and zero external resource hosts on the marketing page. These are single unthrottled lab samples, not Lighthouse scores or field Core Web Vitals. Public TTFB includes request-time live lineage reads. The page is server-rendered; only navigation and node selection hydrate. No illustrative raster image or animation library is downloaded. The server-rendered landing also passed with JavaScript disabled.

## 8. Product regression

All required commands passed: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm abi:check`, `pnpm build`.

| Check                                | Result                                             |
| ------------------------------------ | -------------------------------------------------- |
| Web/shared/database unit suites      | 225 passed                                         |
| Indexer tests                        | 12 passed                                          |
| Foundry tests                        | 28 passed                                          |
| Isolated social Playwright           | 5 passed                                           |
| Local production Playwright          | 14 passed, 1 inapplicable empty-index case skipped |
| Exact amd64 release image Playwright | 14 passed, same skip                               |
| Public HTTPS Playwright              | 14 passed, same skip                               |

Focused landing tests live in `apps/web/production-smoke/landing.spec.ts`; existing product coverage remains in `production.spec.ts`. The public read-only run used:

```sh
FORK_SMOKE_ORIGIN=https://forktrades.xyz FORK_SMOKE_LIVE=1 FORK_SMOKE_THESIS_ID=2 pnpm --filter @fork/web exec playwright test --config=playwright.production.config.ts
```

Social tests ran in isolated test mode on separate ports, not against production or another local project.

Live read smoke verified real Feed rankings, trusted Thesis #1/#2, their two-node Idea Tree, both profiles and preserved Agree/comment state. PostgreSQL health reports applied migrations; independent Monad RPC returned chain 10143 and deployed registry bytecode. Envio provenance remains live. No live thesis, fork, execution or blockchain transaction was created.

The existing production Google-authenticated User A session restored under B1. The profile exposed its owner-only Edit profile action and the same embedded wallet recorded in the previous approved gate. Public screenshots retain only public profile information. B1 did not repeat a fresh Google OAuth challenge or logout/login cycle; the earlier production auth proof remains in [PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md).

A pre-existing query-cache bug surfaced in isolated social regression: clearing the whole cache orphaned active detail observers after identity changes. Both existing session implementations now clear mutation state and reset queries, preserving active observers while removing stale user data. All five social tests passed after that narrow fix. Auth architecture, contracts and reputation formulas are unchanged.

## 9. Security

The image scan covered 98,027 files / 22 layers, including 207 browser assets. Actual production credentials and private identity values were separately checked against all 207 deployed browser assets and were absent. Image config/history, excluded private/test material and server-only browser configuration checks passed. The final versionable-file scan is recorded in [validation.json](../../assets/stage-b1/validation.json); local env/private transfer/deploy configuration remain ignored.

Production test/dev APIs and `/.env`, `/.env.local` return 404; unauthenticated publication returns 401. The app publishes only `127.0.0.1:13000`; PostgreSQL publishes no host port. Known FORK public TCP probes for 13000 and 5432 could not connect. Valid HTTPS remains active; HTTP → HTTPS is 308 and www → apex is 301. Anonymous landing responses set no app auth cookie. Existing bearer-token/primary-wallet verification and production-origin behavior were preserved.

## 10. Deployment

Implementation commit: **`8ea3506`**. Approved Stage A/deferred-gate documentation was recorded separately in `e64a08b`. Release image: **`fork-metropolis:b1-20261011a`**, amd64, Node 24.21.0, UID 1000.

Image ID: `sha256:849ae4a1416cccd8c461a388b23c610bde10c16c76b361cbb046bf34a4bb94ea`.

Only existing FORK project `fork-metropolis-prod` in `/opt/fork-metropolis` was deployed, after both local production and exact-image browser QA. A restricted FORK-only native PostgreSQL backup was taken first. The same three committed Drizzle migrations applied idempotently. The PostgreSQL container/start identity stayed unchanged, with nine public tables and two real metadata rows. Runtime env/password files stayed byte-identical.

Prior image **`fork-metropolis:public-20261011a`** is retained. Its image configuration is `/opt/fork-metropolis/releases/pre-b1-image.env`. B1 made no schema changes; app rollback is:

```sh
cp /opt/fork-metropolis/releases/pre-b1-image.env /opt/fork-metropolis/image.env
sh /opt/fork-metropolis/ops.sh deploy
```

No Caddy change/reload was necessary. All nine Caddy config hashes, active Caddy PID, UFW rules and 14 unrelated container identities/start times/bindings/networks matched the before-release baseline. All 20 HTTPS host responses matched, including the 18 unrelated original sites. No Cloudflare change, global prune, unrelated Compose operation or server restart occurred.

## 11. Screenshots

Full-resolution public evidence, captured in real Chrome and actually opened/reviewed:

1. [Hero 1440](../../assets/stage-b1/public-hero-1440.jpg)
2. [Full page 1440](../../assets/stage-b1/public-full-1440.jpg)
3. [Hero 1280](../../assets/stage-b1/public-hero-1280.jpg)
4. [Full page 390](../../assets/stage-b1/public-full-390.jpg)
5. [Mobile navigation](../../assets/stage-b1/public-mobile-navigation.jpg)
6. [Original node selected](../../assets/stage-b1/public-lineage-original-selected.jpg)
7. [Landing → real Feed](../../assets/stage-b1/public-feed-transition.jpg)
8. [Restored authenticated profile](../../assets/stage-b1/public-profile-session.jpg)

Additional local hero/full-page screenshots for 1440/1280/1024/768/390/375, mobile navigation and comparison are in `docs/assets/stage-b1/`. See [validation.json](../../assets/stage-b1/validation.json) for actual image dimensions. Browser control disconnected after screenshots and authenticated-profile verification; final open-tab handoff and viewport reset could not be confirmed. Completed public tests and saved visual evidence are unaffected.

## 12. Files changed

31 implementation files in `8ea3506`: marketing page/CSS; marketing navigation/lineage; bounded server projection; root/social layouts and unchanged product route moves; shared tokens/wordmark/buttons/icons; two session cache resets; self-hosted font files/license/provenance; landing unit/production tests; D-052 decision. No dependencies, lockfile, contracts, reputation formula or database migration changed.

This evidence adds `STAGE_B1.md`, public/local screenshots and sanitized `validation.json`, plus the small B1 release/rollback note in `deploy/README.md`. The root README is unchanged.

## 13. Known limitations

Perpl and Nansen remain explicitly deferred; no Verified execution claim. The repository remains private, so no public GitHub CTA. Performance samples are unthrottled single runs; no Lighthouse or field score is claimed. Real Google session persistence was verified, but fresh OAuth was not repeated in B1. Existing optional Privy bundle warnings remain non-fatal; no dependency upgrade was introduced to remove them.

## 14. Next recommended step

After B1 review, authorize **Stage B2: Idea Tree + Fork Diff + Thesis Detail**. B2, composer/Feed/Profile redesign, README rewrite, Perpl and Nansen have not been started.
