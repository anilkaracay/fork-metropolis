import "server-only";
import type { PublicLineage } from "@/components/marketing/hero-tree";
import { formatMon } from "../lib/mon";
import { getRuntime, testMode } from "./runtime";

// A bounded projection of existing public, hash-validated product reads.
// Never serialize database rows, private user IDs or authentication into marketing.
export async function readLandingLineage(): Promise<PublicLineage | null> {
  // The marketing example must never initialize or display the simulated workspace.
  if (testMode()) return null;
  try {
    const { core } = await getRuntime();
    const nodes = await core.graph.getMany(["1", "2"]);
    const items = await core.compose(nodes);
    const original = items.find((item) => item.graph.thesisId === "1");
    const fork = items.find((item) => item.graph.thesisId === "2");
    if (
      !original ||
      !fork ||
      original.metadataState !== "trusted" ||
      fork.metadataState !== "trusted" ||
      !original.metadata ||
      !fork.metadata ||
      original.graph.parentId !== "0" ||
      fork.graph.parentId !== "1" ||
      fork.graph.rootId !== "1" ||
      original.graph.core.marketId !== 32 ||
      fork.graph.core.marketId !== 32 ||
      original.graph.core.side !== "long" ||
      fork.graph.core.side !== "long" ||
      core.graph.provenance !== "envio"
    )
      return null;
    // The selected example is an immutable real lineage, not a synthetic demo.
    if (
      original.graph.core.targetPriceE8 !== "420000000000" ||
      fork.graph.core.targetPriceE8 !== "440000000000" ||
      original.graph.core.leverageBps !== 20000 ||
      fork.graph.core.leverageBps !== 30000 ||
      original.graph.core.invalidationPriceE8 !== "360000000000" ||
      fork.graph.core.invalidationPriceE8 !== "360000000000"
    )
      return null;
    const price = (value: string) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(Number(BigInt(value) / 100000000n));
    const project = (item: typeof original) => ({
      id: item.graph.thesisId,
      handle: item.author.handle,
      target: price(item.graph.core.targetPriceE8),
      leverage: `${item.graph.core.leverageBps / 10000}×`,
      invalidation: price(item.graph.core.invalidationPriceE8),
      reasoning: item.metadata!.reasoning,
    });
    return {
      original: project(original),
      fork: project(fork),
      registry: original.graph.registryAddress,
    };
  } catch {
    // Provider/database errors never become page text, logs or fabricated activity.
    return null;
  }
}

export type LandingLive = {
  ideas: number;
  forks: number;
  authors: number;
  // True when the graph holds more than the 500 latest ideas this page counts.
  bounded: boolean;
  latest: {
    id: string;
    handle: string;
    parentId: string | null;
    side: "long" | "short";
    target: string;
    leverage: string;
    backedMon: string | null;
  }[];
  backing: {
    totalMon: string;
    backings: number;
    supporters: number;
    sentToAncestorsMon: string;
  } | null;
};
// What the indexer holds right now. Numbers are counted, never estimated or padded.
export async function readLandingLive(): Promise<LandingLive | null> {
  if (testMode()) return null;
  try {
    const { core } = await getRuntime();
    if (core.graph.provenance !== "envio") return null;
    const { nodes, bounded } = await core.graph.recent();
    const [latest, totals] = await Promise.all([
      core.compose(nodes.slice(0, 4)),
      core.backing ? core.backing.source.totals() : null,
    ]);
    const price = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    return {
      ideas: nodes.length,
      forks: nodes.filter((node) => node.parentId !== "0").length,
      authors: new Set(nodes.map((node) => node.author)).size,
      bounded,
      latest: latest
        .filter((item) => item.metadataState === "trusted")
        .map((item) => ({
          id: item.graph.thesisId,
          handle: item.author.handle,
          parentId: item.graph.parentId === "0" ? null : item.graph.parentId,
          side: item.graph.core.side,
          target: price.format(
            Number(BigInt(item.graph.core.targetPriceE8) / 100000000n),
          ),
          leverage: `${item.graph.core.leverageBps / 10000}×`,
          backedMon:
            item.backing.backers > 0 ? formatMon(item.backing.totalWei) : null,
        })),
      backing:
        totals && totals.backings > 0
          ? {
              totalMon: formatMon(totals.totalBackedWei),
              backings: totals.backings,
              supporters: totals.supporters,
              sentToAncestorsMon: formatMon(totals.sentToAncestorsWei),
            }
          : null,
    };
  } catch {
    return null;
  }
}
