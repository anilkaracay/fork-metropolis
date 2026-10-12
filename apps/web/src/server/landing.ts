import "server-only";
import type { FeedThesis, GraphThesis } from "@fork/shared";
import { formatMon } from "../lib/mon";
import { getRuntime, testMode } from "./runtime";

// Everything the landing page says about activity comes from here: bounded reads of the
// indexer, joined with public handles. Nothing is estimated, padded or kept from memory.
// Never serialize database rows, private user IDs or authentication into marketing.

/** The four markets the product lists, by their onchain market id. */
const MARKETS: Record<number, "BTC" | "ETH" | "SOL" | "MON"> = {
  16: "BTC",
  32: "ETH",
  48: "SOL",
  64: "MON",
};
const EVENT_LIMIT = 12;
const TREE_LIMIT = 9;

export type LandingEvent = {
  kind: "published" | "forked" | "backed";
  handle: string;
  thesisId: string;
  // The idea a fork grew from.
  parentId: string | null;
  // What a backing sent, in MON.
  amountMon: string | null;
  // Unix seconds, from the block that carried the event.
  at: number;
};
export type LandingNode = {
  id: string;
  parentId: string | null;
  // Distance from the root shown, starting at 0.
  depth: number;
  // How many rows above this one its parent sits; 0 for the root.
  rowsToParent: number;
  handle: string;
  market: string;
  side: "long" | "short";
  target: string;
  leverage: string;
  backedMon: string | null;
  backers: number;
  // What backing of its forks sent back to this idea.
  arrivedMon: string | null;
  txHash: string;
};
export type LandingLive = {
  ideas: number;
  forks: number;
  authors: number;
  // True when the graph holds more than the 500 latest ideas this page counts.
  bounded: boolean;
  backing: {
    totalMon: string;
    totalWei: string;
    backings: number;
    supporters: number;
    sentToAncestorsMon: string;
  } | null;
  // Newest first. Short when little has happened: it is never topped up.
  events: LandingEvent[];
  // The largest lineage the indexer holds, or null while nothing has been forked.
  tree: { rootId: string; nodes: LandingNode[]; more: number } | null;
  registry: string;
  backingContract: string | null;
  // When this read was made, in Unix seconds.
  readAt: number;
};

const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const target = (node: GraphThesis) =>
  price.format(Number(BigInt(node.core.targetPriceE8) / 100000000n));

/** Parents before children, siblings in publication order. */
function preorder(nodes: GraphThesis[], rootId: string) {
  const children = new Map<string, GraphThesis[]>();
  for (const node of nodes) {
    const list = children.get(node.parentId) ?? [];
    list.push(node);
    children.set(node.parentId, list);
  }
  const root = nodes.find((node) => node.thesisId === rootId);
  const ordered: GraphThesis[] = [];
  const visit = (node: GraphThesis) => {
    ordered.push(node);
    for (const child of (children.get(node.thesisId) ?? []).sort((a, b) =>
      Number(BigInt(a.thesisId) - BigInt(b.thesisId)),
    ))
      visit(child);
  };
  if (root) visit(root);
  return ordered;
}

