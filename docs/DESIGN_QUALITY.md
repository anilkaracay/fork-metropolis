# Design quality checks

Two rounds are recorded here, both on 2026-10-12: the landing page rebuild of D-060 first, then the earlier redesign of the landing page and app (D-059). Everything was run locally by the author; method and limits are stated with each result.

## Landing page rebuild (D-060)

### Lighthouse

Lighthouse 12.8.2, default mobile emulation with simulated throttling, performance and accessibility, against a local production build (`pnpm --filter @fork/web build`, then `node scripts/production-server.mjs`) reading the live indexer. Five consecutive runs on the final build, the first against a freshly started server.

| Run | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 92 | 100 | 1.1 s | 3.2 s | 90 ms | 0 |
| 2 | 92 | 100 | 1.1 s | 3.3 s | 80 ms | 0 |
| 3 | 93 | 100 | 1.1 s | 3.2 s | 60 ms | 0 |
| 4 | 93 | 100 | 1.1 s | 3.2 s | 80 ms | 0 |
| 5 | 93 | 100 | 1.1 s | 3.2 s | 70 ms | 0 |

The same settings against the deployed page at https://forktrades.xyz on 2026-10-13, image `fork-metropolis:submission-20261013a`, three consecutive runs:

| Run | Performance | Accessibility | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 | 100 | 1.3 s | 2.9 s | 90 ms | 0 |
| 2 | 94 | 100 | 1.1 s | 2.8 s | 100 ms | 0 |
| 3 | 92 | 100 | 1.5 s | 2.4 s | 190 ms | 0 |

The largest paint is the hero's lead paragraph. Three fixes got the page here from a first pass at 85 to 86 performance and 97 accessibility:

- The hero headline faded in from zero opacity, which delays the largest paint until the animation runs. It is now painted from the first frame and only comes into focus.
- Labels on the light "Who it is for" cards failed the contrast rule. They are darker now.
- A freshly started server waited for the indexer before answering, which cost the first run up to 0.4 s of first paint. The landing read is now held briefly and refreshed behind the visitor (D-060).

The machine's load average was between 6 and 11 during the final runs. These are lab figures from one machine, not field data.

### Widths and motion

Every section was captured at 375, 390, 768, 1024, 1280 and 1440 px, once with motion and once with reduced motion: 14 scroll positions per width, 168 captures, reviewed by eye. In the motion pass the page was scrolled in steps so scroll-driven scenes play, and each step of the pinned story was captured inside its own quarter of the pin.

- No horizontal overflow at any width in either pass, and no console errors.
- An element by element scan for anything sticking out of the viewport found the final heading and avatar row too wide at 375 and 390 px; both now fit and the rescan is clean.
- The pinned story was also checked at 1280 px for overlapping text: the steps' copies stacked on top of each other until the inactive ones were hidden, which is now asserted by a smoke test.
- Contact sheets are in `docs/assets/landing/` as `motion-<width>.jpg` and `reduced-motion-<width>.jpg`, with full size frames of the key sections.
- Two screen recordings at 1440 px show the motion: `hero-loop.mp4` (the intro and two rounds of the hero scene with the pointer moving) and `story-scroll.mp4` (the thread and the four pinned steps, scrolled with a wheel).

### Automated flows

Production smoke (`playwright.production.config.ts`), rewritten for the new page:

- Without JavaScript the page is complete: nothing waits for an animation, the four story panels are visible, every illustration carries its "Example" tag, and no example character appears in the bar's count, the activity strip or the live section.
- With live data: the figures, the bar's count, the real tree's links to thesis pages and to the explorer, the strip's links, and the rule that fewer than six events never loop.
- Layout at six widths, 44 px touch targets, and the in-page links.
- Reduced motion never fetches the animation code; motion does.
- The pinned story moves through its four steps with the scroll, and narrow screens are never pinned.
- Same-origin resources only, and a layout shift below 0.1.

Against the local production build with the live indexer (`FORK_SMOKE_LIVE=1`), 12 of 12 pass. Without a reachable indexer, as in CI, 10 pass and the 2 that need indexed ideas are skipped. `apps/web/tests/landing-live.test.ts` covers the data layer: what is counted, the event order, the tree's rows, the hash check filter, the empty and unconfigured cases, and the held read.

### Not done

- No screen reader pass with a human listener.
- Motion was judged from captures and recordings, not on a phone in hand.

## Landing page and app redesign (D-059)

### Lighthouse

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

### Widths

Eight routes were captured in the isolated test workspace with a seeded three-level lineage and backings, at 375, 390, 768, 1024, 1280 and 1440 px: landing, feed, explore, a thesis, its Idea Tree, a profile, the composer and the fork composer. Each capture also measured horizontal overflow of the document.

- 47 of 48 had no overflow. Explore at 1024 px overflowed by 38 px because the backing summary pushed a card's actions out; the card footer now wraps and the recheck shows none.
- The landing page was also captured with real data at 1440, 1024, 768 and 390 px.

Review captures are in `docs/assets/product/`. The Back flow captures come from the test workspace with simulated confirmations, because the backing contract was not deployed at the time.

### Automated flows

- End to end (`pnpm test:e2e`, isolated workspace): 23 cases, including first sign-in with handle claim and welcome drip, the empty-faucet state, backing with split preview and confirmation, self-backing refusal, withdrawal, value on the tree and the feed, and fit checks for the handle dialog, wallet panel and Back sheet at five widths.
- Production smoke (`playwright.production.config.ts`): the landing page without JavaScript, layout at six widths, the step rail, and same-origin resources. Cases that need indexed ideas run with `FORK_SMOKE_LIVE=1`.
- The full CI workflow passed on this branch, including both suites.

### Keyboard and motion

- Dialogs are native `dialog` elements opened modally: focus is trapped, Escape closes them, and the Back sheet returns to the page.
- Amount presets are real radio inputs; the rail, tree nodes and card links are links or buttons with visible focus.
- All motion is disabled under `prefers-reduced-motion`. Without JavaScript the landing page shows every element that would otherwise animate in.

### Not done

- No screen reader pass with a human listener.
- No field performance data; the product has no traffic to measure.
- Contrast was checked by Lighthouse's automated rule only.
