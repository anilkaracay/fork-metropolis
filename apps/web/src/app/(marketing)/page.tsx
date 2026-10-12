import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { splitBacking } from "@fork/shared";
import { Icon } from "@/components/social/icon";
import { Beats, type SplitExample } from "@/components/marketing/beats";
import { HeroTree, type PublicLineage } from "@/components/marketing/hero-tree";
import { MarketingNavigation } from "@/components/marketing/navigation";
import { MotionRoot } from "@/components/ui/motion";
import { Wordmark } from "@/components/ui/wordmark";
import { formatMon, percentOf } from "@/lib/mon";
import { readLandingLineage, readLandingLive } from "@/server/landing";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "FORK · Trading ideas evolve here" },
  description:
    "Publish a trading idea, fork a better one, back the ones you believe in. Everyone who shaped an idea shares what it attracts. On Monad.",
  alternates: { canonical: "/" },
};
const EXAMPLE_BACKING = 10n ** 17n; // 0.1 MON, one of the product's presets

// How the product would split a preset backing of the real fork, by its own rule.
function splitExample(lineage: PublicLineage): SplitExample {
  const credits = splitBacking(
    {
      thesisId: lineage.fork.id,
      author: lineage.fork.handle,
      parent: {
        thesisId: lineage.original.id,
        author: lineage.original.handle,
      },
    },
    EXAMPLE_BACKING,
  );
  return {
    amount: formatMon(EXAMPLE_BACKING),
    rows: credits.map((credit) => ({
      handle: credit.recipient,
      note:
        credit.role === 0
          ? `wrote fork #${credit.creditedThesisId}`
          : `wrote #${credit.creditedThesisId}, the idea it forks`,
      amount: formatMon(credit.amount),
      share: percentOf(credit.amount, EXAMPLE_BACKING),
    })),
  };
}

