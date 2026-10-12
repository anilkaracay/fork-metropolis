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
export const MEASURED_RUN: MeasuredRun | null = null;
