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
        <strong>${price(item.graph.core.targetPriceE8)}</strong>
      </div>
      <div>
        <span>Invalidation</span>
        <strong>${price(item.graph.core.invalidationPriceE8)}</strong>
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
  const context = useMarkets().data,
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
            ? "Challenge"
            : item.graph.parentId === "0"
              ? "Original idea"
              : "Fork"}
        </span>
      </div>
      {item.parent && (
        <div className="provenance">
          <Icon name="fork" size={14} />
          <span>
            Forked from{" "}
            <Link href={`/t/${item.parent.thesisId}`}>
              @{item.parent.author.handle}
            </Link>
            {item.changes.length > 0 && (
              <span className="provenance-changes">
                {" "}
                · Changed{" "}
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
        <p className="card-reasoning">
          {item.metadata?.reasoning ?? "Content unavailable"}
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
      <Parameters item={item} />
      <div className="card-bottom">
        <div className="social-counts">
          <span title="Unique external wallets directly forking this idea">
            <Icon name="fork" size={15} />
            {item.graph.uniqueExternalForkers}{" "}
            <span className="count-label">forkers</span>
          </span>
          <Link href={`/t/${id}#comments`}>
            <Icon name="comment" size={15} />
            {item.social.comments}
          </Link>
          <span>
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
