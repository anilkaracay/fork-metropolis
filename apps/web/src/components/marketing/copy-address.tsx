"use client";

import { useState } from "react";

/** A contract address that copies itself. The full value stays readable for anyone who prefers to select it. */
export function CopyAddress({
  label,
  address,
}: {
  label: string;
  address: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="l-copy">
      <span className="l-copy-label">{label}</span>
      <code title={address}>
        {address.slice(0, 10)}…{address.slice(-8)}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            // The address stays visible and selectable when the clipboard is unavailable.
          }
        }}
        aria-label={
          copied ? `${label} address copied` : `Copy the ${label} address`
        }
      >
        <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
      </button>
    </span>
  );
}
