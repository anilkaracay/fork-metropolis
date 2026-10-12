"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/social/icon";
import { Wordmark } from "@/components/ui/wordmark";

/**
 * The floating bar. It tightens and gains a backdrop once the page has scrolled.
 * `ideas` is the real count from the indexer, or null when it could not be read.
 */
export function MarketingNavigation({ ideas }: { ideas: number | null }) {
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const mark = sentinel.current;
    if (!mark) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry!.isIntersecting),
      { rootMargin: "48px 0px 0px 0px" },
    );
    observer.observe(mark);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <span ref={sentinel} className="l-nav-sentinel" aria-hidden="true" />
      <header className="l-nav" data-scrolled={scrolled}>
        <Link
          href="/"
          className="l-nav-logo"
          aria-label="FORK home"
          prefetch={false}
        >
          <Wordmark />
        </Link>
        <nav className="l-nav-links" aria-label="Landing navigation">
          <a href="#how">How it works</a>
          <a href="#live">Live graph</a>
          <a href="#built">Built on</a>
        </nav>
        <div className="l-nav-end">
          <a className="l-nav-chip" href="#live">
            <span>Monad Testnet</span>
            {ideas !== null && (
              <span className="l-nav-count">
                {ideas} {ideas === 1 ? "idea" : "ideas"}
              </span>
            )}
          </a>
          <Link
            href="/feed"
            prefetch={false}
            className="button primary l-nav-cta"
            data-magnetic
          >
            Open FORK <Icon name="arrow" size={16} />
          </Link>
        </div>
      </header>
    </>
  );
}
