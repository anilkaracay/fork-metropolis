import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const forkId = process.env.FORK_SMOKE_FORK_ID;
test.use({ actionTimeout: 15000 });
test.setTimeout(150000);
async function expectRealScreen(page: Page, selector: string) {
  const content = page.locator(selector);
  const retry = page.getByRole("button", { name: "Try again", exact: true });
  await expect(content.or(retry)).toBeVisible({ timeout: 60000 });
  if (await retry.isVisible()) await retry.click();
  await expect(content).toBeVisible({ timeout: 60000 });
}
async function expectParentComparison(page: Page, parentId: string) {
  const diff = page.locator(".fork-diff");
  try {
    await expect(diff).toContainText(`Changes from #${parentId}`, {
      timeout: 60000,
    });
  } catch {
    // Exercise the real recovery control; never replace unavailable data.
    await page.getByRole("button", { name: "Check parent again" }).click();
    await expect(diff).toContainText(`Changes from #${parentId}`, {
      timeout: 60000,
    });
  }
}
async function capture(page: Page, name: string) {
  const dir = process.env.FORK_SMOKE_CAPTURE_DIR;
  if (!dir) return;
  await mkdir(dir, { recursive: true });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.screenshot({
    path: join(dir, `${name}.jpg`),
    fullPage: true,
    type: "jpeg",
    quality: 90,
  });
}
test.beforeEach(() => {
  test.skip(!forkId, "Opt-in existing real lineage only.");
});
test("real fork detail compares its direct parent and preserves honest execution state", async ({
  page,
  request,
}) => {
  const r = await request.get(`/api/theses/${forkId}`);
  expect(r.ok()).toBe(true);
  const fork = (await r.json()).data;
  expect(fork.metadataState).toBe("trusted");
  await page.goto(`/t/${forkId}`);
  await expect(page.locator(".detail-provenance")).toContainText(
    `#${fork.graph.parentId}`,
  );
  await expectParentComparison(page, fork.graph.parentId);
  await expect(page.locator('[data-diff-field="targetPriceE8"]')).toContainText(
    "$4,400",
  );
  await expect(page.locator(".unchanged-list")).toContainText("$3,600");
  await page.getByRole("link", { name: "Open Idea Tree", exact: true }).click();
  await expectRealScreen(page, ".selected-perspective");
  await expect(page.locator(".selected-perspective")).toContainText(
    `Changes from #${fork.graph.parentId}`,
  );
  await expect(page.locator(".tree-node")).toHaveCount(2);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".selected-perspective .diff-text summary").click();
  await capture(page, "selected-fork-diff-1440");
  await page
    .getByRole("link", {
      name: `Select parent #${fork.graph.parentId}`,
      exact: true,
    })
    .click();
  await expect(page.locator(".selected-perspective")).toContainText(
    "The original perspective",
    { timeout: 60000 },
  );
});
test("live production draft edits and reverts without creating a draft or transaction", async ({
  page,
}) => {
  let writes = 0;
  page.on("request", (r) => {
    if (r.method() !== "GET" && /\/api\/theses\/(draft|finalize)/.test(r.url()))
      writes++;
  });
  await page.goto("/t/1/fork");
  await expectRealScreen(page, ".composer-form");
  const diff = page.getByRole("region", { name: "Live draft comparison" });
  await expect(diff).toContainText("No changes yet", { timeout: 60000 });
  await page.getByLabel("Target", { exact: true }).fill("4400");
  await page.getByLabel("Leverage", { exact: true }).fill("3");
  await expect(diff.locator('[data-diff-field="targetPriceE8"]')).toContainText(
    "$4,400",
  );
  await expect(diff.locator('[data-diff-field="leverageBps"]')).toContainText(
    "3×",
  );
  await page
    .getByLabel("Reasoning", { exact: true })
    .fill(
      "I would wait for stronger confirmation before exploring this higher-target perspective. This is an unsent visual QA draft.",
    );
  await diff.locator(".diff-text summary").click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, "composer-live-1440");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "composer-live-390");
  await page.getByLabel("Target", { exact: true }).fill("4200");
  await expect(diff.locator('[data-diff-field="targetPriceE8"]')).toHaveCount(
    0,
  );
  expect(writes).toBe(0);
});
for (const width of [1440, 1280, 1024, 768, 390, 375])
  test(`signature screens remain readable without overflow at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path] of [
      ["root", "/t/1"],
      ["fork", `/t/${forkId}`],
      ["tree", `/t/${forkId}/tree`],
      ["composer", "/t/1/fork"],
    ] as const) {
      await page.goto(path);
      await expectRealScreen(page, ".signature:not(.signature-loading)");
      await expect(page.locator(".signature")).toBeVisible();
      await expect(page.locator(".signature-loading")).toHaveCount(0);
      if (name === "tree")
        await expect(page.locator(".tree-node")).toHaveCount(2, {
          timeout: 60000,
        });
      else if (name === "composer") {
        await expect(page.locator(".composer-form")).toBeVisible({
          timeout: 60000,
        });
        await expect(
          page.getByRole("combobox", { name: "Market", exact: true }),
        ).toHaveValue("32", {
          timeout: 60000,
        });
        await expect(page.locator(".parent-attribution")).toContainText("ETH", {
          timeout: 60000,
        });
      } else
        await expect(page.locator(".detail-market h1")).toHaveText("ETH", {
          timeout: 60000,
        });
      if (name === "fork") await expectParentComparison(page, "1");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await capture(page, `${name}-${width}`);
    }
  });
