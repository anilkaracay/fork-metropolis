# Design quality checks

Recorded on 2026-10-12 for the redesigned landing page and app (D-059). Everything here was run locally by the author; method and limits are stated with each result.

## Lighthouse

Lighthouse 12.8.2, default mobile emulation with simulated throttling, performance and accessibility categories, against a local production build (`pnpm --filter @fork/web build`, then `node scripts/production-server.mjs`) reading the real indexer. Three consecutive runs per page.

| Page | Run | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Landing `/` | 1 | 94 | 100 | 0.91 s | 3.10 s | 26 ms | 0 |
| Landing `/` | 2 | 97 | 100 | 0.91 s | 2.56 s | 11 ms | 0 |
| Landing `/` | 3 | 99 | 100 | 0.91 s | 2.26 s | 11 ms | 0 |
| Feed `/feed` | 1 | 94 | 100 | 0.91 s | 2.56 s | 189 ms | 0 |
| Feed `/feed` | 2 | 86 | 100 | 0.91 s | 3.62 s | 224 ms | 0 |
| Feed `/feed` | 3 | 97 | 100 | 0.93 s | 1.98 s | 177 ms | 0 |

Median performance is 97 for the landing page and 94 for the feed; accessibility is 100 on every run. One feed run scored 86. The machine was running unrelated heavy workloads during these runs, which lowers and scatters lab scores, so treat single runs as noisy. These are lab figures from one machine, not field data.

Before pages stopped waiting for the sign-in SDK, the same setup measured the feed at performance 74 with a largest contentful paint of 6.6 s.

## Widths

Eight routes were captured in the isolated test workspace with a seeded three-level lineage and backings, at 375, 390, 768, 1024, 1280 and 1440 px: landing, feed, explore, a thesis, its Idea Tree, a profile, the composer and the fork composer. Each capture also measured horizontal overflow of the document.

- 47 of 48 had no overflow. Explore at 1024 px overflowed by 38 px because the backing summary pushed a card's actions out; the card footer now wraps and the recheck shows none.
- The landing page was also captured with real data at 1440, 1024, 768 and 390 px.

Review captures are in `docs/assets/product/`. The Back flow captures come from the test workspace with simulated confirmations, because the backing contract was not deployed at the time.

## Automated flows

- End to end (`pnpm test:e2e`, isolated workspace): 23 cases, including first sign-in with handle claim and welcome drip, the empty-faucet state, backing with split preview and confirmation, self-backing refusal, withdrawal, value on the tree and the feed, and fit checks for the handle dialog, wallet panel and Back sheet at five widths.
- Production smoke (`playwright.production.config.ts`): the landing page without JavaScript, layout at six widths, the step rail, and same-origin resources. Cases that need indexed ideas run with `FORK_SMOKE_LIVE=1`.
- The full CI workflow passed on this branch, including both suites.

## Keyboard and motion

- Dialogs are native `dialog` elements opened modally: focus is trapped, Escape closes them, and the Back sheet returns to the page.
- Amount presets are real radio inputs; the rail, tree nodes and card links are links or buttons with visible focus.
- All motion is disabled under `prefers-reduced-motion`. Without JavaScript the landing page shows every element that would otherwise animate in.

## Not done

- No screen reader pass with a human listener.
- No field performance data; the product has no traffic to measure.
- Contrast was checked by Lighthouse's automated rule only.
