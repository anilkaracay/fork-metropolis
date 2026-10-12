"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Ticker } from "@/components/ui/motion";

export type PublicIdea = {
  id: string;
  handle: string;
  target: string;
  leverage: string;
  invalidation: string;
  reasoning: string;
};
export type PublicLineage = {
  original: PublicIdea;
  fork: PublicIdea;
  registry: string;
};
const number = (text: string) => Number(text.replace(/[^0-9.]/g, ""));
const dollars = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;
const times = (value: number) => `${Math.round(value * 10) / 10}×`;
const ease = [0.2, 0.8, 0.2, 1] as const;

/**
 * The real lineage of thesis #1 and its fork #2, drawing itself: the origin appears,
 * a branch grows, and the fork's parameters move away from its parent's.
 */
export function HeroTree({ lineage }: { lineage: PublicLineage }) {
  const still = useReducedMotion();
  const { original, fork } = lineage;
  const appear = (delay: number) =>
    still
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease },
        };
  const draw = (delay: number, duration = 0.8) =>
    still
      ? { initial: false as const }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration, delay, ease },
        };
  return (
    <figure className="hero-tree" aria-labelledby="hero-tree-caption">
      <svg
        className="hero-tree-lines"
        viewBox="0 0 560 460"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <m.path d="M120 150v70q0 34 34 34h126" {...draw(0.45)} />
        <m.path
          className="ghost"
          d="M120 220v112q0 30 30 30h30"
          {...draw(1.5, 0.6)}
        />
        <m.circle cx="120" cy="150" r="4.5" {...appear(0.4)} />
        <m.circle cx="280" cy="254" r="4.5" {...appear(1.15)} />
      </svg>
      <m.div className="hero-node origin" {...appear(0)}>
        <div className="hero-node-top">
          <span>Thesis #{original.id}</span>
          <span>@{original.handle}</span>
        </div>
        <p className="hero-node-market">
          ETH <b>Long</b>
        </p>
        <dl>
          <div>
            <dt>Target</dt>
            <dd>{original.target}</dd>
          </div>
          <div>
            <dt>Leverage</dt>
            <dd>{original.leverage}</dd>
          </div>
        </dl>
      </m.div>
      <m.div className="hero-node fork" {...appear(1.1)}>
        <div className="hero-node-top">
          <span>Fork #{fork.id}</span>
          <span>@{fork.handle}</span>
        </div>
        <p className="hero-node-market">
          ETH <b>Long</b>
        </p>
        <dl>
          <div>
            <dt>Target</dt>
            <dd className="changed">
              <Ticker
                value={number(fork.target)}
                from={number(original.target)}
                delay={1.5}
                format={dollars}
              />
            </dd>
          </div>
          <div>
            <dt>Leverage</dt>
            <dd className="changed">
              <Ticker
                value={number(fork.leverage)}
                from={number(original.leverage)}
                delay={1.7}
                format={times}
              />
            </dd>
          </div>
        </dl>
      </m.div>
      <m.div className="hero-node ghost" {...appear(1.9)}>
        <span>Your fork</span>
        <Link href={`/t/${fork.id}/fork`} prefetch={false}>
          Change a parameter, keep the history
        </Link>
      </m.div>
      <figcaption id="hero-tree-caption">
        A real lineage on Monad Testnet: @{fork.handle} forked @
        {original.handle}’s idea and changed the target and the leverage.
      </figcaption>
    </figure>
  );
}
