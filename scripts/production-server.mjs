import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireWeb = createRequire(`${root}apps/web/package.json`);
if (process.env.FORK_TEST_MODE)
  throw new Error("Remove FORK_TEST_MODE before production smoke testing.");
const child = spawn(
  process.execPath,
  [
    requireWeb.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3002",
  ],
  {
    cwd: `${root}apps/web`,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit",
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", () => {
  console.error("Production server failed to start. Rebuild and retry.");
  process.exit(1);
});
