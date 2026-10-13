import { z } from "zod";
import {
  thesisCoreSchema,
  thesisMetadataSchema,
  qualifyingForkChanges,
  type ThesisCore,
  type ThesisMetadata,
} from "./thesis.ts";
import {
  thesisIdentitySchema,
  addressSchema,
  uint64IdSchema,
} from "./namespace.ts";
import type {
  BackingRole,
  BackingSummary,
  EarningsSummary,
  LineageFlow,
  SupportSummary,
} from "./backing.ts";

export const graphThesisSchema = thesisIdentitySchema.extend({
  parentId: z.union([z.literal("0"), uint64IdSchema]),
  rootId: uint64IdSchema,
  depth: z.number().int().nonnegative(),
  author: addressSchema,
  core: thesisCoreSchema,
  contentHash: z.string().regex(/^0x[0-9a-f]{64}$/),
  createdAt: z.number().int().nonnegative(),
  blockNumber: z.string().regex(/^\d+$/),
  txHash: z.string().regex(/^0x[0-9a-f]{64}$/),
  executionRef: z
    .string()
    .regex(/^0x[0-9a-f]{64}$/)
    .nullable(),
  directForkCount: z.number().int().nonnegative(),
  uniqueExternalForkers: z.number().int().nonnegative(),
});
export type GraphThesis = z.output<typeof graphThesisSchema>;
export type AuthorIdentity = {
  handle: string;
  displayName: string;
  wallet: string;
  userId: string | null;
};
export type MetadataState =
  "trusted" | "missing" | "integrity-mismatch" | "hidden";
