import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";

// Set FORK_ONBOARDING_CAPTURE_DIR to keep review screenshots of these states.
async function capture(page: Page, name: string) {
  const directory = process.env.FORK_ONBOARDING_CAPTURE_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, `${name}.png`) });
}

test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset", { data: {} })).ok()).toBe(true);
});

test("a first sign-in claims a handle, receives the welcome drip and keeps the old profile link", async ({
  page,
  request,
}) => {
  // Alice exists first, so her handle is taken.
  await request.post("/api/test/identity", { data: { name: "alice" } });
  await page.goto("/feed");
  await page.getByLabel("Test identity").selectOption("dana");

  const dialog = page.getByRole("dialog", { name: "Choose your handle" });
  await expect(dialog).toBeVisible();
  const handle = dialog.getByLabel("Handle");
  const claim = dialog.getByRole("button", { name: "Claim handle" });
  await expect(claim).toBeDisabled();

  await handle.fill("ab");
  await expect(dialog.getByText("Use 3 to 20 characters.")).toBeVisible();
  await handle.fill("Dana-K");
  await expect(
    dialog.getByText("Use lowercase letters, numbers and underscores."),
  ).toBeVisible();
  await handle.fill("admin");
  await expect(
    dialog.getByText("That handle is reserved. Choose another."),
  ).toBeVisible();
  await handle.fill("alice");
  await expect(dialog.getByText("This handle is already taken.")).toBeVisible();
  await expect(claim).toBeDisabled();

  await handle.fill("Dana_K");
  await expect(handle).toHaveValue("dana_k");
  await expect(dialog.getByText("@dana_k is available.")).toBeVisible();
  await dialog.getByLabel("Display name").fill("Dana Kaya");
  await claim.click();
  await expect(dialog).toBeHidden();

  const account = page.locator(".sidebar-account");
  await expect(account.getByText("Dana Kaya")).toBeVisible();
  await expect(account.getByText("@dana_k")).toBeVisible();
  await expect(
    account.getByRole("button", { name: "Claim your handle" }),
  ).toHaveCount(0);

  // The welcome drip was requested without any action and shows in the balance.
  const wallet = page.getByRole("region", { name: "Your wallet" });
  await expect(wallet.locator(".wallet-balance")).toHaveText("0.2 MON");
  await expect(
    wallet.getByText("Your welcome drip has arrived."),
  ).toBeVisible();

  await page.goto("/u/dana_k");
  await expect(page.getByRole("heading", { name: "Dana Kaya" })).toBeVisible();
  // The generated handle this account started with still resolves.
  const profile = await (await request.get("/api/profiles/dana_k")).json();
  expect(profile.data.identity.handle).toBe("dana_k");
  const users = await request.post("/api/test/identity", {
    data: { name: "dana" },
  });
  expect((await users.json()).data.session).toMatchObject({
    handle: "dana_k",
    handleClaimed: true,
  });
});

test("putting the handle off keeps a prompt, and the generated link redirects after a later claim", async ({
  page,
}) => {
  await page.goto("/feed");
  await page.getByLabel("Test identity").selectOption("dana");
  const dialog = page.getByRole("dialog", { name: "Choose your handle" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Not now" }).click();
  await expect(dialog).toBeHidden();

  const account = page.locator(".sidebar-account");
  const generated = (await account.locator("small").innerText()).slice(1);
  expect(generated).toMatch(/^u_[0-9a-f]{12}$/);
  await page.reload();
  await expect(account.getByText(`@${generated}`)).toBeVisible();
  await expect(dialog).toBeHidden();

  await account.getByRole("button", { name: "Claim your handle" }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await account.getByRole("button", { name: "Claim your handle" }).click();
  await dialog.getByLabel("Handle").fill("later_dana");
  await expect(dialog.getByText("@later_dana is available.")).toBeVisible();
  await dialog.getByRole("button", { name: "Claim handle" }).click();
  await expect(account.getByText("@later_dana")).toBeVisible();

  await page.goto(`/u/${generated}`);
  await expect(page).toHaveURL(/\/u\/later_dana$/);
});

test("an empty faucet is stated plainly with a way forward", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post("/api/test/faucet", { data: { balanceWei: "0" } })
    ).ok(),
  ).toBe(true);
  await page.goto("/feed");
  await page.getByLabel("Test identity").selectOption("dana");
  await page
    .getByRole("dialog", { name: "Choose your handle" })
    .getByRole("button", { name: "Not now" })
    .click();
  const wallet = page.getByRole("region", { name: "Your wallet" });
  await expect(wallet.locator(".wallet-balance")).toHaveText("0 MON");
  await expect(
    wallet.getByText("The welcome faucet is empty right now."),
  ).toBeVisible();
  await expect(
    wallet.getByRole("link", { name: "Open the Monad faucet" }),
  ).toHaveAttribute("href", "https://faucet.monad.xyz");
});

for (const width of [1440, 1024, 768, 390, 375])
  test(`the handle dialog and wallet panel fit a ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width > 768 ? 900 : 780 });
    await page.goto("/feed");
    await page.getByLabel("Test identity").selectOption("dana");
    const dialog = page.getByRole("dialog", { name: "Choose your handle" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Handle").fill("dana_k");
    await expect(dialog.getByText("@dana_k is available.")).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await capture(page, `handle-claim-${width}`);
    await dialog.getByRole("button", { name: "Claim handle" }).click();
    await expect(dialog).toBeHidden();
    // Phones have no sidebar: the wallet sits on the owner's profile there.
    if (width <= 680)
      await page.getByRole("link", { name: "Profile", exact: true }).click();
    const wallet = page.getByRole("region", { name: "Your wallet" });
    await expect(wallet.locator(".wallet-balance")).toHaveText("0.2 MON");
    await wallet.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await capture(page, `wallet-panel-${width}`);
  });
