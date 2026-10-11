# Stage B2 — Signature product experience

Reviewed and deployed on 2026-10-11. Canonical production: <https://forktrades.xyz>.

## 1. Stage B2 status

Complete: Thesis Detail, Idea Tree, Fork Diff and live Fork Composer comparison are deployed. B3 has not started. Perpl execution and Nansen remain deferred. This gate created no public thesis, fork or blockchain transaction.

## 2. Visual improvements

The approved B1 canvas, surfaces, accent and Geist typography remain the single design foundation. Detail now uses an information column and a narrower lineage/comparison rail instead of giving every section equal weight. Parameters use aligned numeric typography and grouped thousands. Parent links, explicit root/fork identity and authorship appear early. The tree uses connected, deliberately sized nodes with a clear selected border. Changed values use before/after arrows, struck-through previous values and textual labels; understanding does not depend on color.

## 3. Idea Tree

The existing graph API and engine remain intact; no graph library or dependency was added. Nested semantic lists preserve hierarchy and sibling order. Each node identifies the thesis, author, market/direction, target, leverage, parent and depth. Selection is represented by a native URL link and `aria-current`, so navigation, reload and direct linking retain the selected perspective. The desktop contextual panel links to the immediate parent and full thesis.

Isolated tests cover an 11-node graph with eight siblings, multiple authors and a second-generation fork. That fork compares target 4,400 → 4,600 with its immediate parent, rather than comparing with the original 4,200. Existing social coverage also exercises 22 nodes, depth four and long content. These are explicitly isolated test entities, never production fallbacks. Large results retain the existing 250-node limit and disclose incomplete indexing.

## 4. Fork Diff

Real fork #2 displays target 4,200 → 4,400, leverage 2× → 3× and modified reasoning; invalidation 3,600 and LONG remain unchanged. Detail reuses the existing server-computed canonical changes when both metadata hashes and the parent relationship have been validated. Tree comparison validates its supplied immediate parent; unavailable canonical changes use the guarded parent-read recovery path.

Composer derives comparison from current form values through existing shared schemas, fixed-point parsing and `forkDifference`. Reverting a value removes its changed state. Invalid/incomplete values show pending comparison instead of falsely declaring a field unchanged. Valid field changes remain visible even while another field is invalid. Notes/tags alone still do not satisfy the existing meaningful-change requirement. Publication, authentication and contract semantics are unchanged.

## 5. Thesis Detail

The reading order is root/fork identity, market/direction, author, parent attribution, target/invalidation/leverage, reasoning and entry note, social actions, execution status and public provenance. An early lineage link and contextual rail expose parent/child relationships before the conversation. Fork is the primary social action. Execute is honestly unavailable; no PnL or verified execution result was invented. Existing Agree, comment, reporting and profile attribution remain intact.

## 6. Mobile

Inspected and browser-tested at 1440, 1280, 1024, 768, 390 and 375 pixels. Narrow layouts stack the content and comparison rather than shrinking a desktop graph. Tree indentation is capped for readability while explicit parent/depth labels preserve deeper relationships. A selected-node comparison shortcut and return link connect the hierarchy and contextual panel. Composer presents fields, live comparison and then its publish action. Essential controls have 44-pixel targets; all four signature screens passed horizontal-overflow checks at every requested width.

Full-page screenshots retain fixed navigation at the capture viewport boundary. The additional native 390-pixel viewport capture demonstrates the actual scrolled mobile comparison and usable navigation, rather than treating that full-page capture artifact as the interactive viewport.

## 7. Accessibility

Native links, buttons, labeled form fields, nested lists and disclosure controls retain their semantics. Tree navigation supports Up/Down, Home/End and Enter, with visible keyboard focus and a clear selected state. Changed/unchanged text and before/after structure work without color. Existing reduced-motion rules remain respected; no continuous decorative animation or animation dependency was introduced. Focus and larger-graph keyboard behavior are covered by isolated browser tests.

## 8. Data integrity

Public evidence uses the existing Monad Testnet registry `0x1889a7216b1ecad9a44910dd0996834d0894b9e1`, real Envio lineage #1 → #2 and hash-checked PostgreSQL metadata. All three Feed modes expose the same two real theses. Root #1 retains one Agree and one visible comment; both profiles and reputation values are unchanged. Execution count remains zero. Monad chain 10143 and deployed registry code were checked through read-only calls.

The existing authenticated User A browser session restored successfully on the new production tree. This is session continuity evidence, not a new OAuth, wallet-signature or fresh two-user login proof. B2 did not change the Privy model, ownership verification, execution protocol, reputation formulas, Envio deployment, contracts or database schema.

## 9. Quality gate

| Check | Result |
| --- | --- |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | Passed |
| `pnpm test` | 231 unit, 12 indexer and 28 Foundry tests passed |
| `pnpm abi:check` | Passed |
| `pnpm build` | Passed |
| Isolated social + B2 Playwright | 8/8 passed |
| Exact production image: signature browser tests | 8/8 passed |
| Exact image: baseline browser tests | 12 passed initially; remaining two passed in targeted recovery; one inapplicable empty-feed test skipped |
| Public full browser suite | 21 passed, one transient data-source failure, one inapplicable empty-feed test skipped |
| Public targeted recovery | Failed 1280-pixel case passed, validating all four screens with real content |
| Public visual recapture | 1440-pixel case passed; final captures inspected |

