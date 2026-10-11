"use client";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FeedThesis, ThesisTree } from "@fork/shared";
import { api } from "@/lib/api-client";
import { ErrorState } from "./common";
import { SignatureLoading } from "./signature-loading";
import { Direction, marketName, useMarkets } from "./thesis-card";
import { differenceValue, ParentComparison } from "./fork-diff";
import { Icon } from "./icon";

export function TreeScreen({ id }: { id: string }) {
  const query = useQuery({
      queryKey: ["tree", id],
      queryFn: () => api<ThesisTree>(`theses/${id}/tree`),
      placeholderData: (previous) =>
        previous?.nodes.some((n) => n.graph.thesisId === id)
          ? previous
          : undefined,
    }),
    context = useMarkets().data;
  if (query.isPending) return <SignatureLoading kind="lineage" />;
  if (query.error)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const tree = query.data!,
    root = tree.nodes.find((n) => n.graph.thesisId === tree.rootId),
    selected = tree.nodes.find((n) => n.graph.thesisId === id);
  const children = new Map<string, FeedThesis[]>();
  for (const node of tree.nodes) {
    const siblings = children.get(node.graph.parentId) ?? [];
    siblings.push(node);
    children.set(node.graph.parentId, siblings);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const links = Array.from(
      event.currentTarget.querySelectorAll<HTMLAnchorElement>(
        "[data-node-select]",
      ),
    );
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? links.length - 1
          : Math.max(
              0,
              Math.min(
                links.length - 1,
                index + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
    links[next]?.focus();
  }
  function branch(node: FeedThesis, depth: number, path: Set<string>) {
    // Do not recurse through malformed cyclic data; valid graph traversal stays unchanged.
    if (path.has(node.graph.thesisId)) return null;
    const nextPath = new Set(path).add(node.graph.thesisId),
      current = node.graph.thesisId === id;
    return (
      <li key={node.graph.thesisId} className={current ? "current" : ""}>
        <div
          id={`idea-node-${node.graph.thesisId}`}
          className="tree-node"
          style={{ "--node-depth": Math.min(depth, 4) } as React.CSSProperties}
        >
          <Link
            href={`/t/${node.graph.thesisId}/tree`}
            scroll={false}
            className="tree-node-link"
            aria-current={current ? "page" : undefined}
            aria-label={`Select ${depth === 0 ? "original thesis" : "fork"} #${node.graph.thesisId}`}
            data-node-select
          >
            <div className="node-top">
              <span>
                {node.graph.parentId === "0"
                  ? "Original thesis"
                  : `Fork of #${node.graph.parentId}`}
              </span>
              <span>#{node.graph.thesisId}</span>
            </div>
            <div className="node-market">
              <strong>{marketName(node.graph.core.marketId, context)}</strong>
              <Direction side={node.graph.core.side} />
            </div>
            <div className="node-parameters">
              <span>
                Target
                <strong>
                  {differenceValue(
                    "targetPriceE8",
                    node.graph.core.targetPriceE8,
                  )}
                </strong>
              </span>
              <span>
                Leverage
                <strong>
                  {differenceValue(
                    "leverageBps",
                    String(node.graph.core.leverageBps),
                  )}
                </strong>
              </span>
            </div>
            <div className="node-bottom">
              <span>Depth {node.graph.depth}</span>
              {current && <b>Viewing</b>}
            </div>
          </Link>
          <div className="node-actions">
            <Link
              href={`/u/${node.author.handle}`}
              className="node-author"
              title={node.author.displayName}
            >
              @{node.author.handle}
            </Link>
            <Link href={`/t/${node.graph.thesisId}`}>
              Open idea <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
        {!!children.get(node.graph.thesisId)?.length && (
          <ul className="tree-children">
            {children
              .get(node.graph.thesisId)!
              .map((child) => branch(child, depth + 1, nextPath))}
          </ul>
        )}
      </li>
    );
  }
  return (
    <div className="signature tree-screen">
      <Link className="back-link" href={`/t/${id}`}>
        <Icon name="back" size={16} />
        Back to idea
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Idea lineage</span>
          <h1>One idea. Many perspectives.</h1>
          <p>A shared origin. Independent authors. Every change in view.</p>
        </div>
        {selected?.metadataState === "trusted" && (
          <Link href={`/t/${id}/fork`} className="button primary">
            <Icon name="fork" size={17} />
            Fork this branch
          </Link>
        )}
      </div>
      <div className="tree-context">
        <Link href={`/t/${tree.rootId}`}>
          Origin #{tree.rootId} · @{root?.author.handle ?? "original author"}
        </Link>
        <span>
          {tree.nodes.length} visible{" "}
          {tree.nodes.length === 1 ? "idea" : "ideas"}
        </span>
        <span>
          Viewing #{id} · depth {selected?.graph.depth ?? 0}
        </span>
      </div>
      <a className="tree-selection-shortcut" href="#selected-perspective">
        Viewing #{id} ·{" "}
        {selected?.graph.parentId === "0"
          ? "Original context"
          : `Compare with parent #${selected?.graph.parentId}`}
        <Icon name="arrow" size={15} />
      </a>
      <div className="lineage-workspace">
        <div className="lineage-board" onKeyDown={keyboard}>
          <div className="board-heading">
            <span className="eyebrow">The lineage</span>
            <span>Select a perspective</span>
          </div>
          <div className="idea-tree" aria-label="Idea lineage and branches">
            <ul className="tree-root">
              {root
                ? branch(root, 0, new Set())
                : selected
                  ? branch(selected, selected.graph.depth, new Set())
                  : null}
            </ul>
          </div>
        </div>
        {selected ? (
          <aside
            id="selected-perspective"
            className="selected-perspective"
            aria-label="Selected perspective"
          >
            <span className="eyebrow">Selected perspective · #{id}</span>
            <div className="selected-heading">
              <h2>{marketName(selected.graph.core.marketId, context)}</h2>
              <Direction side={selected.graph.core.side} />
            </div>
            <Link
              className="selected-author"
              href={`/u/${selected.author.handle}`}
            >
              @{selected.author.handle}
            </Link>
            {selected.graph.parentId !== "0" && (
              <Link
                className="parent-navigation"
                href={`/t/${selected.graph.parentId}/tree`}
                scroll={false}
              >
                <Icon name="back" size={15} />
                Select parent #{selected.graph.parentId}
              </Link>
            )}
            <ParentComparison
              item={selected}
              parent={tree.nodes.find(
                (n) => n.graph.thesisId === selected.graph.parentId,
              )}
            />
            {(selected.graph.parentId === "0" ||
              selected.metadataState !== "trusted") && (
              <div className="selected-reasoning">
                <span className="eyebrow">The perspective</span>
                <p>
                  {selected.metadataState === "trusted"
                    ? selected.metadata?.reasoning
                    : selected.metadataState === "hidden"
                      ? "Content hidden. Its public lineage remains."
                      : "Verified reasoning is not available yet."}
                </p>
                {selected.metadataState !== "trusted" && (
                  <button
                    className="text-button"
                    onClick={() => void query.refetch()}
                  >
                    Check metadata again
                  </button>
                )}
              </div>
            )}
            <a className="tree-selection-shortcut" href={`#idea-node-${id}`}>
              Back to selected node <Icon name="tree" size={15} />
            </a>
            <Link className="button secondary full" href={`/t/${id}`}>
              Open full thesis #{id}
              <Icon name="arrow" size={16} />
            </Link>
          </aside>
        ) : (
          <div className="inline-alert">
            This perspective is not in the current graph.{" "}
            <Link href={`/t/${id}`}>Open its thesis</Link> or{" "}
            <button
              className="text-button"
              onClick={() => void query.refetch()}
            >
              check again
            </button>
            .
          </div>
        )}
      </div>
      {tree.truncated && (
        <div className="inline-alert">
          This view is bounded to 250 branch nodes plus selected ancestry. Open
          a specific idea to continue exploring its lineage.
        </div>
      )}
      <p className="subtle-note">
        Every node preserves authorship. Select with Enter; use ↑ and ↓ to move
        between nodes. A fork carries a perspective, not a copied wallet
        position.
      </p>
    </div>
  );
}
