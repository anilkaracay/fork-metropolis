"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FeedThesis } from "@fork/shared";
import { api } from "@/lib/api-client";
import { EmptyState, ErrorState, Skeleton } from "./common";
import { ThesisCard, marketName, useMarkets } from "./thesis-card";
import { Icon } from "./icon";
export function ExploreScreen({
  initialMarket = "",
  initialTag = "",
}: {
  initialMarket?: string;
  initialTag?: string;
}) {
  const query = useQuery({
      queryKey: ["explore"],
      queryFn: () =>
        api<{ items: FeedThesis[]; topics: string[]; scope: string }>(
          "explore",
        ),
    }),
    context = useMarkets().data,
    [market, setMarket] = useState(initialMarket),
    [tag, setTag] = useState(initialTag);
  if (query.isPending) return <Skeleton />;
  if (query.error)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const data = query.data!,
    visible = data.items.filter(
      (n) =>
        (!market || marketName(n.graph.core.marketId, context) === market) &&
        (!tag || n.metadata?.tags.includes(tag)),
    );
  return (
    <div className="explore-screen">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Find your conversation</span>
          <h1>Perspectives worth exploring.</h1>
          <p>A market is a meeting point. See what people are thinking.</p>
        </div>
      </div>
      <div className="market-grid">
        {["BTC", "ETH", "SOL", "MON"].map((symbol, i) => {
          const items = data.items.filter(
              (n) => marketName(n.graph.core.marketId, context) === symbol,
            ),
            best = [...items].sort(
              (a, b) =>
                b.graph.uniqueExternalForkers - a.graph.uniqueExternalForkers,
            )[0],
            contributors = new Set(items.map((n) => n.graph.author)).size;
          return (
            <button
              key={symbol}
              className={`market-topic ${market === symbol ? "selected" : ""}`}
              onClick={() => setMarket(market === symbol ? "" : symbol)}
              aria-pressed={market === symbol}
            >
              <span className={`market-coin coin-${i}`}>{symbol[0]}</span>
              <h2>{symbol}</h2>
              <span>
                {items.length} ideas · {contributors} contributors
              </span>
              <div>
                <small>Most forked in this window</small>
                <strong>
                  {best
                    ? `@${best.author.handle} · ${best.graph.uniqueExternalForkers} external forkers`
                    : "The first perspective is open"}
                </strong>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          );
        })}
      </div>
      <p className="subtle-note">{data.scope}</p>
      {data.topics.length > 0 && (
        <div className="topic-filter" aria-label="Filter topics">
          <button className={!tag ? "selected" : ""} onClick={() => setTag("")}>
            All topics
          </button>
          {data.topics.map((t) => (
            <button
              className={tag === t ? "selected" : ""}
              aria-pressed={tag === t}
              key={t}
              onClick={() => setTag(tag === t ? "" : t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}
      <div className="section-title">
        <h2>
          {market || tag ? "In this conversation" : "Recent perspectives"}
        </h2>
        <Link href="/new" className="quiet-link">
          Add your idea <Icon name="create" size={16} />
        </Link>
      </div>
      <div className="explore-ideas">
        {visible.slice(0, 40).map((n) => (
          <ThesisCard item={n} key={n.graph.thesisId} />
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          title="A conversation waiting to start."
          description="Publish the first perspective in this topic."
        />
      )}
      {visible.length > 40 && (
        <p className="subtle-note">
          Showing 40 ideas. Filter by market or topic to narrow the
          conversation.
        </p>
      )}
    </div>
  );
}
