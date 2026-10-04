import { createHash } from "node:crypto";
import { mkdir, writeFile, chmod, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../.tools/", import.meta.url));
const platform = process.platform;
const arch = process.arch;
const target =
  platform === "darwin" && arch === "arm64"
    ? "darwin_arm64"
    : platform === "linux" && arch === "x64"
      ? "linux_amd64"
      : null;
if (!target) throw new Error("Supported tool setup: macOS arm64 or Linux x64.");

async function download(url) {
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok)
        throw new Error(`Tool download failed (${response.status}).`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt < 2)
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1)),
        );
    }
  }
  throw new Error(
    "Tool download failed. Check connectivity and rerun pnpm tools:install.",
    { cause: last },
  );
}

await mkdir(`${root}foundry`, { recursive: true });
const name = `foundry_v1.8.4_${target}`;
const base = `https://github.com/foundry-rs/foundry/releases/download/v1.8.4/${name}`;
const archive = await download(`${base}.tar.gz`);
const checksum = (await download(`${base}.sha256`))
  .toString()
  .trim()
  .split(/\s+/)[0];
if (createHash("sha256").update(archive).digest("hex") !== checksum) {
  throw new Error("Foundry checksum mismatch; installation stopped.");
}
await writeFile(`${root}foundry.tar.gz`, archive);
const extracted = spawnSync(
  "tar",
  [
    "-xzf",
    `${root}foundry.tar.gz`,
    "-C",
    `${root}foundry`,
    "forge",
    "cast",
    "anvil",
    "chisel",
  ],
  { stdio: "inherit" },
);
if (extracted.status !== 0) throw new Error("Foundry extraction failed.");
await unlink(`${root}foundry.tar.gz`);

const compilerPlatform = platform === "darwin" ? "macosx-amd64" : "linux-amd64";
const compilerBase = `https://binaries.soliditylang.org/${compilerPlatform}`;
const manifest = JSON.parse(
  (await download(`${compilerBase}/list.json`)).toString(),
);
const filename = manifest.releases["0.8.37"];
const build = manifest.builds.find((item) => item.path === filename);
if (!build)
  throw new Error("Pinned Solidity compiler is absent from official manifest.");
const compiler = await download(`${compilerBase}/${filename}`);
if (
  `0x${createHash("sha256").update(compiler).digest("hex")}` !== build.sha256
) {
  throw new Error("Solidity checksum mismatch; installation stopped.");
}
await writeFile(`${root}solc-0.8.37`, compiler);
await chmod(`${root}solc-0.8.37`, 0o755);
console.log(
  "Installed local Foundry 1.8.4 and solc 0.8.37; official SHA-256 checks passed.",
);
