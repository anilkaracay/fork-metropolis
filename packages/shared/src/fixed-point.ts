import { UINT32_MAX, UINT128_MAX } from "./namespace.ts";

export const THESIS_PRICE_DECIMALS = 8;
export const LEVERAGE_BPS_PER_X = 10_000;
export const PERPL_LEVERAGE_PER_X = 100;

export function parseFixedPoint(
  value: string,
  decimals: number,
  max: bigint = UINT128_MAX,
): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 38)
    throw new RangeError("Unsupported decimal precision.");
  const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(value);
  if (!match || (match[2]?.length ?? 0) > decimals)
    throw new RangeError(
      "Use an unsigned decimal within the supported precision.",
    );
  const fraction = (match[2] ?? "").padEnd(decimals, "0");
  const raw =
    BigInt(match[1]!) * 10n ** BigInt(decimals) + BigInt(fraction || "0");
  if (raw > max)
    throw new RangeError("Fixed-point value exceeds its integer bound.");
  return raw;
}

export function formatFixedPoint(raw: bigint, decimals: number): string {
  if (raw < 0n || !Number.isInteger(decimals) || decimals < 0 || decimals > 38)
    throw new RangeError("Invalid fixed-point value.");
  if (decimals === 0) return raw.toString();
  const scale = 10n ** BigInt(decimals);
  const fraction = (raw % scale)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${raw / scale}${fraction ? `.${fraction}` : ""}`;
}

export function leverageBpsToPerpl(leverageBps: number): number {
  if (
    !Number.isSafeInteger(leverageBps) ||
    leverageBps < LEVERAGE_BPS_PER_X ||
    leverageBps > UINT32_MAX ||
    leverageBps % 100 !== 0
  ) {
    throw new RangeError(
      "Leverage must be representable exactly in Perpl hundredths.",
    );
  }
  return leverageBps / 100;
}
