import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const runtime = vi.hoisted(() => ({
  recent: vi.fn(),
  compose: vi.fn(),
  totals: vi.fn(),
  test: false,
  provenance: "envio",
  backing: true,
}));
vi.mock("../src/server/runtime", () => ({
  testMode: () => runtime.test,
  getRuntime: async () => ({
    core: {
      graph: { recent: runtime.recent, provenance: runtime.provenance },
      compose: runtime.compose,
      backing: runtime.backing ? { source: { totals: runtime.totals } } : null,
    },
  }),
}));
import { readLandingLive } from "../src/server/landing";

const node = (id: number, parent: number, author: string) => ({
  thesisId: String(id),
  parentId: String(parent),
  author,
});
const item = (id: number, parent: number, handle: string, backedWei = "0") => ({
  graph: {
    thesisId: String(id),
    parentId: String(parent),
    core: { side: "long", targetPriceE8: "440000000000", leverageBps: 30000 },
  },
  author: { handle, userId: "private-test-id" },
  metadataState: "trusted",
  backing: { totalWei: backedWei, backers: backedWei === "0" ? 0 : 1 },
});
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(runtime, { test: false, provenance: "envio", backing: true });
  runtime.recent.mockResolvedValue({
    nodes: [node(3, 2, "0xc"), node(2, 1, "0xb"), node(1, 0, "0xa")],
    bounded: false,
  });
  runtime.compose.mockResolvedValue([
    item(3, 2, "carol", "100000000000000000"),
    item(2, 1, "bob"),
    item(1, 0, "alice"),
  ]);
  runtime.totals.mockResolvedValue({
    totalBackedWei: "100000000000000000",
    backings: 1,
    supporters: 1,
    thesesBacked: 1,
    sentToAncestorsWei: "30000000000000000",
  });
});

it("counts what the indexer holds and projects only public fields", async () => {
  const live = await readLandingLive();
  expect(live).toMatchObject({
    ideas: 3,
    forks: 2,
    authors: 3,
    bounded: false,
  });
  expect(live?.latest[0]).toEqual({
    id: "3",
    handle: "carol",
    parentId: "2",
    side: "long",
    target: "$4,400",
    leverage: "3×",
    backedMon: "0.1",
  });
  expect(live?.latest[2]).toMatchObject({ parentId: null, backedMon: null });
  expect(live?.backing).toEqual({
    totalMon: "0.1",
    backings: 1,
    supporters: 1,
    sentToAncestorsMon: "0.03",
  });
  expect(JSON.stringify(live)).not.toContain("private-test-id");
});
it("shows no backing figures when nothing has been backed or backing is not live", async () => {
  runtime.totals.mockResolvedValue(null);
  expect((await readLandingLive())?.backing).toBeNull();
  runtime.backing = false;
  expect((await readLandingLive())?.backing).toBeNull();
  expect(runtime.totals).toHaveBeenCalledTimes(1);
});
it("leaves untrusted ideas out of the latest list without changing the counts", async () => {
  const items = [item(3, 2, "carol"), item(2, 1, "bob"), item(1, 0, "alice")];
  items[1]!.metadataState = "hidden";
  runtime.compose.mockResolvedValue(items);
  const live = await readLandingLive();
  expect(live?.latest.map((idea) => idea.id)).toEqual(["3", "1"]);
  expect(live?.ideas).toBe(3);
});
it("returns nothing for the test workspace, a test indexer or a failed read", async () => {
  runtime.test = true;
  expect(await readLandingLive()).toBeNull();
  expect(runtime.recent).not.toHaveBeenCalled();
  runtime.test = false;
  runtime.provenance = "envio-test";
  expect(await readLandingLive()).toBeNull();
  runtime.provenance = "envio";
  runtime.recent.mockRejectedValue(new Error("Private provider diagnostic"));
  expect(await readLandingLive()).toBeNull();
});
