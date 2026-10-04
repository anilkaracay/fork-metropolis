import { indexer, type AuthorStats, type MarketStats } from "envio";

export const namespace = (chain: number, registry: string) =>
  `${chain}:${registry.toLowerCase()}`;
export const thesisKey = (chain: number, registry: string, id: bigint) =>
  `${namespace(chain, registry)}:${id}`;
const authorEmpty = (
  chainId: number,
  registryAddress: string,
  address: string,
): AuthorStats => ({
  id: `${namespace(chainId, registryAddress)}:${address}`,
  chainId,
  registryAddress,
  address,
  eligibleRoots: 0,
  successfulRoots: 0,
  eligibleForks: 0,
  successfulForks: 0,
  influence: 0,
  linkedExecutionCount: 0,
});
const marketEmpty = (
  chainId: number,
  registryAddress: string,
  marketId: bigint,
): MarketStats => ({
  id: `${namespace(chainId, registryAddress)}:${marketId}`,
  chainId,
  registryAddress,
  marketId,
  thesisCount: 0,
  rootCount: 0,
  forkCount: 0,
  linkedExecutionCount: 0,
  latestActivityAt: 0n,
});

indexer.onEvent(
  {
    contract: "FORKRegistry",
    event: "ThesisCreated",
    fields: { transaction: ["hash"], block: ["hash"] },
  },
  async ({ event, context }) => {
    const p = event.params,
      chainId = event.chainId,
      registryAddress = event.srcAddress.toLowerCase(),
      author = p.author.toLowerCase();
    const id = thesisKey(chainId, registryAddress, p.thesisId);
    if (await context.Thesis.get(id)) return;
    const parent =
      p.parentId === 0n
        ? undefined
        : await context.Thesis.getOrThrow(
            thesisKey(chainId, registryAddress, p.parentId),
          );
    const a = authorEmpty(chainId, registryAddress, author),
      m = marketEmpty(chainId, registryAddress, p.marketId);
    const stats = (await context.AuthorStats.get(a.id)) ?? a,
      market = (await context.MarketStats.get(m.id)) ?? m;
    context.Thesis.set({
      id,
      chainId,
      registryAddress,
      thesisId: p.thesisId,
      parentId: p.parentId,
      rootId: parent?.rootId ?? p.thesisId,
      depth: parent ? parent.depth + 1 : 0,
      author,
      marketId: p.marketId,
      side: Number(p.side) === 0 ? "long" : "short",
      leverageBps: p.leverageBps,
      targetPriceE8: p.targetPriceE8,
      invalidationPriceE8: p.invalidationPriceE8,
      contentHash: p.contentHash.toLowerCase(),
      createdAt: p.createdAt,
      blockNumber: BigInt(event.block.number),
      blockHash: event.block.hash,
      txHash: event.transaction.hash,
      executionRef: undefined,
      directForkCount: 0,
      uniqueExternalForkers: 0,
    });
    context.AuthorStats.set({
      ...stats,
      eligibleRoots: stats.eligibleRoots + (parent ? 0 : 1),
      eligibleForks: stats.eligibleForks + (parent ? 1 : 0),
    });
    context.MarketStats.set({
      ...market,
      thesisCount: market.thesisCount + 1,
      rootCount: market.rootCount + (parent ? 0 : 1),
      forkCount: market.forkCount + (parent ? 1 : 0),
      latestActivityAt:
        p.createdAt > market.latestActivityAt
          ? p.createdAt
          : market.latestActivityAt,
    });
    if (!parent) return;
    context.ForkEdge.set({
      id,
      chainId,
      registryAddress,
      parentId: p.parentId,
      childId: p.thesisId,
      parentAuthor: parent.author,
      childAuthor: author,
      createdAt: p.createdAt,
    });
    const membershipId = `${parent.id}:${author}`;
    const existing =
      author === parent.author
        ? undefined
        : await context.ThesisExternalForker.get(membershipId);
    const isNewExternal = author !== parent.author && !existing;
    context.Thesis.set({
      ...parent,
      directForkCount: parent.directForkCount + 1,
      uniqueExternalForkers:
        parent.uniqueExternalForkers + (isNewExternal ? 1 : 0),
    });
    if (!isNewExternal) return;
    context.ThesisExternalForker.set({
      id: membershipId,
      thesisKey: parent.id,
      wallet: author,
      firstForkAt: p.createdAt,
    });
    const pa = authorEmpty(chainId, registryAddress, parent.author);
    const parentStats = await context.AuthorStats.getOrThrow(pa.id);
    const authorMembershipId = `${pa.id}:${author}`;
    const authorMembership =
      await context.AuthorExternalForker.get(authorMembershipId);
    if (!authorMembership)
      context.AuthorExternalForker.set({
        id: authorMembershipId,
        authorKey: pa.id,
        wallet: author,
      });
    const firstSuccess = parent.uniqueExternalForkers === 0;
    context.AuthorStats.set({
      ...parentStats,
      successfulRoots:
        parentStats.successfulRoots +
        (firstSuccess && parent.parentId === 0n ? 1 : 0),
      successfulForks:
        parentStats.successfulForks +
        (firstSuccess && parent.parentId !== 0n ? 1 : 0),
      influence: parentStats.influence + (authorMembership ? 0 : 1),
    });
  },
);

indexer.onEvent(
  {
    contract: "FORKRegistry",
    event: "ExecutionLinked",
    fields: { transaction: ["hash"] },
  },
  async ({ event, context }) => {
    const chainId = event.chainId,
      registryAddress = event.srcAddress.toLowerCase(),
      p = event.params;
    const id = thesisKey(chainId, registryAddress, p.thesisId);
    if (await context.ExecutionLink.get(id)) return;
    const thesis = await context.Thesis.getOrThrow(id);
    if (thesis.author !== p.author.toLowerCase())
      throw new Error("Execution author does not match canonical thesis.");
    const stats = await context.AuthorStats.getOrThrow(
      `${namespace(chainId, registryAddress)}:${thesis.author}`,
    );
    const market = await context.MarketStats.getOrThrow(
      `${namespace(chainId, registryAddress)}:${thesis.marketId}`,
    );
    context.ExecutionLink.set({
      id,
      chainId,
      registryAddress,
      thesisId: p.thesisId,
      author: thesis.author,
      executionRef: p.executionRef.toLowerCase(),
      blockNumber: BigInt(event.block.number),
      txHash: event.transaction.hash,
    });
    context.Thesis.set({
      ...thesis,
      executionRef: p.executionRef.toLowerCase(),
    });
    // This counter is explicitly a link count. Verification is application evidence, never inferred here.
    context.AuthorStats.set({
      ...stats,
      linkedExecutionCount: stats.linkedExecutionCount + 1,
    });
    context.MarketStats.set({
      ...market,
      linkedExecutionCount: market.linkedExecutionCount + 1,
    });
  },
);
