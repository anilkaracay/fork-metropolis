"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/social/icon";

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

export function IdeaLineage({ original, fork }: PublicLineage) {
  const [selected, select] = useState("2");
  const idea = selected === "1" ? original : fork;
  return (
    <div
      className="landing-lineage"
      aria-label="Real Monad Testnet idea lineage"
    >
      <div className="lineage-heading">
        <span>IDEA LINEAGE</span>
        <span>
          01 <span aria-hidden="true">→</span> 02
        </span>
      </div>
      <div className="lineage-canvas">
        <div
          className={`landing-node landing-node-original ${selected === "1" ? "is-selected" : ""}`}
        >
          <button
            type="button"
            onClick={() => select("1")}
            aria-pressed={selected === "1"}
            aria-label="Select Thesis #1"
            aria-controls="lineage-perspective"
          >
            <span className="node-kicker">
              <span>Original thesis</span>
              <span>#1</span>
            </span>
            <span className="landing-market">
              ETH <span>Long</span>
            </span>
            <span className="landing-node-values">
              <span>
                <small>Target</small>
                {original.target}
              </span>
              <span>
                <small>Leverage</small>
                {original.leverage}
              </span>
            </span>
          </button>
          <Link
            href={`/u/${original.handle}`}
            prefetch={false}
            className="landing-node-author"
          >
            <span className="landing-avatar">A</span>
            <span>@{original.handle}</span>
            <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="lineage-connector">
          <svg
            viewBox="0 0 160 74"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M1 0v42q0 16 16 16h126q16 0 16 16" />
            <circle cx="1" cy="1" r="3" />
          </svg>
          <span>Target + leverage changed</span>
        </div>
        <div
          className={`landing-node landing-node-fork ${selected === "2" ? "is-selected" : ""}`}
        >
          <button
            type="button"
            onClick={() => select("2")}
            aria-pressed={selected === "2"}
            aria-label="Select Fork #2"
            aria-controls="lineage-perspective"
          >
            <span className="node-kicker">
              <span>
                <Icon name="fork" size={14} /> Fork of #1
              </span>
              <span>#2</span>
            </span>
            <span className="landing-market">A different perspective.</span>
            <span className="landing-node-values">
              <span>
                <small>Target</small>
                <span className="node-before">{original.target}</span>{" "}
                <span aria-hidden="true">→</span> {fork.target}
              </span>
              <span>
                <small>Leverage</small>
                <span className="node-before">{original.leverage}</span>{" "}
                <span aria-hidden="true">→</span> {fork.leverage}
              </span>
            </span>
            <span className="landing-unchanged">
              {fork.invalidation} invalidation · unchanged
            </span>
          </button>
          <Link
            href={`/u/${fork.handle}`}
            prefetch={false}
            className="landing-node-author"
          >
            <span className="landing-avatar">B</span>
            <span>@{fork.handle}</span>
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </div>
      <div
        id="lineage-perspective"
        className="lineage-perspective"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="lineage-perspective-label">
          {selected === "1" ? "THE ORIGINAL" : "THE CONTRIBUTION"}
        </span>
        <p>{idea.reasoning}</p>
        <Link href={`/t/${idea.id}`} prefetch={false}>
          Read {selected === "1" ? "Thesis #1" : "Fork #2"}{" "}
          <Icon name="arrow" size={14} />
        </Link>
      </div>
      <div className="lineage-footnote">
        <span>Real ideas. Monad Testnet.</span>
        <Link href="/t/2/tree" prefetch={false}>
          Open Idea Tree <Icon name="arrow" size={14} />
        </Link>
      </div>
    </div>
  );
}
