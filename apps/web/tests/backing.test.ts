import { fileURLToPath } from "node:url";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { testDatabase } from "@fork/db/testing";
import type { BackingSummary, GraphThesis, LineageFlow } from "@fork/shared";
import { SocialCore } from "../src/server/social-core";
import { synchronizeIdentity } from "../src/server/auth";
import type { GraphSource } from "../src/server/graph";
import {
  backingRows,
  envioBacking,
  noEarnings,
  noSupport,
  type BackingSource,
} from "../src/server/backing";

const ns = {
  chainId: 10143,
  registryAddress: `0x${"aa".repeat(20)}` as `0x${string}`,
};
const backingAddress = `0x${"cc".repeat(20)}`;
const wallet = (n: number) => `0x${String(n).repeat(40)}`;
const [alice, bob, carol, dana] = [wallet(1), wallet(2), wallet(3), wallet(4)];
const node = (id: number, parent: number, author: string): GraphThesis => ({
  ...ns,
  thesisId: String(id),
  parentId: String(parent),
  rootId: "1",
  depth: id - 1,
  author: author as `0x${string}`,
  core: {
    marketId: 16,
    side: "long",
    leverageBps: 20000,
    targetPriceE8: "7000000000000",
    invalidationPriceE8: "6000000000000",
  },
  contentHash: `0x${"ab".repeat(32)}`,
  createdAt: 1_700_000_000 + id,
  blockNumber: String(id),
  txHash: `0x${String(id).repeat(64)}`,
  executionRef: null,
  directForkCount: 0,
  uniqueExternalForkers: 0,
});
// Alice wrote #1, Bob forked it as #2, Carol forked that as #3. #9 is another tree.
const nodes = [node(1, 0, alice), node(2, 1, bob), node(3, 2, carol)];
const counts = {
  eligibleRoots: 0,
  successfulRoots: 0,
  eligibleForks: 0,
  successfulForks: 0,
  influence: 0,
  executionsInspired: 0,
};
const graph: GraphSource = {
  provenance: "envio-test",
  get: async (id) => nodes.find((n) => n.thesisId === id) ?? null,
  getMany: async (ids) => nodes.filter((n) => ids.includes(n.thesisId)),
  recent: async () => ({ nodes, activity: nodes, bounded: false }),
  tree: async () => ({ nodes, truncated: false }),
  author: async (address) => ({
    nodes: nodes.filter((n) => n.author === address),
    counts,
  }),
};
const summary: BackingSummary = {
  totalWei: "100000000000000000",
  backers: 1,
  backings: 1,
  earlyBackers: [dana],
  lastBackedAt: 1_700_000_100,
};
const flows: LineageFlow[] = [
  {
    sourceThesisId: "3",
    creditedThesisId: "2",
    recipient: bob,
    role: 1,
    amountWei: "20000000000000000",
  },
  {
    sourceThesisId: "3",
    creditedThesisId: "1",
    recipient: alice,
    role: 2,
    amountWei: "10000000000000000",
  },
  {
    sourceThesisId: "9",
    creditedThesisId: "3",
    recipient: carol,
    role: 1,
    amountWei: "5",
  },
];
const source: BackingSource = {
  summaries: async (ids) =>
    new Map(ids.includes("3") ? [["3", summary] as const] : []),
  recent: async (id) =>
    id === "3"
      ? [
          {
            txHash: `0x${"ef".repeat(32)}`,
            backer: dana,
            amountWei: summary.totalWei,
            position: 1,
            early: true,
            timestamp: 1_700_000_100,
          },
        ]
      : [],
  latest: async () => [],
  flows: async (ids) =>
    flows.filter(
      (f) => ids.includes(f.sourceThesisId) || ids.includes(f.creditedThesisId),
    ),
  earnings: async (address) =>
    address === alice
      ? {
          ...noEarnings,
          earnedFromForksWei: "10000000000000000",
          claimableWei: "10000000000000000",
        }
      : noEarnings,
  support: async (address) =>
    address === dana
      ? {
          totalBackedWei: summary.totalWei,
          thesesBacked: 1,
          earlySupportCount: 1,
        }
      : noSupport,
  totals: async () => null,
};

let connection: Awaited<ReturnType<typeof testDatabase>>,
  live: SocialCore,
  dormant: SocialCore;
beforeAll(async () => {
  connection = await testDatabase(
    fileURLToPath(new URL("../../../packages/db/migrations", import.meta.url)),
  );
  const core = (backing: ConstructorParameters<typeof SocialCore>[6]) =>
    new SocialCore(
      connection.db,
      graph,
      { creation: async () => Promise.reject(new Error("unused")) },
      ns,
      async () => [16],
      new Set(),
      backing,
    );
  live = core({ source, address: backingAddress });
  dormant = core(null);
  const session = await synchronizeIdentity(connection.db, {
    did: "did:test:backing:alice",
    wallets: [{ address: alice, kind: "embedded" }],
  });
  await live.updateProfile(session, { handle: "alice", displayName: "Alice" });
}, 120000);
afterAll(async () => {
  await connection.close();
});

