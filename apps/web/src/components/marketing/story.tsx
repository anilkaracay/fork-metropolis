import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/social/icon";
import { Face, TokenMark, type Character } from "./characters";

// "How it works", told with the example characters. On wide screens with motion the four
// steps share one pinned frame; otherwise they stack, each step followed by its panel.

/** The same idea shown small in several panels, so the frame can carry it between them. */
function IdeaChip({
  who,
  target,
  leverage,
  flip,
}: {
  who: Character;
  target: string;
  leverage: string;
  flip: string;
}) {
  return (
    <span className="idea-chip" data-flip-id={flip}>
      <Face name={who} size={26} />
      <span className="idea-chip-who">@{who}</span>
      <span className="idea-chip-nums">
        ETH · {target} · {leverage}
      </span>
    </span>
  );
}

/** Where a tree row sits: how deep it is and how many rows above its parent is. */
export const treeStyle = (depth: number, rowsToParent: number) =>
  ({ "--depth": depth, "--rows": rowsToParent }) as CSSProperties;

function Step({
  index,
  tone,
  name,
  title,
  children,
}: {
  index: number;
  tone: string;
  name: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="story-copy"
      data-step={index}
      style={{ "--tone": `var(--${tone})`, order: index * 2 } as CSSProperties}
    >
      <p className="story-step">
        <span>{String(index + 1).padStart(2, "0")}</span> {name}
      </p>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function Panel({
  index,
  tone,
  label,
  children,
}: {
  index: number;
  tone: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="story-panel"
      data-panel={index}
      role="img"
      aria-label={label}
      style={
        { "--tone": `var(--${tone})`, order: index * 2 + 1 } as CSSProperties
      }
    >
      <span className="l-tag story-panel-tag">Example</span>
      {children}
    </div>
  );
}

export function Story() {
  return (
    <section id="how" className="l-section l-story" aria-labelledby="how-title">
      <header className="l-section-head">
        <p className="l-kicker">How it works</p>
        <h2 id="how-title" data-split>
          An idea becomes an object with a history.
        </h2>
      </header>

      <div className="story" data-story>
        <div className="story-copies">
          <Step
            index={0}
            tone="publish"
            name="Publish"
            title="Put it on the record."
          >
            Market, direction, target, invalidation, leverage and your
            reasoning. Your wallet signs it, and Monad records you as the
            author.
          </Step>
          <Step index={1} tone="fork" name="Fork" title="Disagree? Fork it.">
            Change the target, the leverage or the argument. The fork shows
            exactly what changed and stays linked to the original for good.
          </Step>
          <Step
            index={2}
            tone="back"
            name="Back"
            title="Back what you believe in."
          >
            Put MON behind an idea. It is split on the spot between its author
            and the authors of the ideas it grew from: 70, 20 and 10.
          </Step>
          <Step
            index={3}
            tone="tree"
            name="Idea Tree"
            title="See how an idea grew."
          >
            Every branch in one view: who wrote it, what changed, and the value
            that travelled back to the ideas before it.
          </Step>
        </div>

        <div className="story-frame" data-story-frame>
          <div className="story-frame-bar" aria-hidden="true">
            <span className="l-tag">Example</span>
            <span className="story-frame-title" data-story-title>
              New idea
            </span>
          </div>

          <Panel
            index={0}
            tone="publish"
            label="Example: mira fills in a new ETH idea, her wallet signs it and it is confirmed on Monad."
          >
            <div className="composer">
              <IdeaChip who="mira" target="$4,200" leverage="2×" flip="mira" />
              <div className="composer-row">
                <span className="field" data-fill>
                  <small>Market</small>
                  <b>
                    <TokenMark symbol="ETH" size={18} /> ETH
                  </b>
                </span>
                <span className="field" data-fill>
                  <small>Perspective</small>
                  <b className="is-long">↗ Long</b>
                </span>
              </div>
              <div className="composer-row three">
                <span className="field" data-fill>
                  <small>Target</small>
                  <b>4,200</b>
                </span>
                <span className="field" data-fill>
                  <small>Invalidation</small>
                  <b>3,600</b>
                </span>
                <span className="field" data-fill>
                  <small>Leverage</small>
                  <b>2×</b>
                </span>
              </div>
              <span className="field wide" data-fill>
                <small>Reasoning</small>
                <b>
                  ETH keeps its weekly range while spot demand holds. A close
                  below 3,600 means I am wrong.
                </b>
              </span>
              <div className="composer-foot">
                <span className="fake-button" data-press>
                  Publish on Monad
                </span>
                <span className="confirm" data-confirm>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path
                      data-morph
                      d="m5 12 4 4L19 6"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Confirmed on Monad
                </span>
              </div>
            </div>
          </Panel>

          <Panel
            index={1}
            tone="fork"
            label="Example: theo forks mira's idea. Target changes from 4,200 to 4,400, leverage from 2 times to 3 times, and the reasoning is rewritten. The fork stays linked to its parent."
          >
            <div className="diff">
              <div className="diff-head">
                <IdeaChip
                  who="theo"
                  target="$4,400"
                  leverage="3×"
                  flip="theo"
                />
                <svg
                  className="diff-link"
                  viewBox="0 0 120 40"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    data-draw
                    d="M2 20h70c12 0 14-12 26-12h20"
                    stroke="var(--fork)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <IdeaChip
                  who="mira"
                  target="$4,200"
                  leverage="2×"
                  flip="mira"
                />
              </div>
              <ol className="diff-lines">
                <li className="del" data-line>
                  <i>−</i>
                  <span>target</span>
                  <b>$4,200</b>
                </li>
                <li className="add" data-line>
                  <i>+</i>
                  <span>target</span>
                  <b>$4,400</b>
                </li>
                <li className="del" data-line>
                  <i>−</i>
                  <span>leverage</span>
                  <b>2×</b>
                </li>
                <li className="add" data-line>
                  <i>+</i>
                  <span>leverage</span>
                  <b>3×</b>
                </li>
                <li className="del" data-line>
                  <i>−</i>
                  <span>reasoning</span>
                  <b>ETH keeps its weekly range while spot demand holds.</b>
                </li>
                <li className="add" data-line>
                  <i>+</i>
                  <span>reasoning</span>
                  <b>Same range, but it runs further once 4,200 clears.</b>
                </li>
              </ol>
              <p className="diff-foot">
                <Icon name="fork" size={15} /> 3 changes from its parent
              </p>
            </div>
          </Panel>

          <Panel
            index={2}
            tone="back"
            label="Example: 1 MON backs lena's idea, a fork of theo's fork of mira's idea. 0.7 MON goes to lena, 0.2 to theo and 0.1 to mira."
          >
            <div className="split">
              <div className="split-source">
                <span className="split-coin" data-coin>
                  <TokenMark symbol="MON" size={22} />
                </span>
                <b>1 MON</b>
                <small>backs @lena&apos;s idea</small>
              </div>
              <svg
                className="split-streams"
                viewBox="0 0 200 240"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path
                  data-stream
                  d="M0 120C80 120 90 40 200 40"
                  stroke="var(--back)"
                  strokeWidth="14"
                />
                <path
                  data-stream
                  d="M0 120C90 120 100 120 200 120"
                  stroke="var(--back)"
                  strokeWidth="4"
                />
                <path
                  data-stream
                  d="M0 120C80 120 90 200 200 200"
                  stroke="var(--back)"
                  strokeWidth="2"
                />
              </svg>
              <ul className="split-to">
                <li>
                  <IdeaChip
                    who="lena"
                    target="$4,600"
                    leverage="3×"
                    flip="lena"
                  />
                  <small>
                    <span className="role">wrote this idea · </span>70%
                  </small>
                  <b data-count="0.7">0.7 MON</b>
                </li>
                <li>
                  <IdeaChip
                    who="theo"
                    target="$4,400"
                    leverage="3×"
                    flip="theo"
                  />
                  <small>
                    <span className="role">wrote the idea it forks · </span>20%
                  </small>
                  <b data-count="0.2">0.2 MON</b>
                </li>
                <li>
                  <IdeaChip
                    who="mira"
                    target="$4,200"
                    leverage="2×"
                    flip="mira"
                  />
                  <small>
                    <span className="role">wrote the original · </span>10%
                  </small>
                  <b data-count="0.1">0.1 MON</b>
                </li>
              </ul>
            </div>
          </Panel>

          <Panel
            index={3}
            tone="tree"
            label="Example: the Idea Tree. mira's original is the root. theo and kaan forked it, and lena forked theo's fork. Backing of lena's idea sent 0.2 MON to theo's and 0.1 MON to mira's."
          >
            <ol className="tr mini-tree">
              <li className="tr-node" style={treeStyle(0, 0)} data-node>
                <IdeaChip
                  who="mira"
                  target="$4,200"
                  leverage="2×"
                  flip="mira"
                />
                <span className="tr-flow" data-flow>
                  +0.1 MON from forks
                </span>
              </li>
              <li className="tr-node" style={treeStyle(1, 1)} data-node>
                <IdeaChip
                  who="theo"
                  target="$4,400"
                  leverage="3×"
                  flip="theo"
                />
                <span className="tr-flow" data-flow>
                  +0.2 MON from forks
                </span>
              </li>
              <li className="tr-node" style={treeStyle(2, 1)} data-node>
                <IdeaChip
                  who="lena"
                  target="$4,600"
                  leverage="3×"
                  flip="lena"
                />
                <span className="tr-backed">1 MON backed</span>
              </li>
              <li className="tr-node" style={treeStyle(1, 3)} data-node>
                <IdeaChip
                  who="kaan"
                  target="$3,900"
                  leverage="2×"
                  flip="kaan"
                />
              </li>
            </ol>
          </Panel>
        </div>
      </div>
    </section>
  );
}
