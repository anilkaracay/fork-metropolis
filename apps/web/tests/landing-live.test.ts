import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const runtime = vi.hoisted(() => ({
  recent: vi.fn(),
  tree: vi.fn(),
  getMany: vi.fn(),
  compose: vi.fn(),
  identities: vi.fn(),
  totals: vi.fn(),
  latest: vi.fn(),
  flows: vi.fn(),
  test: false,
  provenance: "envio",
  backing: true,
}));
vi.mock("../src/server/runtime", () => ({
  testMode: () => runtime.test,
  getRuntime: async () => ({
    core: {
      graph: {
        recent: runtime.recent,
        tree: runtime.tree,
        getMany: runtime.getMany,
        provenance: runtime.provenance,
      },
      compose: runtime.compose,
      identities: runtime.identities,
      backing: runtime.backing
        ? {
            address: `0x${"cc".repeat(20)}`,
            source: {
              totals: runtime.totals,
              latest: runtime.latest,
              flows: runtime.flows,
            },
          }
        : null,
    },
  }),
}));
import { forgetLandingRead, readLandingLive } from "../src/server/landing";

const registry = `0x${"aa".repeat(20)}`;
// A root with two forks, a fork of the first fork, and an unrelated root.
const shape: [id: number, parent: number, root: number, depth: number][] = [
  [1, 0, 1, 0],
  [2, 1, 1, 1],
  [3, 2, 1, 2],
  [4, 1, 1, 1],
  [5, 0, 5, 0],
];
const node = ([id, parent, root, depth]: (typeof shape)[number]) => ({
  thesisId: String(id),
  parentId: String(parent),
  rootId: String(root),
  depth,
  author: `0x${String(id).repeat(40)}`,
  registryAddress: registry,
  createdAt: 1_700_000_000 + id * 100,
  txHash: `0x${String(id).repeat(64)}`,
  core: {
    marketId: id === 5 ? 48 : 32,
    side: id === 4 ? "short" : "long",
    targetPriceE8: "440000000000",
    leverageBps: 30000,
  },
});
const nodes = shape.map(node);
const untrusted = new Set<string>();
const backed: Record<string, [wei: string, backers: number]> = {
  "3": ["100000000000000000", 1],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  forgetLandingRead();
  untrusted.clear();
  Object.assign(runtime, { test: false, provenance: "envio", backing: true });
  // The indexer returns the newest idea first.
  runtime.recent.mockResolvedValue({
    nodes: [...nodes].reverse(),
    bounded: false,
  });
  runtime.tree.mockImplementation(async (rootId: string) => ({
    nodes: nodes.filter((item) => item.rootId === rootId),
    truncated: false,
  }));
  runtime.getMany.mockImplementation(async (ids: string[]) =>
    nodes.filter((item) => ids.includes(item.thesisId)),
  );
  runtime.compose.mockImplementation(async (items: typeof nodes) =>
    items.map((graph) => ({
      graph,
      author: { handle: `author${graph.thesisId}`, userId: "private-test-id" },
      metadataState: untrusted.has(graph.thesisId) ? "missing" : "trusted",
      backing: {
        totalWei: backed[graph.thesisId]?.[0] ?? "0",
        backers: backed[graph.thesisId]?.[1] ?? 0,
      },
    })),
  );
  runtime.identities.mockResolvedValue((wallet: string) => ({
    handle: `backer_${wallet.slice(2, 4)}`,
    userId: "private-test-id",
  }));
  runtime.totals.mockResolvedValue({
    totalBackedWei: "100000000000000000",
    backings: 1,
    supporters: 1,
    thesesBacked: 1,
    sentToAncestorsWei: "30000000000000000",
  });
  runtime.latest.mockResolvedValue([
    {
      thesisId: "3",
      txHash: `0x${"ef".repeat(32)}`,
      backer: `0x${"d1".repeat(20)}`,
      amountWei: "100000000000000000",
      position: 1,
      early: true,
      timestamp: 1_700_000_900,
    },
  ]);
  runtime.flows.mockResolvedValue([
    {
      sourceThesisId: "3",
      creditedThesisId: "2",
      recipient: nodes[1]!.author,
      role: 1,
      amountWei: "20000000000000000",
    },
    {
      sourceThesisId: "3",
      creditedThesisId: "1",
      recipient: nodes[0]!.author,
      role: 2,
      amountWei: "10000000000000000",
    },
  ]);
});

