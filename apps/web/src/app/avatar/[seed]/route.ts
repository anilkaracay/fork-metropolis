import { Avatar, Style } from "@dicebear/core";
import notionists from "@dicebear/styles/notionists.json";

// DiceBear "Notionists" (artwork CC0 1.0, a remix of Notionists by Zoish), seeded by handle.
// The same seed always draws the same person, so responses are cached for a year.
const style = new Style(notionists as ConstructorParameters<typeof Style>[0]);
const backgrounds = [
  "#FFE38F",
  "#FFB996",
  "#9FD3FF",
  "#C5B6FF",
  "#B1D6AC",
  "#F5B3C8",
  "#B8E6D9",
];
const SEED = /^[a-z0-9_]{1,32}$/;
const rendered = new Map<string, string>();

export async function GET(
  _request: Request,
  context: { params: Promise<{ seed: string }> },
) {
  const seed = (await context.params).seed;
  if (!SEED.test(seed))
    return new Response("Unknown avatar.", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  let svg = rendered.get(seed);
  if (!svg) {
    // The credit lives in THIRD_PARTY_NOTICES.md; the embedded copy only adds weight.
    svg = new Avatar(style, { seed, size: 96, backgroundColor: backgrounds })
      .toString()
      .replace(/<metadata[\s\S]*?<\/metadata>/, "")
      .replace(/<!--[\s\S]*?-->/g, "");
    if (rendered.size > 2000) rendered.clear();
    rendered.set(seed, svg);
  }
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
