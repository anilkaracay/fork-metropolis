import { beforeEach, describe, expect, it } from "vitest";
import { createTestIndexer } from "envio";

type Wallet = `0x${string}`;
const registry = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const otherRegistry = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;
const backing = "0xcccccccccccccccccccccccccccccccccccccccc" as const;
const otherBacking = "0xdddddddddddddddddddddddddddddddddddddddd" as const;
const alice = "0x1111111111111111111111111111111111111111" as const;
const bob = "0x2222222222222222222222222222222222222222" as const;
const carol = "0x3333333333333333333333333333333333333333" as const;
const dave = "0x4444444444444444444444444444444444444444" as const;
const numbered = (n: number): Wallet =>
  `0x${(0xb000 + n).toString(16).padStart(40, "0")}`;
const hash = `0x${"ab".repeat(32)}`;
const MON = 10n ** 18n;
const tenth = MON / 10n;
const key = (id: bigint, address: string = registry) =>
  `10143:${address}:${id}`;
const scoped = (wallet: string, address: string = registry) =>
  `10143:${address}:${wallet}`;
// One share of a backing, exactly as FORKBacking emits it in a Credited event.
type Share = { to: Wallet; thesis: bigint; role: 0 | 1 | 2; amount: bigint };

let block = 0;
let graph: ReturnType<typeof createTestIndexer>;
beforeEach(() => {
  graph = createTestIndexer();
  block = 0;
});
const at = () => ({ number: ++block, timestamp: 1_700_000_000 + block, hash });

async function create(
  id: bigint,
  parent: bigint,
  author: Wallet,
  address: Wallet = registry,
) {
  await graph.process({
    chains: {
      10143: {
        simulate: [
          {
            contract: "FORKRegistry",
            event: "ThesisCreated",
            srcAddress: address,
            block: at(),
            transaction: { hash },
            params: {
              thesisId: id,
              parentId: parent,
              author,
              marketId: 16n,
              side: 0n,
              leverageBps: 20000n,
              targetPriceE8: 7000000000000n,
              invalidationPriceE8: 6000000000000n,
              contentHash: hash,
              createdAt: 1700000000n + id,
            },
          },
        ],
      },
    },
  });
}
// Emits Backed followed by its Credited events in one transaction, like the contract.
async function back(
  thesisId: bigint,
  backer: Wallet,
  amount: bigint,
  position: number,
  shares: Share[],
  address: Wallet = backing,
) {
  const mined = at();
  await graph.process({
    chains: {
      10143: {
        simulate: [
          {
            contract: "FORKBacking",
            event: "Backed",
            srcAddress: address,
            block: mined,
            transaction: { hash },
            params: {
              thesisId,
              backer,
              amount,
              backerIndex: BigInt(position),
              early: position <= 10,
            },
          },
          ...shares.map((share) => ({
            contract: "FORKBacking" as const,
            event: "Credited" as const,
            srcAddress: address,
            block: mined,
            transaction: { hash },
            params: {
              recipient: share.to,
              sourceThesisId: thesisId,
              creditedThesisId: share.thesis,
              role: BigInt(share.role),
              amount: share.amount,
            },
          })),
        ],
      },
    },
  });
}
async function withdraw(account: Wallet, amount: bigint) {
  await graph.process({
    chains: {
      10143: {
        simulate: [
          {
            contract: "FORKBacking",
            event: "Withdrawn",
            srcAddress: backing,
            block: at(),
            transaction: { hash },
            params: { account, amount },
          },
        ],
      },
    },
  });
}
// Alice publishes, Bob forks Alice, Carol forks Bob.
async function threeLevels() {
  await create(1n, 0n, alice);
  await create(2n, 1n, bob);
  await create(3n, 2n, carol);
}
const split: Share[] = [
  { to: carol, thesis: 3n, role: 0, amount: 7n * tenth },
  { to: bob, thesis: 2n, role: 1, amount: 2n * tenth },
  { to: alice, thesis: 1n, role: 2, amount: tenth },
];

