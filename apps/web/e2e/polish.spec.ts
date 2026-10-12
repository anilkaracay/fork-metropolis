import { test, expect, type APIRequestContext } from "@playwright/test";
async function seed(request: APIRequestContext) {
  const person = async (name: string) =>
    (
      await (
        await request.post("/api/test/identity", { data: { name } })
      ).json()
    ).data;
  const a = await person("alice"),
    b = await person("bob");
  async function publish(
    user: typeof a,
    parentId: string,
    target: string,
    leverage: number,
    reasoning: string,
  ) {
    const headers = {
      authorization: `Bearer ${user.token}`,
      "x-fork-wallet": user.session.wallet,
    };
    const response = await request.post("/api/theses/draft", {
      headers,
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
    expect(response.ok()).toBe(true);
    const draft = (await response.json()).data;
    const sent = await request.post("/api/test/submit", {
      headers,
      data: { draftId: draft.draftId },
    });
    const final = await request.post("/api/theses/finalize", {
      headers,
      data: { draftId: draft.draftId, txHash: (await sent.json()).data.txHash },
    });
    expect(final.ok()).toBe(true);
    return String((await final.json()).data.thesisId);
  }
  const root = await publish(
      a,
      "0",
      "420000000000",
      20000,
      "A careful original perspective that other authors can improve.",
    ),
    fork = await publish(
      b,
      root,
      "440000000000",
      30000,
      "A different angle on the target, keeping invalidation explicit.",
    );
  return { root, fork, a, b };
}
test.beforeEach(async ({ request }) =>
  expect((await request.post("/api/test/reset", { data: {} })).ok()).toBe(true),
);
test("trusted Feed differences and Explore filters preserve root/fork discovery", async ({
  page,
  request,
}) => {
  const { root, fork } = await seed(request);
  await page.goto("/feed");
  const card = page.locator(`[data-thesis-id="${fork}"]`);
  await expect(card).toContainText(`Forked from #${root}`);
  await expect(card.locator(".card-change-summary")).toContainText("$4,200");
  await expect(card.locator(".card-change-summary")).toContainText("$4,400");
  for (const name of ["Most Forked", "Smart Signal", "Fresh"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".thesis-card")).toHaveCount(2);
  }
  await page.goto("/explore");
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  await page.getByLabel("Idea type").selectOption("forks");
  await expect(page.locator(".thesis-card")).toHaveCount(1);
  await expect(page.locator(".thesis-card")).toHaveAttribute(
    "data-thesis-id",
    fork,
  );
  await page.getByLabel("Search ideas").fill("no-match-here");
  await expect(
    page.getByRole("heading", { name: "No ideas match yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all ideas" }).click();
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  await page.getByRole("button", { name: "BTC 0 ideas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No ideas match yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Search ideas").fill("alice");
  await expect(page.locator(".thesis-card")).toHaveAttribute(
    "data-thesis-id",
    root,
  );
});
test("read errors offer recovery and failed refreshes retain explicitly labeled successful data", async ({
  page,
  request,
}) => {
  await seed(request);
  let fail = true;
  let release: (() => void) | undefined;
  const loadingGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/feed?*", (route) =>
    fail
      ? loadingGate.then(() =>
          route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              ok: false,
              error: {
                code: "UPSTREAM_UNAVAILABLE",
                message: "The data source did not respond.",
                recovery: "Retry shortly. Your data has not been changed.",
              },
            }),
          }),
        )
      : route.continue(),
  );
  await page.goto("/feed");
  await expect(
    page.getByRole("status", { name: "Loading ideas" }),
  ).toBeVisible();
  release!();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "The data source did not respond.",
  );
  await expect(page.locator(".thesis-card")).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  fail = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Showing the last loaded ideas.",
  );
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  fail = false;
  await page
    .getByRole("button", { name: "Retry refresh", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  let explored = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/api/explore") explored++;
  });
  // Feed and Explore both list two ideas, so wait for each route before counting reads.
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  await page.getByRole("link", { name: "Feed", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  expect(explored).toBe(1);
});
test("Create field feedback and contributor copy/filter behavior remain usable on mobile", async ({
  page,
  request,
  context,
}) => {
  const { a } = await seed(request);
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/new");
  await page.getByLabel("Target", { exact: true }).fill("0");
  await page.getByLabel("Reasoning", { exact: true }).fill("short");
  await page.getByLabel("Entry note", { exact: true }).focus();
  await expect(page.getByLabel("Target", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Reasoning", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Target", { exact: true }).fill("4200");
  await page
    .getByLabel("Reasoning", { exact: true })
    .fill("A clear argument that remains an unsent draft.");
  await expect(page.getByLabel("Target", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  const publish = page.getByRole("button", { name: "Publish on Monad" });
  await publish.scrollIntoViewIfNeeded();
  const button = await publish.boundingBox(),
    nav = await page.locator(".main-nav").boundingBox();
  expect(button!.y + button!.height).toBeLessThanOrEqual(nav!.y);
  await page.goto("/u/alice");
  await expect(page.locator(".reputation-grid")).toContainText("Emerging");
  await expect(page.locator(".reputation-grid")).toContainText("1 / 1");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy wallet address" }).click();
  await expect(
    page.getByRole("button", { name: "Copy wallet address" }),
  ).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    a.session.wallet,
  );
  await page.getByRole("button", { name: "Forks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The next idea is unwritten." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("a missing market label keeps onchain parameters readable and offers recovery", async ({
  page,
  request,
}) => {
  await seed(request);
  await page.route("**/api/context", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "Market context unavailable.",
          recovery: "Retry market context.",
        },
      }),
    }),
  );
  await page.goto("/feed");
  await expect(page.locator(".thesis-card")).toHaveCount(2);
  await expect(page.locator(".market-symbol").first()).toHaveText("Market 32");
  await expect(
    page.getByRole("button", { name: "Retry market label" }).first(),
  ).toBeVisible();
  await expect(page.locator('[data-thesis-id="2"] .parameters')).toContainText(
    "$4,400",
  );
  await page.unroute("**/api/context");
  await page
    .getByRole("button", { name: "Retry market label" })
    .first()
    .click();
  await expect(page.locator(".market-symbol").first()).toHaveText("ETH");
  await expect(
    page.getByRole("button", { name: "Retry market label" }),
  ).toHaveCount(0);
});
