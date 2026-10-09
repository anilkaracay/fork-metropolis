"use client";
import { useSyncExternalStore } from "react";
import {
  publishObservationEvent,
  publishObservationKey,
  safePublishObservations,
} from "@/lib/publish-observation";

function subscribe(notify: () => void) {
  window.addEventListener(publishObservationEvent, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(publishObservationEvent, notify);
    window.removeEventListener("storage", notify);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(publishObservationKey);
  } catch {
    return null;
  }
}
// Readable through the development DOM; no product UI, credentials or auth access.
export function DevelopmentPublishObservation() {
  const value = useSyncExternalStore(subscribe, snapshot, () => null);
  return (
    <script id="fork-development-publish-observations" type="application/json">
      {safePublishObservations(value)}
    </script>
  );
}
