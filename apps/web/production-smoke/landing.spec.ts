import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// With FORK_SMOKE_LIVE=1 the origin has indexed ideas and the landing shows them.
// Without it (a fresh build with no data source) the landing must say so and invent nothing.
const live = process.env.FORK_SMOKE_LIVE === "1";
// The people in the illustrations. They may never appear where the page reports the real graph.
const characters = /\b(mira|theo|lena|kaan|deniz|umut|ada|emre)\b/;
const steps = ["Publish", "Fork", "Back", "Idea Tree"];

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
    page.getByRole("link", { name: /^Open FORK/ }).first(),
  ).toHaveAttribute("href", "/feed");
  for (const name of steps)
    await expect(
      page.getByRole("heading", { level: 3, name, exact: true }),
    ).toBeVisible();
  // Every illustration says that it is one.
  await expect(
    page.getByLabel("An example of one idea being forked and backed"),
  ).toContainText("Example");
  await expect(page.getByText("mon traders")).toBeVisible();
  // The Monad figures are the recorded run, and nothing else.
  const monad = page.locator("#monad");
  await expect(monad).toContainText("417.5");
  await expect(monad).toContainText("p95 423 ms");
  await expect(monad).toContainText("+580.5");
  await expect(monad).toContainText("p95 840 ms");
  await expect(monad).toContainText("20 real backings");
  await expect(monad.locator(".g20 > div")).toHaveCount(20);
  if (live) {
    await expect(page.locator(".l3-chip-count")).toBeVisible();
    await expect(page.locator(".l3-activity")).toBeVisible();
  } else {
    // A failed read shows no count and no strip, never a placeholder.
    await expect(page.locator(".l3-chip-count")).toHaveCount(0);
    await expect(page.locator(".l3-activity")).toHaveCount(0);
  }
  // The parts that report the graph never contain an example character.
  for (const selector of [".l3-chip", ".l3-activity"])
    for (const text of await page.locator(selector).allInnerTexts())
      expect(text, selector).not.toMatch(characters);
  await context.close();
});

test("the live parts count the graph and link real events", async ({
  page,
  request,
}) => {
  test.skip(!live, "Needs an origin with indexed ideas.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const feed = (await (await request.get("/api/explore")).json()).data.items;
  expect(feed.length).toBeGreaterThan(0);
  await expect(page.locator(".l3-chip-count")).toHaveText(
    `${feed.length} ${feed.length === 1 ? "idea" : "ideas"}`,
  );
  // The strip holds real events: each one links to the idea it is about.
  const events = page.locator(".l3-activity .l3-track").first();
  const links = await events.getByRole("link").all();
  expect(links.length).toBeGreaterThan(0);
  for (const link of links)
    await expect(link).toHaveAttribute("href", /^\/t\/\d+$/);
  // Fewer than six events are a still row, never a loop.
  await expect(page.locator(".l3-marquee")).toHaveAttribute(
    "data-loop",
    String(links.length >= 6),
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
      ".fk .h1",
      ".fk .nav",
      "#how",
      "#backing .bento",
      "#tree",
      "#monad .g20",
      ".fk footer",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.x, selector).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(width);
    }
    const buttons = await page
      .locator(".fk .btn")
      .evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => el.getBoundingClientRect().height),
      );
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    expect(buttons.every((height) => height >= 44)).toBe(true);
    const links = page.locator(".fk .nav a.l");
    if (width > 960) {
      await links.filter({ hasText: "How it works" }).click();
      await expect(page).toHaveURL(/#how$/);
    } else await expect(links.first()).toBeHidden();
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
  await expect(page.locator("html.lenis")).toHaveCount(0);
  // Static story: every step shows its own illustration inline, and the sticky frame is off.
  await expect(page.locator(".fk .stick")).toBeHidden();
  for (const inline of await page.locator(".fk .vis-inline").all())
    await expect(inline).toBeVisible();
  // The animation code is one lazy chunk: it is fetched only for motion.
  const still = scripts.length;
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html.lenis")).toHaveCount(1);
  expect(scripts.length - still).toBeGreaterThan(still);
});

test("with motion, How it works keeps one sticky visual beside the steps", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".fk .stick")).toBeVisible();
  await expect(page.locator(".fk .stick .layer")).toHaveCount(4);
  // Narrow screens never stick: each step carries its own illustration.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator(".fk .stick")).toBeHidden();
  for (const inline of await page.locator(".fk .vis-inline").all())
    await expect(inline).toBeVisible();
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
    await expect(page.locator(".fk"), path).toHaveCount(0);
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
