import { describe, expect, it } from "vitest";
import { formatMon, parseMon, percentOf } from "../src/lib/mon";

const MON = 10n ** 18n;
describe("MON amounts", () => {
  it("formats with up to four decimals and no trailing zeros", () => {
    expect(formatMon(0n)).toBe("0");
    expect(formatMon(MON / 5n)).toBe("0.2");
    expect(formatMon("1034500000000000000")).toBe("1.0345");
    expect(formatMon(MON + 1n)).toBe("1");
    expect(formatMon(25n * MON)).toBe("25");
  });
  it("parses plain positive decimals and rejects everything else", () => {
    expect(parseMon("0.05")).toBe(MON / 20n);
    expect(parseMon(" 0,25 ")).toBe(MON / 4n);
    expect(parseMon("1")).toBe(MON);
    for (const value of [
      "",
      "0",
      "0.0",
      "-1",
      "1e3",
      "abc",
      ".5",
      "1.",
      "1.2.3",
    ])
      expect(parseMon(value)).toBeNull();
  });
  it("gives label percentages", () => {
    expect(percentOf(7n, 10n)).toBe(70);
    expect(percentOf(1n, 3n)).toBe(33.3);
    expect(percentOf(1n, 0n)).toBe(0);
  });
});
