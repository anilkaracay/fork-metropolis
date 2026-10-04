import { z } from "zod";
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly recovery: string,
  ) {
    super(message);
  }
}
export function configuration(item: string): never {
  throw new AppError(
    "CONFIGURATION_REQUIRED",
    `${item} is not configured.`,
    503,
    "Configure the development integration, then retry. Public browsing remains available.",
  );
}
export function mapError(error: unknown) {
  if (error instanceof AppError) return error;
  if (error instanceof z.ZodError)
    return new AppError(
      "VALIDATION_FAILED",
      error.issues[0]?.message ?? "Check the form.",
      400,
      "Correct the highlighted values and try again.",
    );
  return new AppError(
    "SERVICE_UNAVAILABLE",
    "This action could not be completed.",
    503,
    "Your confirmed transaction remains onchain. Retry this action; do not submit another transaction.",
  );
}
export function assert(
  condition: unknown,
  code: string,
  message: string,
  status = 409,
  recovery = "Review the details and try again.",
): asserts condition {
  if (!condition) throw new AppError(code, message, status, recovery);
}
