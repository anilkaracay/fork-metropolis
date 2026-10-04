"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { FeedThesis, ThesisTree } from "@fork/shared";
import { api } from "@/lib/api-client";
import { Avatar, ErrorState, Skeleton } from "./common";
import { Direction, marketName, useMarkets } from "./thesis-card";
import { Icon } from "./icon";
export function TreeScreen({ id }: { id: string }) {
  const query = useQuery({
      queryKey: ["tree", id],
      queryFn: () => api<ThesisTree>(`theses/${id}/tree`),
    }),
    context = useMarkets().data;
  if (query.isPending) return <Skeleton cards={3} />;
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
  function branch(node: FeedThesis, depth: number) {
    const current = node.graph.thesisId === id,
      ancestor = tree.ancestors.includes(node.graph.thesisId);
    return (
      <li
        key={node.graph.thesisId}
        className={`${current ? "current" : ancestor ? "ancestor" : ""}`}
      >
        <div
          className="tree-node"
          style={{ "--node-depth": Math.min(depth, 3) } as React.CSSProperties}
        >
          <Link
            href={`/t/${node.graph.thesisId}/tree`}
            className="tree-node-link"
            aria-current={current ? "page" : undefined}
          >
            <div className="node-top">
              <Avatar
                small
                name={node.author.displayName}
                wallet={node.author.wallet}
              />
              <strong title={node.author.displayName}>
                @{node.author.handle}
              </strong>
              <Direction side={node.graph.core.side} />
            </div>
            <p>
              {node.metadataState === "trusted"
                ? node.metadata?.reasoning
                : node.metadataState === "hidden"
                  ? "Content hidden · lineage remains"
                  : "Reasoning unavailable"}
            </p>
            <div className="node-bottom">
              <span>
                {depth === 0
                  ? "Original idea"
                  : node.challenge
                    ? "Challenge"
                    : node.changes.length
                      ? `Changed ${node.changes
                          .map((c) => c.label.toLowerCase())
                          .slice(0, 2)
                          .join(" + ")}`
                      : `Branch · depth ${node.graph.depth}`}
              </span>
              {current && <b>Viewing</b>}
            </div>
          </Link>
          <div className="node-actions">
            <Link href={`/t/${node.graph.thesisId}`}>Open idea</Link>
            {node.metadataState === "trusted" && (
              <Link href={`/t/${node.graph.thesisId}/fork`}>
                <Icon name="fork" size={13} />
                Fork here
              </Link>
            )}
          </div>
        </div>
        {children.get(node.graph.thesisId)?.length ? (
          <ul className="tree-children">
            {children
              .get(node.graph.thesisId)!
              .map((child) => branch(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }
  return (
    <div className="tree-screen">
      <Link className="back-link" href={`/t/${id}`}>
        <Icon name="back" size={16} />
        Back to idea
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">The network remembers</span>
          <h1>One idea. Many perspectives.</h1>
          <p>
            {root ? marketName(root.graph.core.marketId, context) : "Idea"}{" "}
            lineage · {tree.nodes.length} visible ideas
          </p>
        </div>
        {selected?.metadataState === "trusted" && (
          <Link href={`/t/${id}/fork`} className="button primary">
            <Icon name="fork" size={17} />
            Fork this branch
          </Link>
        )}
      </div>
      <div className="tree-context">
        <div>
          <span className="eyebrow">Origin</span>
          <Link href={`/t/${tree.rootId}`}>
            @{root?.author.handle ?? "original author"}’s original idea
          </Link>
        </div>
        <div>
          <span className="eyebrow">Viewing</span>
          <span>
            Branch #{id} · depth {selected?.graph.depth ?? 0}
          </span>
        </div>
        <div className="tree-legend">
          <i />
          Selected lineage <span>↗ Long</span>
          <span>↘ Short</span>
        </div>
      </div>
      <div className="idea-tree" aria-label="Idea lineage and branches">
        <ul className="tree-root">
          {root
            ? branch(root, 0)
            : selected
              ? branch(selected, selected.graph.depth)
              : null}
        </ul>
      </div>
      {tree.truncated && (
        <div className="inline-alert">
          This view is bounded to 250 branch nodes plus selected ancestry. Open
          a specific idea to continue exploring its lineage.
        </div>
      )}
      <p className="subtle-note">
        Every node preserves authorship. An opposite-side fork is a Challenge;
        it remains part of the same idea graph.
      </p>
    </div>
  );
}
