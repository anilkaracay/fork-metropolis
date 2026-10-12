import {
  indexer,
  type AuthorEarnings,
  type BackingTotals,
  type Supporter,
  type ThesisBacking,
} from "envio";
import { namespace, thesisKey } from "./registry.ts";

type Origin = ReturnType<typeof origin>;

// Each FORKBacking contract reads exactly one registry. Both are listed in the same
// order in config.yaml, so position pairs a backing address with its registry.
function registryOf(chainId: 10143, backingAddress: string) {
  const { FORKBacking, FORKRegistry } = indexer.chains[chainId];
  const registry =
    FORKRegistry.addresses[
      FORKBacking.addresses.findIndex(
        (address) => address.toLowerCase() === backingAddress,
      )
    ];
  if (
    !registry ||
    FORKBacking.addresses.length !== FORKRegistry.addresses.length
  )
    throw new Error("FORKBacking address has no paired registry in config.");
  return registry.toLowerCase();
}

// Backing entities live in the registry namespace so they join the thesis graph directly.
function origin(event: {
  chainId: 10143;
  srcAddress: string;
  logIndex: number;
  block: { number: number; timestamp: number };
  transaction: { hash: string };
}) {
  const backingAddress = event.srcAddress.toLowerCase();
  const registryAddress = registryOf(event.chainId, backingAddress);
  return {
    chainId: event.chainId,
    registryAddress,
    backingAddress,
    scope: namespace(event.chainId, registryAddress),
    eventId: `${event.chainId}:${event.block.number}:${event.logIndex}`,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    txHash: event.transaction.hash,
    logIndex: event.logIndex,
  };
}
const thesisBackingEmpty = (
  at: Origin,
  id: string,
  thesisId: bigint,
): ThesisBacking => ({
  id,
  chainId: at.chainId,
  registryAddress: at.registryAddress,
  thesis_id: id,
  thesisId,
  totalBacked: 0n,
  backingCount: 0,
  backerCount: 0,
  earlyBackers: [],
  firstBackedAt: at.timestamp,
  lastBackedAt: at.timestamp,
});
const supporterEmpty = (at: Origin, wallet: string): Supporter => ({
  id: `${at.scope}:${wallet}`,
  chainId: at.chainId,
  registryAddress: at.registryAddress,
  wallet,
  totalBacked: 0n,
  backingCount: 0,
  thesesBacked: 0,
  earlySupportCount: 0,
  firstBackedAt: at.timestamp,
  lastBackedAt: at.timestamp,
});
const earningsEmpty = (at: Origin, wallet: string): AuthorEarnings => ({
  id: `${at.scope}:${wallet}`,
  chainId: at.chainId,
  registryAddress: at.registryAddress,
  wallet,
  earnedAsAuthor: 0n,
  earnedFromForks: 0n,
  withdrawn: 0n,
  claimable: 0n,
  creditCount: 0,
  lastCreditedAt: 0n,
});
const totalsEmpty = (at: Origin): BackingTotals => ({
  id: at.scope,
  chainId: at.chainId,
  registryAddress: at.registryAddress,
  backingAddress: at.backingAddress,
  totalBacked: 0n,
  backingCount: 0,
  supporterCount: 0,
  thesesBacked: 0,
  sentToAncestors: 0n,
  totalWithdrawn: 0n,
  lastActivityAt: 0n,
});

indexer.onEvent(
  {
    contract: "FORKBacking",
    event: "Backed",
    fields: { transaction: ["hash"], block: ["timestamp"] },
  },
  async ({ event, context }) => {
    const at = origin(event),
      p = event.params,
      backer = p.backer.toLowerCase();
    const thesis = await context.Thesis.getOrThrow(
      thesisKey(at.chainId, at.registryAddress, p.thesisId),
    );
    const received =
      (await context.ThesisBacking.get(thesis.id)) ??
      thesisBackingEmpty(at, thesis.id, p.thesisId);
    const known = await context.Supporter.get(`${at.scope}:${backer}`);
    const supporter = known ?? supporterEmpty(at, backer);
    const totals =
      (await context.BackingTotals.get(at.scope)) ?? totalsEmpty(at);
    // The contract numbers distinct backers in arrival order, so a position
    // past the indexed count is this wallet's first backing of the thesis.
    const position = Number(p.backerIndex);
    const firstByBacker = position > received.backerCount;
    const newlyEarly = firstByBacker && p.early;

    context.Backing.set({
      id: at.eventId,
      chainId: at.chainId,
      registryAddress: at.registryAddress,
      backingAddress: at.backingAddress,
      thesis_id: thesis.id,
      thesisBacking_id: thesis.id,
      supporter_id: supporter.id,
      thesisId: p.thesisId,
      backer,
      amount: p.amount,
      backerIndex: position,
      early: p.early,
      firstByBacker,
      timestamp: at.timestamp,
      blockNumber: at.blockNumber,
      txHash: at.txHash,
      logIndex: at.logIndex,
    });
    context.ThesisBacking.set({
      ...received,
      totalBacked: received.totalBacked + p.amount,
      backingCount: received.backingCount + 1,
      backerCount: firstByBacker ? position : received.backerCount,
      earlyBackers: newlyEarly
        ? [...received.earlyBackers, backer]
        : received.earlyBackers,
      lastBackedAt: at.timestamp,
    });
    context.Supporter.set({
      ...supporter,
      totalBacked: supporter.totalBacked + p.amount,
      backingCount: supporter.backingCount + 1,
      thesesBacked: supporter.thesesBacked + (firstByBacker ? 1 : 0),
      earlySupportCount: supporter.earlySupportCount + (newlyEarly ? 1 : 0),
      lastBackedAt: at.timestamp,
    });
    context.BackingTotals.set({
      ...totals,
      totalBacked: totals.totalBacked + p.amount,
      backingCount: totals.backingCount + 1,
      supporterCount: totals.supporterCount + (known ? 0 : 1),
      thesesBacked: totals.thesesBacked + (received.backingCount ? 0 : 1),
      lastActivityAt: at.timestamp,
    });
  },
);

