/**
 * The recorded Monad measurement the landing page quotes, copied from the run recorded in
 * docs/MONAD_PERFORMANCE.md and its raw file. A unit test checks every value against that
 * file, so the page can never show a timing that was not measured.
 */
export type MeasuredRun = {
  recordedAt: string;
  // The raw file this copy comes from, relative to the repository root.
  source: string;
  samples: number;
  confirmMedianMs: number;
  confirmP95Ms: number;
  indexMedianMs: number;
  indexP95Ms: number;
  // Each backing in send order: [hash to first receipt, first receipt to indexed], in ms.
  timings: [number, number][];
};
export const MEASURED_RUN: MeasuredRun = {
  recordedAt: "2026-10-13T07:45:23Z",
  source: "docs/monad-performance/backing-2026-10-13T07-45-23-986Z.json",
  samples: 20,
  confirmMedianMs: 417.5,
  confirmP95Ms: 423,
  indexMedianMs: 580.5,
  indexP95Ms: 840,
  timings: [
    [427, 764],
    [418, 573],
    [414, 573],
    [417, 845],
    [239, 832],
    [417, 578],
    [419, 316],
    [417, 840],
    [419, 833],
    [241, 574],
    [419, 831],
    [419, 833],
    [421, 835],
    [242, 577],
    [423, 583],
    [422, 590],
    [419, 574],
    [237, 573],
    [238, 315],
    [415, 316],
  ],
};
