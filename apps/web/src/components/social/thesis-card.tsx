"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  formatFixedPoint,
  type FeedThesis,
  type MvpContext,
} from "@fork/shared";
import { api } from "@/lib/api-client";
import { Avatar, age } from "./common";
import { Icon } from "./icon";
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
      {side === "long" ? "↗" : "↘"} {side === "long" ? "LONG" : "SHORT"}
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
export function ThesisCard({ item }: { item: FeedThesis }) {
  const markets = useMarkets(),
    context = markets.data,
    id = item.graph.thesisId;
  return (
    <article className="thesis-card" data-thesis-id={id}>
      <div className="card-author">
        <Link href={`/u/${item.author.handle}`} className="identity-link">
          <Avatar name={item.author.displayName} wallet={item.author.wallet} />
          <span>
            <strong>{item.author.displayName}</strong>
            <small>
              @{item.author.handle} <span>· {age(item.graph.createdAt)}</span>
            </small>
          </span>
        </Link>
        <span className={`idea-label ${item.challenge ? "challenge" : ""}`}>
          {item.challenge
            ? `Challenge #${id}`
            : item.graph.parentId === "0"
              ? `Original #${id}`
              : `Fork #${id}`}
        </span>
      </div>
      {item.parent && (
        <div className="provenance">
          <Icon name="fork" size={14} />
          <span>
            Forked from{" "}
            <Link href={`/t/${item.parent.thesisId}`}>
              #{item.parent.thesisId} · @{item.parent.author.handle}
            </Link>
            {item.changes.length > 0 && (
              <span className="provenance-changes">
                {" "}
                ·{" "}
                {item.changes
                  .map((c) => c.label.toLowerCase())
                  .slice(0, 3)
                  .join(", ")}
              </span>
            )}
          </span>
        </div>
      )}
      <Link href={`/t/${id}`} className="card-body">
        <div className="market-line">
          <span className="market-symbol">
            {marketName(item.graph.core.marketId, context)}
          </span>
          <Direction side={item.graph.core.side} />
        </div>
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
                {c.label}{" "}
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
        <div className="social-counts">
          <span title="Unique external wallets directly forking this idea">
            <Icon name="fork" size={15} />
            {item.graph.uniqueExternalForkers}{" "}
            <span className="count-label">
              {item.graph.uniqueExternalForkers === 1 ? "forker" : "forkers"}
            </span>
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
          <Link href={`/t/${id}`} className="quiet-link">
            Open <Icon name="arrow" size={14} />
          </Link>
          {item.metadataState === "trusted" && (
            <Link href={`/t/${id}/fork`} className="button fork-button">
              <Icon name="fork" size={16} />
              Fork
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
