"use client";
import { useSyncExternalStore } from "react";
import { confirmationText, readConfirmation } from "@/lib/confirmation";

const subscribe = () => () => {};
/** Shows the confirmation time this browser measured for this transaction, if it has one. */
export function ConfirmationNote({ txHash }: { txHash: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => {
      const confirmation = readConfirmation(txHash);
      return confirmation ? confirmationText(confirmation) : null;
    },
    () => null,
  );
  return text ? (
    <p className="confirmation-note" role="status">
      {text}
    </p>
  ) : null;
}
