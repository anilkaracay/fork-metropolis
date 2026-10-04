import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    ...(process.platform === "darwin" ? { channel: "chrome" } : {}),
  },
  webServer: {
    command: "node ../../scripts/test-dev.mjs",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: process.env.FORK_E2E_REUSE_SERVER === "1",
    timeout: 120000,
  },
});
