import { formatEther, parseEther } from "viem";

/** Up to four decimals, without trailing zeros: 0.2, 1.0345, 0. */
export function formatMon(wei: string | bigint) {
  const [whole, fraction = ""] = formatEther(BigInt(wei)).split(".");
  const shown = fraction.slice(0, 4).replace(/0+$/, "");
  return shown ? `${whole}.${shown}` : whole!;
}
/** Wei for a typed MON amount, or null while it is not a plain positive decimal. */
export function parseMon(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!/^\d{1,9}(\.\d{1,18})?$/.test(trimmed)) return null;
  const wei = parseEther(trimmed);
  return wei > 0n ? wei : null;
}
/** A share of a whole as a rounded percentage, for labels only. */
export const percentOf = (part: bigint, whole: bigint) =>
  whole > 0n ? Number((part * 1000n) / whole) / 10 : 0;