Thus 22 unique public checks were validated across the full suite and targeted recovery, not a single all-green first run. Intermittent upstream read availability occurred in local/image/public QA. Existing recovery controls worked; the underlying provider cause was not established or changed in this bounded visual gate. Existing optional Privy/Solana build warnings were non-fatal; dependencies were not upgraded.

## 10. Production deployment

Implementation commit: `f9754b8`. Image: `fork-metropolis:b2-20261011a`, verified ID `sha256:5fc9cc7b586b95863ad1f7012d0290405b9e5418c7727bd19ae6c92cac60b307`. Only the FORK application was replaced. A restricted FORK-only PostgreSQL-native backup preceded deployment; the same three committed migrations applied idempotently. App and database are healthy.

Public URL: <https://forktrades.xyz>. Signature entry points: [root #1](https://forktrades.xyz/t/1), [fork #2](https://forktrades.xyz/t/2), [selected fork tree](https://forktrades.xyz/t/2/tree), [fork composer](https://forktrades.xyz/t/1/fork).

The retained B1 image is `fork-metropolis:b1-20261011a`; its saved image configuration is `/opt/fork-metropolis/releases/pre-b2-image.env`. Schema-compatible application rollback restores only that configuration and runs the scoped deployment command documented in [the operations runbook](../../../deploy/README.md). Database recovery remains a separate reviewed operation. No rollback was necessary.

## 11. GitHub sync

The source snapshot was 27 commits ahead and zero behind the freshly fetched private `anilkaracay/fork-metropolis` remote. Including evidence commit `c1ea5be`, the normal non-force push synchronized 28 commits; local/remote were verified at zero ahead / zero behind and repository visibility remained PRIVATE. All 387 unpushed blobs passed configured-credential/private-identity checking, and the reviewed history scan had no additional secret findings. Three pre-existing generic scanner findings were individually reviewed as a document SHA-256 and two public correlation UUIDs; only their exact fingerprints were allowlisted locally. No shared history rewrite, visibility change or broad secret-scanner exemption was used. There is no synchronization blocker. The root README remains untouched.

## 12. Screenshots

These eight final full-resolution public captures were actually opened and visually inspected:

| Required view | Capture |
| --- | --- |
| Root detail desktop | [root-1440.jpg](../../assets/stage-b2/public/root-1440.jpg) |
| Fork detail desktop | [fork-1440.jpg](../../assets/stage-b2/public/fork-1440.jpg) |
| Idea Tree desktop | [tree-1440.jpg](../../assets/stage-b2/public/tree-1440.jpg) |
| Selected fork with diff | [selected-fork-diff-1440.jpg](../../assets/stage-b2/public/selected-fork-diff-1440.jpg) |
| Composer live diff | [composer-live-1440.jpg](../../assets/stage-b2/public/composer-live-1440.jpg) |
| Root detail mobile | [root-390.jpg](../../assets/stage-b2/public/root-390.jpg) |
| Idea Tree mobile | [tree-390.jpg](../../assets/stage-b2/public/tree-390.jpg) |
| Composer live diff mobile | [composer-live-390.jpg](../../assets/stage-b2/public/composer-live-390.jpg) |

Additional [public](../../assets/stage-b2/public/) and [exact-image local](../../assets/stage-b2/local/) captures cover all six widths. [Isolated larger-graph captures](../../assets/stage-b2/isolated/) are clearly test evidence. Native authenticated-browser proofs: [desktop tree](../../assets/stage-b2/public/signed-in-tree.png) and [390-pixel comparison](../../assets/stage-b2/public/signed-in-mobile-comparison.png). Total: 58 unaltered captures. Composer drafts shown here were not submitted. The [sanitized validation record](../../assets/stage-b2/validation.json) accompanies the images.

## 13. Security

Production remains loopback-only at `127.0.0.1:13000`; PostgreSQL publishes no host port. Public 13000/5432 checks were closed. Environment and dev/test routes return 404; unauthenticated publication returns 401. HTTP redirects with 308, www redirects with 301 and TLS validates. Anonymous landing responses set no application authentication cookie; B2 introduced no cookie/origin change.

The exact image's 22 layers / 98,029 files and 208 browser files were scanned. Configured credentials and private identity values are absent from browser assets; runtime secrets are absent from image configuration and history. The production fail-closed test stub remains present as intended, while fixture implementation is excluded. Versionable artifacts and unpushed history were checked against configured credentials and private identities without printing those values. Local environment files, private exports and deployment credentials remain ignored. Screenshots contain no emails, tokens, DID values or secret payloads.

Existing-server safety: 14 unrelated containers retained identities, start times, bindings and networks; nine Caddy files, the Caddy PID, firewall policy and runtime credential files were unchanged. All 20 checked HTTPS hostname responses matched the baseline, including 18 unrelated sites. PostgreSQL's container was unchanged.

## 14. Regressions

Visual review led to grouped numeric formatting, removal of duplicated selected-fork reasoning and clearer comparison placement before the mobile publish action. Detail comparison now uses already trusted canonical changes, avoiding a redundant parent read. Test synchronization was corrected to wait for actual signature content and fonts, with bounded use of existing recovery controls. A full-page text rasterization artifact disappeared after recapture; no image editing was used.

No persistent B2 product regression remained in the completed checks. Transient upstream data unavailability remains a real limitation, recorded above rather than represented as a clean first-pass run. No production fixture fallback, additional execution claim or public mutation was used to make tests pass.

## 15. Next step

Recommend B3: Feed + Explore + Create + Profile polish. Wait for review before starting it. No human action is required to use this deployed B2 release.
