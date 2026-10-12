"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FeedThesis } from "@fork/shared";
import { api } from "@/lib/api-client";
import { EmptyState, ErrorState, Skeleton, ReadStatus } from "./common";
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
      staleTime: 30000,
    }),
    context = useMarkets(),
    [market, setMarket] = useState(initialMarket),
    [tag, setTag] = useState(initialTag),
    [search, setSearch] = useState(""),
    [kind, setKind] = useState("all"),
    [sort, setSort] = useState("newest");
  const data = query.data,
    term = search.trim().toLowerCase(),
    visible = (data?.items ?? [])
      .filter(
        (n) =>
          (!market ||
            marketName(n.graph.core.marketId, context.data) === market) &&
          (!tag || n.metadata?.tags.includes(tag)) &&
          (kind === "all" ||
            (kind === "roots"
              ? n.graph.parentId === "0"
              : n.graph.parentId !== "0")) &&
          (!term ||
            [
              n.graph.thesisId,
              n.author.handle,
              n.author.displayName,
              marketName(n.graph.core.marketId, context.data),
              n.metadata?.reasoning ?? "",
              ...(n.metadata?.tags ?? []),
            ].some((v) => v.toLowerCase().includes(term))),
      )
      .sort(
        (a, b) =>
          (sort === "forked"
            ? b.graph.uniqueExternalForkers - a.graph.uniqueExternalForkers
            : 0) ||
          b.graph.createdAt - a.graph.createdAt ||
          (BigInt(a.graph.thesisId) < BigInt(b.graph.thesisId) ? 1 : -1),
      );
  const filtered = !!(market || tag || search || kind !== "all");
  function clear() {
    setMarket("");
    setTag("");
    setSearch("");
    setKind("all");
  }
  return (
    <div className="explore-screen social-polish">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Find your conversation</span>
          <h1>Perspectives worth exploring.</h1>
          <p>Find an original idea. Follow how others build on it.</p>
        </div>
      </div>
      <div className="discovery-search">
        <label>
          Search ideas
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Market, author or idea"
            maxLength={100}
          />
        </label>
      </div>
      <div className="market-grid" role="group" aria-label="Filter by market">
        <button
          className={`market-topic ${!market ? "selected" : ""}`}
          aria-pressed={!market}
          onClick={() => setMarket("")}
        >
          <strong>All markets</strong>
          {data && <span>{data.items.length} ideas</span>}
        </button>
        {["BTC", "ETH", "SOL", "MON"].map((symbol) => {
          const count = data?.items.filter(
            (n) => marketName(n.graph.core.marketId, context.data) === symbol,
          ).length;
          return (
            <button
              key={symbol}
              className={`market-topic ${market === symbol ? "selected" : ""}`}
              aria-pressed={market === symbol}
              onClick={() => setMarket(market === symbol ? "" : symbol)}
            >
              <strong>{symbol}</strong>
              {count !== undefined && context.data && (
                <span>
                  {count} {count === 1 ? "idea" : "ideas"}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {context.error && !context.data && (
        <ErrorState
          error={context.error}
          retry={() => void context.refetch()}
        />
      )}
      <div className="discovery-options">
        <label>
          Idea type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All ideas</option>
            <option value="roots">Original ideas</option>
            <option value="forks">Forks</option>
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="forked">Most external forkers</option>
          </select>
        </label>
        {filtered && (
          <button className="button secondary" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>
      {!!data?.topics.length && (
        <div className="topic-filter" role="group" aria-label="Filter topics">
          <button
            className={!tag ? "selected" : ""}
            aria-pressed={!tag}
            onClick={() => setTag("")}
          >
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
        <h2>{filtered ? "In this conversation" : "Recent perspectives"}</h2>
        <Link href="/new" className="quiet-link">
          Add your idea <Icon name="create" size={16} />
        </Link>
      </div>
      {query.isPending ? (
        <Skeleton cards={2} />
      ) : query.error && !data ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <ReadStatus
            error={query.error}
            refreshing={query.isFetching}
            retry={() => void query.refetch()}
          />
          <p className="discovery-count" role="status">
            {visible.length}{" "}
            {visible.length === 1 ? "perspective" : "perspectives"}
            {filtered
              ? " match your filters"
              : " in this discovery window"} ·{" "}
            {sort === "forked"
              ? "external forkers, then newest"
              : "newest first"}
          </p>
          <div className="explore-ideas">
            {visible.slice(0, 40).map((n) => (
              <ThesisCard item={n} key={n.graph.thesisId} />
            ))}
          </div>
          {!visible.length && (
            <>
              <EmptyState
                title={
                  filtered
                    ? "No ideas match yet."
                    : "A conversation waiting to start."
                }
                description={
                  filtered
                    ? "Try another market, author or phrase, or clear your filters."
                    : "Publish the first perspective in this topic."
                }
                create={!filtered}
              />
              {filtered && (
                <button className="button secondary" onClick={clear}>
                  Show all ideas
                </button>
              )}
            </>
          )}
          <p className="subtle-note">
            {data?.scope}{" "}
            {visible.length > 40 &&
              "Showing 40 ideas. Narrow your filters to see a smaller selection."}
          </p>
        </>
      )}
    </div>
  );
}
