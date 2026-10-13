"use client";
import Link from "next/link";
import { ViewTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  formatFixedPoint,
  type FeedThesis,
  type MvpContext,
  type ThesisDetail,
} from "@fork/shared";
import { api } from "@/lib/api-client";
import { Avatar, TokenMark, age } from "./common";
import { Icon } from "./icon";
import { formatMon } from "@/lib/mon";
export function useMarkets() {
  return useQuery({
    queryKey: ["context"],
    queryFn: () => api<MvpContext>("context"),
    staleTime: 20000,
  });
}
export function marketName(id: number, context: MvpContext | undefined) {
  return (
    Object.entries(context?.markets ?? {}).find(([, m]) => m.id === id)?.[0] ??
    `Market ${id}`
  );
}
export function price(raw: string) {
  return formatFixedPoint(BigInt(raw), 8);
}
export function displayPrice(raw: string) {
  const [whole, fraction] = price(raw).split(".");
  return `$${whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
}
export function Direction({ side }: { side: string }) {
  return (
    <span className={`direction ${side}`}>
      {side === "long" ? "LONG" : "SHORT"}
    </span>
  );
}
export function Parameters({ item }: { item: FeedThesis }) {
  return (
    <div className="parameters">
      <div>
        <span>Target</span>
        <strong>{displayPrice(item.graph.core.targetPriceE8)}</strong>
      </div>
      <div>
        <span>Invalidation</span>
        <strong>{displayPrice(item.graph.core.invalidationPriceE8)}</strong>
      </div>
      <div>
        <span>Leverage</span>
        <strong>
          {item.graph.core.leverageBps / 10000}
          <small>×</small>
        </strong>
      </div>
    </div>
  );
}
export function ThesisCard({
  item,
  index = 0,
}: {
  item: FeedThesis;
  index?: number;
}) {
  const markets = useMarkets(),
    client = useQueryClient(),
    context = markets.data,
    id = item.graph.thesisId;
  // Opening an idea starts from what the card already shows; the full page then refreshes
  // itself. Marked stale so comments and forks are fetched at once.
  function warm() {
    if (client.getQueryData(["detail", id])) return;
    client.setQueryData<ThesisDetail>(
      ["detail", id],
      { ...item, comments: [], commentsHasMore: false, children: [] },
      { updatedAt: 0 },
    );
  }
  const symbol = marketName(item.graph.core.marketId, context);
  return (
    <article
      className={`thesis-card ${item.parent ? "is-fork" : ""}`}
      data-thesis-id={id}
      style={{ "--card-index": Math.min(index, 8) } as React.CSSProperties}
    >
      <div className="card-author">
        <Link
          href={`/u/${item.author.handle}`}
          className="identity-link"
          aria-label={`${item.author.displayName}, @${item.author.handle}`}
        >
          <Avatar
            size={40}
            name={item.author.displayName}
            wallet={item.author.wallet}
            handle={item.author.handle}
          />
        </Link>
        <div className="card-byline">
          <p>
            <Link href={`/u/${item.author.handle}`}>
              <strong>@{item.author.handle}</strong>
            </Link>{" "}
            <span>· {age(item.graph.createdAt)}</span>
          </p>
          {item.parent ? (
            <p className="provenance">
              <Icon name="fork" size={14} />
              <span>
                Forked from{" "}
                <Link href={`/t/${item.parent.thesisId}`}>
                  #{item.parent.thesisId} by @{item.parent.author.handle}
                </Link>
              </span>
            </p>
          ) : (
            <p className="card-origin">
              {item.challenge ? "Challenge" : "Original idea"}
            </p>
          )}
        </div>
        <span
          className={`idea-label ${item.challenge ? "challenge" : ""}`}
          title={
            item.challenge
              ? `Challenge #${id}`
              : item.graph.parentId === "0"
                ? `Original #${id}`
                : `Fork #${id}`
          }
        >
          #{id}
        </span>
      </div>
      <Link
        href={`/t/${id}`}
        className="card-body"
        onPointerDown={warm}
        onFocus={warm}
      >
        <ViewTransition
          name={`thesis-title-${id}`}
          share="morph"
          default="none"
        >
          <div className="market-line">
            <TokenMark symbol={symbol} />
            <span className="market-symbol">{symbol}</span>
            <Direction side={item.graph.core.side} />
          </div>
        </ViewTransition>
      </Link>
      {markets.error && !context && (
        <div className="market-label-state" role="status">
          Market label unavailable. The onchain market ID is shown.
          <button
            className="text-button"
            disabled={markets.isFetching}
            onClick={() => void markets.refetch()}
          >
            Retry market label
          </button>
        </div>
      )}
      <Parameters item={item} />
      {item.metadataState === "trusted" && item.changes.length > 0 && (
        <div className="card-change-summary" aria-label="Changes from parent">
          {item.changes
            .filter((c) => ["targetPriceE8", "leverageBps"].includes(c.field))
            .map((c) => (
              <span key={c.field}>
                {c.label.toLowerCase()}{" "}
                <del>
                  {c.field === "targetPriceE8"
                    ? displayPrice(c.before)
                    : `${Number(c.before) / 10000}×`}
                </del>
                <span aria-label="changed to"> → </span>
                <strong>
                  {c.field === "targetPriceE8"
                    ? displayPrice(c.after)
                    : `${Number(c.after) / 10000}×`}
                </strong>
              </span>
            ))}
        </div>
      )}
      <Link href={`/t/${id}`} className="card-body">
        <p className="card-reasoning">
          {item.metadata?.reasoning ??
            (item.metadataState === "missing"
              ? "Reasoning is still indexing. Open the idea to check again."
              : "Reasoning unavailable. Open the idea for its current status.")}
        </p>
      </Link>
      {!!item.metadata?.tags.length && (
        <div className="tags">
          {item.metadata?.tags.map((tag) => (
            <Link href={`/explore?tag=${encodeURIComponent(tag)}`} key={tag}>
              #{tag}
            </Link>
          ))}
        </div>
      )}
      <div className="card-bottom">
        {item.backing.backers > 0 ? (
          <span
            className="backed-chip"
            title="Backed with testnet MON, split along the lineage"
          >
            {formatMon(item.backing.totalWei)} MON backed
            <small>
              {item.backing.backers}{" "}
              {item.backing.backers === 1 ? "backer" : "backers"}
            </small>
          </span>
        ) : (
          <span className="card-unbacked">
            No backing yet. Be the first of ten early supporters.
          </span>
        )}
        <div className="social-counts">
          <span
            title="Unique external wallets directly forking this idea"
            aria-label={`${item.graph.uniqueExternalForkers} ${item.graph.uniqueExternalForkers === 1 ? "forker" : "forkers"}`}
          >
            <Icon name="fork" size={15} />
            {item.graph.uniqueExternalForkers}
          </span>
          <Link
            href={`/t/${id}#comments`}
            aria-label={`${item.social.comments} comments on idea #${id}`}
          >
            <Icon name="comment" size={15} />
            {item.social.comments}
          </Link>
          <span aria-label={`${item.social.agrees} agrees`}>
            <Icon name="agree" size={15} />
            {item.social.agrees}
          </span>
        </div>
        <div className="card-actions">
          {item.metadataState === "trusted" && (
            <Link href={`/t/${id}/fork`} className="button fork-button">
              <Icon name="fork" size={15} />
              Fork
            </Link>
          )}
          <Link href={`/t/${id}#back`} className="button card-back-button">
            <Icon name="diamond" size={14} />
            Back
          </Link>
        </div>
      </div>
    </article>
  );
}
