import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  jsonb,
  boolean,
  primaryKey,
  unique,
  uniqueIndex,
  index,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";

const date = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });
const audit = () => ({
  createdAt: date("created_at").defaultNow().notNull(),
  updatedAt: date("updated_at").defaultNow().notNull(),
});
const namespace = () => ({
  chainId: bigint("chain_id", { mode: "number" }).notNull(),
  registryAddress: text("registry_address").notNull(),
  thesisId: numeric("thesis_id", { precision: 20, scale: 0 }).notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    privyDid: text("privy_did").notNull().unique(),
    handle: text("handle").notNull().unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    primaryWallet: text("primary_wallet"),
    ...audit(),
  },
  (t) => [
    check("handle_format", sql`${t.handle} ~ '^[a-z0-9_]{3,24}$'`),
    check("bio_length", sql`${t.bio} IS NULL OR char_length(${t.bio}) <= 160`),
  ],
);

export const wallets = pgTable(
  "wallets",
  {
    address: text("address").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(),
    ...audit(),
  },
  (t) => [
    unique("wallet_owner_pair").on(t.userId, t.address),
    check(
      "wallet_address_format",
      sql`${t.address} ~ '^0x[0-9a-f]{40}$' AND ${t.address} <> '0x0000000000000000000000000000000000000000'`,
    ),
    check("wallet_kind", sql`${t.kind} IN ('embedded', 'external')`),
    index("wallet_user_idx").on(t.userId),
  ],
);

