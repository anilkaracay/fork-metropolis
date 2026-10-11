import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/social/icon";
import { IdeaLineage } from "@/components/marketing/lineage";
import { MarketingNavigation } from "@/components/marketing/navigation";
import { Wordmark } from "@/components/ui/wordmark";
import { readLandingLineage } from "@/server/landing";
import "./marketing.css";

export const metadata: Metadata = {
  title: { absolute: "FORK — Trading ideas evolve here" },
  description:
    "Publish an idea. Fork a better one. Build its history. A social network for collaborative trading ideas on Monad.",
  alternates: { canonical: "/" },
};

export default async function LandingPage() {
  await connection();
  const lineage = await readLandingLineage();
  return (
    <div className="marketing">
      <a className="skip-link" href="#landing-content">
        Skip to content
      </a>
      <div className="marketing-container">
        <MarketingNavigation />
        <main id="landing-content" tabIndex={-1}>
          <section className="landing-hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="landing-eyebrow">A NETWORK OF IDEAS</p>
              <h1 id="hero-title">
                Trading ideas
                <br />
                <span>evolve here.</span>
              </h1>
              <p className="hero-description">
                Publish an idea.
                <br />
                Fork a better one.
                <br />
                Build its history.
              </p>
              <div className="hero-actions">
                <Link href="/feed" prefetch={false} className="button primary">
                  Explore FORK <Icon name="arrow" size={18} />
                </Link>
                <a href="#how-it-works" className="landing-text-link">
                  See how it works <span aria-hidden="true">↓</span>
                </a>
              </div>
              <p className="hero-caption">
                Independent perspectives.
                <br />A shared history.
              </p>
            </div>
            {lineage ? (
              <IdeaLineage {...lineage} />
            ) : (
              <div className="lineage-unavailable">
                <span className="landing-eyebrow">IDEA LINEAGE</span>
                <h2>The history stays public.</h2>
                <p>
                  The live example is temporarily unavailable. Explore the Feed
                  or reload this page to try again.
                </p>
                <Link
                  href="/feed"
                  prefetch={false}
                  className="landing-text-link"
                >
                  Explore FORK <Icon name="arrow" size={16} />
                </Link>
                {/* A full reload retries the unavailable server-side projection. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/" className="landing-text-link">
                  Reload example <Icon name="arrow" size={16} />
                </a>
              </div>
            )}
          </section>

          <section
            id="how-it-works"
            className="landing-section"
            aria-labelledby="how-title"
          >
            <div className="section-heading">
              <p className="landing-eyebrow">01 / THE PRODUCT</p>
              <h2 id="how-title">Post. Fork. Improve.</h2>
              <p>
                One idea is a starting point.
                <br />
                Another perspective moves it forward.
              </p>
            </div>
            <div className="product-steps">
              <article>
                <div className="step-heading">
                  <span>01</span>
                  <h3>Put your reasoning first.</h3>
                </div>
                <p>
                  Publish a thesis with a target, a risk boundary, and the
                  thinking behind it.
                </p>
                <div className="product-excerpt">
                  <span className="excerpt-label">
                    {lineage
                      ? "THESIS #1 / ORIGINAL REASONING"
                      : "A THESIS STARTS WITH REASONING"}
                  </span>
                  {lineage ? (
                    <blockquote>{lineage.original.reasoning}</blockquote>
                  ) : (
                    <p>
                      Describe what you see — and what would change your view.
                    </p>
                  )}
                  <Link
                    href={lineage ? "/t/1" : "/new"}
                    prefetch={false}
                    className="landing-text-link"
                  >
                    {lineage ? "Read the original" : "Publish an idea"}{" "}
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              </article>
              <article>
                <div className="step-heading">
                  <span>02</span>
                  <h3>Keep the idea. Change the view.</h3>
                </div>
                <p>
                  Fork a thesis. Adjust its parameters and explain your own
                  perspective.
                </p>
                <div className="product-excerpt">
                  <span className="excerpt-label">
                    {lineage
                      ? "FORK #2 / THE MODIFIED PARAMETERS"
                      : "YOUR CONTRIBUTION"}
                  </span>
                  {lineage ? (
                    <dl className="step-diff">
                      <div>
                        <dt>Target</dt>
                        <dd>
                          <span>{lineage.original.target}</span>
                          <span aria-hidden="true">→</span>
                          <strong>{lineage.fork.target}</strong>
                        </dd>
                      </div>
                      <div>
                        <dt>Leverage</dt>
                        <dd>
                          <span>{lineage.original.leverage}</span>
                          <span aria-hidden="true">→</span>
                          <strong>{lineage.fork.leverage}</strong>
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p>
                      Your fork preserves its parent while making your changes
                      visible.
                    </p>
                  )}
                  <Link
                    href={lineage ? "/t/1/fork" : "/feed"}
                    prefetch={false}
                    className="landing-text-link"
                  >
                    {lineage
                      ? "Explore the fork composer"
                      : "Find an idea to fork"}{" "}
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              </article>
              <article>
                <div className="step-heading">
                  <span>03</span>
                  <h3>Leave a visible contribution.</h3>
                </div>
                <p>
                  The original author stays credited. Your reasoning gets a
                  place in the story.
                </p>
                <div className="product-excerpt">
                  <span className="excerpt-label">
                    {lineage
                      ? "FORK #2 / A NEW PERSPECTIVE"
                      : "A SHARED HISTORY"}
                  </span>
                  {lineage ? (
                    <blockquote>{lineage.fork.reasoning}</blockquote>
                  ) : (
                    <p>
                      Follow each contribution back to the idea that started it.
                    </p>
                  )}
                  <Link
                    href={lineage ? "/t/2" : "/explore"}
                    prefetch={false}
                    className="landing-text-link"
                  >
                    {lineage ? "Read the contribution" : "Explore perspectives"}{" "}
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              </article>
            </div>
          </section>

          <section
            id="lineage"
            className="landing-section lineage-section"
            aria-labelledby="lineage-title"
          >
            <div className="section-heading">
              <p className="landing-eyebrow">02 / THE SIGNATURE</p>
              <h2 id="lineage-title">
                Every idea has
                <br />a lineage.
              </h2>
              <p>
                Keep the origin.
                <br />
                Make your contribution visible.
              </p>
              <Link
                href="/t/2/tree"
                prefetch={false}
                className="landing-text-link"
              >
                Explore the real Idea Tree <Icon name="arrow" size={18} />
              </Link>
            </div>
            {lineage ? (
              <div className="lineage-comparison">
                <div className="comparison-authors">
                  <Link href={`/u/${lineage.original.handle}`} prefetch={false}>
                    <span className="excerpt-label">THESIS #1 / ORIGINAL</span>
                    <span className="comparison-identity">
                      <span className="landing-avatar">A</span>
                      <span>@{lineage.original.handle}</span>
                    </span>
                  </Link>
                  <Link href={`/u/${lineage.fork.handle}`} prefetch={false}>
                    <span className="excerpt-label">
                      FORK #2 / CONTRIBUTION
                    </span>
                    <span className="comparison-identity">
                      <span className="landing-avatar">B</span>
                      <span>@{lineage.fork.handle}</span>
                    </span>
                  </Link>
                </div>
                <div className="comparison-branch" aria-hidden="true">
                  <span />
                  <Icon name="fork" size={20} />
                  <span />
                </div>
                <dl className="comparison-values">
                  <div>
                    <dt>Target</dt>
                    <dd>{lineage.original.target}</dd>
                    <dd className="changed-value">
                      <span aria-hidden="true">→</span>
                      {lineage.fork.target}
                    </dd>
                  </div>
                  <div>
                    <dt>Leverage</dt>
                    <dd>{lineage.original.leverage}</dd>
                    <dd className="changed-value">
                      <span aria-hidden="true">→</span>
                      {lineage.fork.leverage}
                    </dd>
                  </div>
                  <div>
                    <dt>Invalidation</dt>
                    <dd>{lineage.original.invalidation}</dd>
                    <dd>
                      {lineage.fork.invalidation}
                      <small>UNCHANGED</small>
                    </dd>
                  </div>
                </dl>
                <p className="comparison-note">
                  Two authors. One public history.
                  <br />A record of contribution, not a performance claim.
                </p>
              </div>
            ) : (
              <div className="lineage-unavailable">
                <h3>Read the history at its source.</h3>
                <p>
                  The live comparison could not be loaded. Browse public ideas
                  to view their lineage.
                </p>
                <Link
                  href="/feed"
                  prefetch={false}
                  className="landing-text-link"
                >
                  Browse Feed <Icon name="arrow" size={16} />
                </Link>
              </div>
            )}
          </section>

          <section
            id="built-on-monad"
            className="landing-section infrastructure-section"
            aria-labelledby="infra-title"
          >
            <div className="section-heading">
              <p className="landing-eyebrow">03 / THE FOUNDATION</p>
              <h2 id="infra-title">Built on Monad.</h2>
              <p>
                Public authorship.
                <br />
                Traceable history.
              </p>
            </div>
            <div className="infrastructure-list">
              <a
                href="https://testnet.monadexplorer.com/address/0x1889a7216b1ecad9a44910dd0996834d0894b9e1"
                target="_blank"
                rel="noreferrer"
              >
                <span className="infra-number">01</span>
                <div>
                  <h3>Monad Testnet</h3>
                  <p>
                    FORKRegistry anchors authorship, parent links, and content
                    hashes onchain.
                  </p>
                </div>
                <span className="infra-destination">
                  View registry <Icon name="arrow" size={16} />
                </span>
              </a>
              <Link href="/t/2/tree" prefetch={false}>
                <span className="infra-number">02</span>
                <div>
                  <h3>Envio HyperIndex</h3>
                  <p>
                    Registry events become a readable graph of ideas and their
                    contributions.
                  </p>
                </div>
                <span className="infra-destination">
                  Read the lineage <Icon name="arrow" size={16} />
                </span>
              </Link>
              <Link href="/feed" prefetch={false}>
                <span className="infra-number">03</span>
                <div>
                  <h3>Privy embedded wallets</h3>
                  <p>
                    Sign in with Google. Use your embedded wallet to publish on
                    Monad.
                  </p>
                </div>
                <span className="infra-destination">
                  Enter the product <Icon name="arrow" size={16} />
                </span>
              </Link>
              <p className="infrastructure-note">
                Reasoning and social content live in PostgreSQL. Onchain
                provenance proves attribution, not investment outcomes.
                Execution integration is deferred.
              </p>
            </div>
          </section>

          <section className="landing-finale" aria-labelledby="finale-title">
            <p className="landing-eyebrow">IDEAS EVOLVE IN PUBLIC.</p>
            <h2 id="finale-title">
              Good ideas deserve
              <br />a history.
            </h2>
            <Link href="/feed" prefetch={false} className="button primary">
              Enter FORK <Icon name="arrow" size={18} />
            </Link>
            <svg
              className="finale-branch"
              viewBox="0 0 340 190"
              fill="none"
              aria-hidden="true"
            >
              <path d="M30 190V8M30 110h150q40 0 40-40V8M220 70h64q28 0 28-28V8" />
              <circle cx="30" cy="8" r="5" />
              <circle cx="220" cy="8" r="5" />
              <circle cx="312" cy="8" r="5" />
            </svg>
          </section>
        </main>
        <footer className="marketing-footer">
          <Link href="/" aria-label="FORK home" prefetch={false}>
            <Wordmark />
          </Link>
          <p>Ideas are perspectives, not promises.</p>
          <nav aria-label="Footer navigation">
            <Link href="/feed" prefetch={false}>
              Product
            </Link>
            <Link href="/t/2/tree" prefetch={false}>
              Idea Tree
            </Link>
            <a href="#built-on-monad">Monad Testnet</a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
