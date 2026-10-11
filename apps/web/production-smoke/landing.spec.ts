import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("landing is server-rendered, public, and independent of wallet hydration", async ({
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
    page.getByRole("link", { name: "Explore FORK", exact: true }).first(),
  ).toHaveAttribute("href", "/feed");
  await expect(page.locator(".landing-node")).toHaveCount(2);
  await expect(page.locator(".landing-node-fork")).toContainText("$4,400");
  await context.close();
});

test("real lineage selection works with keyboard and reduced motion without a route reload", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const original = page.getByRole("button", {
    name: "Select Thesis #1",
    exact: true,
  });
  const fork = page.getByRole("button", {
    name: "Select Fork #2",
    exact: true,
  });
  await expect(fork).toHaveAttribute("aria-pressed", "true");
  await original.focus();
  await page.keyboard.press("Enter");
  await expect(original).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#lineage-perspective")).toContainText(
    "THE ORIGINAL",
  );
  await expect(page.locator("#lineage-perspective a")).toHaveAttribute(
    "href",
    "/t/1",
  );
  await fork.focus();
  await page.keyboard.press("Space");
  await expect(fork).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#lineage-perspective a")).toHaveAttribute(
    "href",
    "/t/2",
  );
  expect(await fork.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
  await expect(page).toHaveURL(/\/$/);
});

for (const width of [1440, 1280, 1024, 768, 390, 375]) {
  test(`landing layout stays readable and within ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".landing-node")).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const selector of [
      ".hero-copy h1",
      ".landing-node-original",
      ".landing-node-fork",
      ".comparison-values",
      ".marketing-footer",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.x, selector).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(width);
    }
    const buttons = await page
      .locator(
        ".hero-actions .button, .marketing-header-actions .button, .marketing-menu-toggle",
      )
      .evaluateAll((els) =>
        els
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => el.getBoundingClientRect().height),
      );
    expect(buttons.every((height) => height >= 44)).toBe(true);
    if (width < 768) {
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await expect(
        page.getByRole("navigation", {
          name: "Landing navigation",
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open navigation", exact: true }),
      ).toBeFocused();
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await page
        .getByRole("link", { name: "How it works", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Open navigation", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(page).toHaveURL(/#how-it-works$/);
    }
  });
}

test("landing to Feed and existing product deep links preserve real social data", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore FORK", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.locator(".thesis-card")).toHaveCount(2);
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
    "/u/u_4dcde4749ffd",
    "/u/u_03572f901994",
    "/new",
    "/explore",
  ]) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expect(page.locator(".app-layout"), path).toHaveCount(1);
    await expect(page.locator(".marketing-header"), path).toHaveCount(0);
  }
  const root = (await (await request.get("/api/theses/1")).json()).data;
  const fork = (await (await request.get("/api/theses/2")).json()).data;
  expect(root.social.agrees).toBe(1);
  expect(root.comments).toHaveLength(1);
  expect(root.provenance.graph).toBe("envio");
  expect(fork.graph.parentId).toBe("1");
  expect(fork.execution.state).toBe("not-executed");
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
