import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const screenshots = resolve("../../docs/assets/phase2");
type Identity = { token: string; session: { wallet: string; handle: string } };
const headers = (i: Identity) => ({
  authorization: `Bearer ${i.token}`,
  "x-fork-wallet": i.session.wallet,
});
async function identity(request: APIRequestContext, name: string) {
  const response = await request.post("/api/test/identity", { data: { name } });
  expect(response.ok()).toBe(true);
  return (await response.json()).data as Identity;
}
async function publish(
  request: APIRequestContext,
  i: Identity,
  options: {
    parentId?: string;
    side?: "long" | "short";
    marketId?: number;
    reasoning?: string;
    target?: string;
    leverage?: number;
  } = {},
) {
  const value = {
    parentId: options.parentId ?? "0",
    core: {
      marketId: options.marketId ?? 16,
      side: options.side ?? "long",
      targetPriceE8: options.target ?? "7400000000000",
      invalidationPriceE8:
        options.marketId === 32
          ? "260000000000"
          : options.marketId === 48
            ? "14000000000"
            : "6500000000000",
      leverageBps: options.leverage ?? 20000,
    },
    metadata: {
      reasoning:
        options.reasoning ??
        "BTC is building a higher low around the weekly support. I would wait for a daily close above resistance; the thesis fails below the last consolidation.",
      entryNote: "Wait for confirmation, then reconsider the risk.",
      tags: ["structure", "macro"],
    },
    requestKey: crypto.randomUUID(),
  };
  const draftResponse = await request.post("/api/theses/draft", {
    data: value,
    headers: headers(i),
  });
  expect(draftResponse.ok(), await draftResponse.text()).toBe(true);
  const draft = (await draftResponse.json()).data;
  const sent = await request.post("/api/test/submit", {
    data: { draftId: draft.draftId },
    headers: headers(i),
  });
  expect(sent.ok()).toBe(true);
  const txHash = (await sent.json()).data.txHash;
  const finalized = await request.post("/api/theses/finalize", {
    data: { draftId: draft.draftId, txHash },
    headers: headers(i),
  });
  expect(finalized.ok(), await finalized.text()).toBe(true);
  return String((await finalized.json()).data.thesisId);
}
async function select(page: Page, name: string) {
  await page.getByLabel("Test identity").selectOption(name);
  await expect(page.locator(".sidebar-account strong")).toHaveText(
    name === "alice"
      ? "Alice Chen"
      : name === "bob"
        ? "Bora Kaya"
        : "Carol Bennett",
  );
}
async function screenshot(page: Page, name: string) {
  await expect(page.locator(".app-layout")).toHaveCount(1);
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  await page.screenshot({ path: resolve(screenshots, name), fullPage: true });
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset", { data: {} })).ok()).toBe(true);
});
test("publish → second identity forks → Agree/comment → tree/profile, with review screenshots", async ({
  page,
  request,
}) => {
  await mkdir(screenshots, { recursive: true });
  await page.goto("/feed");
  await expect(page.getByText("The first idea starts with you.")).toBeVisible();
  await select(page, "alice");
  await page.getByRole("link", { name: "Create", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Market", exact: true })
    .selectOption("16");
  await page.getByLabel("Target", { exact: true }).fill("74000");
  await page.getByLabel("Invalidation", { exact: true }).fill("65000");
  await page
    .getByLabel("Reasoning", { exact: true })
    .fill(
      "BTC is building a higher low around weekly support. A daily close above resistance would support the next leg; a loss of the consolidation invalidates this idea.",
    );
  await page
    .getByLabel("Entry note", { exact: true })
    .fill("Wait for a daily close before taking a view.");
  await page.getByLabel("Tags", { exact: true }).fill("structure, macro");
  await page.getByRole("button", { name: "Publish on Monad" }).click();
  await expect(page).toHaveURL(/\/t\/1$/);
  await expect(page.getByText("Not executed", { exact: true })).toBeVisible();
  await select(page, "bob");
  await page.getByRole("link", { name: "Fork this idea", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Market", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("Forking")).toBeVisible();
  await page.getByLabel("Target", { exact: true }).fill("78000");
  await page.getByLabel("Leverage", { exact: true }).fill("3");
  await page
    .getByLabel("Reasoning", { exact: true })
    .fill(
      "I agree with the structure, but see room for a stronger continuation after the breakout. My higher target depends on spot demand holding through the retest.",
    );
  await expect(page.locator(".diff-list")).toContainText("Target");
  await screenshot(page, "fork-composer.png");
  await page.getByRole("button", { name: "Publish fork" }).click();
  await expect(page).toHaveURL(/\/t\/2$/);
  await expect(page.locator(".detail-provenance")).toContainText("@alice");
  await expect(page.getByText("What changed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Agree / }).click();
  await expect(page.getByRole("button", { name: /^Agreed / })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByLabel("Add a perspective")
    .fill("The retest is the key. What changes your view if volume fades?");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.locator(".comment-list")).toContainText(
    "What changes your view",
  );
  await screenshot(page, "detail.png");
  await page.getByRole("link", { name: "Open Idea Tree" }).click();
  await expect(page.locator(".tree-node")).toHaveCount(2);
  await expect(page.locator("li.current .node-bottom b")).toHaveText("Viewing");
  await screenshot(page, "tree-desktop.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot(page, "tree-mobile.png");
  await noOverflow(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/u/alice");
  await expect(page.locator(".reputation-grid")).toContainText("1 / 1");
  await expect(page.locator(".reputation-grid")).toContainText("Emerging");
  await screenshot(page, "profile.png");
  const alice = await identity(request, "alice"),
    bob = await identity(request, "bob"),
    carol = await identity(request, "carol");
  await publish(request, carol, {
    parentId: "1",
    side: "short",
    target: "6100000000000",
    reasoning:
      "The same structure could fail if the weekly level becomes resistance. I would challenge the bullish case until price reclaims the range with conviction.",
  });
  await publish(request, alice, {
    marketId: 32,
    target: "310000000000",
    reasoning:
      "ETH is compressing into a narrow range. A clean reclaim with broad participation would give the thesis a firmer foundation; below support I would reassess.",
  });
  await publish(request, bob, {
    marketId: 48,
    target: "19000000000",
    reasoning:
      "SOL strength depends on the retest holding. I prefer to describe the conditions first and leave room for someone else to improve the setup.",
  });
  await page.goto("/feed");
  await expect(page.locator(".thesis-card")).toHaveCount(5);
  await screenshot(page, "feed-desktop.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot(page, "feed-mobile.png");
  await noOverflow(page);
  await page.goto("/explore");
  await expect(page.locator(".market-topic")).toHaveCount(4);
  await expect(page.locator(".market-topic").first()).toContainText("3 ideas");
  await page.getByRole("button", { name: /BTC/ }).click();
  await expect(page.locator(".thesis-card")).toHaveCount(3);
  await noOverflow(page);
});
test("refresh after submission retries the same transaction without a second wallet send", async ({
  page,
}) => {
  await page.goto("/new");
  await select(page, "alice");
  await page
    .getByRole("combobox", { name: "Market", exact: true })
    .selectOption("16");
  await page.getByLabel("Target", { exact: true }).fill("74000");
  await page.getByLabel("Invalidation", { exact: true }).fill("65000");
  await page
    .getByLabel("Reasoning", { exact: true })
    .fill(
      "A recoverable thesis retains its transaction across a page refresh.",
    );
  let sends = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/test/submit")) sends++;
  });
  await page.route("**/api/theses/finalize", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Finalization briefly unavailable.",
          recovery: "Retry the same transaction.",
        },
      }),
    }),
  );
  await page.getByRole("button", { name: "Publish on Monad" }).click();
  await expect(
    page.getByText("Finalization briefly unavailable."),
  ).toBeVisible();
  await page.reload();
  await page.unroute("**/api/theses/finalize");
  await expect(
    page.getByRole("button", { name: "Check confirmation again" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check confirmation again" }).click();
  await expect(page).toHaveURL(/\/t\/1$/);
  expect(sends).toBe(1);
});
test("wrong-wallet auth, report moderation and safe text use the normal application routes", async ({
  request,
  page,
}) => {
  const alice = await identity(request, "alice"),
    bob = await identity(request, "bob"),
    carol = await identity(request, "carol"),
    id = await publish(request, alice);
  const wrong = await request.put(`/api/theses/${id}/agree`, {
    headers: { ...headers(alice), "x-fork-wallet": bob.session.wallet },
  });
  expect(wrong.status()).toBe(403);
  expect((await wrong.json()).error.code).toBe("WRONG_WALLET");
  for (let n = 0; n < 2; n++)
    expect(
      (
        await request.put(`/api/theses/${id}/agree`, { headers: headers(bob) })
      ).ok(),
    ).toBe(true);
  expect(
    (await (await request.get(`/api/theses/${id}`)).json()).data.social.agrees,
  ).toBe(1);
  await request.post(`/api/theses/${id}/comments`, {
    headers: headers(bob),
    data: {
      body: "<script>window.compromised=true</script>",
      requestKey: crypto.randomUUID(),
    },
  });
  await page.goto(`/t/${id}`);
  await expect(page.locator(".comment-list")).toContainText("<script>");
  expect(await page.evaluate(() => "compromised" in window)).toBe(false);
  const report = {
    reason: "spam",
    note: "Test moderation report.",
    requestKey: crypto.randomUUID(),
  };
  for (let n = 0; n < 2; n++)
    expect(
      (
        await request.post(`/api/theses/${id}/report`, {
          headers: headers(bob),
          data: report,
        })
      ).ok(),
    ).toBe(true);
  expect(
    (
      await request.put(`/api/moderation/${id}`, {
        headers: headers(bob),
        data: { hidden: true },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put(`/api/moderation/${id}`, {
        headers: headers(carol),
        data: { hidden: true },
      })
    ).ok(),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByText("This content is hidden after moderation."),
  ).toBeVisible();
  expect(
    (await (await request.get("/api/feed")).json()).data.items,
  ).toHaveLength(0);
  expect(
    (await (await request.get(`/api/theses/${id}/tree`)).json()).data.nodes,
  ).toHaveLength(1);
  expect(
    (
      await request.put(`/api/moderation/${id}`, {
        headers: headers(carol),
        data: { hidden: false },
      })
    ).ok(),
  ).toBe(true);
});
test("root-only, one child, depth four, and twenty descendants remain navigable on mobile", async ({
  request,
  page,
}) => {
  const alice = await identity(request, "alice"),
    bob = await identity(request, "bob"),
    carol = await identity(request, "carol");
  const root = await publish(request, alice);
  await page.goto(`/t/${root}/tree`);
  await expect(page.locator(".tree-node")).toHaveCount(1);
  let parent = root;
  for (let depth = 1; depth <= 4; depth++) {
    parent = await publish(request, depth % 2 ? bob : carol, {
      parentId: parent,
      side: depth % 2 ? "short" : "long",
      leverage: 20000 + depth * 10000,
    });
    if (depth === 1) {
      await page.goto(`/t/${parent}/tree`);
      await expect(page.locator(".tree-node")).toHaveCount(2);
    }
  }
  for (let n = 0; n < 17; n++)
    await publish(request, n % 2 ? bob : carol, {
      parentId: root,
      leverage: 30000 + n * 10000,
      side: n % 2 ? "long" : "short",
      reasoning:
        "A long reasoning field still needs to remain legible and safely bounded. "
          .repeat(7)
          .slice(0, 500),
    });
  expect(
    (
      await request.post("/api/profile", {
        headers: headers(bob),
        data: {
          handle: "perspective_builder_long",
          displayName: "A contributor with a deliberately long display name",
          bio: "Ideas evolve through discussion.",
        },
      })
    ).ok(),
  ).toBe(true);
  await page.goto(`/t/${parent}/tree`);
  await expect(page.locator(".tree-node")).toHaveCount(22);
  await expect(page.locator(".tree-context")).toContainText("depth 4");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await expect(page.locator("li.current > .tree-node")).toContainText(
    "Viewing",
  );
  await page
    .locator("li.current > .tree-node")
    .getByRole("link", { name: "Open idea" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/t/${parent}$`));
});
test("optimistic Agree rolls back on failure, profile editing refreshes identity, and keyboard focus is visible", async ({
  page,
  request,
}) => {
  const alice = await identity(request, "alice"),
    id = await publish(request, alice);
  await page.goto(`/t/${id}`);
  await select(page, "bob");
  const agree = page.getByRole("button", { name: /^Agree / });
  await expect(agree).toBeEnabled();
  await page.route("**/api/theses/*/agree", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Reaction unavailable.",
              recovery: "Try again.",
            },
          }),
        })
      : route.continue(),
  );
  await agree.click();
  await expect(page.getByText("Reaction unavailable.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Agree / })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(
    (await (await request.get(`/api/theses/${id}`)).json()).data.social.agrees,
  ).toBe(0);
  await page.unroute("**/api/theses/*/agree");
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/u\/bob$/);
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Handle", { exact: true }).fill("bora");
  await page.getByLabel("Display name", { exact: true }).fill("Bora Research");
  await page
    .getByRole("textbox", { name: "Bio", exact: true })
    .fill("Good questions improve ideas.");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page).toHaveURL(/\/u\/bora$/);
  await expect(page.locator(".sidebar-account strong")).toHaveText(
    "Bora Research",
  );
  await expect(page.locator(".profile-bio")).toHaveText(
    "Good questions improve ideas.",
  );
  await page.keyboard.press("Tab");
  await page.getByRole("link", { name: "Feed", exact: true }).focus();
  expect(
    await page
      .getByRole("link", { name: "Feed", exact: true })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/feed$/);
});