export const metadata = pgTable(
  "thesis_metadata",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: bigint("chain_id", { mode: "number" }).notNull(),
    registryAddress: text("registry_address").notNull(),
    thesisId: numeric("thesis_id", { precision: 20, scale: 0 }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id),
    authorWallet: text("author_wallet").notNull(),
    parentId: numeric("parent_id", { precision: 20, scale: 0 }).notNull(),
    intent: jsonb("intent").$type<Record<string, unknown>>().notNull(),
    contentHash: text("content_hash").notNull(),
    reasoning: text("reasoning").notNull(),
    entryNote: text("entry_note"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: text("status").notNull().default("draft"),
    hidden: boolean("hidden").notNull().default(false),
    txHash: text("tx_hash"),
    requestKey: uuid("request_key").notNull(),
    expiresAt: date("expires_at").notNull(),
    finalizedAt: date("finalized_at"),
    ...audit(),
  },
  (t) => [
    unique("metadata_namespace").on(t.chainId, t.registryAddress, t.thesisId),
    unique("draft_idempotency").on(t.authorUserId, t.requestKey),
    unique("receipt_once").on(t.chainId, t.registryAddress, t.txHash),
    foreignKey({
      columns: [t.authorUserId, t.authorWallet],
      foreignColumns: [wallets.userId, wallets.address],
      name: "metadata_wallet_owner",
    }),
    check(
      "metadata_registry",
      sql`${t.chainId} > 0 AND ${t.registryAddress} ~ '^0x[0-9a-f]{40}$' AND ${t.registryAddress} <> '0x0000000000000000000000000000000000000000'`,
    ),
    check(
      "metadata_id_bounds",
      sql`(${t.thesisId} IS NULL OR ${t.thesisId} BETWEEN 1 AND 18446744073709551615) AND ${t.parentId} BETWEEN 0 AND 18446744073709551615`,
    ),
    check("metadata_hash", sql`${t.contentHash} ~ '^0x[0-9a-f]{64}$'`),
    check(
      "metadata_lengths",
      sql`char_length(${t.reasoning}) BETWEEN 10 AND 500 AND (${t.entryNote} IS NULL OR char_length(${t.entryNote}) <= 160) AND cardinality(${t.tags}) <= 3`,
    ),
    check(
      "metadata_state",
      sql`coalesce((${t.status} = 'draft' AND ${t.thesisId} IS NULL AND ${t.txHash} IS NULL AND ${t.finalizedAt} IS NULL) OR (${t.status} = 'finalized' AND ${t.thesisId} IS NOT NULL AND ${t.txHash} ~ '^0x[0-9a-f]{64}$' AND ${t.finalizedAt} IS NOT NULL), false)`,
    ),
    index("metadata_author_idx").on(t.authorUserId, t.createdAt),
    index("metadata_published_idx").on(t.status, t.hidden, t.finalizedAt),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...namespace(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    status: text("status").notNull().default("visible"),
    requestKey: uuid("request_key").notNull(),
    ...audit(),
  },
  (t) => [
    foreignKey({
      columns: [t.chainId, t.registryAddress, t.thesisId],
      foreignColumns: [
        metadata.chainId,
        metadata.registryAddress,
        metadata.thesisId,
      ],
      name: "comment_thesis_fk",
    }),
    unique("comment_idempotency").on(t.authorUserId, t.requestKey),
    check("comment_length", sql`char_length(${t.body}) BETWEEN 1 AND 280`),
    check("comment_status", sql`${t.status} IN ('visible','hidden','deleted')`),
    index("comment_thesis_idx").on(
      t.chainId,
      t.registryAddress,
      t.thesisId,
      t.createdAt,
    ),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    ...namespace(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull().default("agree"),
    createdAt: date("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.chainId, t.registryAddress, t.thesisId, t.userId, t.type],
    }),
    foreignKey({
      columns: [t.chainId, t.registryAddress, t.thesisId],
      foreignColumns: [
        metadata.chainId,
        metadata.registryAddress,
        metadata.thesisId,
      ],
      name: "reaction_thesis_fk",
    }),
    check("reaction_type", sql`${t.type} = 'agree'`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...namespace(),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    note: text("note"),
    status: text("status").notNull().default("open"),
    requestKey: uuid("request_key").notNull(),
    ...audit(),
  },
  (t) => [
    foreignKey({
      columns: [t.chainId, t.registryAddress, t.thesisId],
      foreignColumns: [
        metadata.chainId,
        metadata.registryAddress,
        metadata.thesisId,
      ],
      name: "report_thesis_fk",
    }),
    unique("report_idempotency").on(t.reporterUserId, t.requestKey),
    unique("report_once").on(
      t.chainId,
      t.registryAddress,
      t.thesisId,
      t.reporterUserId,
    ),
    check(
      "report_reason",
      sql`${t.reason} IN ('spam','abuse','misinformation','other')`,
    ),
    check(
      "report_note",
      sql`${t.note} IS NULL OR char_length(${t.note}) <= 280`,
    ),
    check(
      "report_status",
      sql`${t.status} IN ('open','reviewed','dismissed','actioned')`,
    ),
    index("reports_open_idx").on(t.status, t.createdAt),
  ],
);

export const executions = pgTable(
  "execution_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...namespace(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    walletAddress: text("wallet_address").notNull(),
    verificationStatus: text("verification_status")
      .notNull()
      .default("attested"),
    positionState: text("position_state").notNull().default("unknown"),
    executionRef: text("execution_ref"),
    fillIdentity: text("fill_identity"),
    exchangeAddress: text("exchange_address"),
    instanceId: integer("instance_id"),
    accountId: numeric("account_id", { precision: 20, scale: 0 }),
    orderId: numeric("order_id", { precision: 20, scale: 0 }),
    marketId: integer("market_id"),
    transactionHash: text("transaction_hash"),
    logIndex: integer("log_index"),
    evidence: jsonb("evidence"),
    verifiedAt: date("verified_at"),
    ...audit(),
  },
  (t) => [
    foreignKey({
      columns: [t.chainId, t.registryAddress, t.thesisId],
      foreignColumns: [
        metadata.chainId,
        metadata.registryAddress,
        metadata.thesisId,
      ],
      name: "execution_thesis_fk",
    }),
    foreignKey({
      columns: [t.userId, t.walletAddress],
      foreignColumns: [wallets.userId, wallets.address],
      name: "execution_wallet_fk",
    }),
    unique("execution_per_thesis").on(t.chainId, t.registryAddress, t.thesisId),
    uniqueIndex("fill_identity_once").on(t.fillIdentity),
    check(
      "execution_reference_format",
      sql`${t.executionRef} IS NULL OR ${t.executionRef} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check(
      "position_state",
      sql`${t.positionState} IN ('unknown','open','closed')`,
    ),
    check(
      "verified_evidence_required",
      sql`coalesce((${t.verificationStatus} = 'attested' AND ${t.fillIdentity} IS NULL AND ${t.exchangeAddress} IS NULL AND ${t.instanceId} IS NULL AND ${t.accountId} IS NULL AND ${t.orderId} IS NULL AND ${t.marketId} IS NULL AND ${t.transactionHash} IS NULL AND ${t.logIndex} IS NULL AND ${t.evidence} IS NULL AND ${t.verifiedAt} IS NULL AND ${t.positionState} = 'unknown') OR (${t.verificationStatus} = 'verified' AND ${t.fillIdentity} ~ '^0x[0-9a-f]{64}$' AND ${t.exchangeAddress} ~ '^0x[0-9a-f]{40}$' AND ${t.instanceId} > 0 AND ${t.accountId} BETWEEN 1 AND 18446744073709551615 AND ${t.orderId} BETWEEN 1 AND 18446744073709551615 AND ${t.marketId} > 0 AND ${t.transactionHash} ~ '^0x[0-9a-f]{64}$' AND ${t.logIndex} >= 0 AND ${t.executionRef} IS NOT NULL AND ${t.evidence} IS NOT NULL AND ${t.verifiedAt} IS NOT NULL), false)`,
    ),
  ],
);

export const rateBuckets = pgTable(
  "rate_buckets",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    windowStart: date("window_start").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.action, t.windowStart] }),
    check("rate_count_positive", sql`${t.count} > 0`),
    index("rate_cleanup_idx").on(t.windowStart),
  ],
);

// Permitted external context only; this table never contributes to native reputation.
export const walletContext = pgTable("wallet_context_cache", {
  key: text("key").primaryKey(),
  walletAddress: text("wallet_address")
    .notNull()
    .references(() => wallets.address),
  value: jsonb("value").$type<Record<string, unknown>>(),
  expiresAt: date("expires_at").notNull(),
  leaseId: uuid("lease_id"),
  leaseExpiresAt: date("lease_expires_at"),
  ...audit(),
});