export type ForkDifference = {
  field: string;
  label: string;
  before: string;
  after: string;
  meaningful: boolean;
};
export function forkDifference(
  parent: { core: ThesisCore; metadata: ThesisMetadata },
  child: { core: ThesisCore; metadata: ThesisMetadata },
): ForkDifference[] {
  const a = thesisCoreSchema.parse(parent.core),
    b = thesisCoreSchema.parse(child.core),
    am = thesisMetadataSchema.parse(parent.metadata),
    bm = thesisMetadataSchema.parse(child.metadata);
  const meaningful = qualifyingForkChanges(parent, child);
  const pairs = [
    ["side", "Direction", a.side, b.side],
    ["targetPriceE8", "Target", a.targetPriceE8, b.targetPriceE8],
    [
      "invalidationPriceE8",
      "Invalidation",
      a.invalidationPriceE8,
      b.invalidationPriceE8,
    ],
    ["leverageBps", "Leverage", String(a.leverageBps), String(b.leverageBps)],
    ["reasoning", "Reasoning", am.reasoning, bm.reasoning],
    ["entryNote", "Entry note", am.entryNote ?? "none", bm.entryNote ?? "none"],
    ["tags", "Tags", am.tags.join(", "), bm.tags.join(", ")],
  ] as const;
  return pairs
    .filter(([, , before, after]) => before !== after)
    .map(([field, label, before, after]) => ({
      field,
      label,
      before,
      after,
      meaningful: meaningful.includes(field),
    }));
}
export type FeedThesis = {
  graph: GraphThesis;
  author: AuthorIdentity;
  metadata: ThesisMetadata | null;
  metadataState: MetadataState;
  parent: { thesisId: string; author: AuthorIdentity } | null;
  changes: ForkDifference[];
  challenge: boolean;
  social: { agrees: number; comments: number };
  backing: BackingSummary;
  // Up to three of the first backers, as people. Absent in older responses.
  firstBackers?: AuthorIdentity[];
  // What backing of this idea's forks has sent back to it, in wei.
  arrivedFromForksWei?: string;
  execution: {
    state: "not-executed" | "attested" | "verified";
    position: "unknown" | "open" | "closed";
  };
  provenance: {
    graph: "envio" | "envio-test";
    metadata: "postgres";
    verification: "postgres";
    enrichment: "absent";
  };
};
export type CommentView = {
  id: string;
  author: AuthorIdentity;
  body: string;
  createdAt: string;
};
export type ThesisDetail = FeedThesis & {
  comments: CommentView[];
  commentsHasMore: boolean;
  children: FeedThesis[];
};
export type ThesisTree = {
  rootId: string;
  selectedId: string;
  nodes: FeedThesis[];
  truncated: boolean;
  ancestors: string[];
  // Value that backing has sent between theses of this tree.
  flows: LineageFlow[];
};
/** Everything the Back sheet and a thesis's backing panel need. */
export type ThesisBackingView = {
  thesisId: string;
  // Null while backing is not live in this deployment.
  contract: { address: string; chainId: number } | null;
  // Who a backing of this thesis is split between, nearest first.
  lineage: { role: BackingRole; thesisId: string; author: AuthorIdentity }[];
  summary: BackingSummary;
  earlyBackers: AuthorIdentity[];
  recent: {
    txHash: string;
    backer: AuthorIdentity;
    amountWei: string;
    position: number;
    early: boolean;
    timestamp: number;
  }[];
  // Where this thesis's backing went, and what its forks' backing sent back.
  sent: LineageFlow[];
  received: LineageFlow[];
};
export type ReputationCounts = {
  eligibleRoots: number;
  successfulRoots: number;
  eligibleForks: number;
  successfulForks: number;
  influence: number;
  executionsInspired: number;
};
export function reputation(counts: ReputationCounts) {
  for (const value of Object.values(counts))
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error("Invalid reputation count.");
  if (
    counts.successfulRoots > counts.eligibleRoots ||
    counts.successfulForks > counts.eligibleForks
  )
    throw new Error("Successful sample exceeds eligible sample.");
  const ratio = (successful: number, eligible: number) => ({
    label:
      eligible < 3
        ? "Emerging"
        : `${Math.round((successful / eligible) * 100)}%`,
    successful,
    eligible,
    percentage: eligible < 3 ? null : (successful / eligible) * 100,
  });
  return {
    ...counts,
    originality: ratio(counts.successfulRoots, counts.eligibleRoots),
    contribution: ratio(counts.successfulForks, counts.eligibleForks),
  };
}
export type ProfileSummary = {
  identity: AuthorIdentity;
  bio: string | null;
  reputation: ReturnType<typeof reputation>;
  earnings: EarningsSummary;
  support: SupportSummary;
  // Where claimable earnings are withdrawn from; null while backing is not live.
  backingContract: string | null;
  // Value that backing of other people's forks sent to this author, per fork.
  forkEarnings?: {
    thesisId: string;
    author: AuthorIdentity;
    amountWei: string;
  }[];
  recent: FeedThesis[];
  scope: { chainId: number; registryAddress: string; wallet: string };
};
export type FeedMode = "fresh" | "most-forked" | "smart-signal";
export function recentExternalForkers(
  thesis: GraphThesis,
  nodes: GraphThesis[],
  since: number,
): number {
  return new Set(
    nodes
      .filter(
        (n) =>
          n.chainId === thesis.chainId &&
          n.registryAddress === thesis.registryAddress &&
          n.parentId === thesis.thesisId &&
          n.author !== thesis.author &&
          n.createdAt >= since,
      )
      .map((n) => n.author),
  ).size;
}
export function rankFeed(
  items: FeedThesis[],
  activity: GraphThesis[],
  mode: FeedMode,
  now: number,
): FeedThesis[] {
  const key = (n: FeedThesis) =>
    [
      recentExternalForkers(n.graph, activity, now - 86400),
      recentExternalForkers(n.graph, activity, now - 604800),
      n.graph.createdAt,
      BigInt(n.graph.thesisId),
    ] as const;
  // Smart Signal's Phase 2 social-only baseline deliberately equals Most Forked. No undocumented weights.
  return [...items].sort((a, b) => {
    const ak = key(a),
      bk = key(b);
    for (const i of mode === "fresh" ? [2, 3] : [0, 1, 2, 3]) {
      const av = ak[i]!,
        bv = bk[i]!;
      if (av !== bv) return av > bv ? -1 : 1;
    }
    return 0;
  });
}
