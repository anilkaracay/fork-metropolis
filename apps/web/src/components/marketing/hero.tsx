import Link from "next/link";
import { Icon } from "@/components/social/icon";
import { Face, TokenMark, type Character } from "./characters";

function FeedCard({
  who,
  label,
  target,
  leverage,
  market = "ETH",
  className,
  children,
}: {
  who: Character;
  label: string;
  target: string;
  leverage: string;
  market?: string;
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`fc ${className}`}>
      <div className="fc-head">
        <Face name={who} size={36} eager />
        <span className="fc-who">@{who}</span>
        <span className="fc-label">{label}</span>
      </div>
      <div className="fc-market">
        <TokenMark symbol={market} size={22} />
        <strong>{market}</strong>
        <span className="fc-side">Long</span>
      </div>
      <dl className="fc-nums">
        <div>
          <dt>Target</dt>
          <dd data-hero="target">{target}</dd>
        </div>
        <div>
          <dt>Leverage</dt>
          <dd data-hero="leverage">{leverage}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}

/**
 * The opening scene. The stage on the right is an illustration of one idea evolving and
 * says so; nothing in it is read from the graph. Its markup is the finished scene, which
 * is what a visitor without motion sees. Motion replays it from the first frame.
 */
export function Hero() {
  return (
    <section className="l-hero" aria-labelledby="hero-title" data-hero-root>
      <div className="l-hero-grid" aria-hidden="true" />
      <div className="l-hero-copy">
        <p className="l-kicker">A social network for trading ideas</p>
        <h1 id="hero-title" className="l-hero-title">
          <span className="l-word">Trading</span>{" "}
          <span className="l-word">ideas</span>
          <br />
          <span className="l-grad-text">evolve here.</span>
        </h1>
        <div className="l-hero-sub">
          <p className="l-hero-lead">
            Publish a thesis. Fork a better one. Back the ones you believe in.
            Everyone who shaped an idea shares what it attracts.
          </p>
          <div className="l-hero-actions">
            <Link
              href="/feed"
              prefetch={false}
              className="button primary"
              data-magnetic
            >
              Open FORK <Icon name="arrow" size={18} />
            </Link>
            <a href="#how" className="l-link">
              See how it works
            </a>
          </div>
        </div>
      </div>

      <div className="l-stage-wrap">
        <div
          className="l-stage"
          data-stage
          role="img"
          aria-label="Example: mira publishes an ETH idea with a 4,200 target at 2 times leverage. theo forks it to 4,400 at 3 times. Three people back the fork, and part of their backing travels back to mira."
        >
          <svg
            className="l-stage-branch"
            viewBox="0 0 560 620"
            fill="none"
            aria-hidden="true"
          >
            <path
              data-hero="branch"
              d="M112 236V352c0 30 24 54 54 54h70"
              stroke="var(--fork)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <FeedCard
            who="umut"
            label="Original"
            target="$182"
            leverage="2×"
            market="SOL"
            className="fc-ghost fc-ghost-a"
          />
          <FeedCard
            who="ada"
            label="Original"
            target="$118,000"
            leverage="1×"
            market="BTC"
            className="fc-ghost fc-ghost-b"
          />
          <FeedCard
            who="mira"
            label="Original"
            target="$4,200"
            leverage="2×"
            className="fc-mira"
          >
            <p className="fc-earned" data-hero="earned">
              <TokenMark symbol="MON" size={16} /> +0.02 MON from forks
            </p>
          </FeedCard>
          <FeedCard
            who="theo"
            label="Forked from @mira"
            target="$4,400"
            leverage="3×"
            className="fc-theo"
          >
            <div className="fc-backers">
              <span className="fc-backer-row">
                <Face name="lena" size={28} eager className="fc-backer" />
                <Face name="kaan" size={28} eager className="fc-backer" />
                <Face name="deniz" size={28} eager className="fc-backer" />
              </span>
              <span className="fc-backed" data-hero="backed">
                Backed 0.1 MON
              </span>
            </div>
          </FeedCard>
          <span className="l-coin" data-hero="coin" aria-hidden="true">
            <TokenMark symbol="MON" size={18} />
          </span>
        </div>
        <p className="l-stage-note">
          <span className="l-tag">Example</span> How one idea evolves. The real
          graph is <a href="#live">further down</a>.
        </p>
      </div>
    </section>
  );
}
