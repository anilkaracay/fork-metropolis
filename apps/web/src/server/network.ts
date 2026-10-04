import { AppError } from "./errors";
export async function fetchJson(
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt === 0
        ) {
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
        throw new AppError(
          "UPSTREAM_UNAVAILABLE",
          "The data source is unavailable.",
          503,
          "Try again shortly.",
        );
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AppError || attempt === 1)
        throw new AppError(
          "UPSTREAM_UNAVAILABLE",
          "The data source did not respond.",
          503,
          "Retry shortly. Your data has not been changed.",
        );
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new AppError(
    "UPSTREAM_UNAVAILABLE",
    "The data source did not respond.",
    503,
    "Retry shortly.",
  );
}