it("counts what the indexer holds and projects only public fields", async () => {
  const live = await readLandingLive();
  expect(live).toMatchObject({
    ideas: 5,
    forks: 3,
    authors: 5,
    bounded: false,
    registry,
    backingContract: `0x${"cc".repeat(20)}`,
    backing: {
      totalMon: "0.1",
      backings: 1,
      supporters: 1,
      sentToAncestorsMon: "0.03",
    },
  });
  const text = JSON.stringify(live);
  expect(text).not.toContain("private-test-id");
  expect(text).not.toContain("userId");
});

it("lists real events newest first, with who did what", async () => {
  const live = await readLandingLive();
  expect(live!.events[0]).toEqual({
    kind: "backed",
    handle: "backer_d1",
    thesisId: "3",
    parentId: null,
    amountMon: "0.1",
    count: 1,
    at: 1_700_000_900,
  });
  expect(
    live!.events.map((event) => `${event.kind} ${event.thesisId}`),
  ).toEqual([
    "backed 3",
    "published 5",
    "forked 4",
    "forked 3",
    "forked 2",
    "published 1",
  ]);
  expect(live!.events[2]).toMatchObject({ handle: "author4", parentId: "1" });
});

it("draws the largest lineage with rows, depth, backing and value from forks", async () => {
  const live = await readLandingLive();
  expect(live!.tree!.rootId).toBe("1");
  expect(live!.tree!.more).toBe(0);
  expect(
    live!.tree!.nodes.map((item) => [item.id, item.depth, item.rowsToParent]),
  ).toEqual([
    ["1", 0, 0],
    ["2", 1, 1],
    ["3", 2, 1],
    ["4", 1, 3],
  ]);
  const [root, fork, leaf, sibling] = live!.tree!.nodes;
  expect(root).toMatchObject({
    parentId: null,
    handle: "author1",
    market: "ETH",
    target: "$4,400",
    leverage: "3×",
    arrivedMon: "0.01",
    backedMon: null,
  });
  expect(fork).toMatchObject({ parentId: "1", arrivedMon: "0.02" });
  expect(leaf).toMatchObject({
    backedMon: "0.1",
    backers: 1,
    arrivedMon: null,
  });
  expect(sibling).toMatchObject({ side: "short", txHash: nodes[3]!.txHash });
});

it("announces only ideas whose reasoning passed its check", async () => {
  untrusted.add("3").add("5");
  const live = await readLandingLive();
  expect(
    live!.events.map((event) => `${event.kind} ${event.thesisId}`),
  ).toEqual(["forked 4", "forked 2", "published 1"]);
  // The figures and the tree come from the chain and stay complete.
  expect(live!.ideas).toBe(5);
  expect(live!.tree!.nodes).toHaveLength(4);
});

it("has no tree while nothing has been forked, and never invents one", async () => {
  const roots = [node([1, 0, 1, 0]), node([5, 0, 5, 0])];
  runtime.recent.mockResolvedValue({ nodes: roots, bounded: true });
  runtime.latest.mockResolvedValue([]);
  runtime.totals.mockResolvedValue(null);
  const live = await readLandingLive();
  expect(live).toMatchObject({
    ideas: 2,
    forks: 0,
    bounded: true,
    tree: null,
    backing: null,
  });
  expect(runtime.tree).not.toHaveBeenCalled();
  expect(live!.events).toHaveLength(2);
});

it("still reports ideas when the backing contract is not configured", async () => {
  runtime.backing = false;
  const live = await readLandingLive();
  expect(live).toMatchObject({ backing: null, backingContract: null });
  expect(live!.events.every((event) => event.kind !== "backed")).toBe(true);
  expect(live!.tree!.nodes.every((item) => item.arrivedMon === null)).toBe(
    true,
  );
});

