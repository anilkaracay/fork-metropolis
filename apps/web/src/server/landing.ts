import "server-only";
import type { PublicLineage } from "@/components/marketing/lineage";
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