describe("backing in the thesis views", () => {
  it("describes who a backing is split between, what arrived and where it went", async () => {
    const view = await live.backingView("3");
    expect(view.contract).toEqual({ address: backingAddress, chainId: 10143 });
    expect(
      view.lineage.map((entry) => [
        entry.role,
        entry.thesisId,
        entry.author.wallet,
      ]),
    ).toEqual([
      [0, "3", carol],
      [1, "2", bob],
      [2, "1", alice],
    ]);
    expect(view.lineage[2]!.author.handle).toBe("alice");
    expect(view.summary).toEqual(summary);
    expect(view.earlyBackers.map((person) => person.wallet)).toEqual([dana]);
    expect(view.recent).toMatchObject([
      { position: 1, early: true, backer: { wallet: dana, userId: null } },
    ]);
    expect(view.sent.map((flow) => flow.creditedThesisId)).toEqual(["2", "1"]);
    expect(view.received.map((flow) => flow.sourceThesisId)).toEqual(["9"]);
  });
  it("gives a root a one-entry lineage and an empty summary", async () => {
    const view = await live.backingView("1");
    expect(view.lineage).toHaveLength(1);
    expect(view.summary).toMatchObject({ totalWei: "0", backers: 0 });
    expect(view.received.map((flow) => flow.sourceThesisId)).toEqual(["3"]);
  });
  it("reports backing as not live when no contract is configured", async () => {
    const view = await dormant.backingView("3");
    expect(view.contract).toBeNull();
    expect(view.summary.backers).toBe(0);
    expect(view.recent).toEqual([]);
    const [item] = await dormant.compose([nodes[2]!]);
    expect(item!.backing).toMatchObject({ totalWei: "0", backers: 0 });
    expect((await dormant.profile("alice")).backingContract).toBeNull();
  });
  it("rejects an unknown thesis", async () => {
    await expect(live.backingView("42")).rejects.toMatchObject({
      code: "THESIS_NOT_FOUND",
      status: 404,
    });
  });
  it("puts each idea's backing summary on its card", async () => {
    const items = await live.compose(nodes);
    expect(items.map((item) => item.backing.backers)).toEqual([0, 0, 1]);
    expect(items[2]!.backing.totalWei).toBe(summary.totalWei);
  });
  it("returns only flows between ideas of the tree", async () => {
    const tree = await live.tree("3");
    expect(
      tree.flows.map((f) => `${f.sourceThesisId}>${f.creditedThesisId}`),
    ).toEqual(["3>2", "3>1"]);
    expect((await dormant.tree("3")).flows).toEqual([]);
  });
  it("puts earnings, support and the contract on the profile", async () => {
    const profile = await live.profile("alice");
    expect(profile.earnings).toMatchObject({
      earnedFromForksWei: "10000000000000000",
      claimableWei: "10000000000000000",
    });
    expect(profile.support).toEqual(noSupport);
    expect(profile.backingContract).toBe(backingAddress);
  });
});

describe("reading the backing graph from Envio", () => {
  afterEach(() => vi.unstubAllGlobals());
  const respond = (data: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data })),
    );
  it("normalizes rows and keeps wei exact", async () => {
    respond({
      ThesisBacking: [
        {
          thesisId: "3",
          totalBacked: "123456789012345678901",
          backingCount: 2,
          backerCount: 1,
          earlyBackers: [dana.toUpperCase().replace("0X", "0x")],
          lastBackedAt: "1700000100",
        },
      ],
    });
    const summaries = await envioBacking(
      "https://envio.test/graphql",
      10143,
      ns.registryAddress,
    ).summaries(["3"]);
    expect(summaries.get("3")).toEqual({
      totalWei: "123456789012345678901",
      backers: 1,
      backings: 2,
      earlyBackers: [dana],
      lastBackedAt: 1_700_000_100,
    });
    const [, request] = (
      fetch as unknown as { mock: { calls: [string, { body: string }][] } }
    ).mock.calls[0]!;
    expect(JSON.parse(request.body).variables.where).toMatchObject({
      chainId: { _eq: 10143 },
      registryAddress: { _eq: ns.registryAddress },
      thesisId: { _in: ["3"] },
    });
  });
  it("returns zeroes for a wallet the indexer has not seen", async () => {
    respond({ AuthorEarnings_by_pk: null, Supporter_by_pk: null });
    const reader = envioBacking(
      "https://envio.test/graphql",
      10143,
      ns.registryAddress,
    );
    expect(await reader.earnings(alice)).toEqual(noEarnings);
    expect(await reader.support(alice)).toEqual(noSupport);
  });
  it("does not query when there is nothing to look up", async () => {
    respond({});
    const reader = envioBacking(
      "https://envio.test/graphql",
      10143,
      ns.registryAddress,
    );
    expect((await reader.summaries([])).size).toBe(0);
    expect(await reader.flows([])).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects amounts that lost precision as numbers", () => {
    expect(() =>
      backingRows.flow.parse({
        sourceThesisId: "3",
        creditedThesisId: "1",
        recipient: alice,
        role: 2,
        amount: 2 ** 60,
      }),
    ).toThrow();
    expect(
      backingRows.flow.parse({
        sourceThesisId: 3,
        creditedThesisId: 1,
        recipient: alice,
        role: 2,
        amount: 1000,
      }),
    ).toMatchObject({ sourceThesisId: "3", amountWei: "1000" });
  });
});
