import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const check = process.argv.includes("--check");
for (const contract of ["FORKRegistry", "FORKBacking"]) {
  const artifact = JSON.parse(
    await readFile(
      `${root}contracts/out/${contract}.sol/${contract}.json`,
      "utf8",
    ),
  );
  const contents = `${JSON.stringify(artifact.abi, null, 2)}\n`;
  for (const path of [
    `packages/shared/src/abi/${contract}.json`,
    `indexer/abi/${contract}.json`,
  ]) {
    const destination = `${root}${path}`;
    if (check) {
      if ((await readFile(destination, "utf8")) !== contents)
        throw new Error(
          `${path} differs from the tested contract. Run pnpm abi:export and review the change.`,
        );
    } else {
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, contents);
    }
  }
}
console.log(
  check
    ? "Contract ABI copies match the compiled contracts."
    : "Exported contract ABIs to shared and self-contained indexer directories.",
);
