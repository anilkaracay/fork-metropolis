import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const runtime = vi.hoisted(() => ({
  get: vi.fn(),
  compose: vi.fn(),
  test: false,
  provenance: "envio",
}));
vi.mock("../src/server/runtime", () => ({
  testMode: () => runtime.test,
  getRuntime: async () => ({
    core: {
      graph: { getMany: runtime.get, provenance: runtime.provenance },
      compose: runtime.compose,
    },
  }),
}));
import { readLandingLineage } from "../src/server/landing";

function example() {
  return [1, 2].map((id) => ({
    graph: {
      thesisId: String(id),
      parentId: id === 1 ? "0" : "1",
      rootId: "1",
      registryAddress: "0x1889a7216b1ecad9a44910dd0996834d0894b9e1",
      core: {
        marketId: 32,
        side: "long",
        targetPriceE8: id === 1 ? "420000000000" : "440000000000",
        leverageBps: id === 1 ? 20000 : 30000,
        invalidationPriceE8: "360000000000",
      },
    },
    metadataState: "trusted",
    metadata: { reasoning: "Unit test reasoning." },
    author: {
      handle: id === 1 ? "author_a" : "author_b",
      userId: "private-test-id",
    },
  }));
}
beforeEach(() => {
  vi.clearAllMocks();
  runtime.test = false;
  runtime.provenance = "envio";
  runtime.get.mockResolvedValue([]);
  runtime.compose.mockResolvedValue(example());
});

it("projects only public fields from a bounded, trusted real namespace read", async () => {
  const result = await readLandingLineage();
  expect(runtime.get).toHaveBeenCalledExactlyOnceWith(["1", "2"]);
  expect(result?.fork).toEqual({
    id: "2",
    handle: "author_b",
    target: "$4,400",
    leverage: "3×",
    invalidation: "$3,600",
    reasoning: "Unit test reasoning.",
  });
  expect(JSON.stringify(result)).not.toContain("private-test-id");
});
it("never initializes or displays the isolated simulated workspace", async () => {
  runtime.test = true;
  expect(await readLandingLineage()).toBeNull();
  expect(runtime.get).not.toHaveBeenCalled();
});
it("fails closed for hidden or mismatched lineage rather than inventing a fallback", async () => {
  const items = example();
  items[1]!.metadataState = "hidden";
  runtime.compose.mockResolvedValue(items);
  expect(await readLandingLineage()).toBeNull();
  items[1]!.metadataState = "trusted";
  items[1]!.graph.parentId = "9";
  expect(await readLandingLineage()).toBeNull();
  items[1]!.graph.parentId = "1";
  items[1]!.graph.core.targetPriceE8 = "999000000000";
  expect(await readLandingLineage()).toBeNull();
});
it("withholds provider errors and rejects test indexer provenance", async () => {
  runtime.get.mockRejectedValue(new Error("Private provider diagnostic"));
  expect(await readLandingLineage()).toBeNull();
  runtime.get.mockResolvedValue([]);
  runtime.provenance = "envio-test";
  expect(await readLandingLineage()).toBeNull();
});
