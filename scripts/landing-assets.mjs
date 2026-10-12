import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Generates the static artwork the landing page uses, from pinned packages:
//   avatars      DiceBear "notionists" (artwork CC0 1.0, a remix of Notionists by Zoish)
//   token marks  @web3icons/core branded marks (package MIT; marks belong to their projects)
//   tech marks   simple-icons (CC0 1.0; marks belong to their owners)
// The output under apps/web/public/landing is committed, so the site never needs these packages.
// Run: node scripts/landing-assets.mjs

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(`${root}package.json`);
const out = `${root}apps/web/public/landing/`;
const { Avatar, Style } = await import("@dicebear/core");
const notionists = new Style(
  JSON.parse(
    readFileSync(require.resolve("@dicebear/styles/notionists.json"), "utf8"),
  ),
);

// Every illustrative character keeps one colour everywhere it appears.
export const characters = {
  mira: "#FFE38F",
  theo: "#FFB996",
  lena: "#9FD3FF",
  kaan: "#C5B6FF",
  deniz: "#B1D6AC",
  umut: "#F5B3C8",
  ada: "#B8E6D9",
  emre: "#EEF0EB",
};

function write(path, content) {
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`);
}

for (const [seed, color] of Object.entries(characters)) {
  const svg = new Avatar(notionists, {
    seed,
    backgroundColor: [color],
    size: 96,
  }).toString();
  // The credit lives in THIRD_PARTY_NOTICES.md; the embedded copy only adds weight.
  write(
    `${out}avatars/${seed}.svg`,
    svg
      .replace(/<metadata[\s\S]*?<\/metadata>/, "")
      .replace(/<!--[\s\S]*?-->/g, ""),
  );
}

const web3icons = require
  .resolve("@web3icons/core")
  .replace(/dist\/.*$/, "dist/svgs/");
const marks = {
  eth: "tokens/branded/ETH.svg.js",
  btc: "tokens/branded/BTC.svg.js",
  sol: "tokens/branded/SOL.svg.js",
  usdc: "tokens/branded/USDC.svg.js",
  mon: "networks/branded/monad.svg.js",
};
for (const [name, file] of Object.entries(marks)) {
  const mark = (await import(pathToFileURL(`${web3icons}${file}`))).default;
  write(`${out}tokens/${name}.svg`, mark);
}

const icons = await import("simple-icons");
const tech = { nextjs: icons.siNextdotjs, postgresql: icons.siPostgresql };
for (const [name, icon] of Object.entries(tech)) {
  // One flat path per mark, drawn in the page's ink so it reads on the dark base.
  write(
    `${out}logos/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${icon.title}"><path fill="#F2F4F2" d="${icon.path}"/></svg>`,
  );
}
console.log(
  JSON.stringify({
    avatars: Object.keys(characters).length,
    tokens: Object.keys(marks).length,
    logos: Object.keys(tech).length,
  }),
);
