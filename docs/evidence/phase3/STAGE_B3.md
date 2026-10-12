# Stage B3 — Final social product polish

Completed and publicly verified on 2026-10-12. Production: <https://forktrades.xyz>. Implementation commit: `de353b7`.

## 1. B3 status

Feed, Explore, root Create and contributor profiles now extend the approved B1/B2 Precision Social / Product First direction. B3 is complete within the requested timebox. B4 has not started. No new production thesis, fork, wallet signature or blockchain transaction was submitted.

## 2. Feed improvements

Dense nested cards became a disciplined list with shared borders and stronger numeric hierarchy. Original/fork identity includes the thesis number; forks link to the actual parent number and author. Target, invalidation and leverage precede the reasoning preview. A compact trusted parent comparison shows target and leverage changes using before/after values, rather than adding another badge collection. Fork is visually primary; comment navigation and existing engagement counts remain public and attributable.

Fresh, Most Forked and Smart Signal still use the existing server ranking. Explanatory copy identifies newest-first or the existing 24h → 7d → newest ordering; Smart Signal makes no execution-ranking claim. Price grouping preserves canonical fixed-point precision. Unsupported market labels retain their actual onchain market ID; a failed label read now offers explicit recovery.

## 3. Explore improvements

Search and compact market buttons replace oversized market/topic cards. Counts describe only the existing bounded discovery window; empty markets remain honestly empty. Search matches market, author, reasoning, tags and thesis number. Original/fork filtering and explicitly labeled newest/external-forker sorting operate on the existing returned dataset, without changing Feed ranking or creating a new reputation score. Clear filters and Show all ideas recover from an empty selection. Real content appears earlier, especially after tightening mobile spacing. No users or activity were seeded in production.

## 4. Create improvements

The root composer separates the setup from the argument: market/perspective and target/invalidation/leverage, then reasoning and optional entry note/tags. Visible labels, mono numeric inputs and field explanations clarify the opportunity and its risk boundary. Feedback after a field is visited reuses the existing shared field schemas and fixed-point parser; publication validation remains authoritative and unchanged.

The primary publish action and live status retain Draft → Awaiting wallet → Submitted → Confirming → Confirmed / indexing → Published. Existing transaction recovery still checks the same submitted transaction. Copy explains that publication records authorship and does not execute a trade. Isolated tests cover normal publication and refresh recovery; public QA does not press Publish.

## 5. Profile improvements

The decorative cover was removed. Identity, subtle truncated wallet, real reputation and authored ideas now lead the page. Copy wallet has success feedback and a selectable-address fallback if clipboard access fails. Originality, Contribution, Influence and Executions Inspired retain their exact formulas, raw counts and Emerging states. Authored originals/forks remain filterable. Missing external Nansen context never becomes zero PnL. Public User A retains one successful root and influence one; User B retains one fork and no execution credit.

## 6. Global design polish

Scoped `polish.css` extends the existing tokens and Geist fonts; no second palette or dependency was added. Card hierarchy, numeric alignment, focusable controls, button geometry, restrained separators, loading geometry and recovery controls now align with B2. Mobile navigation text is more readable; focus scrolling reserves space for its fixed bar. Existing reduced-motion behavior is preserved. No contract, schema, Privy model, Envio deployment, reputation formula or executionRef change was made.

## 7. Mobile QA

Browser tests cover 1440, 1280, 1024, 768, 390 and 375 pixels for all five views, plus B1/B2 signature regressions. Cards remain readable, discovery controls wrap, the root composer stacks its risk fields, and profile metrics form a two-column grid on narrow screens. Inputs use 16-pixel mobile text; primary actions and appropriate controls have 44-pixel targets. Tests check document overflow and explicitly scroll to the final card/composer action, verifying its bounds sit above the fixed navigation. Long content, keyboard focus and publication recovery retain existing isolated social coverage.

Full-page mobile images capture the fixed navigation at the viewport boundary inside the taller image. This capture behavior is distinct from interactive clipping; scrolled action/navigation bounds were tested directly.

## 8. Data reliability

