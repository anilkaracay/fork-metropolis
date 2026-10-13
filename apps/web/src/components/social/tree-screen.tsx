"use client";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FeedThesis, ThesisTree } from "@fork/shared";
import { api } from "@/lib/api-client";
import { Avatar, ErrorState, TokenMark } from "./common";
import { SignatureLoading } from "./signature-loading";
import { marketName, useMarkets } from "./thesis-card";
import { differenceValue, ParentComparison } from "./fork-diff";
import { Icon } from "./icon";
import { formatMon } from "@/lib/mon";

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
  // Value that backing of descendants has sent to this idea's author.
  const arrived = (thesisId: string) =>
    (query.data?.flows ?? [])
      .filter((flow) => flow.creditedThesisId === thesisId)
      .reduce((sum, flow) => sum + BigInt(flow.amountWei), 0n);
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
              <Avatar
                size={36}
                name={node.author.displayName}
                wallet={node.author.wallet}
                handle={node.author.handle}
              />
              <strong>@{node.author.handle}</strong>
              <span>
                {node.graph.parentId === "0"
                  ? "Original"
                  : `Fork of #${node.graph.parentId}`}
              </span>
              <span className="node-id">#{node.graph.thesisId}</span>
            </div>
            <div className="node-market">
              <TokenMark
                symbol={marketName(node.graph.core.marketId, context)}
                size={20}
              />
              <span className="sr-only">
                {marketName(node.graph.core.marketId, context)}{" "}
                {node.graph.core.side}, target
              </span>
              <strong className="node-values">
                {differenceValue(
                  "targetPriceE8",
                  node.graph.core.targetPriceE8,
                )}
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, leverage </span>
                {differenceValue(
                  "leverageBps",
                  String(node.graph.core.leverageBps),
                )}
              </strong>
              {arrived(node.graph.thesisId) > 0n ? (
                <span
                  className="node-flow"
                  key={arrived(node.graph.thesisId).toString()}
                >
                  +{formatMon(arrived(node.graph.thesisId))} MON from forks
                </span>
              ) : node.backing.backers > 0 ? (
                <span className="backed-chip">
                  {formatMon(node.backing.totalWei)} MON backed
                </span>
              ) : null}
            </div>
            {current && (
              <div className="node-bottom">
                <b>Viewing</b>
              </div>
            )}
          </Link>
          {current && (
            <div className="node-actions">
              <Link href={`/t/${node.graph.thesisId}`}>Open idea</Link>
              {node.metadataState === "trusted" && (
                <Link href={`/t/${node.graph.thesisId}/fork`}>
                  Fork this branch
                </Link>
              )}
            </div>
          )}
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
          <h1>One idea. Many perspectives.</h1>
          <p>A shared origin, independent authors, and every change in view.</p>
        </div>
        {selected?.metadataState === "trusted" && (
          <Link href={`/t/${id}/fork`} className="v2-btn v2-fork">
            <Icon name="fork" size={17} />
            Fork this branch
          </Link>
        )}
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
          <div className="tree-context">
            <Link href={`/t/${tree.rootId}`}>
              Origin #{tree.rootId} by @
              {root?.author.handle ?? "original author"}, {tree.nodes.length}{" "}
              {tree.nodes.length === 1 ? "idea" : "ideas"}
            </Link>
            <span>
              Viewing #{id}, depth {selected?.graph.depth ?? 0}
            </span>
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
            <div className="selected-heading">
              <Avatar
                size={36}
                name={selected.author.displayName}
                wallet={selected.author.wallet}
                handle={selected.author.handle}
              />
              <div>
                <h2>Selected: #{id}</h2>
                <p>
                  by{" "}
                  <Link
                    className="selected-author"
                    href={`/u/${selected.author.handle}`}
                  >
                    @{selected.author.handle}
                  </Link>
                  {selected.graph.parentId !== "0" &&
                    `, compared with #${selected.graph.parentId}`}
                  <span className="sr-only">
                    , {marketName(selected.graph.core.marketId, context)}{" "}
                    {selected.graph.core.side}
                  </span>
                </p>
              </div>
            </div>
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
            <ValueFlow tree={tree} id={id} />
            <a className="tree-selection-shortcut" href={`#idea-node-${id}`}>
              Back to selected node <Icon name="tree" size={15} />
            </a>
            <Link className="v2-btn v2-ghost full" href={`/t/${id}`}>
              Open full idea #{id}
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
        Every node keeps its author. Select with Enter; use the arrow keys to
        move between nodes.
      </p>
    </div>
  );
}
/** Where the selected idea's backing went, and what its forks' backing sent back. */
function ValueFlow({ tree, id }: { tree: ThesisTree; id: string }) {
  const sent = tree.flows.filter((flow) => flow.sourceThesisId === id),
    received = tree.flows.filter((flow) => flow.creditedThesisId === id),
    handle = (wallet: string) =>
      tree.nodes.find((node) => node.author.wallet === wallet)?.author.handle ??
      `${wallet.slice(0, 6)}…`;
  if (!sent.length && !received.length) return null;
  return (
    <div className="value-flow">
      <h4>Value along the lineage</h4>
      <ul>
        {sent.map((flow) => (
          <li key={`out-${flow.creditedThesisId}`}>
            <span>
              #{id} <Icon name="arrow" size={13} /> #{flow.creditedThesisId}, @
              {handle(flow.recipient)}
            </span>
            <strong>{formatMon(flow.amountWei)} MON</strong>
          </li>
        ))}
        {received.map((flow) => (
          <li key={`in-${flow.sourceThesisId}`}>
            <span>
              #{flow.sourceThesisId} <Icon name="arrow" size={13} /> #{id}
            </span>
            <strong>{formatMon(flow.amountWei)} MON</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
