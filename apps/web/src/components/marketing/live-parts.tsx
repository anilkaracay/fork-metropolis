import Link from "next/link";
import type { LandingEvent } from "@/server/landing";

// The two parts of the landing page that report the live graph. They render only what the
// indexer returned for this request; the example characters never appear here.

/** The nav chip: the network, and the real idea count when the read succeeded. */
export function NavChip({ ideas }: { ideas: number | null }) {
  return (
    <span
      className="mono hideM l3-chip"
      style={{
        fontSize: "13px",
        color: "#A4ABA7",
        border: "1px solid #2F3540",
        borderRadius: "999px",
        padding: "6px 12px",
      }}
    >
      Monad Testnet
      {ideas !== null && (
        <span className="l3-chip-count">
          {ideas} {ideas === 1 ? "idea" : "ideas"}
        </span>
      )}
    </span>
  );
}

function ago(at: number, now: number) {
  const seconds = Math.max(0, now - at);
  if (seconds < 90) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / 86400)} d ago`;
}

function Event({ event, now }: { event: LandingEvent; now: number }) {
  const said =
    event.kind === "published"
      ? `${event.handle} published an idea`
      : event.kind === "forked"
        ? `${event.handle} forked #${event.parentId}`
        : `${event.handle} backed #${event.thesisId}`;
  const detail =
    event.kind === "backed"
      ? `${event.amountMon} MON${event.count > 1 ? ` in ${event.count} backings` : ""}`
      : `#${event.thesisId}`;
  return (
    <li>
      <Link
        href={`/t/${event.thesisId}`}
        prefetch={false}
        className={`l3-event l3-event-${event.kind}`}
      >
        {/* Each person's avatar, seeded by their handle. Decorative: the name follows. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="l3-event-face"
          src={`/avatar/${event.handle}`}
          width={26}
          height={26}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className="l3-event-text">{said}</span>
        <span className="mono l3-event-detail">{detail}</span>
        <time
          className="mono l3-event-time"
          dateTime={new Date(event.at * 1000).toISOString()}
        >
          {ago(event.at, now)}
        </time>
      </Link>
    </li>
  );
}

/** Real events only. Fewer than six stay a still row: a loop would repeat them as if more had happened. */
export function ActivityStrip({
  events,
  now,
}: {
  events: LandingEvent[];
  now: number;
}) {
  if (!events.length) return null;
  const loop = events.length >= 6;
  return (
    <section className="l3-activity" aria-label="Latest on Monad Testnet">
      <div className="l3-marquee" data-loop={loop}>
        <ul className="l3-track">
          {events.map((event) => (
            <Event
              key={`${event.kind}-${event.thesisId}-${event.at}-${event.handle}`}
              event={event}
              now={now}
            />
          ))}
        </ul>
        {loop && (
          <ul className="l3-track" aria-hidden="true" inert>
            {events.map((event) => (
              <Event
                key={`${event.kind}-${event.thesisId}-${event.at}-${event.handle}`}
                event={event}
                now={now}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