describe("backing handler state", () => {
  it("records a root backing in full for its author", async () => {
    await create(1n, 0n, alice);
    await back(1n, bob, MON, 1, [
      { to: alice, thesis: 1n, role: 0, amount: MON },
    ]);
    expect(await graph.ThesisBacking.get(key(1n))).toMatchObject({
      thesis_id: key(1n),
      totalBacked: MON,
      backingCount: 1,
      backerCount: 1,
      earlyBackers: [bob],
      firstBackedAt: 1_700_000_002n,
      lastBackedAt: 1_700_000_002n,
    });
    expect(await graph.Backing.getAll()).toMatchObject([
      {
        thesis_id: key(1n),
        thesisBacking_id: key(1n),
        supporter_id: scoped(bob),
        backingAddress: backing,
        registryAddress: registry,
        backer: bob,
        amount: MON,
        backerIndex: 1,
        early: true,
        firstByBacker: true,
        txHash: hash,
      },
    ]);
    expect(await graph.Supporter.get(scoped(bob))).toMatchObject({
      totalBacked: MON,
      backingCount: 1,
      thesesBacked: 1,
      earlySupportCount: 1,
    });
    expect(await graph.AuthorEarnings.get(scoped(alice))).toMatchObject({
      earnedAsAuthor: MON,
      earnedFromForks: 0n,
      withdrawn: 0n,
      claimable: MON,
    });
    expect(await graph.LineageFlow.getAll()).toHaveLength(0);
    expect(await graph.BackingTotals.get(`10143:${registry}`)).toMatchObject({
      backingAddress: backing,
      totalBacked: MON,
      backingCount: 1,
      supporterCount: 1,
      thesesBacked: 1,
      sentToAncestors: 0n,
      totalWithdrawn: 0n,
    });
  });

  it("splits a three-level backing into author income and two lineage flows", async () => {
    await threeLevels();
    await back(3n, dave, MON, 1, split);
    expect(await graph.Credit.getAll()).toHaveLength(3);
    expect(await graph.AuthorEarnings.get(scoped(carol))).toMatchObject({
      earnedAsAuthor: 7n * tenth,
      earnedFromForks: 0n,
    });
    expect(await graph.AuthorEarnings.get(scoped(bob))).toMatchObject({
      earnedAsAuthor: 0n,
      earnedFromForks: 2n * tenth,
      claimable: 2n * tenth,
    });
    expect(await graph.AuthorEarnings.get(scoped(alice))).toMatchObject({
      earnedAsAuthor: 0n,
      earnedFromForks: tenth,
    });
    expect(await graph.LineageFlow.get(`${key(3n)}:2`)).toMatchObject({
      sourceThesis_id: key(3n),
      creditedThesis_id: key(2n),
      recipient: bob,
      role: 1,
      amount: 2n * tenth,
      creditCount: 1,
    });
    expect(await graph.LineageFlow.get(`${key(3n)}:1`)).toMatchObject({
      creditedThesis_id: key(1n),
      recipient: alice,
      role: 2,
      amount: tenth,
    });
    expect(await graph.BackingTotals.get(`10143:${registry}`)).toMatchObject({
      totalBacked: MON,
      sentToAncestors: 3n * tenth,
    });
  });

  it("accumulates repeated flows between the same theses", async () => {
    await threeLevels();
    await back(3n, dave, MON, 1, split);
    await back(3n, dave, MON, 1, split);
    await back(2n, dave, MON, 1, [
      { to: bob, thesis: 2n, role: 0, amount: 8n * tenth },
      { to: alice, thesis: 1n, role: 1, amount: 2n * tenth },
    ]);
    expect(await graph.LineageFlow.getAll()).toHaveLength(3);
    expect(await graph.LineageFlow.get(`${key(3n)}:1`)).toMatchObject({
      amount: 2n * tenth,
      creditCount: 2,
    });
    expect(await graph.LineageFlow.get(`${key(2n)}:1`)).toMatchObject({
      role: 1,
      amount: 2n * tenth,
    });
    expect(await graph.AuthorEarnings.get(scoped(alice))).toMatchObject({
      earnedFromForks: 4n * tenth,
      creditCount: 3,
    });
    expect(await graph.AuthorEarnings.get(scoped(bob))).toMatchObject({
      earnedAsAuthor: 8n * tenth,
      earnedFromForks: 4n * tenth,
      claimable: 12n * tenth,
    });
  });

  it("keeps an author who also wrote the parent out of fork income", async () => {
    await create(1n, 0n, carol);
    await create(2n, 1n, alice);
    await create(3n, 2n, alice);
    await back(3n, dave, MON, 1, [
      { to: alice, thesis: 3n, role: 0, amount: 9n * tenth },
      { to: carol, thesis: 1n, role: 2, amount: tenth },
    ]);
    expect(await graph.AuthorEarnings.get(scoped(alice))).toMatchObject({
      earnedAsAuthor: 9n * tenth,
      earnedFromForks: 0n,
    });
    expect(await graph.LineageFlow.getAll()).toMatchObject([
      { id: `${key(3n)}:1`, recipient: carol, role: 2, amount: tenth },
    ]);
  });

  it("records one parent flow when the parent also wrote the grandparent", async () => {
    await create(1n, 0n, bob);
    await create(2n, 1n, bob);
    await create(3n, 2n, alice);
    await back(3n, dave, MON, 1, [
      { to: alice, thesis: 3n, role: 0, amount: 7n * tenth },
      { to: bob, thesis: 2n, role: 1, amount: 3n * tenth },
    ]);
    expect(await graph.LineageFlow.getAll()).toMatchObject([
      { id: `${key(3n)}:2`, recipient: bob, role: 1, amount: 3n * tenth },
    ]);
    expect(await graph.AuthorEarnings.get(scoped(bob))).toMatchObject({
      earnedFromForks: 3n * tenth,
    });
  });

  it("creates no flow for a lineage written by one author", async () => {
    await create(1n, 0n, alice);
    await create(2n, 1n, alice);
    await create(3n, 2n, alice);
    await back(3n, dave, MON, 1, [
      { to: alice, thesis: 3n, role: 0, amount: MON },
    ]);
    expect(await graph.LineageFlow.getAll()).toHaveLength(0);
    expect(await graph.AuthorEarnings.get(scoped(alice))).toMatchObject({
      earnedAsAuthor: MON,
      earnedFromForks: 0n,
    });
    expect(await graph.BackingTotals.get(`10143:${registry}`)).toMatchObject({
      sentToAncestors: 0n,
    });
  });

  it("keeps the first ten distinct backers as early supporters", async () => {
    await create(1n, 0n, alice);
    for (let position = 1; position <= 11; position++)
      await back(1n, numbered(position), tenth, position, [
        { to: alice, thesis: 1n, role: 0, amount: tenth },
      ]);
    const received = await graph.ThesisBacking.getOrThrow(key(1n));
    expect(received).toMatchObject({ backerCount: 11, backingCount: 11 });
    expect(received.earlyBackers).toEqual(
      Array.from({ length: 10 }, (_, index) => numbered(index + 1)),
    );
    expect(await graph.Supporter.get(scoped(numbered(1)))).toMatchObject({
      earlySupportCount: 1,
    });
    expect(await graph.Supporter.get(scoped(numbered(11)))).toMatchObject({
      thesesBacked: 1,
      earlySupportCount: 0,
    });
  });

  it("counts a repeat backing as volume, not as a new backer", async () => {
    await create(1n, 0n, alice);
    for (let position = 1; position <= 3; position++)
      await back(1n, numbered(position), tenth, position, [
        { to: alice, thesis: 1n, role: 0, amount: tenth },
      ]);
    await back(1n, numbered(2), MON, 2, [
      { to: alice, thesis: 1n, role: 0, amount: MON },
    ]);
    expect(await graph.ThesisBacking.get(key(1n))).toMatchObject({
      totalBacked: MON + 3n * tenth,
      backingCount: 4,
      backerCount: 3,
      earlyBackers: [numbered(1), numbered(2), numbered(3)],
    });
    expect(await graph.Supporter.get(scoped(numbered(2)))).toMatchObject({
      totalBacked: MON + tenth,
      backingCount: 2,
      thesesBacked: 1,
      earlySupportCount: 1,
    });
    const repeat = (await graph.Backing.getAll()).filter(
      (row) => row.backer === numbered(2),
    );
    expect(repeat.map((row) => row.firstByBacker).sort()).toEqual([
      false,
      true,
    ]);
    expect(await graph.BackingTotals.get(`10143:${registry}`)).toMatchObject({
      backingCount: 4,
      supporterCount: 3,
      thesesBacked: 1,
    });
  });

  it("counts distinct theses per supporter and distinct supporters overall", async () => {
    await create(1n, 0n, alice);
    await create(2n, 0n, carol);
    await back(1n, bob, MON, 1, [
      { to: alice, thesis: 1n, role: 0, amount: MON },
    ]);
    await back(2n, bob, tenth, 1, [
      { to: carol, thesis: 2n, role: 0, amount: tenth },
    ]);
    await back(2n, dave, tenth, 2, [
      { to: carol, thesis: 2n, role: 0, amount: tenth },
    ]);
    expect(await graph.Supporter.get(scoped(bob))).toMatchObject({
      totalBacked: MON + tenth,
      thesesBacked: 2,
      earlySupportCount: 2,
    });
    expect(await graph.BackingTotals.get(`10143:${registry}`)).toMatchObject({
      totalBacked: MON + 2n * tenth,
      supporterCount: 2,
      thesesBacked: 2,
    });
  });

  it("moves claimable balance to withdrawn and keeps earning afterwards", async () => {
    await threeLevels();
    await back(3n, dave, MON, 1, split);
    await withdraw(carol, 7n * tenth);
    expect(await graph.AuthorEarnings.get(scoped(carol))).toMatchObject({
      earnedAsAuthor: 7n * tenth,
      withdrawn: 7n * tenth,
      claimable: 0n,
    });
    expect(await graph.Withdrawal.getAll()).toMatchObject([
      { account: carol, amount: 7n * tenth, backingAddress: backing },
    ]);
    await back(3n, dave, MON, 1, split);
    expect(await graph.AuthorEarnings.get(scoped(carol))).toMatchObject({
      earnedAsAuthor: 14n * tenth,
      withdrawn: 7n * tenth,
      claimable: 7n * tenth,
    });
    expect(await graph.BackingTotals.get(`10143:${registry}`)).toMatchObject({
      totalWithdrawn: 7n * tenth,
    });
  });

  it("rejects a withdrawal the indexed credits cannot cover", async () => {
    await create(1n, 0n, alice);
    await back(1n, bob, tenth, 1, [
      { to: alice, thesis: 1n, role: 0, amount: tenth },
    ]);
    await expect(withdraw(alice, MON)).rejects.toThrow();
    await expect(withdraw(carol, tenth)).rejects.toThrow();
  });

  it("pairs each backing contract with its own registry", async () => {
    await create(1n, 0n, alice);
    await create(1n, 0n, bob, otherRegistry);
    await back(
      1n,
      carol,
      MON,
      1,
      [{ to: bob, thesis: 1n, role: 0, amount: MON }],
      otherBacking,
    );
    expect(await graph.ThesisBacking.get(key(1n))).toBeUndefined();
    expect(await graph.ThesisBacking.get(key(1n, otherRegistry))).toMatchObject(
      { registryAddress: otherRegistry, totalBacked: MON },
    );
    expect(
      await graph.AuthorEarnings.get(scoped(bob, otherRegistry)),
    ).toMatchObject({ earnedAsAuthor: MON });
    expect(await graph.AuthorEarnings.get(scoped(alice))).toBeUndefined();
    expect(
      await graph.BackingTotals.get(`10143:${otherRegistry}`),
    ).toMatchObject({ backingAddress: otherBacking });
  });

  it("rejects backing of a thesis the registry never created", async () => {
    await expect(
      back(9n, bob, MON, 1, [{ to: alice, thesis: 9n, role: 0, amount: MON }]),
    ).rejects.toThrow();
  });

  it("leaves fork and reputation aggregates untouched", async () => {
    await create(1n, 0n, alice);
    await create(2n, 1n, bob);
    const thesis = await graph.Thesis.get(key(1n));
    const stats = await graph.AuthorStats.get(scoped(alice));
    await back(2n, carol, MON, 1, [
      { to: bob, thesis: 2n, role: 0, amount: 8n * tenth },
      { to: alice, thesis: 1n, role: 1, amount: 2n * tenth },
    ]);
    expect(await graph.Thesis.get(key(1n))).toEqual(thesis);
    expect(await graph.AuthorStats.get(scoped(alice))).toEqual(stats);
    expect(await graph.Thesis.getAll()).toHaveLength(2);
  });
});
