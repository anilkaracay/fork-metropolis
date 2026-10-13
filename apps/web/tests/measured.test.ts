import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { MEASURED_RUN } from "../src/lib/measured";

it("quotes exactly the recorded run", () => {
  const raw = JSON.parse(
    readFileSync(
      fileURLToPath(
        new URL(`../../../${MEASURED_RUN.source}`, import.meta.url),
      ),
      "utf8",
    ),
  );
  expect(MEASURED_RUN.recordedAt.slice(0, 16)).toBe(
    String(raw.recordedAt).slice(0, 16),
  );
  expect(MEASURED_RUN.samples).toBe(raw.samples.length);
  expect(MEASURED_RUN.timings).toEqual(
    raw.samples.map((sample: { confirmMs: number; indexMs: number }) => [
      sample.confirmMs,
      sample.indexMs,
    ]),
  );
  expect(MEASURED_RUN.confirmMedianMs).toBe(raw.summary.confirmMs.median);
  expect(MEASURED_RUN.confirmP95Ms).toBe(raw.summary.confirmMs.p95);
  expect(MEASURED_RUN.indexMedianMs).toBe(raw.summary.indexMs.median);
  expect(MEASURED_RUN.indexP95Ms).toBe(raw.summary.indexMs.p95);
});
