import { spawnSync } from "node:child_process";
if (
  !/^0x[0-9a-fA-F]{40}$/.test(process.env.FORK_REGISTRY_ADDRESS ?? "") ||
  /^0x0{40}$/.test(process.env.FORK_REGISTRY_ADDRESS ?? "") ||
  !/^\d+$/.test(process.env.FORK_START_BLOCK ?? "")
) {
  throw new Error(
    "Configure the reviewed registry address and deployment start block before starting live indexing. Codegen/tests need no deployment.",
  );
}
if (process.env.ENVIO_CONFIG && process.env.ENVIO_CONFIG !== "config.yaml")
  throw new Error(
    "Live indexing only supports the reviewed config.yaml, not a test configuration.",
  );
const run = spawnSync("envio", ["dev"], { stdio: "inherit" });
process.exit(run.status ?? 1);
