import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

type Person = { token: string; session: { wallet: string; handle: string } };
const headers = (person: Person) => ({
  authorization: `Bearer ${person.token}`,
  "x-fork-wallet": person.session.wallet,
});
async function person(request: APIRequestContext, name: string) {
  const response = await request.post("/api/test/identity", { data: { name } });
  return (await response.json()).data as Person;
}
async function publish(
  request: APIRequestContext,
  author: Person,
  parentId: string,
  target: string,
) {
  const draft = await request.post("/api/theses/draft", {
    headers: headers(author),
    data: {
      parentId,
      core: {
        marketId: 32,
        side: "long",
        targetPriceE8: target,
        invalidationPriceE8: "360000000000",
        leverageBps: 20000,
      },
      metadata: {
        reasoning: `A perspective with target ${target} that others can improve.`,
        tags: ["eth"],
        entryNote: null,
      },
      requestKey: crypto.randomUUID(),
    },
  });
  expect(draft.ok(), await draft.text()).toBe(true);
  const { draftId } = (await draft.json()).data;
  const sent = await request.post("/api/test/submit", {
    headers: headers(author),
    data: { draftId },
  });
  const final = await request.post("/api/theses/finalize", {
    headers: headers(author),
    data: { draftId, txHash: (await sent.json()).data.txHash },
  });
  expect(final.ok(), await final.text()).toBe(true);
  return String((await final.json()).data.thesisId);
}
// Alice publishes #1, Bob forks it as #2, Carol forks that as #3.
async function lineage(request: APIRequestContext) {
  const alice = await person(request, "alice"),
    bob = await person(request, "bob"),
    carol = await person(request, "carol");
  const root = await publish(request, alice, "0", "420000000000");
  const fork = await publish(request, bob, root, "440000000000");
  const leaf = await publish(request, carol, fork, "460000000000");
  return { alice, bob, carol, root, fork, leaf };
}
async function signIn(page: Page, name: string) {
  await page.getByLabel("Test identity").selectOption(name);
  const dialog = page.getByRole("dialog", { name: "Choose your handle" });
  if (name === "dana") {
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Not now" }).click();
  }
  // The welcome drip arrives without any action.
  await expect(
    page
      .getByRole("region", { name: "Your wallet" })
      .locator(".wallet-balance"),
  ).toContainText(/0\.2\d* MON/);
}

test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset", { data: {} })).ok()).toBe(true);
});

test("backing a fork shows the split, confirms, and credits the whole lineage", async ({
  page,
  request,
}) => {
  const { leaf, root } = await lineage(request);
  await page.goto(`/t/${leaf}`);
  await signIn(page, "dana");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: /Back @carol's idea/ });
  await expect(sheet).toBeVisible();

  // 0.1 MON is preselected: 70% to the author, 20% and 10% to the ideas it grew from.
  const rows = sheet
    .getByRole("region", { name: "Where it goes" })
    .getByRole("listitem");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("@carol");
  await expect(rows.nth(0)).toContainText("0.07 MON");
  await expect(rows.nth(1)).toContainText("@bob");
  await expect(rows.nth(1)).toContainText("0.02 MON");
  await expect(rows.nth(2)).toContainText("@alice");
  await expect(rows.nth(2)).toContainText("0.01 MON");
  await sheet.getByText("0.05 MON", { exact: true }).click();
  await expect(rows.nth(0)).toContainText("0.035 MON");

  await sheet.getByText("Custom", { exact: true }).click();
  const custom = sheet.getByLabel("Custom amount in MON");
  await custom.fill("0.001");
  await expect(sheet.getByRole("alert")).toContainText(
    "The smallest backing is 0.01 MON.",
  );
  await custom.fill("5");
  await expect(sheet.getByRole("alert")).toContainText(
    "Your wallet holds 0.2 MON.",
  );
  await expect(
    sheet.getByRole("button", { name: /Back with|Choose an amount/ }),
  ).toBeDisabled();

  await sheet.getByText("0.1 MON", { exact: true }).click();
  await sheet.getByRole("button", { name: "Back with 0.1 MON" }).click();
  await expect(
    sheet.getByRole("heading", { name: "Backed with 0.1 MON" }),
  ).toBeVisible();
  await expect(
    sheet.getByText(/^Confirmed in the test workspace in \d+(\.\d)? s$/),
  ).toBeVisible();
  await expect(
    sheet.getByText("You are supporter 1 of the first 10."),
  ).toBeVisible();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();

  const panel = page.getByRole("region", { name: "Backing", exact: true });
  await expect(panel.locator(".backing-total strong")).toContainText("0.1");
  await expect(panel).toContainText("1 backer · 1 backing");
  await expect(panel).toContainText("Passed on to the ideas it grew from");
  await expect(panel).toContainText("0.03 MON");
  await expect(
    page
      .getByRole("region", { name: "Your wallet" })
      .locator(".wallet-balance"),
  ).toHaveText("0.1 MON");

  // The tree shows the value arriving at both ancestors.
  await page.goto(`/t/${leaf}/tree`);
  const flow = page.locator(".value-flow");
  await expect(flow).toContainText("0.02 MON");
  await expect(flow).toContainText("0.01 MON");
  await expect(page.locator(`#idea-node-${root}`)).toContainText(
    "+0.01 MON from forks",
  );

  // The feed card carries the summary.
  await page.goto("/feed");
  await expect(page.locator(`[data-thesis-id="${leaf}"]`)).toContainText(
    "0.1 MON · 1 backer",
  );
});