Successful Feed/Explore/Profile reads remain visible when a background refresh fails, with an explicit last-loaded-data warning and retry. Initial failures retain the genuine error presentation, not a fixture fallback. These queries use a 30-second freshness window and existing mutation invalidation; completed reads are not needlessly refetched during a short navigation round trip. See the official [query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) and [background-fetching indicators](https://tanstack.com/query/latest/docs/framework/react/guides/background-fetching-indicators).

An independent budget mismatch was identified: the former 10-second client GET timeout was shorter than the server's two 8-second upstream attempts plus backoff. GET now allows 25 seconds; mutation/wallet request budgets remain 10 seconds. This is **not** a proven explanation for the historical B2 provider failure. Seven bounded public reads succeeded in the preflight observation, around 999–1,587 ms. Local image QA nevertheless observed a 503 read and temporarily missing Tree/Composer content. The exact provider cause was not established. All four affected scenarios passed targeted recovery; final public QA passed all 30 applicable cases in one run. No infrastructure error was suppressed or provider configuration changed.

## 9. Visual screenshots

These ten full-resolution public captures were opened and visually inspected, alongside their final local-image equivalents:

| View | Desktop | Mobile |
| --- | --- | --- |
| Feed | [1440](../../assets/stage-b3/public/feed-1440.jpg) | [390](../../assets/stage-b3/public/feed-390.jpg) |
| Explore | [1440](../../assets/stage-b3/public/explore-1440.jpg) | [390](../../assets/stage-b3/public/explore-390.jpg) |
| Create | [1440](../../assets/stage-b3/public/create-1440.jpg) | [390](../../assets/stage-b3/public/create-390.jpg) |
| Profile A | [1440](../../assets/stage-b3/public/profile-a-1440.jpg) | [390](../../assets/stage-b3/public/profile-a-390.jpg) |
| Profile B | [1440](../../assets/stage-b3/public/profile-b-1440.jpg) | [390](../../assets/stage-b3/public/profile-b-390.jpg) |

The actual public journey was also captured and inspected: [Landing](../../assets/stage-b3/public/journey-landing.jpg) → [Feed](../../assets/stage-b3/public/journey-feed.jpg) → [Root #1](../../assets/stage-b3/public/journey-root.jpg) → [Fork #2](../../assets/stage-b3/public/journey-fork.jpg) → [Idea Tree](../../assets/stage-b3/public/journey-tree.jpg) → [Profile B](../../assets/stage-b3/public/journey-profile.jpg).

All six widths are available under [public captures](../../assets/stage-b3/public/) and [local exact-image captures](../../assets/stage-b3/local/): 72 unaltered JPEGs. Review corrected mobile spacing, singular/plural copy, market-label readiness and route-transition capture synchronization. No bitmap editing was used. Historical Phase 2 images overwritten by their existing isolated tests were restored rather than replacing historical evidence. The [sanitized validation record](../../assets/stage-b3/validation.json) contains the results.

## 10. Test results

| Check | Result |
| --- | --- |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | Passed |
| `pnpm test` | 234 unit + 12 indexer + 28 Foundry passed |
| `pnpm abi:check` | Passed |
| `pnpm build` | Passed |
| Existing isolated social/B2 | 8 cases passed |
| Final isolated B3 | 4/4 passed, including pending/error/cached recovery, filters, form feedback, wallet copy and missing market-label recovery |
| Exact final image | 26 passed / 4 failed / 1 inapplicable empty-index case skipped initially; four targeted cases subsequently passed |
| Final local journey recapture | Passed with actual route identity and market readiness |
| Public production browser | **30 passed / 1 inapplicable empty-index case skipped**, one complete run |
| Live production product/security smoke | Passed |

The exact image's 30 unique cases were validated across the initial run and recovery, not a single clean first pass. Initial isolated test issues involved a consumed mock response and Next's separate route announcer; corrected tests passed. Existing optional Privy/Solana build warnings and the sandboxed Foundry signature-cache warning were non-fatal; pinned dependencies were not upgraded.

## 11. Production deployment

Release: `fork-metropolis:b3-20261012c`, implementation `de353b7`, verified image ID `sha256:ac8d2dbf7dc76ecb39869ecc1d2fe5fe56ca28a97f2e76f5c96f5c44c27a6140`. Only FORK's app image was replaced after local validation and visual review. A restricted FORK-only native PostgreSQL backup preceded deployment; the same three committed Drizzle migrations applied idempotently. Health is passing; no schema push or data reset was used.

B2 remains retained as `fork-metropolis:b2-20261011a`, with `/opt/fork-metropolis/releases/pre-b3-image.env` for schema-compatible app rollback. See [operations](../../../deploy/README.md). No rollback was necessary.

Live checks retain two trusted metadata rows, lineage #1 → #2, one Agree and one visible comment on root #1, both profile reputations and zero execution credit. Monad chain 10143 and registry code remain readable. Public dev/test/env routes return 404 and unauthenticated publication returns 401. App remains `127.0.0.1:13000`; PostgreSQL publishes no host port and its identity matches the retained pre-B2 baseline. Public 13000/5432 are closed. TLS validates; HTTP is 308 and www is 301 to the apex. Anonymous landing sets no app auth cookie.

All 14 unrelated containers, nine Caddy files, Caddy PID, firewall policy and runtime credential bytes were unchanged. Twenty HTTPS hostname responses matched the baseline. The exact image's 22 layers / 98,030 files and 209 browser files passed configured-secret scans. Actual production credentials, private identities and server-only config are absent from browser assets. Fixture implementation is excluded; the expected production fail-closed test stub remains. B3 does not claim a fresh Google/DID/wallet-signature proof; the approved auth model is unchanged.

## 12. GitHub sync

Implementation and evidence were synchronized to `main` in the existing private `anilkaracay/fork-metropolis` repository through a normal non-force push. Before that push: two ahead, zero behind. Afterward: zero ahead / zero behind, clean working tree and PRIVATE visibility independently verified against the remote head. Source, staged evidence and all 63 unpushed blobs passed credential/private-identity checks; Gitleaks reported no new findings. No ignored environment files, private exports or credentials were staged. This final documentation update is synchronized through the same checked workflow; there is no repository blocker. Root README rewriting remains B4 work.

## 13. Known limitations

Intermittent upstream read availability remains possible; the historical cause was not proven. Recovery is visible and bounded, and final public checks passed. Explore search/sort covers the existing latest-500 window, not a global/full-history search. Profiles retain the intentionally small Emerging sample. Execution remains unavailable under the approved Perpl deferral; Nansen remains deferred. There is no new production data, synthetic activity, PnL or verified execution claim.

## 14. Remaining submission blockers

There is no remaining B3 deployment blocker. Submission preparation still requires a judge-ready root README, reviewed public GitHub release, final demo/pitch URLs and portal submission confirmation. The existing `docs/24_DEMO_SUBMISSION.md` is a plan, not recorded submission proof, and its execution-demo narrative must be reconciled with the approved Perpl deferral before recording. Do not present the unimplemented execution sequence as completed.

Recommend **B4 — judge-ready README + public GitHub preparation + demo/pitch/submission pack**. Wait for review; B4 has not been executed.
