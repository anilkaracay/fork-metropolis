import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// With FORK_SMOKE_LIVE=1 the origin has indexed ideas and the landing shows them.
// Without it (a fresh build with no data source) the landing must say so and invent nothing.
const live = process.env.FORK_SMOKE_LIVE === "1";
const steps = [
  "Put it on the record.",
  "Disagree? Fork it.",
  "Back what you believe in.",
  "See how an idea grew.",
];
// The people in the examples. They may never appear where the page reports the real graph.
const characters = /@(mira|theo|lena|kaan|deniz|umut|ada|emre)\b/;

test("landing is server-rendered, public, and readable without JavaScript", async ({
  request,
  browser,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Trading ideas");
  expect(html).not.toContain("Preparing sign-in");
  expect(html).not.toContain("app-layout");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Trading ideasevolve here.",
  );
  await expect(
    page.getByRole("link", { name: "Open FORK", exact: true }).first(),
  ).toHaveAttribute("href", "/feed");
  // Without scripts nothing is hidden waiting for an animation.
  await expect(page.locator(".landing.motion")).toHaveCount(0);
  await expect(page.locator(".l-intro")).toBeHidden();
  await expect(page.locator(".l-stage .fc-theo")).toBeVisible();
  for (const title of steps)
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".story-panel")).toHaveCount(4);
  for (const panel of await page.locator(".story-panel").all())
    await expect(panel).toBeVisible();
  // Every illustration says that it is one.
  await expect(page.locator(".l-stage-note .l-tag")).toHaveText("Example");
  await expect(page.locator(".l-profile-card > .l-tag")).toHaveText("Example");
  if (live) {
    await expect(page.locator(".l-figures")).toBeVisible();
    await expect(page.locator(".l-realtree .tr-node").first()).toBeVisible();
  } else {
    await expect(
      page.getByText("The live graph could not be read just now."),
    ).toBeVisible();
    await expect(page.locator(".l-figures")).toHaveCount(0);
    await expect(page.locator(".l-activity")).toHaveCount(0);
    await expect(page.locator(".l-nav-count")).toHaveCount(0);
  }
  // Sections that report the graph never contain an example character.
  for (const selector of ["#live", ".l-activity", ".l-nav-chip"])
    for (const text of await page.locator(selector).allInnerTexts())
      expect(text, selector).not.toMatch(characters);
  await context.close();
});

