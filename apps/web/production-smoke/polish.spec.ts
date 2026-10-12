import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const userA = "u_4dcde4749ffd",
  userB = "u_03572f901994";
const captures = process.env.FORK_POLISH_CAPTURE_DIR;
test.setTimeout(120000);
async function loaded(page: Page, selector: string) {
  const content = page.locator(selector).first();
  await expect(
    content.or(
      page.getByRole("button", { name: "Try again", exact: true }).first(),
    ),
  ).toBeVisible({ timeout: 60000 });
  if (!(await content.isVisible()))
    await page
      .getByRole("button", { name: "Try again", exact: true })
      .first()
      .click();
  await expect(content).toBeVisible({ timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page: Page, name: string) {
  if (name === "journey-root" || name === "journey-fork")
    await expect(
      page.getByRole("heading", { name: "ETH", exact: true }),
    ).toBeVisible({ timeout: 60000 });
  else if (name === "journey-feed" || name === "journey-profile")
    await expect(page.locator(".market-symbol").first()).toHaveText("ETH", {
      timeout: 60000,
    });
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
  }) => {
    test.skip(
      process.env.FORK_SMOKE_LIVE !== "1",
      "Only existing real production data.",
    );
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path, ready] of [
      ["feed", "/feed", ".thesis-card"],
      ["explore", "/explore", ".thesis-card"],
      ["create", "/new", ".composer-form"],
      ["profile-a", `/u/${userA}`, ".reputation-grid"],
      ["profile-b", `/u/${userB}`, ".reputation-grid"],
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
        await expect(
          label.filter({ hasText: /^ETH$/ }).or(retryMarket),
        ).toBeVisible({ timeout: 60000 });
        if (await retryMarket.isVisible()) await retryMarket.click();
        await expect(label).toHaveText("ETH", { timeout: 60000 });
        await expect(page.locator(".thesis-card")).toHaveCount(
          name?.startsWith("profile") ? 1 : 2,
        );
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
}) => {
  test.skip(process.env.FORK_SMOKE_LIVE !== "1", "Real production only.");
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
  for (const mode of ["Most Forked", "Smart Signal", "Fresh"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await loaded(page, ".thesis-card");
    await expect(page.locator(".thesis-card")).toHaveCount(2);
  }
  await page.goto("/explore");
  await loaded(page, ".thesis-card");
  await page.getByLabel("Sort by").selectOption("forked");
  await expect(page.locator(".thesis-card").first()).toHaveAttribute(
    "data-thesis-id",
    "1",
  );
  await page.getByLabel("Idea type").selectOption("forks");
  await expect(page.locator(".thesis-card")).toHaveAttribute(
    "data-thesis-id",
    "2",
  );
  await page.getByLabel("Search ideas").fill("no-match-for-this-query");
  await expect(
    page.getByRole("heading", { name: "No ideas match yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all ideas" }).click();
  await page.getByRole("button", { name: "BTC 0 ideas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No ideas match yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  await page.goto(`/u/${userA}`);
  await loaded(page, ".reputation-grid");
  await expect(page.locator(".reputation-grid")).toContainText("Emerging");
  await expect(page.locator(".reputation-grid")).toContainText("1 / 1");
  await page.getByRole("button", { name: "Forks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The next idea is unwritten." }),
  ).toBeVisible();
  await page.goto(`/u/${userB}`);
  await loaded(page, ".reputation-grid");
  await expect(page.locator(".reputation-grid")).toContainText("0 / 1");
  await page
    .getByRole("button", { name: "Original ideas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The next idea is unwritten." }),
  ).toBeVisible();
});
test("one cross-product journey preserves the approved landing, lineage and profiles", async ({
  page,
}) => {
  test.skip(process.env.FORK_SMOKE_LIVE !== "1", "Real production only.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await loaded(page, ".landing-node");
  await capture(page, "journey-landing");
  await page
    .getByRole("link", { name: "Explore FORK", exact: true })
    .first()
    .click();
  await loaded(page, ".thesis-card");
  await capture(page, "journey-feed");
  await page
    .locator('[data-thesis-id="1"] .card-actions')
    .getByRole("link", { name: "Open", exact: true })
    .click();
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
    .getByRole("link", { name: `@${userB}`, exact: true })
    .click();
  await loaded(page, ".reputation-grid");
  await capture(page, "journey-profile");
  await expect(page).toHaveURL(new RegExp(`/u/${userB}$`));
});
