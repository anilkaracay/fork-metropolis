"use client";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import { Icon } from "./icon";
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const e = error instanceof Error ? error : null;
  return (
    <div className="state-box error-box" role="alert">
      <span className="eyebrow">A moment of friction</span>
      <h2>{e?.message ?? "This could not be loaded."}</h2>
      <p>
        {error instanceof ApiError
          ? error.recovery
          : "Try again or return to Feed."}
      </p>
      <button className="button secondary" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  create = true,
}: {
  title: string;
  description: string;
  create?: boolean;
}) {
  return (
    <div className="state-box">
      <div className="empty-glyph">
        <Icon name="fork" size={30} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {create && (
        <Link href="/new" className="button primary">
          Publish an idea <Icon name="arrow" size={16} />
        </Link>
      )}
    </div>
  );
}
export function Skeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="skeleton-group" role="status" aria-label="Loading ideas">
      {Array.from({ length: cards }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line medium" />
        </div>
      ))}
    </div>
  );
}
export function ReadStatus({
  error,
  refreshing,
  retry,
}: {
  error: unknown;
  refreshing: boolean;
  retry: () => void;
}) {
  return (
    <div className={`read-status ${error ? "read-failed" : ""}`}>
      <p role={error ? "alert" : "status"}>
        {error
          ? `Showing the last loaded ideas. ${error instanceof Error ? error.message : "Refresh failed."} Retry to check for updates.`
          : refreshing
            ? "Checking for updates…"
            : "Loaded from the idea graph."}
      </p>
      <button className="text-button" disabled={refreshing} onClick={retry}>
        {error ? "Retry refresh" : "Refresh"}
        <Icon name="arrow" size={14} />
      </button>
    </div>
  );
}
export function Avatar({
  name,
  wallet,
  small = false,
}: {
  name: string;
  wallet: string;
  small?: boolean;
}) {
  const palette = ["#2d493e", "#41415c", "#594435", "#344d61", "#584552"];
  const index = parseInt(wallet.slice(-4) || "0", 16) % palette.length;
  return (
    <span
      className={`avatar ${small ? "small" : ""}`}
      style={{ background: palette[index] }}
      aria-hidden="true"
    >
      {name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function age(seconds: number) {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - seconds);
  return s < 60
    ? "just now"
    : s < 3600
      ? `${Math.floor(s / 60)}m`
      : s < 86400
        ? `${Math.floor(s / 3600)}h`
        : `${Math.floor(s / 86400)}d`;
}
