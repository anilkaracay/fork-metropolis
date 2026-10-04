import { beforeEach, describe, expect, it } from "vitest";
import { createTestIndexer } from "envio";
const registry = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const alice = "0x1111111111111111111111111111111111111111" as const;
const bob = "0x2222222222222222222222222222222222222222" as const;
const carol = "0x3333333333333333333333333333333333333333" as const;
const hash = `0x${"ab".repeat(32)}`;
const key = (id: bigint) => `10143:${registry}:${id}`;
let block = 0;
let graph: ReturnType<typeof createTestIndexer>;
beforeEach(() => {
  graph = createTestIndexer();
  block = 0;
});
async function create(
  id: bigint,
  parent = 0n,
  author: typeof alice | typeof bob | typeof carol = alice,
  address: typeof registry | `0x${string}` = registry,
) {
  await graph.process({
    chains: {
      10143: {
        simulate: [
          {
            contract: "FORKRegistry",
            event: "ThesisCreated",
            srcAddress: address,
            block: { number: ++block, hash },
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
const stats = (wallet: string) =>
  graph.AuthorStats.get(`10143:${registry}:${wallet}`);
describe("real Envio handler state", () => {
  it("indexes a root, its namespace, transaction and block", async () => {
    await create(1n);
    expect(await graph.Thesis.get(key(1n))).toMatchObject({
      rootId: 1n,
      parentId: 0n,
      depth: 0,
      author: alice,
      txHash: hash,
      blockHash: hash,
    });
    expect(await stats(alice)).toMatchObject({
      eligibleRoots: 1,
      eligibleForks: 0,
      influence: 0,
    });
  });
  it("keeps root and depth through four levels", async () => {
    await create(1n);
    for (let id = 2n; id <= 5n; id++)
      await create(id, id - 1n, id % 2n ? alice : bob);
    expect(await graph.Thesis.get(key(5n))).toMatchObject({
      rootId: 1n,
      parentId: 4n,
      depth: 4,
    });
    expect(await graph.ForkEdge.get(key(5n))).toMatchObject({
      parentId: 4n,
      childId: 5n,
      parentAuthor: bob,
      childAuthor: alice,
    });
  });
  it("does not award success or influence for self forks", async () => {
    await create(1n);
    await create(2n, 1n);
    expect(await stats(alice)).toMatchObject({
      eligibleRoots: 1,
      eligibleForks: 1,
      successfulRoots: 0,
      influence: 0,
    });
    expect(await graph.Thesis.get(key(1n))).toMatchObject({
      directForkCount: 1,
      uniqueExternalForkers: 0,
    });
  });
  it("counts repeated external wallets once and two distinct wallets exactly", async () => {
    await create(1n);
    await create(2n, 1n, bob);
    await create(3n, 1n, bob);
    await create(4n, 1n, carol);
    expect(await stats(alice)).toMatchObject({
      successfulRoots: 1,
      influence: 2,
    });
    expect(await graph.Thesis.get(key(1n))).toMatchObject({
      directForkCount: 3,
      uniqueExternalForkers: 2,
    });
    expect(await graph.ThesisExternalForker.getAll()).toHaveLength(2);
  });
  it("awards contribution when an authored fork receives an external fork", async () => {
    await create(1n);
    await create(2n, 1n, bob);
    await create(3n, 2n, carol);
    expect(await stats(bob)).toMatchObject({
      eligibleForks: 1,
      successfulForks: 1,
      influence: 1,
    });
  });
  it("deduplicates influence across multiple authored roots", async () => {
    await create(1n);
    await create(2n);
    await create(3n, 1n, bob);
    await create(4n, 2n, bob);
    expect(await stats(alice)).toMatchObject({
      eligibleRoots: 2,
      successfulRoots: 2,
      influence: 1,
    });
  });
  it("replaying a creation does not double-count entities or aggregates", async () => {
    await create(1n);
    await create(2n, 1n, bob);
    await create(2n, 1n, bob);
    expect(await graph.Thesis.getAll()).toHaveLength(2);
    expect(await graph.ForkEdge.getAll()).toHaveLength(1);
    expect(await stats(alice)).toMatchObject({
      successfulRoots: 1,
      influence: 1,
    });
  });
  it("keeps the same thesis ID separate between registries", async () => {
    await create(1n);
    const other = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;
    await create(1n, 0n, bob, other);
    expect(await graph.Thesis.getAll()).toHaveLength(2);
    expect(await graph.Thesis.get(`10143:${other}:1`)).toMatchObject({
      author: bob,
    });
  });
  it("indexes an execution link replay-safely without verified status", async () => {
    await create(1n);
    const event = {
      contract: "FORKRegistry",
      event: "ExecutionLinked",
      srcAddress: registry,
      block: { number: 10 },
      transaction: { hash },
      params: { thesisId: 1n, author: alice, executionRef: hash },
    } as const;
    await graph.process({ chains: { 10143: { simulate: [event] } } });
    await graph.process({
      chains: { 10143: { simulate: [{ ...event, block: { number: 11 } }] } },
    });
    expect(await graph.Thesis.get(key(1n))).toMatchObject({
      executionRef: hash,
    });
    const s = await stats(alice);
    expect(s).toMatchObject({ linkedExecutionCount: 1 });
    expect(s).not.toHaveProperty("executionsInspired");
    expect(await graph.ExecutionLink.getAll()).toHaveLength(1);
  });
  it("rejects an orphan fork instead of inventing its ancestry", async () => {
    await expect(create(2n, 1n, bob)).rejects.toThrow();
  });
  it("retains exact aggregates for twenty descendants", async () => {
    await create(1n);
    for (let id = 2n; id <= 22n; id++)
      await create(id, 1n, id % 2n ? bob : carol);
    expect(await graph.Thesis.getAll()).toHaveLength(22);
    expect(await graph.Thesis.get(key(1n))).toMatchObject({
      directForkCount: 21,
      uniqueExternalForkers: 2,
    });
  });
  it("preserves uint32 market/leverage boundaries without signed-Int overflow", async () => {
    await graph.process({
      chains: {
        10143: {
          simulate: [
            {
              contract: "FORKRegistry",
              event: "ThesisCreated",
              srcAddress: registry,
              block: { number: 1, hash },
              transaction: { hash },
              params: {
                thesisId: 1n,
                parentId: 0n,
                author: alice,
                marketId: 4294967295n,
                side: 1n,
                leverageBps: 4294967295n,
                targetPriceE8: 1n,
                invalidationPriceE8: 2n,
                contentHash: hash,
                createdAt: 1n,
              },
            },
          ],
        },
      },
    });
    expect(await graph.Thesis.get(key(1n))).toMatchObject({
      marketId: 4294967295n,
      leverageBps: 4294967295n,
    });
  });
});