test("the live section counts the graph and draws the real tree", async ({
  page,
}) => {
  test.skip(!live, "Needs an origin with indexed ideas.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const figures = page.locator(".l-figures dd [data-ticker]");
  const ideas = Number(await figures.nth(0).innerText());
  expect(ideas).toBeGreaterThanOrEqual(2);
  expect(Number(await figures.nth(1).innerText())).toBeGreaterThanOrEqual(1);
  await expect(page.locator(".l-nav-count")).toHaveText(`${ideas} ideas`);
  const nodes = page.locator(".l-realtree .tr-node");
  expect(await nodes.count()).toBeGreaterThanOrEqual(2);
  await expect(nodes.first().locator(".tr-card")).toHaveAttribute(
    "href",
    /^\/t\/\d+$/,
  );
  await expect(nodes.first().locator(".tr-tx")).toHaveAttribute(
    "href",
    /^https:\/\/testnet\.monadexplorer\.com\/tx\/0x[0-9a-f]{64}$/,
  );
  // The strip holds real events: each one links to the idea it is about.
  const events = page.locator(".l-activity .l-marquee-track").first();
  for (const link of await events.getByRole("link").all())
    await expect(link).toHaveAttribute("href", /^\/t\/\d+$/);
  // Fewer than six events are a still row, never a loop.
  const count = await events.getByRole("listitem").count();
  await expect(page.locator(".l-marquee")).toHaveAttribute(
    "data-loop",
    String(count >= 6),
  );
});

for (const width of [1440, 1280, 1024, 768, 390, 375]) {
  test(`landing layout stays readable and within ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const selector of [
      ".l-hero h1",
      ".l-stage",
      ".l-section-head h2 >> nth=0",
      ".l-thread",
      ".story-panel >> nth=0",
      ".story-panel >> nth=2",
      ".l-profile-card",
      ".l-audience-list",
      ".l-built-list",
      ".l-finale h2",
      ".l-footer-row",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.x, selector).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(width);
    }
    const buttons = await page
      .locator(".l-hero-actions .button, .l-nav .button, .l-finale .button")
      .evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => el.getBoundingClientRect().height),
      );
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    expect(buttons.every((height) => height >= 44)).toBe(true);
    const links = page.getByRole("navigation", { name: "Landing navigation" });
    if (width > 900) {
      await links.getByRole("link", { name: "How it works" }).click();
      await expect(page).toHaveURL(/#how$/);
    } else await expect(links).toBeHidden();
  });
}

test("reduced motion gets the finished page without the animation code", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".landing.motion")).toHaveCount(0);
  await expect(page.locator(".story.is-pinned")).toHaveCount(0);
  await expect(page.locator("html.lenis")).toHaveCount(0);
  await expect(page.locator(".l-stage .fc-theo")).toBeVisible();
  await expect(page.locator(".fc-earned")).toBeVisible();
  // The animation code is one lazy chunk: it is fetched only for motion.
  const still = scripts.length;
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator(".landing.motion-live")).toHaveCount(1);
  expect(scripts.length - still).toBeGreaterThan(still);
});

test("the pinned story moves through its four steps with the scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".landing.motion-live")).toHaveCount(1);
  const story = page.locator(".story.is-pinned");
  await expect(story).toHaveCount(1);
  const start = await story.evaluate(
    (element) => element.getBoundingClientRect().top + scrollY - 96,
  );
  const names = ["Publish", "Fork", "Back", "Idea Tree"];
  for (const [index, name] of names.entries()) {
    // The pin lasts 2.8 screens; each step owns a quarter of it.
    await page.evaluate(
      (top) => scrollTo(0, top),
      start + ((index + 0.5) / 4) * 2.8 * 800,
    );
    await expect(
      page.locator(`.story-panel[data-panel="${index}"]`),
    ).toHaveAttribute("data-active", "");
    await expect(page.locator(".story-panel[data-active]")).toHaveCount(1);
    await expect(page.locator(".story-copy[data-active]")).toContainText(name);
  }
  // Narrow screens are never pinned: every step is in the flow.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator(".story.is-pinned")).toHaveCount(0);
  for (const panel of await page.locator(".story-panel").all())
    await expect(panel).toBeVisible();
});

test("landing to Feed and existing product deep links preserve real social data", async ({
  page,
  request,
}) => {
  test.skip(!live, "Needs an origin with indexed ideas.");
  await page.goto("/");
  await page
    .getByRole("link", { name: "Open FORK", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.locator(".thesis-card").first()).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Trading ideas",
  );
  for (const path of [
    "/t/1",
    "/t/2",
    "/t/1/fork",
    "/t/1/tree",
    "/t/2/tree",
    "/new",
    "/explore",
  ]) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expect(page.locator(".app-layout"), path).toHaveCount(1);
    await expect(page.locator(".l-nav"), path).toHaveCount(0);
  }
  const root = (await (await request.get("/api/theses/1")).json()).data;
  const fork = (await (await request.get("/api/theses/2")).json()).data;
  expect(root.provenance.graph).toBe("envio");
  expect(fork.graph.parentId).toBe("1");
});

test("landing loads only same-origin resources and records honest lab timing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const metrics = { cls: 0, lcp: 0 };
    (window as unknown as { forkLabTiming: typeof metrics }).forkLabTiming =
      metrics;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput) metrics.cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  // A bounded observation window for lab metrics, not a readiness workaround.
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    const timing = (
      window as unknown as { forkLabTiming: { cls: number; lcp: number } }
    ).forkLabTiming;
    return {
      origin: location.origin,
      viewport: innerWidth,
      ttfbMs: navigation.responseStart - navigation.startTime,
      fcpMs:
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
        null,
      lcpMs: timing.lcp,
      observedCls: timing.cls,
      jsTransferBytes: resources
        .filter((r) => new URL(r.name).pathname.endsWith(".js"))
        .reduce((sum, r) => sum + r.transferSize, 0),
      externalResourceHosts: [
        ...new Set(
          resources
            .filter((r) => new URL(r.name).origin !== location.origin)
            .map((r) => new URL(r.name).hostname),
        ),
      ],
      fontResources: resources.filter((r) =>
        new URL(r.name).pathname.endsWith(".woff2"),
      ).length,
      scope:
        "Single fresh-browser desktop lab observation; no CPU/network throttle, not field Core Web Vitals or Lighthouse.",
    };
  });
  expect(result.externalResourceHosts).toEqual([]);
  expect(result.fontResources).toBe(2);
  expect(result.observedCls).toBeLessThan(0.1);
  if (process.env.FORK_LAB_REPORT)
    await writeFile(
      process.env.FORK_LAB_REPORT,
      JSON.stringify(result, null, 2),
    );
});
