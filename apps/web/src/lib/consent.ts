import { ApiError } from "./api-client";

/**
 * The embedded wallet signs without a prompt of its own (D-061), so FORK's buttons are the
 * consent: Publish on Monad, Publish fork on Monad, Back with … MON and Withdraw … MON. A
 * trusted click on one of them grants one consent for that action, and the signing call
 * takes it. Nothing else (page load, a timer, a retry) can make the wallet sign.
 */
export type ConsentAction = "publish" | "back" | "withdraw";
// Long enough for a draft to be saved between the click and the signature.
export const CONSENT_WINDOW_MS = 60000;
let granted: { action: ConsentAction; at: number } | null = null;

/** Call from the click or submit handler of a consent button, with its native event. */
export function grantConsent(
  action: ConsentAction,
  event: { isTrusted: boolean },
  now = Date.now(),
) {
  granted = event.isTrusted ? { action, at: now } : null;
}

/** Call right before asking the wallet to sign. Throws unless a matching click came first. */
export function takeConsent(action: ConsentAction, now = Date.now()) {
  const consent = granted;
  granted = null;
  if (
    !consent ||
    consent.action !== action ||
    now - consent.at > CONSENT_WINDOW_MS
  )
    throw new ApiError(
      "CONSENT_REQUIRED",
      "Nothing was signed.",
      "Press the button again to sign.",
      403,
    );
}