test("an author cannot back their own idea, and earnings can be withdrawn", async ({
  page,
  request,
}) => {
  const { alice, leaf, root } = await lineage(request);
  const dana = await person(request, "dana");
  expect(
    (await request.post("/api/account/drip", { headers: headers(dana) })).ok(),
  ).toBe(true);
  const backed = await request.post("/api/test/back", {
    headers: headers(dana),
    data: { thesisId: leaf, amountWei: "100000000000000000" },
  });
  expect(backed.ok(), await backed.text()).toBe(true);

  await page.goto(`/t/${leaf}`);
  await signIn(page, "carol");
  await page.getByRole("button", { name: /^Back/ }).click();
  const sheet = page.getByRole("dialog", { name: /Back @carol's idea/ });
  await expect(
    sheet.getByText("You wrote this idea. Backing comes from other people."),
  ).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Back with/ })).toBeDisabled();
  await sheet.getByRole("button", { name: "Close" }).click();

  // Alice wrote the origin: 10% of the backing reached her as fork earnings.
  await signIn(page, "alice");
  await page.goto(`/u/${alice.session.handle}`);
  const earnings = page.getByRole("region", {
    name: "Backing earned and given",
  });
  await expect(earnings).toContainText("Earned from forks");
  const claimable = earnings.locator("div", { hasText: "Claimable" }).last();
  await expect(claimable.locator("dd")).toHaveText("0.01 MON");
  await claimable.getByRole("button", { name: "Withdraw 0.01 MON" }).click();
  await expect(
    claimable.getByText(/^Confirmed in the test workspace in/),
  ).toBeVisible();
  await expect(claimable.locator("dd")).toHaveText("0 MON");
  await expect(claimable).toContainText("0.01 MON withdrawn so far.");
  await expect(claimable.getByRole("button", { name: /Withdraw/ })).toHaveCount(
    0,
  );
  await expect(
    page
      .getByRole("region", { name: "Your wallet" })
      .locator(".wallet-balance"),
  ).toHaveText("0.21 MON");

  // The same thesis id on the test API refuses self backing and dust.
  const self = await request.post("/api/test/back", {
    headers: headers(alice),
    data: { thesisId: root, amountWei: "100000000000000000" },
  });
  expect((await self.json()).error.code).toBe("SELF_BACKING");
});

test("the Back sheet fits a phone and keeps its primary action reachable", async ({
  page,
  request,
}) => {
  const { leaf } = await lineage(request);
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto(`/t/${leaf}`);
  await page.getByLabel("Test identity").selectOption("dana");
  await page
    .getByRole("dialog", { name: "Choose your handle" })
    .getByRole("button", { name: "Not now" })
    .click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: /Back @carol's idea/ });
  await expect(sheet).toBeVisible();
  const box = (await sheet.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await expect(sheet.getByRole("button", { name: /Back with/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
