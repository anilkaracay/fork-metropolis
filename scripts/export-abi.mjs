import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const artifact = JSON.parse(
  await readFile(
    `${root}contracts/out/FORKRegistry.sol/FORKRegistry.json`,
    "utf8",
  ),
);
const contents = `${JSON.stringify(artifact.abi, null, 2)}\n`;
for (const path of [
  "packages/shared/src/abi/FORKRegistry.json",
  "indexer/abi/FORKRegistry.json",
]) {
  const destination = `${root}${path}`;
  if (process.argv.includes("--check")) {
    if ((await readFile(destination, "utf8")) !== contents)
      throw new Error(
        `${path} differs from the tested contract. Run pnpm abi:export and review the change.`,
      );
  } else {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
}
console.log(
  process.argv.includes("--check")
    ? "Registry ABI copies match the compiled contract."
    : "Exported registry ABI to shared and self-contained indexer directories.",
);
