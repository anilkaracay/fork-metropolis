import { z } from "zod";
import {
  noBacking,
  type BackingSummary,
  type EarningsSummary,
  type LineageFlow,
  type SupportSummary,
} from "@fork/shared";
import { envioQuery } from "./graph";

/** One Backed event as the indexer recorded it. */
export type BackingEvent = {
  txHash: string;
  backer: string;
  amountWei: string;
  position: number;
  early: boolean;
  timestamp: number;
};
export type BackingTotals = {
  totalBackedWei: string;
  backings: number;
  supporters: number;
  thesesBacked: number;
  sentToAncestorsWei: string;
};
/** Reads of the backing graph, in the same namespace as the thesis graph. */
export interface BackingSource {
  /** Summaries for theses that have been backed; the rest are absent. */
  summaries(thesisIds: string[]): Promise<Map<string, BackingSummary>>;
  /** Latest backings of one thesis, newest first. */
  recent(thesisId: string, limit: number): Promise<BackingEvent[]>;
  /** Latest backings across every thesis, newest first. */
  latest(limit: number): Promise<(BackingEvent & { thesisId: string })[]>;
  /** Flows that start or end at any of these theses. */
  flows(thesisIds: string[]): Promise<LineageFlow[]>;
  earnings(wallet: string): Promise<EarningsSummary>;
  support(wallet: string): Promise<SupportSummary>;
  totals(): Promise<BackingTotals | null>;
}
export const noEarnings: EarningsSummary = {
  earnedAsAuthorWei: "0",
  earnedFromForksWei: "0",
  withdrawnWei: "0",
  claimableWei: "0",
};
export const noSupport: SupportSummary = {
  totalBackedWei: "0",
  thesesBacked: 0,
  earlySupportCount: 0,
};

// Wei amounts exceed double precision, so a number is accepted only while it is exact.
const wei = z
  .union([
    z.string().regex(/^\d+$/),
    z.number().int().nonnegative().refine(Number.isSafeInteger),
  ])
  .transform(String);
const count = z.number().int().nonnegative();
const id = z.union([z.string().regex(/^\d+$/), z.number()]).transform(String);
const seconds = z.union([z.string(), z.number()]).transform(Number);
const address = z.string().transform((value) => value.toLowerCase());

export const backingRows = {
  summary: z
    .object({
      thesisId: id,
      totalBacked: wei,
      backingCount: count,
      backerCount: count,
      earlyBackers: z.array(address),
      lastBackedAt: seconds,
    })
    .transform((row): [string, BackingSummary] => [
      row.thesisId,
      {
        totalWei: row.totalBacked,
        backers: row.backerCount,
        backings: row.backingCount,
        earlyBackers: row.earlyBackers,
        lastBackedAt: row.lastBackedAt,
      },
    ]),
  event: z
    .object({
      txHash: z.string(),
      backer: address,
      amount: wei,
      backerIndex: count,
      early: z.boolean(),
      timestamp: seconds,
    })
    .transform((row): BackingEvent => ({
      txHash: row.txHash,
      backer: row.backer,
      amountWei: row.amount,
      position: row.backerIndex,
      early: row.early,
      timestamp: row.timestamp,
    })),
  placedEvent: z
    .object({
      thesisId: id,
      txHash: z.string(),
      backer: address,
      amount: wei,
      backerIndex: count,
      early: z.boolean(),
      timestamp: seconds,
    })
    .transform((row): BackingEvent & { thesisId: string } => ({
      thesisId: row.thesisId,
      txHash: row.txHash,
      backer: row.backer,
      amountWei: row.amount,
      position: row.backerIndex,
      early: row.early,
      timestamp: row.timestamp,
    })),
  flow: z
    .object({
      sourceThesisId: id,
      creditedThesisId: id,
      recipient: address,
      role: z.union([z.literal(1), z.literal(2)]),
      amount: wei,
    })
    .transform((row): LineageFlow => ({
      sourceThesisId: row.sourceThesisId,
      creditedThesisId: row.creditedThesisId,
      recipient: row.recipient,
      role: row.role,
      amountWei: row.amount,
    })),
  earnings: z
    .object({
      earnedAsAuthor: wei,
      earnedFromForks: wei,
      withdrawn: wei,
      claimable: wei,
    })
    .transform((row): EarningsSummary => ({
      earnedAsAuthorWei: row.earnedAsAuthor,
      earnedFromForksWei: row.earnedFromForks,
      withdrawnWei: row.withdrawn,
      claimableWei: row.claimable,
    })),
  support: z
    .object({
      totalBacked: wei,
      thesesBacked: count,
      earlySupportCount: count,
    })
    .transform((row): SupportSummary => ({
      totalBackedWei: row.totalBacked,
      thesesBacked: row.thesesBacked,
      earlySupportCount: row.earlySupportCount,
    })),
  totals: z
    .object({
      totalBacked: wei,
      backingCount: count,
      supporterCount: count,
      thesesBacked: count,
      sentToAncestors: wei,
    })
    .transform((row): BackingTotals => ({
      totalBackedWei: row.totalBacked,
      backings: row.backingCount,
      supporters: row.supporterCount,
      thesesBacked: row.thesesBacked,
      sentToAncestorsWei: row.sentToAncestors,
    })),
};
const list = <T>(schema: z.ZodType<T>, value: unknown) =>
  z.array(schema).parse(value);

