import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const passwordPath = new URL("../.env.postgres.password", import.meta.url);
const envPath = new URL("../apps/web/.env.local", import.meta.url);

try {
  const previous = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const configured = previous.match(/^DATABASE_URL=(.*)$/m)?.[1];
  if (configured) {
    const url = new URL(configured.replace(/^["']|["']$/g, ""));
    if (
      url.hostname !== "127.0.0.1" ||
      url.port !== "5432" ||
      url.username !== "fork_dev" ||
      url.pathname !== "/fork_dev"
    ) {
      throw new Error("Another database is configured");
    }
    if (!existsSync(passwordPath))
      throw new Error("Local password file absent");
    if (
      decodeURIComponent(url.password) !==
      readFileSync(passwordPath, "utf8").trim()
    )
      throw new Error("Local password mismatch");
  }
  if (!existsSync(passwordPath)) {
    writeFileSync(passwordPath, randomBytes(32).toString("hex"), {
      mode: 0o600,
      flag: "wx",
    });
  }
  chmodSync(passwordPath, 0o600);
  const password = readFileSync(passwordPath, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(password))
    throw new Error("Invalid local password");
  const setting = `DATABASE_URL=postgresql://fork_dev:${password}@127.0.0.1:5432/fork_dev`;
  const next = configured
    ? previous.replace(/^DATABASE_URL=.*$/m, setting)
    : `${previous}${previous && !previous.endsWith("\n") ? "\n" : ""}${setting}\n`;
  writeFileSync(envPath, next, { mode: 0o600 });
  chmodSync(envPath, 0o600);
} catch {
  console.error(
    "Local database configuration failed. Check ignored .env.postgres.password and apps/web/.env.local for a matching local development connection; an existing non-local connection is never overwritten. No credentials are logged.",
  );
  process.exit(1);
}

const result = spawnSync(
  "docker",
  ["compose", "up", "-d", "--wait", "--wait-timeout", "60", "postgres"],
  { cwd: root, stdio: "inherit", timeout: 300000 },
);
if (result.error || result.status !== 0) {
  console.error(
    "Local PostgreSQL startup failed. Start Docker Desktop and check localhost port 5432, then retry pnpm db:up. The data volume and password are retained.",
  );
  process.exit(1);
}
console.log(
  "Local PostgreSQL is healthy; DATABASE_URL is configured securely.",
);