indexer.onEvent(
  {
    contract: "FORKBacking",
    event: "Credited",
    fields: { transaction: ["hash"], block: ["timestamp"] },
  },
  async ({ event, context }) => {
    const at = origin(event),
      p = event.params,
      recipient = p.recipient.toLowerCase(),
      role = Number(p.role);
    const sourceId = thesisKey(
      at.chainId,
      at.registryAddress,
      p.sourceThesisId,
    );
    const creditedId = thesisKey(
      at.chainId,
      at.registryAddress,
      p.creditedThesisId,
    );
    const earnings =
      (await context.AuthorEarnings.get(`${at.scope}:${recipient}`)) ??
      earningsEmpty(at, recipient);

    context.Credit.set({
      id: at.eventId,
      chainId: at.chainId,
      registryAddress: at.registryAddress,
      backingAddress: at.backingAddress,
      sourceThesis_id: sourceId,
      creditedThesis_id: creditedId,
      sourceThesisId: p.sourceThesisId,
      creditedThesisId: p.creditedThesisId,
      recipient,
      role,
      amount: p.amount,
      timestamp: at.timestamp,
      blockNumber: at.blockNumber,
      txHash: at.txHash,
      logIndex: at.logIndex,
    });
    // Role 0 is the backed thesis's own author. Roles 1 and 2 are ancestors, and the
    // contract never credits one address in two roles, so a self-fork earns nothing here.
    context.AuthorEarnings.set({
      ...earnings,
      earnedAsAuthor: earnings.earnedAsAuthor + (role === 0 ? p.amount : 0n),
      earnedFromForks: earnings.earnedFromForks + (role === 0 ? 0n : p.amount),
      claimable: earnings.claimable + p.amount,
      creditCount: earnings.creditCount + 1,
      lastCreditedAt: at.timestamp,
    });
    if (role === 0) return;

    const flowId = `${sourceId}:${p.creditedThesisId}`;
    const flow = await context.LineageFlow.get(flowId);
    context.LineageFlow.set({
      id: flowId,
      chainId: at.chainId,
      registryAddress: at.registryAddress,
      sourceThesis_id: sourceId,
      creditedThesis_id: creditedId,
      sourceThesisId: p.sourceThesisId,
      creditedThesisId: p.creditedThesisId,
      recipient,
      role,
      amount: (flow?.amount ?? 0n) + p.amount,
      creditCount: (flow?.creditCount ?? 0) + 1,
      lastCreditedAt: at.timestamp,
    });
    // A Backed event always precedes its credits, so the totals row exists.
    const totals = await context.BackingTotals.getOrThrow(at.scope);
    context.BackingTotals.set({
      ...totals,
      sentToAncestors: totals.sentToAncestors + p.amount,
    });
  },
);

indexer.onEvent(
  {
    contract: "FORKBacking",
    event: "Withdrawn",
    fields: { transaction: ["hash"], block: ["timestamp"] },
  },
  async ({ event, context }) => {
    const at = origin(event),
      p = event.params,
      account = p.account.toLowerCase();
    const earnings = await context.AuthorEarnings.getOrThrow(
      `${at.scope}:${account}`,
    );
    if (earnings.claimable < p.amount)
      throw new Error(
        "Withdrawal exceeds the credits indexed for this account.",
      );
    const totals = await context.BackingTotals.getOrThrow(at.scope);

    context.Withdrawal.set({
      id: at.eventId,
      chainId: at.chainId,
      registryAddress: at.registryAddress,
      backingAddress: at.backingAddress,
      account,
      amount: p.amount,
      timestamp: at.timestamp,
      blockNumber: at.blockNumber,
      txHash: at.txHash,
      logIndex: at.logIndex,
    });
    context.AuthorEarnings.set({
      ...earnings,
      withdrawn: earnings.withdrawn + p.amount,
      claimable: earnings.claimable - p.amount,
    });
    context.BackingTotals.set({
      ...totals,
      totalWithdrawn: totals.totalWithdrawn + p.amount,
      lastActivityAt: at.timestamp,
    });
  },
);