export function envioBacking(
  endpoint: string,
  chainId: number,
  registryAddress: string,
): BackingSource {
  const query = envioQuery(endpoint),
    base = {
      chainId: { _eq: chainId },
      registryAddress: { _eq: registryAddress },
    },
    scoped = (wallet: string) => `${chainId}:${registryAddress}:${wallet}`;
  return {
    async summaries(thesisIds) {
      if (!thesisIds.length) return new Map();
      const data = await query(
        `query Summaries($where: ThesisBacking_bool_exp!, $limit: Int!) { ThesisBacking(where: $where, limit: $limit) { thesisId totalBacked backingCount backerCount earlyBackers lastBackedAt } }`,
        {
          where: { ...base, thesisId: { _in: thesisIds } },
          limit: thesisIds.length,
        },
      );
      return new Map(list(backingRows.summary, data.ThesisBacking));
    },
    async recent(thesisId, limit) {
      const data = await query(
        `query Recent($where: Backing_bool_exp!, $limit: Int!) { Backing(where: $where, order_by: [{blockNumber: desc}, {logIndex: desc}], limit: $limit) { txHash backer amount backerIndex early timestamp } }`,
        { where: { ...base, thesisId: { _eq: thesisId } }, limit },
      );
      return list(backingRows.event, data.Backing);
    },
    async latest(limit) {
      const data = await query(
        `query Latest($where: Backing_bool_exp!, $limit: Int!) { Backing(where: $where, order_by: [{blockNumber: desc}, {logIndex: desc}], limit: $limit) { thesisId txHash backer amount backerIndex early timestamp } }`,
        { where: base, limit },
      );
      return list(backingRows.placedEvent, data.Backing);
    },
    async flows(thesisIds) {
      if (!thesisIds.length) return [];
      const data = await query(
        `query Flows($where: LineageFlow_bool_exp!) { LineageFlow(where: $where, limit: 1000) { sourceThesisId creditedThesisId recipient role amount } }`,
        {
          where: {
            ...base,
            _or: [
              { sourceThesisId: { _in: thesisIds } },
              { creditedThesisId: { _in: thesisIds } },
            ],
          },
        },
      );
      return list(backingRows.flow, data.LineageFlow);
    },
    async earnings(wallet) {
      const data = await query(
        `query Earnings($id: String!) { AuthorEarnings_by_pk(id: $id) { earnedAsAuthor earnedFromForks withdrawn claimable } }`,
        { id: scoped(wallet) },
      );
      return data.AuthorEarnings_by_pk
        ? backingRows.earnings.parse(data.AuthorEarnings_by_pk)
        : noEarnings;
    },
    async support(wallet) {
      const data = await query(
        `query Support($id: String!) { Supporter_by_pk(id: $id) { totalBacked thesesBacked earlySupportCount } }`,
        { id: scoped(wallet) },
      );
      return data.Supporter_by_pk
        ? backingRows.support.parse(data.Supporter_by_pk)
        : noSupport;
    },
    async totals() {
      const data = await query(
        `query Totals($id: String!) { BackingTotals_by_pk(id: $id) { totalBacked backingCount supporterCount thesesBacked sentToAncestors } }`,
        { id: `${chainId}:${registryAddress}` },
      );
      return data.BackingTotals_by_pk
        ? backingRows.totals.parse(data.BackingTotals_by_pk)
        : null;
    },
  };
}
export { noBacking };
