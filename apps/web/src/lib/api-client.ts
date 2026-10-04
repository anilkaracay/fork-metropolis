export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly recovery: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    wallet?: string | null | undefined;
  } = {},
): Promise<T> {
  try {
    const response = await fetch(`/api/${path}`, {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...(options.wallet ? { "x-fork-wallet": options.wallet } : {}),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const result = (await response.json()) as {
      ok: boolean;
      data: T;
      error?: { code: string; message: string; recovery: string };
    };
    if (!result.ok || !response.ok)
      throw new ApiError(
        result.error?.code ?? "REQUEST_FAILED",
        result.error?.message ?? "This request failed.",
        result.error?.recovery ?? "Try again.",
        response.status,
      );
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "NETWORK_UNAVAILABLE",
      "The connection was interrupted.",
      "Check your connection and retry the same action.",
      503,
    );
  }
}
