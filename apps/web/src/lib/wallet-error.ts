import { ApiError } from "./api-client";
/** A missing hash is an uncertain wallet result, never permission to auto-resend. */
export function walletError(
  error: unknown,
  operation: "transaction" | "signature" = "transaction",
): ApiError {
  if (error instanceof ApiError) return error;
  let current = error;
  const seen = new Set<unknown>();
  let message = "";
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (e.code === 4001 || e.code === "ACTION_REJECTED")
      return new ApiError(
        "WALLET_REJECTED",
        "The wallet request was declined.",
        "Approve the wallet request when you are ready.",
        409,
      );
    if (typeof e.message === "string") message += ` ${e.message}`;
    current = e.cause;
  }
  if (/insufficient funds|insufficient balance/i.test(message))
    return new ApiError(
      "GAS_REQUIRED",
      "Your wallet needs Monad Testnet gas.",
      "Fund the selected wallet with testnet MON, then retry.",
      409,
    );
  if (/switch.*chain|chain.*mismatch|wrong chain/i.test(message))
    return new ApiError(
      "WRONG_CHAIN",
      "The wallet is not on Monad Testnet.",
      "Switch to Monad Testnet and retry the wallet request.",
      409,
    );
  if (operation === "signature")
    return new ApiError(
      "SIGNATURE_UNAVAILABLE",
      "The wallet signature could not be completed.",
      "Retry the signature request from your signed-in account.",
      503,
    );
  return new ApiError(
    "WALLET_RESULT_UNCERTAIN",
    "The wallet did not return a transaction hash.",
    "Check wallet activity before retrying. If a transaction was sent, recover its hash below.",
    503,
  );
}
