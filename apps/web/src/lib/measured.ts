/**
 * The recorded Monad measurement the landing page may quote, copied from the run recorded
 * in docs/MONAD_PERFORMANCE.md. It stays null until a run exists: the page then shows no
 * timing figure at all.
 */
export type MeasuredRun = {
  recordedAt: string;
  samples: number;
  confirmMedianMs: number;
  confirmP95Ms: number;
  indexMedianMs: number | null;
};
export const MEASURED_RUN: MeasuredRun | null = {
  recordedAt: "2026-10-13T07:45:23Z",
  samples: 20,
  confirmMedianMs: 417.5,
  confirmP95Ms: 423,
  indexMedianMs: 580.5,
};
