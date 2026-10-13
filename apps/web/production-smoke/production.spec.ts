import { expect, test } from "@playwright/test";

test("real published fork preserves its parent, changed fields and two-node tree", async ({
  request,
  page,
}) => {
  const id = process.env.FORK_SMOKE_FORK_ID;
  test.skip(!id, "Opt-in actual published fork only.");
  if (!id || !/^[1-9]\d*$/.test(id)) throw new Error("Use a real fork ID.");
  const response = await request.get(`/api/theses/${id}`);
  expect(response.status()).toBe(200);
  const fork = (await response.json()).data;
  expect(fork.metadataState).toBe("trusted");
  expect(fork.parent.thesisId).toBe(fork.graph.parentId);
  expect(fork.graph.parentId).not.toBe("0");
  expect(fork.changes.map((c: { field: string }) => c.field)).toEqual(
    expect.arrayContaining(["targetPriceE8", "leverageBps", "reasoning"]),
  );
  expect(fork.execution.state).toBe("not-executed");
  await page.goto(`/t/${id}`);
  await expect(
    page.getByRole("heading", { name: "What changed", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open Idea Tree", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "One idea. Many perspectives.",
      exact: true,
    }),
  ).toBeVisible();
  const nodes = page.locator(".tree-node-link");
  await expect(nodes).toHaveCount(2);
  await expect(
    page.locator(`.tree-node-link[href="/t/${id}/tree"]`),
  ).toHaveAttribute("aria-current", "page");
  await page
    .locator(`.tree-node-link[href="/t/${fork.graph.parentId}/tree"]`)
    .click();
  await expect(
    page.locator(`.tree-node-link[href="/t/${fork.graph.parentId}/tree"]`),
  ).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(`.tree-node-link[href="/t/${id}/tree"]`).click();
  await expect(nodes).toHaveCount(2);
  await expect(
    page.locator(`.tree-node-link[href="/t/${id}/tree"]`),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("real empty index serves Feed, Explore and zero-activity Profile", async ({
  request,
  page,
}) => {
  test.skip(
    process.env.FORK_SMOKE_EMPTY !== "1",
    "Opt-in real Cloud baseline only.",
  );
  const health = await request.get("/api/health/database");
  expect(health.status()).toBe(200);
  expect((await health.json()).ok).toBe(true);
  for (const mode of ["fresh", "most-forked", "smart-signal"]) {
    const response = await request.get(`/api/feed?mode=${mode}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.items).toEqual([]);
    expect(body.data.nextOffset).toBeNull();
    expect(body.data.bounded).toBe(false);
  }
  const explore = await request.get("/api/explore");
  expect(explore.status()).toBe(200);
  const discovery = await explore.json();
  expect(discovery.ok).toBe(true);
  expect(discovery.data.items).toEqual([]);
  expect(discovery.data.topics).toEqual([]);
  const handle = process.env.FORK_SMOKE_PROFILE_HANDLE!;
  const profile = await request.get(`/api/profiles/${handle}`);
  expect(profile.status()).toBe(200);
  const body = await profile.json();
  expect(body.ok).toBe(true);
  expect(body.data.recent).toEqual([]);
  for (const field of [
    "eligibleRoots",
    "successfulRoots",
    "eligibleForks",
    "successfulForks",
    "influence",
    "executionsInspired",
  ])
    expect(body.data.reputation[field]).toBe(0);
  expect(body.data.scope.chainId).toBe(10143);
  for (const [path, title] of [
    ["/feed", "The first idea starts with you."],
    ["/explore", "A conversation waiting to start."],
    [`/u/${handle}`, "The next idea is unwritten."],
  ]) {
    await page.goto(path!);
    await expect(
      page.getByRole("heading", { name: title!, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Local test workspace · simulated confirmations"),
    ).toHaveCount(0);
  }
});

test("production public screens and mobile layout never expose the test workspace", async ({
  page,
}) => {
  for (const path of ["/feed", "/explore", "/u/me"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("Local test workspace · simulated confirmations"),
    ).toHaveCount(0);
    await expect(page.getByLabel("Test identity")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Feed", exact: true }).first(),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/feed");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("all test mutations are unavailable and unauthenticated publication cannot succeed", async ({
  request,
}) => {
  expect((await request.get("/dev/privy")).status()).toBe(404);
  for (const endpoint of ["identity", "submit", "reset"]) {
    const r = await request.post(`/api/test/${endpoint}`, {
      data: { name: "alice" },
    });
    expect(r.status()).toBe(404);
    const body = await r.json();
    expect(body.error.code).toBe("NOT_FOUND");
  }
  const r = await request.post("/api/theses/draft", { data: {} });
  if (process.env.FORK_SMOKE_LIVE === "1") expect(r.status()).toBe(401);
  else expect([401, 503]).toContain(r.status());
  expect((await r.json()).ok).toBe(false);
});

test("404, database recovery and real service reads have honest states", async ({
  request,
  page,
}) => {
  test.setTimeout(120000);
  const missing = await page.goto("/this-route-does-not-exist");
  expect(missing?.status()).toBe(404);
  for (const path of ["/api/health/database", "/api/feed", "/api/explore"]) {
    let response = await request.get(path);
    // The hosted indexer's per-minute limit is shared by the whole smoke run. A graph read
    // it refused is asked again once the window has passed; the database check never is.
    for (
      let attempt = 0;
      process.env.FORK_SMOKE_LIVE === "1" &&
      path !== "/api/health/database" &&
      response.status() === 503 &&
      attempt < 2;
      attempt++
    ) {
      await new Promise((done) => setTimeout(done, 20000));
      response = await request.get(path);
    }
    const body = await response.json();
    if (process.env.FORK_SMOKE_LIVE === "1") {
      expect(response.status(), path).toBe(200);
      expect(body.ok).toBe(true);
    } else {
      expect([200, 503]).toContain(response.status());
      if (response.status() === 503)
        expect(body.error.recovery.length).toBeGreaterThan(0);
    }
  }
  if (process.env.FORK_SMOKE_THESIS_ID) {
    if (!/^[1-9]\d*$/.test(process.env.FORK_SMOKE_THESIS_ID))
      throw new Error("Use a real thesis ID.");
    const r = await request.get(
      `/api/theses/${process.env.FORK_SMOKE_THESIS_ID}`,
    );
    expect(r.status()).toBe(200);
    await page.goto(`/t/${process.env.FORK_SMOKE_THESIS_ID}`);
    await expect(
      page.getByRole("link", { name: "Fork this idea", exact: true }),
    ).toBeVisible();
  }
});
