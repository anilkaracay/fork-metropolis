import { describe, expect, it } from "vitest";
import { percentile, summarize } from "./measure-backing.mjs";

describe("backing measurement summary", () => {
  const twenty = Array.from({ length: 20 }, (_, index) => (index + 1) * 100);
  it("uses the nearest-rank percentile", () => {
    expect(percentile(twenty, 95)).toBe(1900);
    expect(percentile(twenty, 50)).toBe(1000);
    expect(percentile([7], 95)).toBe(7);
    expect(percentile([300, 100, 200], 95)).toBe(300);
  });
  it("reports min, median, p95 and max without reordering its input", () => {
    const values = [900, 400, 1200, 700];
    expect(summarize(values)).toEqual({
      samples: 4,
      min: 400,
      median: 800,
      p95: 1200,
      max: 1200,
    });
    expect(values).toEqual([900, 400, 1200, 700]);
    expect(summarize(twenty)).toMatchObject({ median: 1050, p95: 1900 });
    expect(summarize([500, 100, 300]).median).toBe(300);
  });
});
