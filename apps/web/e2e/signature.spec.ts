import { test, expect, type APIRequestContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

type Identity = { token: string; session: { wallet: string } };
const headers = (i: Identity) => ({
  authorization: `Bearer ${i.token}`,
  "x-fork-wallet": i.session.wallet,
});
async function person(request: APIRequestContext, name: string) {
  const r = await request.post("/api/test/identity", { data: { name } });
  expect(r.ok()).toBe(true);
  return (await r.json()).data as Identity;
}
async function publish(
  request: APIRequestContext,
  identity: Identity,
  parentId = "0",
  target = "420000000000",
  leverage = 20000,
  reasoning = "A real test perspective with enough reasoning to preserve attribution.",
) {
  const r = await request.post("/api/theses/draft", {
    headers: headers(identity),
    data: {
      parentId,
      core: {
        marketId: 32,
        side: "long",
        targetPriceE8: target,
        invalidationPriceE8: "360000000000",
        leverageBps: leverage,
      },
      metadata: { reasoning, tags: ["eth"], entryNote: null },
      requestKey: crypto.randomUUID(),
    },
  });
  expect(r.ok(), await r.text()).toBe(true);
  const d = (await r.json()).data;
  const sent = await request.post("/api/test/submit", {
    headers: headers(identity),
    data: { draftId: d.draftId },
  });
  expect(sent.ok()).toBe(true);
  const f = await request.post("/api/theses/finalize", {
    headers: headers(identity),
    data: { draftId: d.draftId, txHash: (await sent.json()).data.txHash },
  });
  expect(f.ok()).toBe(true);
  return String((await f.json()).data.thesisId);
}
test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset", { data: {} })).ok()).toBe(true);
});
test("depth and sibling selection compare the immediate parent, including keyboard and narrow screens", async ({
  page,
  request,
}) => {
  const a = await person(request, "alice"),
    b = await person(request, "bob"),
    c = await person(request, "carol");
  const root = await publish(request, a),
    child = await publish(request, b, root, "440000000000", 30000),
    grandchild = await publish(request, c, child, "460000000000", 40000);
  for (let i = 0; i < 8; i++)
    await publish(
      request,
      i % 2 ? a : b,
      root,
      String(470000000000 + i * 100000000),
      30000 + i * 10000,
    );
  await page.goto(`/t/${grandchild}`);
  await expect(page.locator(".fork-diff")).toContainText(
    `Changes from #${child}`,
  );
  await expect(page.locator('[data-diff-field="targetPriceE8"]')).toContainText(
    "$4,400",
  );
  await expect(page.locator('[data-diff-field="targetPriceE8"]')).toContainText(
    "$4,600",
  );
  await page.getByRole("link", { name: "Open Idea Tree", exact: true }).click();
  await expect(page.locator(".tree-node")).toHaveCount(11);
  const panel = page.getByRole("complementary", {
    name: "Selected perspective",
  });
  await expect(panel).toContainText(`Changes from #${child}`);
  await expect(
    panel.locator('[data-diff-field="targetPriceE8"]'),
  ).toContainText("$4,400");
  await expect(
    panel.locator('[data-diff-field="targetPriceE8"]'),
  ).toContainText("$4,600");
  await expect(panel.locator(".unchanged-list")).toContainText("$3,600");
  await page.locator(`[data-node-select][href="/t/${root}/tree"]`).focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.locator(`[data-node-select][href="/t/${child}/tree"]`),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/t/${child}/tree$`));
  await expect(panel).toContainText(`Changes from #${root}`);
  for (const width of [1440, 1280, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const captureDir = process.env.FORK_SIGNATURE_TEST_CAPTURE_DIR;
    if (captureDir && (width === 1440 || width === 375)) {
      await mkdir(captureDir, { recursive: true });
      await page.screenshot({
        path: join(captureDir, `isolated-eleven-node-tree-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page
    .getByRole("link", { name: new RegExp(`Viewing #${child} · Compare`) })
    .click();
  await expect(panel).toBeInViewport();
  await panel
    .getByRole("link", { name: `Select parent #${root}`, exact: true })
    .click();
  await expect(panel).toContainText("The original perspective");
});
test("fork editing shows canonical changes, revert and invalid-field recovery without a wallet request", async ({
  page,
  request,
}) => {
  const root = await publish(request, await person(request, "alice"));
  await page.goto(`/t/${root}/fork`);
  await page.getByLabel("Test identity").selectOption("bob");
  await expect(page.locator(".sidebar-account strong")).toHaveText("Bora Kaya");
  const diff = page.getByRole("region", { name: "Live draft comparison" });
  await expect(diff).toContainText("No changes yet");
  await page.getByLabel("Target", { exact: true }).fill("4400");
  await page.getByLabel("Leverage", { exact: true }).fill("3");
  await expect(diff.locator('[data-diff-field="targetPriceE8"]')).toContainText(
    "$4,400",
  );
  await expect(diff.locator('[data-diff-field="leverageBps"]')).toContainText(
    "3×",
  );
  await page.getByLabel("Reasoning", { exact: true }).fill("");
  await expect(diff).toContainText("Finish reasoning");
  await expect(diff.locator('[data-diff-field="targetPriceE8"]')).toBeVisible();
  await page
    .getByLabel("Reasoning", { exact: true })
    .fill(
      "An independently attributed improvement to the continuation thesis.",
    );
  await diff.getByText("Reasoning", { exact: true }).click();
  await expect(diff).toContainText("independently attributed");
  await page.getByLabel("Target", { exact: true }).fill("4200");
  await expect(diff.locator('[data-diff-field="targetPriceE8"]')).toHaveCount(
    0,
  );
  for (const width of [1440, 1280, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  // Unchanged publishing behavior is exercised by the existing social journey.
  await expect(
    page.getByRole("button", { name: "Publish fork", exact: true }),
  ).toBeEnabled();
});
test("root, unavailable metadata and unknown identities keep honest recovery states", async ({
  page,
  request,
}) => {
  const root = await publish(request, await person(request, "alice"));
  await page.goto(`/t/${root}/tree`);
  await expect(page.locator(".tree-node")).toHaveCount(1);
  await expect(
    page.getByText("The original perspective", { exact: true }),
  ).toBeVisible();
  await page.goto(`/t/${root}`);
  await expect(
    page.getByText("No child perspectives yet.", { exact: false }),
  ).toBeVisible();
  await page.route("**/api/theses/" + root, async (route) => {
    const response = await route.fetch();
    const value = await response.json();
    value.data.metadataState = "missing";
    value.data.metadata = null;
    await route.fulfill({ json: value });
  });
  await page.reload();
  await expect(
    page.getByText("Reasoning is not available yet.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check again", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Fork this idea", exact: true }),
  ).toHaveCount(0);
  await page.goto("/t/999999");
  await expect(page.locator(".error-box[role=alert]")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
});
