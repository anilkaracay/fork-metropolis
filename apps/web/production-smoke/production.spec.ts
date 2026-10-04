import { expect, test } from "@playwright/test";

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
  const missing = await page.goto("/this-route-does-not-exist");
  expect(missing?.status()).toBe(404);
  for (const path of ["/api/health/database", "/api/feed", "/api/explore"]) {
    const response = await request.get(path);
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
