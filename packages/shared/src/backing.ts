import abi from "./abi/FORKBacking.json" with { type: "json" };
import { encodeFunctionData, type Abi, type Hex } from "viem";

// Generated from the tested Solidity artifact; pnpm abi:check prevents drift.
export const forkBackingAbi: Abi = abi as Abi;

export const MIN_BACKING_WEI = 10n ** 16n; // 0.01 MON, FORKBacking.MIN_BACKING
export const EARLY_BACKER_LIMIT = 10;
export const BACKING_PRESETS_MON = ["0.05", "0.1", "0.25"] as const;
const PARENT_SHARE_BPS = 2_000n;
const GRANDPARENT_SHARE_BPS = 1_000n;

export type BackingRole = 0 | 1 | 2; // author, parent, grandparent
export type BackingLineage = {
  thesisId: string;
  author: string;
  parent?: { thesisId: string; author: string } | null | undefined;
  grandparent?: { thesisId: string; author: string } | null | undefined;
};
export type BackingCredit = {
  recipient: string;
  creditedThesisId: string;
  role: BackingRole;
  amount: bigint;
};

/**
 * The credits FORKBacking records for one backing, in the order it emits them.
 * Mirrors the contract's split: the author keeps whatever is not owed to a different
 * ancestor, and one address is credited once, in its nearest role.
 */
export function splitBacking(
  lineage: BackingLineage,
  amount: bigint,
): BackingCredit[] {
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const credits: BackingCredit[] = [
    {
      recipient: lineage.author,
      creditedThesisId: lineage.thesisId,
      role: 0,
      amount,
    },
  ];
  const { parent, grandparent } = lineage;
  if (!parent) return credits;
  if (!same(parent.author, lineage.author)) {
    const share = (amount * PARENT_SHARE_BPS) / 10_000n;
    credits[0]!.amount -= share;
    credits.push({
      recipient: parent.author,
      creditedThesisId: parent.thesisId,
      role: 1,
      amount: share,
    });
  }
  if (!grandparent || same(grandparent.author, lineage.author)) return credits;
  const share = (amount * GRANDPARENT_SHARE_BPS) / 10_000n;
  credits[0]!.amount -= share;
  if (same(grandparent.author, parent.author)) credits[1]!.amount += share;
  else
    credits.push({
      recipient: grandparent.author,
      creditedThesisId: grandparent.thesisId,
      role: 2,
      amount: share,
    });
  return credits;
}

export const backCalldata = (thesisId: string): Hex =>
  encodeFunctionData({
    abi: forkBackingAbi,
    functionName: "back",
    args: [BigInt(thesisId)],
  });
export const withdrawCalldata = (): Hex =>
  encodeFunctionData({ abi: forkBackingAbi, functionName: "withdraw" });

/** What a thesis has received. Amounts are wei as decimal strings. */
export type BackingSummary = {
  totalWei: string;
  backers: number;
  backings: number;
  earlyBackers: string[];
  lastBackedAt: number | null;
};
export const noBacking: BackingSummary = {
  totalWei: "0",
  backers: 0,
  backings: 0,
  earlyBackers: [],
  lastBackedAt: null,
};
/** Value that backing of one thesis has sent to one ancestor thesis. */
export type LineageFlow = {
  sourceThesisId: string;
  creditedThesisId: string;
  recipient: string;
  role: 1 | 2;
  amountWei: string;
};
export type EarningsSummary = {
  earnedAsAuthorWei: string;
  earnedFromForksWei: string;
  withdrawnWei: string;
  claimableWei: string;
};
export type SupportSummary = {
  totalBackedWei: string;
  thesesBacked: number;
  earlySupportCount: number;
};
