import { describe, expect, it } from "vitest";
import {
  forkDifference,
  noBacking,
  rankFeed,
  reputation,
  recentExternalForkers,
  type FeedThesis,
  type GraphThesis,
  type ThesisMetadata,
} from "../src/index";
const ns = {
    chainId: 10143,
    registryAddress: `0x${"aa".repeat(20)}` as `0x${string}`,
  },
  wallet = `0x${"11".repeat(20)}` as `0x${string}`,
  external = `0x${"22".repeat(20)}` as `0x${string}`;
function node(
  id: string,
  parentId = "0",
  author = wallet,
  createdAt = 1000000,
): GraphThesis {
  return {
    ...ns,
    thesisId: id,
    parentId,
    rootId: "1",
    depth: parentId === "0" ? 0 : 1,
    author,
    core: {
      marketId: 16,
      side: "long",
      leverageBps: 20000,
      targetPriceE8: "70000",
      invalidationPriceE8: "60000",
    },
    contentHash: `0x${"ab".repeat(32)}`,
    createdAt,
    blockNumber: "1",
    txHash: `0x${"cd".repeat(32)}`,
    executionRef: null,
    directForkCount: 0,
    uniqueExternalForkers: 0,
  };
}
function item(graph: GraphThesis): FeedThesis {
  return {
    graph,
    author: {
      handle: "alice",
      displayName: "Alice",
      wallet: graph.author,
      userId: null,
    },
    metadata: {
      version: 1,
      reasoning: "A thoughtful perspective.",
      tags: [],
      entryNote: null,
    },
    metadataState: "trusted",
    parent: null,
    changes: [],
    challenge: false,
    social: { agrees: 0, comments: 0 },
    backing: noBacking,
    execution: { state: "not-executed", position: "unknown" },
    provenance: {
      graph: "envio-test",
      metadata: "postgres",
      verification: "postgres",
      enrichment: "absent",
    },
  };
}
describe("transparent social formulas", () => {
  it("small samples show Emerging, zero stays a raw zero", () => {
    const r = reputation({
      eligibleRoots: 2,
      successfulRoots: 1,
      eligibleForks: 0,
      successfulForks: 0,
      influence: 1,
      executionsInspired: 0,
    });
    expect(r.originality.label).toBe("Emerging");
    expect(r.contribution.percentage).toBeNull();
    expect(r.executionsInspired).toBe(0);
  });
  it("three or more samples show the actual percentage and raw fraction", () => {
    const r = reputation({
      eligibleRoots: 3,
      successfulRoots: 2,
      eligibleForks: 4,
      successfulForks: 1,
      influence: 2,
      executionsInspired: 0,
    });
    expect(r.originality).toMatchObject({
      label: "67%",
      successful: 2,
      eligible: 3,
    });
    expect(r.contribution.label).toBe("25%");
  });
  it("rejects impossible and unsafe counts", () => {
    expect(() =>
      reputation({
        eligibleRoots: 1,
        successfulRoots: 2,
        eligibleForks: 0,
        successfulForks: 0,
        influence: 0,
        executionsInspired: 0,
      }),
    ).toThrow();
  });
  it("diffs all allowed fields and distinguishes meaningful changes", () => {
    const parent = {
      core: node("1").core,
      metadata: item(node("1")).metadata as ThesisMetadata,
    };
    const diff = forkDifference(parent, {
      core: { ...parent.core, side: "short", leverageBps: 30000 },
      metadata: {
        ...parent.metadata,
        tags: ["macro"],
        entryNote: "A new note",
      },
    });
    expect(diff.map((d) => [d.field, d.meaningful])).toEqual([
      ["side", true],
      ["leverageBps", true],
      ["entryNote", false],
      ["tags", false],
    ]);
  });
  it("Fresh ranks by creation time, then ID descending", () => {
    expect(
      rankFeed([item(node("1")), item(node("2"))], [], "fresh", 1000000).map(
        (n) => n.graph.thesisId,
      ),
    ).toEqual(["2", "1"]);
  });
  it("Most Forked and social Smart Signal use unique external direct wallets", () => {
    const root = node("1"),
      newer = node("2", "0", wallet, 1000001),
      activity = [
        node("3", "1", external),
        node("4", "1", external),
        node("5", "1", wallet),
        {
          ...node("6", "2", external),
          registryAddress: `0x${"bb".repeat(20)}` as `0x${string}`,
        },
      ];
    expect(recentExternalForkers(root, activity, 999000)).toBe(1);
    for (const mode of ["most-forked", "smart-signal"] as const)
      expect(
        rankFeed([item(newer), item(root)], activity, mode, 1000002)[0]?.graph
          .thesisId,
      ).toBe("1");
  });
  it("24h activity outranks 7d activity before newest tie-breaker", () => {
    const roots = [item(node("1")), item(node("2"))],
      activity = [
        node("3", "1", external, 900000),
        node("4", "2", external, 999900),
      ];
    expect(
      rankFeed(roots, activity, "most-forked", 1000000)[0]?.graph.thesisId,
    ).toBe("2");
  });
});
