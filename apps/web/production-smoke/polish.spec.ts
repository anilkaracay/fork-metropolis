import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const captures = process.env.FORK_POLISH_CAPTURE_DIR;
const live = process.env.FORK_SMOKE_LIVE === "1";
test.setTimeout(300000);

// The graph grows, so what the screens should show is read from the live API at test time.
// With FORK_SMOKE_LIVE=1 an empty graph is a failure, never a skip.
const MARKETS: Record<number, string> = {
  16: "BTC",
  32: "ETH",
  48: "SOL",
  64: "MON",
};
type Item = {
  graph: {
    thesisId: string;
    parentId: string;
    author: string;
    directForkCount: number;
    uniqueExternalForkers: number;
    core: { marketId: number };
  };
  author: { handle: string; wallet: string };
};
// The hosted indexer limits requests per minute, so each read is made once per run and
// shared by every test in this file; a refused read is retried once the window has passed.
const cache = new Map<string, Promise<unknown>>();
function read<T>(request: APIRequestContext, path: string): Promise<T> {
  if (!cache.has(path))
    cache.set(
      path,
      (async () => {
        for (let attempt = 0; ; attempt++) {
          const response = await request.get(`/api/${path}`);
          const body = response.ok() ? await response.json() : null;
          if (body?.ok) return body.data as T;
          if (attempt === 2)
            throw new Error(`${path} failed with HTTP ${response.status()}`);
          await new Promise((done) => setTimeout(done, 20000));
        }
      })(),
    );
  return cache.get(path) as Promise<T>;
}
async function graph(request: APIRequestContext) {
  const feed = (await read<{ items: Item[] }>(request, "feed?mode=fresh"))
    .items;
  const explore = (await read<{ items: Item[] }>(request, "explore")).items;
  expect(feed.length, "the live feed is empty").toBeGreaterThan(0);
  expect(explore.length, "the live explore list is empty").toBeGreaterThan(0);
  return { feed, explore, market: MARKETS[feed[0]!.graph.core.marketId]! };
}
// Thesis #1 and its fork #2 are the immutable real lineage. They are loaded by id.
async function lineage(request: APIRequestContext) {
  const root = await read<Item>(request, "theses/1");
  const fork = await read<Item>(request, "theses/2");
  expect(root.graph.parentId).toBe("0");
  expect(fork.graph.parentId).toBe("1");
  expect(fork.graph.author).not.toBe(root.graph.author);
  for (const item of [root, fork]) {
    const profile = await read<{ identity: { wallet: string } }>(
      request,
      `profiles/${item.author.handle}`,
    );
    expect(profile.identity.wallet).toBe(item.graph.author);
  }
  return { root, fork };
}
// A page that could not reach the indexer shows "Try again". The hosted indexer's
// per-minute limit is shared by the whole run, so a retry waits for the window to pass.
async function loaded(page: Page, selector: string) {
  const content = page.locator(selector).first();
  const retry = page.getByRole("button", { name: "Try again", exact: true });
  for (let attempt = 0; attempt < 4; attempt++) {
    await expect(content.or(retry.first())).toBeVisible({ timeout: 60000 });
    if (await content.isVisible()) break;
    if (attempt === 3) break;
    await page.waitForTimeout(20000);
    await retry.first().click();
  }
  await expect(content).toBeVisible({ timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page: Page, name: string) {
  if (name === "journey-root" || name === "journey-fork")
    await expect(
      page.getByRole("heading", { name: "ETH", exact: true }),
    ).toBeVisible({ timeout: 60000 });
  else if (name === "journey-feed" || name === "journey-profile")
    await expect(page.locator(".market-symbol").first()).toHaveText(
      /^(BTC|ETH|SOL|MON)$/,
      { timeout: 60000 },
    );
  if (!captures) return;
  await mkdir(captures, { recursive: true });
  await page.screenshot({
    path: join(captures, `${name}.jpg`),
    fullPage: true,
    type: "jpeg",
    quality: 90,
  });
}
for (const width of [1440, 1280, 1024, 768, 390, 375]) {
  test(`social polish real content and navigation at ${width}`, async ({
    page,
    request,
  }) => {
    test.skip(!live, "Only existing real production data.");
    const { feed, explore, market } = await graph(request);
    const { root, fork } = await lineage(request);
    const ideasBy = (wallet: string) =>
      explore.filter((item) => item.graph.author === wallet);
    const expected: Record<string, { count: number; market: string }> = {
      feed: { count: feed.length, market },
      explore: {
        count: explore.length,
        market: MARKETS[explore[0]!.graph.core.marketId]!,
      },
    };
    for (const [name, item] of [
      ["profile-a", root],
      ["profile-b", fork],
    ] as const) {
      const own = ideasBy(item.graph.author);
      expected[name] = {
        count: own.length,
        market: MARKETS[own[0]!.graph.core.marketId]!,
      };
    }
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path, ready] of [
      ["feed", "/feed", ".thesis-card"],
      ["explore", "/explore", ".thesis-card"],
      ["create", "/new", ".composer-form"],
      ["profile-a", `/u/${root.author.handle}`, ".reputation-grid"],
      ["profile-b", `/u/${fork.author.handle}`, ".reputation-grid"],
    ]) {
      await page.goto(path!);
      await loaded(page, ready!);
      if (name === "create") {
        await expect(
          page
            .getByRole("combobox", { name: "Market", exact: true })
            .locator('option[value="32"]'),
        ).toHaveText("ETH", { timeout: 60000 });
        await expect(
          page.getByRole("combobox", { name: "Market", exact: true }),
        ).toHaveValue("");
        await expect(page.getByLabel("Target", { exact: true })).toHaveValue(
          "",
        );
        await expect(
          page.getByRole("button", { name: "Publish on Monad" }),
        ).toBeVisible();
      } else {
        const label = page.locator(".thesis-card .market-symbol").first();
        const retryMarket = page
          .getByRole("button", { name: "Retry market label", exact: true })
          .first();
        const want = expected[name!]!;
        await expect(
          label
            .filter({ hasText: new RegExp(`^${want.market}$`) })
            .or(retryMarket),
        ).toBeVisible({ timeout: 60000 });
        if (await retryMarket.isVisible()) await retryMarket.click();
        await expect(label).toHaveText(want.market, { timeout: 60000 });
        await expect(page.locator(".thesis-card")).toHaveCount(want.count);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.getByLabel("Test identity")).toHaveCount(0);
      await capture(page, `${name}-${width}`);
      if (width <= 390) {
        const control =
          name === "create"
            ? page.getByRole("button", { name: "Publish on Monad" })
            : page.locator(".thesis-card .fork-button").last();
        await control.scrollIntoViewIfNeeded();
        const box = await control.boundingBox(),
          nav = await page.locator(".main-nav").boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.y + box!.height).toBeLessThanOrEqual(nav!.y);
        await expect(
          page.getByRole("navigation", { name: "Main navigation" }),
        ).toBeVisible();
      }
    }
  });
}
test("public discovery and contributor filters use the real two-author dataset", async ({
  page,
  request,
}) => {
  test.skip(!live, "Real production only.");
  const { root, fork } = await lineage(request);
  const { explore } = await graph(request);
  await page.goto("/feed");
  await loaded(page, ".thesis-card");
  await expect(page.locator('[data-thesis-id="2"] .provenance')).toContainText(
    "Forked from #1",
  );
  await expect(
    page.locator('[data-thesis-id="2"] .card-change-summary'),
  ).toContainText("$4,200");
  await expect(
    page.locator('[data-thesis-id="2"] .card-change-summary'),
  ).toContainText("$4,400");
  for (const [label, mode] of [
    ["Most forked", "most-forked"],
    ["Smart signal", "smart-signal"],
    ["Fresh", "fresh"],
  ] as const) {
    const items = (await read<{ items: Item[] }>(request, `feed?mode=${mode}`))
      .items;
    await page.getByRole("button", { name: label, exact: true }).click();
    if (items.length) {
      await loaded(page, ".thesis-card");
      await expect(page.locator(".thesis-card")).toHaveCount(items.length);
    } else await expect(page.locator(".thesis-card")).toHaveCount(0);
  }
  await page.goto("/explore");
  await loaded(page, ".thesis-card");
  await page.getByLabel("Sort by").selectOption("forked");
  const most = Math.max(
    ...explore.map((item) => item.graph.uniqueExternalForkers),
  );
  const leaders = explore
    .filter((item) => item.graph.uniqueExternalForkers === most)
    .map((item) => item.graph.thesisId);
  expect(leaders).toContain("1");
  expect(leaders).toContain(
    await page.locator(".thesis-card").first().getAttribute("data-thesis-id"),
  );
  await page.getByLabel("Idea type").selectOption("forks");
  const forks = explore.filter((item) => item.graph.parentId !== "0");
  await expect(page.locator(".thesis-card")).toHaveCount(forks.length);
  await expect(page.locator('.thesis-card[data-thesis-id="2"]')).toHaveCount(1);
  await page.getByLabel("Search ideas").fill("no-match-for-this-query");
  await expect(
    page.getByRole("heading", { name: "No ideas match yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all ideas" }).click();
  await expect(page.locator(".thesis-card")).toHaveCount(explore.length);
  const btc = explore.filter((item) => item.graph.core.marketId === 16).length;
  await page
    .getByRole("button", {
      name: `BTC ${btc} ${btc === 1 ? "idea" : "ideas"}`,
      exact: true,
    })
    .click();
  if (btc === 0)
    await expect(
      page.getByRole("heading", { name: "No ideas match yet." }),
    ).toBeVisible();
  else await expect(page.locator(".thesis-card")).toHaveCount(btc);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".thesis-card")).toHaveCount(explore.length);
  // The root's author has an original idea forked by someone else; the fork's author forked it.
  await page.goto(`/u/${root.author.handle}`);
  await loaded(page, ".reputation-grid");
  await expect(page.locator(".reputation-grid")).toContainText("1 / 1");
  await page.goto(`/u/${fork.author.handle}`);
  await loaded(page, ".reputation-grid");
  await expect(page.locator(".reputation-grid")).toContainText("0 / 1");
});
test("one cross-product journey preserves the approved landing, lineage and profiles", async ({
  page,
  request,
}) => {
  test.skip(!live, "Real production only.");
  const { fork } = await lineage(request);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await loaded(page, ".l-realtree .tr-node");
  await capture(page, "journey-landing");
  await page
    .getByRole("link", { name: "Open FORK", exact: true })
    .first()
    .click();
  await loaded(page, ".thesis-card");
  await capture(page, "journey-feed");
  // The lineage is opened by id, not found through the feed's order.
  await page.goto("/t/1");
  await loaded(page, ".signature:not(.signature-loading) .detail-reasoning");
  await capture(page, "journey-root");
  await page.getByRole("link", { name: /Fork #2/ }).click();
  await expect(page).toHaveURL(/\/t\/2$/);
  await expect(
    page.getByRole("main").getByText("Fork #2", { exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await loaded(page, ".signature:not(.signature-loading) .detail-reasoning");
  await capture(page, "journey-fork");
  await page.getByRole("link", { name: "Open Idea Tree", exact: true }).click();
  await loaded(page, ".selected-perspective");
  await capture(page, "journey-tree");
  await page
    .locator(".selected-perspective")
    .getByRole("link", { name: `@${fork.author.handle}`, exact: true })
    .click();
  await loaded(page, ".reputation-grid");
  await capture(page, "journey-profile");
  await expect(page).toHaveURL(new RegExp(`/u/${fork.author.handle}$`));
});
