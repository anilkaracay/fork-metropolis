# Landing v3 design reference

Open index.html in Chrome. This is the approved visual target for the landing page.
Motion is CSS only: a 9 second hero loop, scroll-driven reveals with blur, a nav that tightens on scroll,
a hero that recedes on scroll, inset panels that open as they enter, and a sticky "How it works" story
whose right-hand visual changes with each step (named view timelines). Reduced motion shows a complete static page.

Implement it in apps/web/src/app/(marketing) with the existing stack, keep the live data rules,
and treat every number and name in the illustrative scenes as the one story we use everywhere:
mira $0.040 2x, theo fork $0.045 3x, kaan backs theo 0.1 MON (theo 0.08, mira 0.02),
lena fork $0.048 3x, kaan backs lena 1 MON (0.70, 0.20, 0.10), mira earned from forks 0.12 MON.

Reveals run only during each element's entry phase, so anything already on screen is always sharp. A viewport taller than 1600px (full-page renders, canvas previews) gets the static version.
