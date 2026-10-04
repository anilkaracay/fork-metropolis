import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const forge = `${root}.tools/foundry/forge`;
const solc = `${root}.tools/solc-0.8.37`;
if (!existsSync(forge) || !existsSync(solc)) {
  console.error(
    "Install pinned local tools with pnpm tools:install, then retry.",
  );
  process.exit(1);
}
const args = process.argv.slice(2);
if (["build", "test", "snapshot"].includes(args[0])) args.push("--use", solc);
const result = spawnSync(forge, args, {
  cwd: `${root}contracts`,
  stdio: "inherit",
});
if (result.error)
  console.error("Foundry failed to start:", result.error.message);
process.exit(result.status ?? 1);
