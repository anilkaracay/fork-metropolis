import { defineConfig, devices } from "@playwright/test";

const origin = process.env.FORK_SMOKE_ORIGIN ?? "http://127.0.0.1:3002";
const parsed = new URL(origin);
if (
  parsed.username ||
  parsed.password ||
  parsed.search ||
  parsed.hash ||
  parsed.pathname !== "/" ||
  (parsed.protocol !== "https:" &&
    !(
      parsed.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(parsed.hostname)
    ))
)
  throw new Error(
    "Use a stable HTTPS origin or local loopback origin without credentials or paths.",
  );
if (
  process.env.FORK_SMOKE_LIVE === "1" &&
  !/^[1-9]\d*$/.test(process.env.FORK_SMOKE_THESIS_ID ?? "")
)
  throw new Error(
    "Live staging smoke requires FORK_SMOKE_THESIS_ID for a real indexed thesis.",
  );
if (process.env.FORK_SMOKE_EMPTY === "1") {
  if (process.env.FORK_SMOKE_LIVE === "1" || process.env.FORK_SMOKE_THESIS_ID)
    throw new Error("Empty-index smoke cannot use an existing thesis.");
  if (!/^[a-z0-9_]{3,24}$/.test(process.env.FORK_SMOKE_PROFILE_HANDLE ?? ""))
    throw new Error(
      "Empty-index smoke requires an existing real profile handle.",
    );
}

export default defineConfig({
  testDir: "./production-smoke",
  workers: 1,
  retries: 0,
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: parsed.origin,
    ...(process.platform === "darwin" ? { channel: "chrome" } : {}),
    trace: "off",
    screenshot: "off",
  },
  ...(!process.env.FORK_SMOKE_ORIGIN
    ? {
        webServer: {
          command: "node ../../scripts/production-server.mjs",
          url: origin,
          reuseExistingServer: false,
          timeout: 30000,
        },
      }
    : {}),
});
