import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const requireWeb = createRequire("/app/apps/web/package.json");
const port = process.env.PORT ?? "3000";
const host = process.env.FORK_LISTEN_HOST ?? "0.0.0.0";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
  throw new Error("Configure a valid application port.");
if (!["0.0.0.0", "127.0.0.1", "::"].includes(host))
  throw new Error("Configure a supported application bind address.");
if (process.env.FORK_TEST_MODE)
  throw new Error("Test adapters must be absent from production.");
const child = spawn(
  process.execPath,
  [requireWeb.resolve("next/dist/bin/next"), "start", "-H", host, "-p", port],
  { cwd: "/app/apps/web", env: process.env, stdio: "inherit" },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("error", () => {
  console.error("Application startup failed. Check the image and restart.");
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