it("says nothing in the test workspace, off the live indexer or after an error", async () => {
  runtime.test = true;
  expect(await readLandingLive()).toBeNull();
  runtime.test = false;
  runtime.provenance = "envio-test";
  expect(await readLandingLive()).toBeNull();
  runtime.provenance = "envio";
  runtime.recent.mockRejectedValue(new Error("indexer unavailable"));
  expect(await readLandingLive()).toBeNull();
  runtime.recent.mockResolvedValue({ nodes: [], bounded: false });
  expect(await readLandingLive()).toBeNull();
});

it("shares one read, refreshes quietly, and shows a held read only with its own time", async () => {
  vi.useFakeTimers({ now: new Date("2026-10-12T18:00:00Z") });
  const [first, second] = await Promise.all([
    readLandingLive(),
    readLandingLive(),
  ]);
  expect(first).toBe(second);
  expect(runtime.recent).toHaveBeenCalledTimes(1);
  expect(first!.readAt).toBe(Date.parse("2026-10-12T18:00:00Z") / 1000);
  // Within twenty seconds nobody asks the indexer again.
  vi.setSystemTime(new Date("2026-10-12T18:00:19Z"));
  expect(await readLandingLive()).toBe(first);
  expect(runtime.recent).toHaveBeenCalledTimes(1);
  // A little later the visitor is served at once and a newer read is fetched behind them.
  vi.setSystemTime(new Date("2026-10-12T18:00:30Z"));
  expect(await readLandingLive()).toBe(first);
  expect(runtime.recent).toHaveBeenCalledTimes(2);
  await vi.waitFor(async () =>
    expect((await readLandingLive())!.readAt).toBe(
      Date.parse("2026-10-12T18:00:30Z") / 1000,
    ),
  );
  // After a quiet spell the read is awaited. If the indexer does not answer, the last
  // read stands, with its own time.
  vi.setSystemTime(new Date("2026-10-12T18:03:00Z"));
  runtime.recent.mockRejectedValue(new Error("rate limited"));
  const heldRead = await readLandingLive();
  expect(heldRead!.readAt).toBe(Date.parse("2026-10-12T18:00:30Z") / 1000);
  // A read older than five minutes is not shown at all.
  vi.setSystemTime(new Date("2026-10-12T18:05:31Z"));
  expect(await readLandingLive()).toBeNull();
  // The next answer replaces it.
  runtime.recent.mockResolvedValue({
    nodes: [...nodes].reverse(),
    bounded: false,
  });
  expect((await readLandingLive())!.readAt).toBe(
    Date.parse("2026-10-12T18:05:31Z") / 1000,
  );
});

it("folds repeated backings of one idea by one wallet into one event", async () => {
  const one = (index: number, backer: string, thesisId = "3") => ({
    thesisId,
    txHash: `0x${String(index).padStart(64, "0")}`,
    backer,
    amountWei: "10000000000000000",
    position: index,
    early: index <= 10,
    timestamp: 1_700_001_000 - index,
  });
  runtime.latest.mockResolvedValue([
    ...Array.from({ length: 20 }, (_, index) =>
      one(index + 1, `0x${"d1".repeat(20)}`),
    ),
    one(30, `0x${"d2".repeat(20)}`),
    one(31, `0x${"d1".repeat(20)}`, "2"),
  ]);
  const backed = (await readLandingLive())!.events.filter(
    (event) => event.kind === "backed",
  );
  expect(backed).toEqual([
    {
      kind: "backed",
      handle: "backer_d1",
      thesisId: "3",
      parentId: null,
      amountMon: "0.2",
      count: 20,
      at: 1_700_000_999,
    },
    expect.objectContaining({ handle: "backer_d2", thesisId: "3", count: 1 }),
    expect.objectContaining({ handle: "backer_d1", thesisId: "2", count: 1 }),
  ]);
  expect(runtime.latest).toHaveBeenCalledWith(100);
});
