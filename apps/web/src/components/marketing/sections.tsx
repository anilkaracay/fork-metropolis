import type { CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@/components/social/icon";
import type { MeasuredRun } from "@/lib/measured";
import type { LandingEvent, LandingLive } from "@/server/landing";
import { CHARACTERS, Face, TokenMark, type Character } from "./characters";
import { CopyAddress } from "./copy-address";
import { treeStyle } from "./story";

const EXPLORER = "https://testnet.monadexplorer.com";
const GITHUB = "https://github.com/anilkaracay/fork-metropolis";
const clock = (at: number) => new Date(at * 1000).toISOString().slice(11, 19);
function ago(at: number, now: number) {
  const seconds = Math.max(0, now - at);
  if (seconds < 90) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / 86400)} d ago`;
}
function EventLine({ event, now }: { event: LandingEvent; now: number }) {
  return (
    <li className={`ev ev-${event.kind}`}>
      <Link href={`/t/${event.thesisId}`} prefetch={false}>
        <span className="ev-kind">{event.kind}</span>
        <span className="ev-text">
          <b>@{event.handle}</b>{" "}
          {event.kind === "published"
            ? `idea #${event.thesisId}`
            : event.kind === "forked"
              ? `#${event.parentId} into #${event.thesisId}`
              : `${event.amountMon} MON on #${event.thesisId}${event.count > 1 ? ` in ${event.count} backings` : ""}`}
        </span>
        <time dateTime={new Date(event.at * 1000).toISOString()}>
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
    <section className="l-activity" aria-label="Latest on Monad Testnet">
      <p className="l-activity-label">Latest on Monad Testnet</p>
      <div className="l-marquee" data-loop={loop}>
        <ul className="l-marquee-track">
          {events.map((event) => (
            <EventLine
              key={`${event.kind}-${event.thesisId}-${event.at}-${event.handle}`}
              event={event}
              now={now}
            />
          ))}
        </ul>
        {loop && (
          <ul className="l-marquee-track" aria-hidden="true" inert>
            {events.map((event) => (
              <EventLine
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

function Message({
  who,
  children,
  mark,
}: {
  who: Character;
  children: React.ReactNode;
  mark?: string;
}) {
  return (
    <li className="msg" data-msg={mark}>
      <Face name={who} size={34} />
      <div>
        <b>{who}</b>
        <p>{children}</p>
      </div>
    </li>
  );
}

export function Problem() {
  return (
    <section
      className="l-section l-problem l-light"
      aria-labelledby="problem-title"
      data-problem
    >
      <div className="l-problem-copy">
        <p className="l-kicker">Today</p>
        <h2 id="problem-title" data-split>
          In a thread, the best reply disappears.
        </h2>
        <ol className="l-lost">
          <li>
            <b>The improvement.</b> A better target is buried under the next
            forty replies.
          </li>
          <li>
            <b>The credit.</b> A week later nobody can say who changed what.
          </li>
          <li>
            <b>The upside.</b> The person who made the idea better gets nothing
            from the attention it draws.
          </li>
        </ol>
      </div>
      <div
        className="l-thread-wrap"
        role="img"
        aria-label="Example: in a group chat, mira posts an ETH idea. theo replies with a better target and his reasoning. More replies arrive, his message scrolls away, and a screenshot of it circulates without his name."
      >
        <ol className="l-thread">
          <Message who="mira">
            ETH long. Target 4,200, out below 3,600, 2x. Weekly range is
            holding.
          </Message>
          <Message who="umut">gm, watching this</Message>
          <Message who="theo" mark="reply">
            Target is too low. If 3,600 holds I would take 4,400 at 3x: spot
            demand has not slowed.
          </Message>
          <Message who="ada" mark="noise">
            anyone looking at SOL?
          </Message>
          <Message who="emre" mark="noise">
            wen
          </Message>
          <Message who="kaan" mark="noise">
            +1
          </Message>
          <Message who="deniz" mark="noise">
            who said 4,400 again?
          </Message>
        </ol>
        <div className="l-shot" data-shot aria-hidden="true">
          <span>screenshot</span>
          <p>
            Target is too low. If 3,600 holds I would take 4,400 at 3x: spot
            demand has not slowed.
          </p>
          <small>author unknown</small>
        </div>
      </div>
    </section>
  );
}

function Figure({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span data-ticker>{value}</span>
        {unit && <small> {unit}</small>}
      </dd>
    </div>
  );
}

/** The real graph. Every figure, handle and link comes from the indexer read for this request. */
export function LiveGraph({ live }: { live: LandingLive | null }) {
  return (
    <section
      id="live"
      className="l-section l-live"
      aria-labelledby="live-title"
    >
      <header className="l-section-head">
        <p className="l-kicker">Live on Monad Testnet</p>
        <h2 id="live-title" data-split>
          What the graph holds right now.
        </h2>
        <p>
          {live
            ? `Read from the FORK indexer at ${clock(live.readAt)} UTC. `
            : ""}
          It is early and small, and it includes the team’s own test activity.
        </p>
      </header>
      {live ? (
        <div className="l-live-body">
          <dl className="l-figures">
            <Figure
              label={`Ideas published${live.bounded ? " (latest)" : ""}`}
              value={String(live.ideas)}
            />
            <Figure label="Of them, forks" value={String(live.forks)} />
            <Figure label="Authors" value={String(live.authors)} />
            {live.backing && (
              <>
                <Figure
                  label="Backed"
                  value={live.backing.totalMon}
                  unit="MON"
                />
                <Figure
                  label="Passed on to earlier authors"
                  value={live.backing.sentToAncestorsMon}
                  unit="MON"
                />
                <Figure
                  label="Supporters"
                  value={String(live.backing.supporters)}
                />
              </>
            )}
          </dl>
          {live.tree ? (
            <div className="l-realtree" data-realtree>
              <p className="l-realtree-cap">
                The largest lineage on FORK, starting at idea #
                {live.tree.rootId}
              </p>
              <ol className="tr">
                {live.tree.nodes.map((node) => (
                  <li
                    key={node.id}
                    className="tr-node"
                    style={treeStyle(node.depth, node.rowsToParent)}
                    data-node
                  >
                    <Link
                      className="tr-card"
                      href={`/t/${node.id}`}
                      prefetch={false}
                    >
                      <span className="tr-id">#{node.id}</span>
                      <span className="tr-who">@{node.handle}</span>
                      <span className="tr-market">
                        <TokenMark symbol={node.market} size={18} />
                        {node.market}
                        <i className={node.side}>
                          {node.side === "long" ? "Long" : "Short"}
                        </i>
                      </span>
                      <span className="tr-nums">
                        {node.target} · {node.leverage}
                      </span>
                      {node.backedMon && (
                        <span className="tr-backed">
                          {node.backedMon} MON backed
                        </span>
                      )}
                      {node.arrivedMon && (
                        <span className="tr-flow" data-flow>
                          +{node.arrivedMon} MON from forks
                        </span>
                      )}
                    </Link>
                    <a
                      className="tr-tx"
                      href={`${EXPLORER}/tx/${node.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Transaction of idea #${node.id} on the Monad explorer`}
                    >
                      tx <Icon name="arrow" size={12} />
                    </a>
                  </li>
                ))}
              </ol>
              <Link
                className="l-link"
                href={`/t/${live.tree.rootId}/tree`}
                prefetch={false}
              >
                {live.tree.more > 0
                  ? `Open the whole tree, ${live.tree.more} more ${live.tree.more === 1 ? "idea" : "ideas"}`
                  : "Open this tree in the product"}{" "}
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          ) : (
            <div className="l-realtree l-realtree-empty">
              <p>
                No idea has been forked yet. The first fork draws the first
                branch here.
              </p>
              <Link className="l-link" href="/feed" prefetch={false}>
                Open the feed <Icon name="arrow" size={16} />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="l-unavailable">
          <p>
            The live graph could not be read just now. Nothing is shown in its
            place.
          </p>
          {/* A full reload retries the server-side read. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/#live" className="l-link">
            Reload <Icon name="arrow" size={16} />
          </a>
          <Link href="/feed" prefetch={false} className="l-link">
            Open the feed <Icon name="arrow" size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}

export function Profiles() {
  return (
    <section className="l-section l-profiles" aria-labelledby="profiles-title">
      <div className="l-profiles-copy">
        <p className="l-kicker">Profiles</p>
        <h2 id="profiles-title" data-split>
          A reputation you can count.
        </h2>
        <p>
          A profile separates what you earned for ideas you wrote from what
          arrived because other people built on them.
        </p>
        <p className="l-profiles-point">
          <b>Earned from forks</b> is the number a thread can never show: you
          were paid because someone else improved your idea.
        </p>
      </div>
      <div
        className="l-profile-card"
        data-glow
        role="img"
        aria-label="Example profile: mira has earned 0.8 MON as an author and 0.32 MON from forks of her ideas, with 0.32 MON claimable. kaan, deniz and umut were her first three supporters."
      >
        <span className="l-tag">Example</span>
        <div className="pc-head">
          <Face name="mira" size={64} />
          <div>
            <b>mira</b>
            <span>@mira · 4 ideas · 3 forked by others</span>
          </div>
        </div>
        <dl className="pc-earn">
          <div>
            <dt>Earned as author</dt>
            <dd>
              0.8 <small>MON</small>
            </dd>
          </div>
          <div className="is-forks">
            <dt>Earned from forks</dt>
            <dd>
              0.32 <small>MON</small>
            </dd>
          </div>
        </dl>
        <div className="pc-claim">
          <div>
            <span>Claimable</span>
            <b>
              0.32 <small>MON</small>
            </b>
          </div>
          <span className="fake-button">Withdraw 0.32 MON</span>
        </div>
        <div className="pc-early">
          <span>Early supporters</span>
          <ol>
            {(["kaan", "deniz", "umut"] as const).map((name, index) => (
              <li key={name}>
                <Face name={name} size={28} />
                <b>@{name}</b>
                <small>{index + 1} of the first 10</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const AUDIENCE: {
  who: Character;
  tone: string;
  name: string;
  today: string;
  here: string;
}[] = [
  {
    who: "mira",
    tone: "publish",
    name: "Authors",
    today:
      "You post the idea. The thread moves on, and the credit goes with it.",
    here: "Your name stays on every fork, and you earn when forks of your idea are backed.",
  },
  {
    who: "deniz",
    tone: "fork",
    name: "Improvers",
    today: "Your better target is a reply nobody can find next week.",
    here: "Your fork is its own idea, with the exact change on record and most of the backing it draws.",
  },
  {
    who: "kaan",
    tone: "back",
    name: "Supporters",
    today: "A like says nothing about when you believed it.",
    here: "The first ten backers of an idea are recorded in order, in public.",
  },
];
export function Audience() {
  return (
    <section
      className="l-section l-audience l-light"
      aria-labelledby="audience-title"
    >
      <header className="l-section-head">
        <p className="l-kicker">Who it is for</p>
        <h2 id="audience-title" data-split>
          Three ways to be right in public.
        </h2>
      </header>
      <ul className="l-audience-list">
        {AUDIENCE.map((item) => (
          <li
            key={item.name}
            style={{ "--tone": `var(--${item.tone})` } as CSSProperties}
            data-reveal
          >
            <div className="aud-head">
              <Face name={item.who} size={56} />
              <h3>{item.name}</h3>
            </div>
            <dl>
              <div>
                <dt>Today</dt>
                <dd>{item.today}</dd>
              </div>
              <div className="is-here">
                <dt>On FORK</dt>
                <dd>{item.here}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

const seconds = (ms: number) =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

export function BuiltOn({
  registry,
  backing,
  measured,
}: {
  registry: string;
  backing: string | null;
  measured: MeasuredRun | null;
}) {
  return (
    <section
      id="built"
      className="l-section l-built"
      aria-labelledby="built-title"
    >
      <header className="l-section-head">
        <p className="l-kicker">Built on</p>
        <h2 id="built-title" data-split>
          Credit that does not depend on us.
        </h2>
      </header>
      <ul className="l-built-list">
        <li data-reveal>
          <div className="built-logo is-monad">
            <TokenMark symbol="MON" size={30} />
            <b>Monad</b>
          </div>
          <p>
            Two contracts with no owner and no upgrade path hold authorship,
            lineage and the backing split.
          </p>
        </li>
        <li data-reveal>
          <div className="built-logo is-plate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/logos/privy.png"
              width={120}
              height={36}
              alt="Privy"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p>
            Sign in with Google or email and get a wallet that is yours. It
            signs what you publish, fork and back.
          </p>
        </li>
        <li data-reveal>
          <div className="built-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/logos/envio.png"
              width={116}
              height={28}
              alt="Envio"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p>
            Turns the events of both contracts into the graph that this page and
            every product screen read.
          </p>
        </li>
        <li data-reveal>
          <div className="built-logo is-pair">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/logos/nextjs.svg"
              width={30}
              height={30}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <b>Next.js</b>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/logos/postgresql.svg"
              width={28}
              height={28}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <b>PostgreSQL</b>
          </div>
          <p>
            The web app and the reasoning text, which is checked against its
            onchain hash before it is shown.
          </p>
        </li>
      </ul>
      {measured && (
        <div className="l-timeline" data-reveal>
          <p className="l-timeline-cap">
            Measured on Monad Testnet over {measured.samples} backings by the
            team’s test wallet, {measured.recordedAt.slice(0, 10)}
          </p>
          <ol>
            <li>
              <b>You sign</b>
              <span>in your wallet</span>
            </li>
            <li>
              <b>Confirmed on Monad</b>
              <span>
                median <em>{seconds(measured.confirmMedianMs)}</em>
              </span>
              <small>95th percentile {seconds(measured.confirmP95Ms)}</small>
            </li>
            {measured.indexMedianMs !== null && (
              <li>
                <b>In everyone’s feed</b>
                <span>
                  median <em>{seconds(measured.indexMedianMs)}</em> later
                </span>
              </li>
            )}
          </ol>
          <a
            className="l-link"
            href={`${GITHUB}/blob/main/docs/MONAD_PERFORMANCE.md`}
            target="_blank"
            rel="noreferrer"
          >
            Method and raw data <Icon name="arrow" size={16} />
          </a>
        </div>
      )}
      <div className="l-contracts">
        <a
          className="l-link"
          href={`${EXPLORER}/address/${registry}`}
          target="_blank"
          rel="noreferrer"
        >
          FORKRegistry on the explorer <Icon name="arrow" size={16} />
        </a>
        {backing && (
          <a
            className="l-link"
            href={`${EXPLORER}/address/${backing}`}
            target="_blank"
            rel="noreferrer"
          >
            FORKBacking on the explorer <Icon name="arrow" size={16} />
          </a>
        )}
      </div>
    </section>
  );
}

export function Finale() {
  return (
    <section className="l-finale" aria-labelledby="finale-title">
      <div className="l-finale-faces" aria-hidden="true">
        {(Object.keys(CHARACTERS) as Character[]).map((name) => (
          <Face key={name} name={name} size={96} />
        ))}
      </div>
      <h2 id="finale-title">
        Good ideas deserve <br />
        <span className="l-grad-text">a history.</span>
      </h2>
      <Link
        href="/feed"
        prefetch={false}
        className="button primary"
        data-magnetic
      >
        Open FORK <Icon name="arrow" size={18} />
      </Link>
    </section>
  );
}

export function LandingFooter({
  registry,
  backing,
}: {
  registry: string;
  backing: string | null;
}) {
  return (
    <footer className="l-footer">
      <div className="l-footer-row">
        <nav aria-label="Footer navigation">
          <Link href="/feed" prefetch={false}>
            Product
          </Link>
          <a href="#how">How it works</a>
          <a href="#live">Live graph</a>
          <a href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
        <div className="l-footer-contracts">
          <CopyAddress label="FORKRegistry" address={registry} />
          {backing && <CopyAddress label="FORKBacking" address={backing} />}
        </div>
      </div>
      <p className="l-footer-note">
        FORK runs on Monad Testnet. Testnet MON has no monetary value, and ideas
        here are opinions, not financial advice.
      </p>
      <div className="l-footer-mark" aria-hidden="true">
        <span>FORK</span>
      </div>
      <p className="l-footer-by">Built by Cayvox Labs</p>
    </footer>
  );
}
