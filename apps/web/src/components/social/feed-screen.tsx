"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FeedMode, FeedThesis } from "@fork/shared";
import { api } from "@/lib/api-client";
import { ThesisCard } from "./thesis-card";
import { EmptyState, ErrorState, Skeleton, ReadStatus } from "./common";
import { Icon } from "./icon";
type Page = {
  items: FeedThesis[];
  nextOffset: number | null;
  bounded: boolean;
  ranking: string;
};
export function FeedScreen() {
  const [mode, setMode] = useState<FeedMode>("fresh"),
    [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["feed", mode, offset],
    queryFn: () => api<Page>(`feed?mode=${mode}&offset=${offset}`),
    staleTime: 30000,
  });
  return (
    <div className="content-grid social-polish">
      <section className="feed-column">
        <div className="page-heading">
          <div>
            <span className="eyebrow">The conversation starts here</span>
            <h1>Good ideas get better.</h1>
            <p>
              Publish a perspective. Find a new angle. Fork what comes next.
            </p>
          </div>
          <Link href="/new" className="button primary create-desktop">
            <Icon name="create" size={17} />
            New idea
          </Link>
        </div>
        <div className="feed-tabs" role="group" aria-label="Feed ranking">
          {(["fresh", "most-forked", "smart-signal"] as const).map((m) => (
            <button
              key={m}
              className={mode === m ? "selected" : ""}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setOffset(0);
              }}
            >
              {m === "fresh"
                ? "Fresh"
                : m === "most-forked"
                  ? "Most Forked"
                  : "Smart Signal"}
              {m === "smart-signal" && <span className="tiny-dot" />}
            </button>
          ))}
        </div>
        <p className="ranking-note">
          {mode === "fresh"
            ? "Newest indexed perspectives first."
            : "Unique external forkers: 24h → 7d → newest."}{" "}
          {mode === "smart-signal" &&
            "Social signals only; no execution ranking."}
        </p>
        {query.data && (
          <ReadStatus
            error={query.error}
            refreshing={query.isFetching}
            retry={() => void query.refetch()}
          />
        )}
        {query.isPending ? (
          <Skeleton />
        ) : query.error && !query.data ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : query.data?.items.length ? (
          <>
            <div className="feed-list">
              {query.data.items.map((item, index) => (
                <ThesisCard
                  key={item.graph.thesisId}
                  item={item}
                  index={index}
                />
              ))}
            </div>
            <div className="pagination">
              {offset > 0 && (
                <button
                  className="button secondary"
                  onClick={() => setOffset(Math.max(0, offset - 20))}
                >
                  Previous ideas
                </button>
              )}
              {query.data.nextOffset !== null && (
                <button
                  className="button secondary"
                  onClick={() => setOffset(query.data!.nextOffset!)}
                >
                  More ideas
                </button>
              )}
            </div>
            {query.data.bounded && (
              <p className="subtle-note">
                Showing the latest 500 indexed ideas.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            title="The first idea starts with you."
            description="Give the network a thesis to discuss and improve."
          />
        )}
      </section>
      <aside className="context-rail">
        <div className="rail-heading">
          <span className="eyebrow">Make room for another angle</span>
          <Icon name="fork" size={18} />
        </div>
        <div className="rail-feature">
          <span className="rail-number">THE IDEA GRAPH</span>
          <h2>
            A perspective.
            <br />A new branch.
            <br />A shared history.
          </h2>
          <p>
            Every fork keeps its author, its changes and its origin in view.
          </p>
          <Link href="/explore" className="quiet-link">
            Explore ideas <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="rail-section">
          <h3>Find your conversation</h3>
          {["BTC", "ETH", "SOL", "MON"].map((symbol, i) => (
            <Link href={`/explore?market=${symbol}`} key={symbol}>
              <span className={`market-coin coin-${i}`}>{symbol[0]}</span>
              <span>
                <strong>{symbol}</strong>
                <small>Ideas & evolving perspectives</small>
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          ))}
        </div>
        <div className="rail-note">
          <span className="tiny-dot" />
          <p>
            Influence comes from what other people build on. Your profile shows
            the math.
          </p>
        </div>
      </aside>
    </div>
  );
}
