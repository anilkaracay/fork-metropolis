import type { Hex } from "viem";

/**
 * How long one transaction took from the moment the wallet returned its hash to the
 * moment this browser first saw its receipt. A local observation that includes polling
 * and network time; it is not a consensus or finality figure.
 */
export type Confirmation = {
  txHash: Hex;
  latencyMs: number;
  // True in the isolated test workspace, where no chain is involved.
  simulated: boolean;
};
// How often the browser asks for the receipt. The measurement cannot be finer than this.
export const RECEIPT_POLL_MS = 100;
const key = (txHash: string) => `fork-confirmation:${txHash.toLowerCase()}`;

/** One decimal below ten seconds, whole seconds above: "0.9 s", "12 s". */
export function formatLatency(ms: number) {
  const seconds = Math.max(ms, 0) / 1000;
  return seconds < 10
    ? `${Math.max(seconds, 0.1).toFixed(1)} s`
    : `${Math.round(seconds)} s`;
}
export const confirmationText = (confirmation: Confirmation) =>
  `Confirmed ${confirmation.simulated ? "in the test workspace" : "on Monad"} in ${formatLatency(confirmation.latencyMs)}`;

// Kept for this tab only, so the page a transaction lands on can show its own measurement.
export function saveConfirmation(confirmation: Confirmation) {
  try {
    sessionStorage.setItem(
      key(confirmation.txHash),
      JSON.stringify(confirmation),
    );
  } catch {
    // Without storage the measurement is simply not shown after navigation.
  }
}
export function readConfirmation(txHash: string): Confirmation | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(key(txHash)) ?? "null",
    ) as Partial<Confirmation> | null;
    return value &&
      typeof value.latencyMs === "number" &&
      Number.isFinite(value.latencyMs) &&
      value.latencyMs >= 0 &&
      typeof value.simulated === "boolean" &&
      value.txHash?.toLowerCase() === txHash.toLowerCase()
      ? (value as Confirmation)
      : null;
  } catch {
    return null;
  }
}
