"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Icon } from "@/components/social/icon";
import type { PublicLineage } from "./hero-tree";

export type SplitExample = {
  amount: string;
  rows: { handle: string; note: string; amount: string; share: number }[];
};
const beats = [
  { id: "publish", label: "Publish" },
  { id: "fork", label: "Fork" },
  { id: "back", label: "Back" },
  { id: "lineage", label: "Lineage" },
] as const;
const ease = [0.2, 0.8, 0.2, 1] as const;

/** The product in four steps. The rail follows the step being read. */
export function Beats({
  lineage,
  split,
}: {
  lineage: PublicLineage | null;
  split: SplitExample | null;
}) {
  const [active, setActive] = useState(0),
    sections = useRef<(HTMLElement | null)[]>([]),
    still = useReducedMotion();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(sections.current.indexOf(entry.target as HTMLElement));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const section of sections.current)
      if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const reveal = still
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-20% 0px" },
        transition: { duration: 0.6, ease },
      };
  const beat = (
    index: number,
    title: string,
    body: string,
    visual: ReactNode,
    link: { href: string; text: string },
  ) => (
    <article
      id={beats[index]!.id}
      className="beat"
      ref={(element) => {
        sections.current[index] = element;
      }}
      aria-labelledby={`${beats[index]!.id}-title`}
    >
      <div className="beat-copy">
        <p className="l-kicker">
          0{index + 1} · {beats[index]!.label}
        </p>
        <h3 id={`${beats[index]!.id}-title`}>{title}</h3>
        <p>{body}</p>
        <Link href={link.href} prefetch={false} className="l-link">
          {link.text} <Icon name="arrow" size={16} />
        </Link>
      </div>
      <m.div className="beat-visual" {...reveal}>
        {visual}
      </m.div>
    </article>
  );
  const unavailable = (
    <p className="beat-unavailable">
      The live example could not be loaded just now. The product itself is one
      click away.
    </p>
  );
  return (
    <div className="beats">
      <ol className="beats-rail" aria-label="How FORK works">
        {beats.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === index ? "step" : undefined}
            >
              <span>0{index + 1}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
      <div className="beats-body">
        {beat(
          0,
          "Say what you see.",
          "A thesis is a market view with a target, an invalidation and your reasoning. Your wallet signs it, and Monad keeps the authorship.",
          lineage ? (
            <div className="beat-card">
              <div className="beat-card-top">
                <span>Thesis #{lineage.original.id}</span>
                <span>@{lineage.original.handle}</span>
              </div>
              <blockquote>{lineage.original.reasoning}</blockquote>
              <dl className="beat-values">
                <div>
                  <dt>Target</dt>
                  <dd>{lineage.original.target}</dd>
                </div>
                <div>
                  <dt>Invalidation</dt>
                  <dd>{lineage.original.invalidation}</dd>
                </div>
                <div>
                  <dt>Leverage</dt>
                  <dd>{lineage.original.leverage}</dd>
                </div>
              </dl>
            </div>
          ) : (
            unavailable
          ),
          lineage
            ? { href: `/t/${lineage.original.id}`, text: "Read this thesis" }
            : { href: "/new", text: "Publish an idea" },
        )}
        {beat(
          1,
          "Improve it without erasing it.",
          "Change the target, the leverage or the argument. Your fork keeps a link to its parent, so the original author stays credited.",
          lineage ? (
            <div className="beat-card">
              <div className="beat-card-top">
                <span>
                  Fork #{lineage.fork.id} of #{lineage.original.id}
                </span>
                <span>@{lineage.fork.handle}</span>
              </div>
              <dl className="beat-diff">
                {(
                  [
                    ["Target", "target"],
                    ["Leverage", "leverage"],
                    ["Invalidation", "invalidation"],
                  ] as const
                ).map(([label, key]) => {
                  const changed = lineage.original[key] !== lineage.fork[key];
                  return (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {changed ? (
                          <>
                            <s>{lineage.original[key]}</s>
                            <Icon name="arrow" size={14} />
                            <strong>{lineage.fork[key]}</strong>
                          </>
                        ) : (
                          <>
                            {lineage.fork[key]} <small>unchanged</small>
                          </>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <blockquote>{lineage.fork.reasoning}</blockquote>
            </div>
          ) : (
            unavailable
          ),
          lineage
            ? {
                href: `/t/${lineage.original.id}/fork`,
                text: "Open the fork composer",
              }
            : { href: "/feed", text: "Find an idea to fork" },
        )}
        {beat(
          2,
          "Put MON behind an idea.",
          "Backing is split along the lineage: the author, the idea it forks and the idea before that. The first ten backers of an idea are recorded as early supporters.",
          split ? (
            <div className="beat-card">
              <div className="beat-card-top">
                <span>Backing fork #{lineage?.fork.id}</span>
                <span>{split.amount} MON</span>
              </div>
              <ul className="beat-split">
                {split.rows.map((row, index) => (
                  <li key={row.handle + row.note}>
                    <span>
                      <strong>@{row.handle}</strong>
                      <small>{row.note}</small>
                    </span>
                    <span>
                      <strong>{row.amount} MON</strong>
                      <small>{row.share}%</small>
                    </span>
                    <m.i
                      aria-hidden="true"
                      initial={still ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: row.share / 100 }}
                      viewport={{ once: true, margin: "-20% 0px" }}
                      transition={{
                        duration: 0.7,
                        delay: 0.2 + index * 0.12,
                        ease,
                      }}
                    />
                  </li>
                ))}
              </ul>
              <p className="beat-note">
                How a {split.amount} MON backing of this fork is split. A fork
                of a fork splits 70, 20 and 10.
              </p>
            </div>
          ) : (
            unavailable
          ),
          lineage
            ? { href: `/t/${lineage.fork.id}`, text: "Open the fork" }
            : { href: "/feed", text: "Browse ideas" },
        )}
        {beat(
          3,
          "See how it grew.",
          "The Idea Tree shows every branch: who wrote it, what changed, and where the value went.",
          lineage ? (
            <div className="beat-card beat-tree">
              <svg viewBox="0 0 320 150" fill="none" aria-hidden="true">
                <m.path
                  d="M70 46v34q0 20 20 20h80"
                  initial={still ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: "-20% 0px" }}
                  transition={{ duration: 0.9, ease }}
                />
                <circle cx="70" cy="38" r="8" />
                <circle cx="178" cy="100" r="8" />
              </svg>
              <div className="beat-tree-node first">
                <strong>#{lineage.original.id}</strong>@
                {lineage.original.handle}
              </div>
              <div className="beat-tree-node second">
                <strong>#{lineage.fork.id}</strong>@{lineage.fork.handle}
              </div>
            </div>
          ) : (
            unavailable
          ),
          lineage
            ? {
                href: `/t/${lineage.fork.id}/tree`,
                text: "Open the real Idea Tree",
              }
            : { href: "/explore", text: "Explore the graph" },
        )}
      </div>
    </div>
  );
}
