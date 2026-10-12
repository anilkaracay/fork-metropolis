import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// With FORK_SMOKE_LIVE=1 the origin has indexed ideas and the landing shows them.
// Without it (a fresh build with no data source) the landing must say so and invent nothing.
const live = process.env.FORK_SMOKE_LIVE === "1";
const beats = [
  "Say what you see.",
  "Improve it without erasing it.",
  "Put MON behind an idea.",
  "See how it grew.",
];

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
  for (const title of beats)
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  if (live) {
    await expect(page.locator(".hero-node.origin")).toBeVisible();
    await expect(page.locator(".hero-node.fork")).toContainText("$4,400");
    await expect(page.locator(".beat-visual").first()).toBeVisible();
  } else {
    await expect(
      page.getByText("The live example could not be loaded just now.").first(),
    ).toBeVisible();
    await expect(
      page.getByText("The live graph could not be read just now."),
    ).toBeVisible();
    await expect(page.locator(".l-figures")).toHaveCount(0);
  }
  await context.close();
});

test("the hero shows the real lineage and the live section counts the graph", async ({
  page,
}) => {
  test.skip(!live, "Needs an origin with indexed ideas.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const tree = page.locator(".hero-tree");
  await expect(tree.locator(".hero-node.origin")).toContainText("Thesis #1");
  await expect(tree.locator(".hero-node.origin")).toContainText("$4,200");
  await expect(tree.locator(".hero-node.fork")).toContainText("Fork #2");
  await expect(tree.locator(".hero-node.fork")).toContainText("$4,400");
  await expect(tree.locator(".hero-node.fork")).toContainText("3×");
  await expect(
    tree.getByRole("link", { name: "Change a parameter, keep the history" }),
  ).toHaveAttribute("href", "/t/2/fork");
  const figures = page.locator(".l-figures dd");
  expect(Number(await figures.nth(0).innerText())).toBeGreaterThanOrEqual(2);
  expect(Number(await figures.nth(1).innerText())).toBeGreaterThanOrEqual(1);
  await expect(
    page.getByRole("list", { name: "Latest ideas" }).getByRole("link").first(),
  ).toHaveAttribute("href", /^\/t\/\d+$/);
  // The split shown for a backing of the real fork follows the product's own rule.
  const split = page.locator(".beat-split li");
  await expect(split).toHaveCount(2);
  await expect(split.nth(0)).toContainText("0.08 MON");
  await expect(split.nth(1)).toContainText("0.02 MON");
});

for (const width of [1440, 1280, 1024, 768, 390, 375]) {
  test(`landing layout stays readable and within ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const selector of [
      ".l-hero h1",
      live ? ".hero-tree" : ".l-hero .l-unavailable",
      ".l-section-head h2 >> nth=0",
      ".beat >> nth=0",
      ".l-stack",
      ".l-footer",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.x, selector).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(width);
    }
    const buttons = await page
      .locator(
        ".l-hero-actions .button, .marketing-header-actions .button, .marketing-menu-toggle",
      )
      .evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => el.getBoundingClientRect().height),
      );
    expect(buttons.every((height) => height >= 44)).toBe(true);
    const rail = page.getByRole("list", { name: "How FORK works" });
    if (width >= 1024) await expect(rail).toBeVisible();
    else await expect(rail).toBeHidden();
    if (width < 768) {
      const toggle = page.getByRole("button", {
        name: "Open navigation",
        exact: true,
      });
      await toggle.click();
      await expect(
        page.getByRole("navigation", {
          name: "Landing navigation",
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await toggle.click();
      await page
        .getByRole("navigation", { name: "Landing navigation", exact: true })
        .getByRole("link", { name: "How it works", exact: true })
        .click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page).toHaveURL(/#how$/);
    }
  });
}

test("the step rail follows the beat being read", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const rail = page.getByRole("list", { name: "How FORK works" });
  await page.locator("#back").scrollIntoViewIfNeeded();
  await page.evaluate(() =>
    document.querySelector("#back")!.scrollIntoView({ block: "center" }),
  );
  await expect(rail.getByRole("link", { name: /Back/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await rail.getByRole("link", { name: /Publish/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#publish$/);
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
    await expect(page.locator(".marketing-header"), path).toHaveCount(0);
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
