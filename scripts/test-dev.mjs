import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
if (process.env.NODE_ENV === "production")
  throw new Error("Test workspace cannot run in production.");
const root = fileURLToPath(new URL("../", import.meta.url));
const requireWeb = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);
const nextBin = requireWeb.resolve("next/dist/bin/next");
const secret = randomBytes(32).toString("hex"),
  children = [];
const childEnv = { ...process.env };
if (childEnv.FORCE_COLOR) delete childEnv.NO_COLOR;
// Spawn Node directly: a package-manager intermediary can detach its server children.
const bridge = spawn(
  process.execPath,
  ["--experimental-strip-types", "src/test-server.ts"],
  {
    cwd: `${root}indexer`,
    env: {
      ...childEnv,
      NODE_ENV: "test",
      ENVIO_CONFIG: "config.test.yaml",
      FORK_TEST_SECRET: secret,
    },
    stdio: ["ignore", "pipe", "inherit"],
  },
);
children.push(bridge);
let started = false,
  stopping = false;
bridge.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  if (!started && String(chunk).includes("harness ready")) {
    started = true;
    const web = spawn(
      process.execPath,
      [nextBin, "dev", "--hostname", "127.0.0.1"],
      {
        cwd: `${root}apps/web`,
        env: {
          ...childEnv,
          NODE_ENV: "development",
          FORK_TEST_MODE: "1",
          FORK_TEST_MIGRATIONS_DIR: `${root}packages/db/migrations`,
          FORK_TEST_SECRET: secret,
        },
        stdio: "inherit",
      },
    );
    children.push(web);
    web.on("exit", (code) => stop(code ?? 1));
    web.on("error", () => stop(1));
  }
});
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  const timeout = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
    process.exit(code);
  }, 2000);
  timeout.unref();
  Promise.all(
    children.map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise((resolve) => child.once("exit", resolve)),
    ),
  ).then(() => process.exit(code));
}
bridge.on("exit", (code) => stop(code ?? 1));
bridge.on("error", () => stop(1));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