export async function readLandingLive(): Promise<LandingLive | null> {
  // The landing page must never initialize or display the simulated workspace.
  if (testMode()) return null;
  try {
    const { core } = await getRuntime();
    if (core.graph.provenance !== "envio") return null;
    const source = core.backing?.source ?? null;
    const [{ nodes, bounded }, totals, backings] = await Promise.all([
      core.graph.recent(),
      source ? source.totals() : null,
      source ? source.latest(EVENT_LIMIT) : [],
    ]);
    const first = nodes[0];
    if (!first) return null;

    // The lineage with the most ideas; among equals, the one with the newest idea.
    const sizes = new Map<string, number>();
    for (const node of nodes)
      sizes.set(node.rootId, (sizes.get(node.rootId) ?? 0) + 1);
    const rootId = nodes
      .filter((node) => (sizes.get(node.rootId) ?? 0) > 1)
      .sort(
        (a, b) =>
          (sizes.get(b.rootId) ?? 0) - (sizes.get(a.rootId) ?? 0) ||
          Number(BigInt(b.thesisId) - BigInt(a.thesisId)),
      )[0]?.rootId;
    const lineage = rootId
      ? preorder((await core.graph.tree(rootId)).nodes, rootId)
      : [];
    const shown = lineage.slice(0, TREE_LIMIT);

    const recent = nodes.slice(0, EVENT_LIMIT);
    const backedIds = backings.map((event) => event.thesisId);
    const wanted = new Map<string, GraphThesis>();
    for (const node of [...recent, ...shown]) wanted.set(node.thesisId, node);
    const missing = backedIds.filter((id) => !wanted.has(id));
    for (const node of missing.length ? await core.graph.getMany(missing) : [])
      wanted.set(node.thesisId, node);
    const [composed, flows, identity] = await Promise.all([
      core.compose([...wanted.values()]),
      source && shown.length
        ? source.flows(shown.map((node) => node.thesisId))
        : [],
      core.identities(backings.map((event) => event.backer)),
    ]);
    const byId = new Map<string, FeedThesis>(
      composed.map((item) => [item.graph.thesisId, item]),
    );
    // Only ideas whose reasoning passed its hash check are announced or linked.
    const readable = (id: string) => byId.get(id)?.metadataState === "trusted";

    const events: LandingEvent[] = [
      ...recent
        .filter((node) => readable(node.thesisId))
        .map((node) => ({
          kind:
            node.parentId === "0"
              ? ("published" as const)
              : ("forked" as const),
          handle: byId.get(node.thesisId)!.author.handle,
          thesisId: node.thesisId,
          parentId: node.parentId === "0" ? null : node.parentId,
          amountMon: null,
          at: node.createdAt,
        })),
      ...backings
        .filter((event) => readable(event.thesisId))
        .map((event) => ({
          kind: "backed" as const,
          handle: identity(event.backer).handle,
          thesisId: event.thesisId,
          parentId: null,
          amountMon: formatMon(event.amountWei),
          at: event.timestamp,
        })),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, EVENT_LIMIT);

    const arrived = new Map<string, bigint>();
    for (const flow of flows)
      arrived.set(
        flow.creditedThesisId,
        (arrived.get(flow.creditedThesisId) ?? 0n) + BigInt(flow.amountWei),
      );
    const rootDepth = shown[0]?.depth ?? 0;
    const treeNodes = shown.flatMap((node, row): LandingNode[] => {
      const item = byId.get(node.thesisId);
      if (!item) return [];
      const parentRow = shown.findIndex(
        (other) => other.thesisId === node.parentId,
      );
      const received = arrived.get(node.thesisId) ?? 0n;
      return [
        {
          id: node.thesisId,
          parentId: row === 0 ? null : node.parentId,
          depth: node.depth - rootDepth,
          rowsToParent: row === 0 || parentRow < 0 ? 0 : row - parentRow,
          handle: item.author.handle,
          market: MARKETS[node.core.marketId] ?? `Market ${node.core.marketId}`,
          side: node.core.side,
          target: target(node),
          leverage: `${node.core.leverageBps / 10000}×`,
          backedMon:
            item.backing.backers > 0 ? formatMon(item.backing.totalWei) : null,
          backers: item.backing.backers,
          arrivedMon: received > 0n ? formatMon(received) : null,
          txHash: node.txHash,
        },
      ];
    });

    return {
      ideas: nodes.length,
      forks: nodes.filter((node) => node.parentId !== "0").length,
      authors: new Set(nodes.map((node) => node.author)).size,
      bounded,
      backing:
        totals && totals.backings > 0
          ? {
              totalMon: formatMon(totals.totalBackedWei),
              totalWei: totals.totalBackedWei,
              backings: totals.backings,
              supporters: totals.supporters,
              sentToAncestorsMon: formatMon(totals.sentToAncestorsWei),
            }
          : null,
      events,
      tree:
        rootId && treeNodes.length > 1
          ? {
              rootId,
              nodes: treeNodes,
              more: Math.max(0, lineage.length - treeNodes.length),
            }
          : null,
      registry: first.registryAddress,
      backingContract: core.backing?.address ?? null,
      readAt: Math.floor(Date.now() / 1000),
    };
  } catch {
    // Provider and database errors never become page text, logs or invented activity.
    return null;
  }
}
