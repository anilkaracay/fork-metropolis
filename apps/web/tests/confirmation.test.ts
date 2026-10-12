import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmationText,
  formatLatency,
  readConfirmation,
  saveConfirmation,
} from "../src/lib/confirmation";

const hash = `0x${"ab".repeat(32)}` as const;
describe("measured confirmation time", () => {
  it("formats sub-ten-second values with one decimal and longer ones as whole seconds", () => {
    expect(formatLatency(912)).toBe("0.9 s");
    expect(formatLatency(1240)).toBe("1.2 s");
    expect(formatLatency(9949)).toBe("9.9 s");
    expect(formatLatency(12400)).toBe("12 s");
  });
  it("never shows zero or a negative time", () => {
    expect(formatLatency(0)).toBe("0.1 s");
    expect(formatLatency(40)).toBe("0.1 s");
    expect(formatLatency(-5)).toBe("0.1 s");
  });
  it("names the test workspace instead of Monad for simulated confirmations", () => {
    expect(
      confirmationText({ txHash: hash, latencyMs: 912, simulated: false }),
    ).toBe("Confirmed on Monad in 0.9 s");
    expect(
      confirmationText({ txHash: hash, latencyMs: 30, simulated: true }),
    ).toBe("Confirmed in the test workspace in 0.1 s");
  });
});
describe("remembering a measurement in the tab", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("returns the saved measurement for the same transaction in any case", () => {
    saveConfirmation({ txHash: hash, latencyMs: 912, simulated: false });
    expect(readConfirmation(hash.toUpperCase().replace("0X", "0x"))).toEqual({
      txHash: hash,
      latencyMs: 912,
      simulated: false,
    });
    expect(readConfirmation(`0x${"cd".repeat(32)}`)).toBeNull();
  });
  it("ignores malformed or mismatched stored values", () => {
    const key = `fork-confirmation:${hash}`;
    for (const value of [
      "not json",
      JSON.stringify({ txHash: hash, latencyMs: "fast", simulated: false }),
      JSON.stringify({ txHash: hash, latencyMs: -1, simulated: false }),
      JSON.stringify({ txHash: hash, latencyMs: 5 }),
      JSON.stringify({
        txHash: `0x${"cd".repeat(32)}`,
        latencyMs: 5,
        simulated: false,
      }),
    ]) {
      sessionStorage.setItem(key, value);
      expect(readConfirmation(hash)).toBeNull();
    }
  });
  it("does not throw when storage is unavailable", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() =>
      saveConfirmation({ txHash: hash, latencyMs: 1, simulated: true }),
    ).not.toThrow();
    expect(readConfirmation(hash)).toBeNull();
  });
});
