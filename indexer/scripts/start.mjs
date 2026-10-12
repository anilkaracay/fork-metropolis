import { spawnSync } from "node:child_process";
for (const contract of ["REGISTRY", "BACKING"]) {
  const address = process.env[`ENVIO_FORK_${contract}_ADDRESS`] ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/.test(address))
    throw new Error(
      "Configure the reviewed registry and backing addresses before starting live indexing. Codegen/tests need no deployment.",
    );
}
for (const block of [
  "ENVIO_FORK_START_BLOCK",
  "ENVIO_FORK_BACKING_START_BLOCK",
])
  if (!/^[1-9]\d*$/.test(process.env[block] ?? ""))
    throw new Error(
      "Configure both deployment start blocks before starting live indexing. Codegen/tests need no deployment.",
    );
if (process.env.ENVIO_CONFIG && process.env.ENVIO_CONFIG !== "config.yaml")
  throw new Error(
    "Live indexing only supports the reviewed config.yaml, not a test configuration.",
  );
const run = spawnSync("envio", ["dev"], { stdio: "inherit" });
process.exit(run.status ?? 1);