export default async function LandingPage() {
  await connection();
  const [lineage, live] = await Promise.all([
    readLandingLineage(),
    readLandingLive(),
  ]);
  return (
    <MotionRoot>
      <div className="landing">
        <noscript>
          <style>{`.hero-tree [style], .beat-visual, .beat-visual [style] { opacity: 1 !important; transform: none !important; stroke-dasharray: none !important; }`}</style>
        </noscript>
        <a className="skip-link" href="#landing-content">
          Skip to content
        </a>
        <div className="l-frame">
          <MarketingNavigation />
          <main id="landing-content" tabIndex={-1}>
            <section className="l-hero" aria-labelledby="hero-title">
              <div className="l-hero-copy">
                <p className="l-kicker">A social network for trading ideas</p>
                <h1 id="hero-title">
                  Trading ideas
                  <br />
                  <span>evolve here.</span>
                </h1>
                <div className="l-hero-sub">
                  <p className="l-hero-lead">
                    Publish a thesis. Fork a better one. Back the ones you
                    believe in. Everyone who shaped an idea shares what it
                    attracts.
                  </p>
                  <div className="l-hero-actions">
                    <Link
                      href="/feed"
                      prefetch={false}
                      className="button primary"
                    >
                      Open FORK <Icon name="arrow" size={18} />
                    </Link>
                    <a href="#how" className="l-link">
                      See how it works
                    </a>
                  </div>
                </div>
              </div>
              {lineage ? (
                <HeroTree lineage={lineage} />
              ) : (
                <div className="l-unavailable">
                  <p className="l-kicker">Idea lineage</p>
                  <h2>The history stays public.</h2>
                  <p>
                    The live example could not be loaded just now. Open the
                    product, or reload this page to try again.
                  </p>
                  <Link href="/feed" prefetch={false} className="l-link">
                    Open FORK <Icon name="arrow" size={16} />
                  </Link>
                  {/* A full reload retries the server-side read. */}
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a href="/" className="l-link">
                    Reload <Icon name="arrow" size={16} />
                  </a>
                </div>
              )}
            </section>

            <section id="how" className="l-section" aria-labelledby="how-title">
              <header className="l-section-head">
                <p className="l-kicker">How it works</p>
                <h2 id="how-title">
                  An idea becomes an object
                  <br />
                  with a history.
                </h2>
                <p>
                  In a thread, an improvement to an idea disappears into the
                  replies. Here it gets its own place, its own author and a link
                  back to where it came from.
                </p>
              </header>
              <Beats
                lineage={lineage}
                split={lineage ? splitExample(lineage) : null}
              />
            </section>

            <section
              id="live"
              className="l-section l-live"
              aria-labelledby="live-title"
            >
              <header className="l-section-head">
                <p className="l-kicker">Live on Monad Testnet</p>
                <h2 id="live-title">What the graph holds right now.</h2>
                <p>
                  Read from the FORK indexer when this page loaded. It is early
                  and small, and it includes the team’s own test activity.
                </p>
              </header>
              {live ? (
                <div className="l-live-grid">
                  <dl className="l-figures">
                    <div>
                      <dt>Ideas published{live.bounded ? " (latest)" : ""}</dt>
                      <dd>{live.ideas}</dd>
                    </div>
                    <div>
                      <dt>Of them, forks</dt>
                      <dd>{live.forks}</dd>
                    </div>
                    <div>
                      <dt>Authors</dt>
                      <dd>{live.authors}</dd>
                    </div>
                    {live.backing && (
                      <>
                        <div>
                          <dt>Backed</dt>
                          <dd>
                            {live.backing.totalMon} <small>MON</small>
                          </dd>
                        </div>
                        <div>
                          <dt>Passed on to earlier authors</dt>
                          <dd>
                            {live.backing.sentToAncestorsMon} <small>MON</small>
                          </dd>
                        </div>
                        <div>
                          <dt>Supporters</dt>
                          <dd>{live.backing.supporters}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  <ol className="l-latest" aria-label="Latest ideas">
                    {live.latest.map((idea) => (
                      <li key={idea.id}>
                        <Link href={`/t/${idea.id}`} prefetch={false}>
                          <span className="l-latest-id">#{idea.id}</span>
                          <span className="l-latest-main">
                            <strong>@{idea.handle}</strong>
                            <small>
                              {idea.parentId
                                ? `forked #${idea.parentId}`
                                : "original idea"}{" "}
                              · {idea.side} · target {idea.target} ·{" "}
                              {idea.leverage}
                            </small>
                          </span>
                          <span className="l-latest-backed">
                            {idea.backedMon ? `${idea.backedMon} MON` : ""}
                          </span>
                          <Icon name="arrow" size={16} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="l-unavailable">
                  <p>
                    The live graph could not be read just now. The numbers are
                    never filled in from memory.
                  </p>
                  <Link href="/feed" prefetch={false} className="l-link">
                    Open the feed <Icon name="arrow" size={16} />
                  </Link>
                </div>
              )}
            </section>

            <section
              id="onchain"
              className="l-section l-onchain"
              aria-labelledby="onchain-title"
            >
              <header className="l-section-head">
                <p className="l-kicker">What lives onchain</p>
                <h2 id="onchain-title">
                  Credit that does not depend
                  <br />
                  on us.
                </h2>
              </header>
              <ul className="l-stack">
                <li>
                  <h3>Monad</h3>
                  <p>
                    Authorship, parent links and the backing split are enforced
                    by two small contracts with no owner and no upgrade path.
                    Each action shows the confirmation time measured for it.
                  </p>
                  <a
                    className="l-link"
                    href={`https://testnet.monadexplorer.com/address/${lineage?.registry ?? "0x1889a7216b1ecad9a44910dd0996834d0894b9e1"}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View the registry <Icon name="arrow" size={16} />
                  </a>
                </li>
                <li>
                  <h3>Envio</h3>
                  <p>
                    Contract events become one graph: who forked whom, who
                    backed what, and how value moved from a fork to the ideas
                    before it.
                  </p>
                  <Link className="l-link" href="/explore" prefetch={false}>
                    Explore the graph <Icon name="arrow" size={16} />
                  </Link>
                </li>
                <li>
                  <h3>Privy</h3>
                  <p>
                    Sign in with Google or email and get a wallet that is yours.
                    It signs what you publish, fork and back.
                  </p>
                  <Link className="l-link" href="/feed" prefetch={false}>
                    Sign in from the product <Icon name="arrow" size={16} />
                  </Link>
                </li>
              </ul>
            </section>

            <section className="l-finale" aria-labelledby="finale-title">
              <h2 id="finale-title">
                Good ideas deserve
                <br />a history.
              </h2>
              <Link href="/feed" prefetch={false} className="button primary">
                Open FORK <Icon name="arrow" size={18} />
              </Link>
            </section>
          </main>
          <footer className="l-footer">
            <Link href="/" aria-label="FORK home" prefetch={false}>
              <Wordmark />
            </Link>
            <p>
              FORK runs on Monad Testnet. Testnet MON has no monetary value, and
              ideas here are opinions, not financial advice.
            </p>
            <nav aria-label="Footer navigation">
              <Link href="/feed" prefetch={false}>
                Product
              </Link>
              <a href="#how">How it works</a>
              <a href="#live">Live graph</a>
            </nav>
          </footer>
        </div>
      </div>
    </MotionRoot>
  );
}
