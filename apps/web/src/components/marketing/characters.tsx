import type { CSSProperties } from "react";

// The people in the landing page's examples. They are illustrations, never shown as live
// activity, and each keeps one colour and one face wherever it appears.
export const CHARACTERS = {
  mira: "#FFE38F",
  theo: "#FFB996",
  lena: "#9FD3FF",
  kaan: "#C5B6FF",
  deniz: "#B1D6AC",
  umut: "#F5B3C8",
  ada: "#B8E6D9",
  emre: "#EEF0EB",
} as const;
export type Character = keyof typeof CHARACTERS;

/** A character's avatar. Decorative: the handle next to it carries the name. */
export function Face({
  name,
  size = 40,
  eager = false,
  className,
}: {
  name: Character;
  size?: number;
  eager?: boolean;
  className?: string;
}) {
  return (
    // Static, pre-sized artwork: the image optimizer would add a request without a gain.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`l-face${className ? ` ${className}` : ""}`}
      src={`/landing/avatars/${name}.svg`}
      width={size}
      height={size}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      style={{ "--tint": CHARACTERS[name] } as CSSProperties}
    />
  );
}

/** A market's mark next to its symbol. */
export function TokenMark({
  symbol,
  size = 20,
}: {
  symbol: string;
  size?: number;
}) {
  const known = ["BTC", "ETH", "SOL", "USDC", "MON"].includes(symbol);
  if (!known) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="l-token"
      src={`/landing/tokens/${symbol.toLowerCase()}.svg`}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}
