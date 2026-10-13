import { and, eq, inArray, desc, or, sql } from "drizzle-orm";
import { schema, type Database } from "@fork/db";
import { z } from "zod";
import {
  thesisSchema,
  forkSchema,
  forkModificationSchema,
  thesisCoreSchema,
  thesisMetadataSchema,
  thesisContentHash,
  forkDifference,
  rankFeed,
  reputation,
  handleProblem,
  handleSchema,
  isGeneratedHandle,
  normalizeHandle,
  noBacking,
  type BackingRole,
  type BackingSummary,
  type LineageFlow,
  type ThesisBackingView,
  type GraphThesis,
  type FeedThesis,
  type FeedMode,
  type ThesisDetail,
  type ThesisTree,
  type AuthorIdentity,
  type ProfileSummary,
} from "@fork/shared";
import type { Session } from "./auth";
import type { GraphSource } from "./graph";
import { noEarnings, noSupport, type BackingSource } from "./backing";
import {
  validateCreation,
  type PublishIntent,
  type ReceiptSource,
} from "./receipt";
import { AppError, assert } from "./errors";

const m = schema.metadata;
const keySchema = z.string().uuid();
export const draftInputSchema = z
  .object({
    parentId: z.string().regex(/^(0|[1-9]\d{0,19})$/),
    core: thesisCoreSchema,
    metadata: thesisMetadataSchema,
    requestKey: keySchema,
  })
  .strict();
export const commentInputSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1)
      .max(280)
      .refine((v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)),
    requestKey: keySchema,
  })
  .strict();
export const reportInputSchema = z
  .object({
    reason: z.enum(["spam", "abuse", "misinformation", "other"]),
    note: z.string().trim().max(280).optional(),
    requestKey: keySchema,
  })
  .strict();
type MetadataRow = typeof m.$inferSelect;
export class SocialCore {
  constructor(
    public readonly db: Database,
    public readonly graph: GraphSource,
    public readonly receipts: ReceiptSource,
    public readonly namespace: { chainId: number; registryAddress: string },
    public readonly marketIds: () => Promise<number[]>,
    public readonly adminDids: ReadonlySet<string> = new Set(),
    // Null until FORKBacking is deployed and indexed for this namespace.
    public readonly backing: {
      source: BackingSource;
      address: string;
    } | null = null,
  ) {}
  private where(id: string) {
    return and(
      eq(m.chainId, this.namespace.chainId),
      eq(m.registryAddress, this.namespace.registryAddress),
      eq(m.thesisId, id),
    );
  }
  private socialWhere<
    T extends
      | typeof schema.comments
      | typeof schema.reactions
      | typeof schema.reports
      | typeof schema.executions,
  >(t: T, id?: string) {
    return and(
      eq(t.chainId, this.namespace.chainId),
      eq(t.registryAddress, this.namespace.registryAddress),
      ...(id ? [eq(t.thesisId, id)] : []),
    );
  }
  async rate(
    session: Session,
    action: string,
    limit: number,
    seconds: number,
    now = new Date(),
  ) {
    const windowStart = new Date(
        Math.floor(now.getTime() / (seconds * 1000)) * seconds * 1000,
      ),
      t = schema.rateBuckets;
    const rows = await this.db
      .insert(t)
      .values({ userId: session.userId, action, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [t.userId, t.action, t.windowStart],
        set: { count: sql`${t.count}+1` },
        setWhere: sql`${t.count}<${limit}`,
      })
      .returning({ count: t.count });
    assert(
      rows.length,
      "RATE_LIMITED",
      "You’re posting too quickly.",
      429,
      `Try again after ${Math.ceil((windowStart.getTime() + seconds * 1000 - now.getTime()) / 1000)} seconds.`,
    );
  }
  async identity(wallet: string): Promise<AuthorIdentity> {
    const [row] = await this.db
      .select({ user: schema.users })
      .from(schema.wallets)
      .innerJoin(schema.users, eq(schema.wallets.userId, schema.users.id))
      .where(eq(schema.wallets.address, wallet));
    return row
      ? {
          handle: row.user.handle,
          displayName: row.user.displayName ?? row.user.handle,
          wallet,
          userId: row.user.id,
        }
      : {
          handle: `${wallet.slice(2, 8)}`,
          displayName: `${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
          wallet,
          userId: null,
        };
  }
  /** Public identities for wallets, with a short-address fallback for unknown ones. */
  async identities(wallets: string[]) {
    const unique = [...new Set(wallets)];
    const rows = unique.length
      ? await this.db
          .select({ wallet: schema.wallets.address, user: schema.users })
          .from(schema.wallets)
          .innerJoin(schema.users, eq(schema.wallets.userId, schema.users.id))
          .where(inArray(schema.wallets.address, unique))
      : [];
    const known = new Map(
      rows.map(({ wallet, user }) => [
        wallet,
        {
          handle: user.handle,
          displayName: user.displayName ?? user.handle,
          wallet,
          userId: user.id,
        },
      ]),
    );
    return (wallet: string): AuthorIdentity =>
      known.get(wallet) ?? {
        handle: wallet.slice(2, 8),
        displayName: `${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
        wallet,
        userId: null,
      };
  }
  async compose(nodes: GraphThesis[]): Promise<FeedThesis[]> {
    if (!nodes.length) return [];
    assert(
      nodes.every(
        (n) =>
          n.chainId === this.namespace.chainId &&
          n.registryAddress === this.namespace.registryAddress,
      ),
      "GRAPH_NAMESPACE_MISMATCH",
      "The graph returned another deployment’s ideas.",
      503,
      "Check the indexer namespace configuration.",
    );
    const allIds = nodes.map((n) => n.thesisId),
      parentIds = [
        ...new Set(nodes.map((n) => n.parentId).filter((id) => id !== "0")),
      ];
    const parents = await this.graph.getMany(parentIds);
    const all = [...nodes, ...parents],
      byId = new Map(all.map((n) => [n.thesisId, n]));
    const rows = await this.db
      .select()
      .from(m)
      .where(
        and(
          eq(m.chainId, this.namespace.chainId),
          eq(m.registryAddress, this.namespace.registryAddress),
          inArray(m.thesisId, [...new Set([...allIds, ...parentIds])]),
          eq(m.status, "finalized"),
        ),
      );
    const byMetadata = new Map(rows.map((row) => [row.thesisId, row]));
    // Backing and the value forks sent back are read before identities, so the first
    // backers can be shown as people rather than addresses.
    const [backed, flows]: [Map<string, BackingSummary>, LineageFlow[]] = this
      .backing
      ? await Promise.all([
          this.backing.source.summaries(allIds),
          this.backing.source.flows(allIds),
        ])
      : [new Map(), []];
    const shownBackers = (id: string) =>
      (backed.get(id)?.earlyBackers ?? []).slice(0, 3);
    const wallets = [
      ...new Set([
        ...all.map((n) => n.author),
        ...allIds.flatMap(shownBackers),
      ]),
    ];
    const identities = await this.db
      .select({ wallet: schema.wallets.address, user: schema.users })
      .from(schema.wallets)
      .innerJoin(schema.users, eq(schema.wallets.userId, schema.users.id))
      .where(inArray(schema.wallets.address, wallets));
    const idMap = new Map(
      identities.map(({ wallet, user }) => [
        wallet,
        {
          handle: user.handle,
          displayName: user.displayName ?? user.handle,
          wallet,
          userId: user.id,
        },
      ]),
    );
    const author = (wallet: string): AuthorIdentity =>
      idMap.get(wallet) ?? {
        handle: wallet.slice(2, 8),
        displayName: `${wallet.slice(0, 6)}…${wallet.slice(-4)}`,
        wallet,
        userId: null,
      };
    const arrived = (id: string) =>
      flows
        .filter((flow) => flow.creditedThesisId === id)
        .reduce((sum, flow) => sum + BigInt(flow.amountWei), 0n)
        .toString();
    const [agrees, commentCounts, evidence] = await Promise.all([
      this.db
        .select({
          id: schema.reactions.thesisId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.reactions)
        .where(
          and(
            this.socialWhere(schema.reactions),
            inArray(schema.reactions.thesisId, allIds),
          ),
        )
        .groupBy(schema.reactions.thesisId),
      this.db
        .select({
          id: schema.comments.thesisId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.comments)
        .where(
          and(
            this.socialWhere(schema.comments),
            inArray(schema.comments.thesisId, allIds),
            eq(schema.comments.status, "visible"),
          ),
        )
        .groupBy(schema.comments.thesisId),
      this.db
        .select()
        .from(schema.executions)
        .where(
          and(
            this.socialWhere(schema.executions),
            inArray(schema.executions.thesisId, allIds),
          ),
        ),
    ]);
    const trusted = (n: GraphThesis, row: MetadataRow | undefined) => {
      if (!row) return { state: "missing" as const, metadata: null };
      if (row.hidden) return { state: "hidden" as const, metadata: null };
      try {
        const metadata = thesisMetadataSchema.parse({
          version: 1,
          reasoning: row.reasoning,
          tags: row.tags,
          entryNote: row.entryNote,
        });
        if (
          row.authorWallet !== n.author ||
          row.contentHash !== n.contentHash ||
          thesisContentHash(metadata) !== n.contentHash
        )
          return { state: "integrity-mismatch" as const, metadata: null };
        return { state: "trusted" as const, metadata };
      } catch {
        return { state: "integrity-mismatch" as const, metadata: null };
      }
    };
    return nodes.map((n) => {
      const own = trusted(n, byMetadata.get(n.thesisId)),
        parent = byId.get(n.parentId),
        parentMeta = parent
          ? trusted(parent, byMetadata.get(parent.thesisId))
          : null;
      const e = evidence.find((e) => e.thesisId === n.thesisId);
      const verified =
        e?.verificationStatus === "verified" &&
        e.executionRef === n.executionRef &&
        e.walletAddress === n.author;
      return {
        graph: n,
        author: author(n.author),
        metadata: own.metadata,
        metadataState: own.state,
        parent: parent
          ? { thesisId: parent.thesisId, author: author(parent.author) }
          : null,
        changes:
          parent &&
          parentMeta?.metadata &&
          own.metadata &&
          parent.core.marketId === n.core.marketId
            ? forkDifference(
                { core: parent.core, metadata: parentMeta.metadata },
                { core: n.core, metadata: own.metadata },
              )
            : [],
        challenge: !!parent && parent.core.side !== n.core.side,
        social: {
          agrees: agrees.find((a) => a.id === n.thesisId)?.count ?? 0,
          comments: commentCounts.find((a) => a.id === n.thesisId)?.count ?? 0,
        },
        backing: backed.get(n.thesisId) ?? noBacking,
        firstBackers: shownBackers(n.thesisId).map(author),
        arrivedFromForksWei: arrived(n.thesisId),
        execution: {
          state: verified
            ? "verified"
            : n.executionRef || e
              ? "attested"
              : "not-executed",
          position:
            verified &&
            (e?.positionState === "open" || e?.positionState === "closed")
              ? e.positionState
              : "unknown",
        },
        provenance: {
          graph: this.graph.provenance,
          metadata: "postgres",
          verification: "postgres",
          enrichment: "absent",
        },
      };
    });
  }
  async feed(mode: FeedMode = "fresh", offset = 0) {
    const snapshot = await this.graph.recent(),
      composed = (await this.compose(snapshot.nodes)).filter(
        (n) => n.metadataState === "trusted",
      );
    const ranked = rankFeed(
      composed,
      snapshot.activity,
      mode,
      Math.floor(Date.now() / 1000),
    );
    return {
      items: ranked.slice(offset, offset + 20),
      nextOffset: offset + 20 < ranked.length ? offset + 20 : null,
      bounded: snapshot.bounded,
      ranking:
        mode === "fresh"
          ? "Latest published ideas"
          : "Unique external direct forkers in 24h, then 7d, then newest. Smart Signal uses this social-only baseline.",
    };
  }
  async detail(id: string): Promise<ThesisDetail> {
    const n = await this.graph.get(id);
    assert(
      n,
      "THESIS_NOT_FOUND",
      "This idea could not be found.",
      404,
      "Return to Feed or check the idea’s link.",
    );
    const [item] = await this.compose([n]);
    assert(
      item,
      "THESIS_NOT_FOUND",
      "This idea could not be loaded.",
      404,
      "Return to Feed.",
    );
    const tree = await this.graph.tree(n.rootId);
    const comments = await this.db
      .select({ comment: schema.comments, user: schema.users })
      .from(schema.comments)
      .innerJoin(
        schema.users,
        eq(schema.comments.authorUserId, schema.users.id),
      )
      .where(
        and(
          this.socialWhere(schema.comments, id),
          eq(schema.comments.status, "visible"),
        ),
      )
      .orderBy(desc(schema.comments.createdAt), desc(schema.comments.id))
      .limit(51);
    return {
      ...item,
      comments:
        item.metadataState !== "trusted"
          ? []
          : comments.slice(0, 50).map(({ comment, user }) => ({
              id: comment.id,
              body: comment.body,
              createdAt: comment.createdAt.toISOString(),
              author: {
                handle: user.handle,
                displayName: user.displayName ?? user.handle,
                wallet: user.primaryWallet ?? "",
                userId: user.id,
              },
            })),
      commentsHasMore: comments.length > 50,
      children: await this.compose(
        tree.nodes.filter((child) => child.parentId === id).slice(0, 8),
      ),
    };
  }
  async tree(id: string): Promise<ThesisTree> {
    const selected = await this.graph.get(id);
    assert(
      selected,
      "THESIS_NOT_FOUND",
      "This branch could not be found.",
      404,
      "Return to Feed.",
    );
    const tree = await this.graph.tree(selected.rootId),
      byId = new Map(tree.nodes.map((n) => [n.thesisId, n]));
    byId.set(id, selected);
    let parent = selected.parentId;
    const ancestors: string[] = [],
      seen = new Set<string>();
    while (parent !== "0" && ancestors.length < 250 && !seen.has(parent)) {
      seen.add(parent);
      const node = byId.get(parent) ?? (await this.graph.get(parent));
      if (!node) break;
      byId.set(parent, node);
      ancestors.unshift(parent);
      parent = node.parentId;
    }
    const inTree = [...byId.keys()];
    const flows = this.backing ? await this.backing.source.flows(inTree) : [];
    return {
      rootId: selected.rootId,
      selectedId: id,
      nodes: await this.compose(
        [...byId.values()].sort((a, b) =>
          BigInt(a.thesisId) > BigInt(b.thesisId) ? 1 : -1,
        ),
      ),
      ancestors,
      truncated: tree.truncated || parent !== "0",
      flows: flows.filter(
        (flow) =>
          byId.has(flow.sourceThesisId) && byId.has(flow.creditedThesisId),
      ),
    };
  }
  /** Who a backing of this thesis is split between, what it has received and where it went. */
  async backingView(id: string): Promise<ThesisBackingView> {
    const thesis = await this.graph.get(id);
    assert(
      thesis,
      "THESIS_NOT_FOUND",
      "This idea could not be found.",
      404,
      "Return to Feed.",
    );
    const parent =
        thesis.parentId === "0" ? null : await this.graph.get(thesis.parentId),
      grandparent =
        !parent || parent.parentId === "0"
          ? null
          : await this.graph.get(parent.parentId);
    const source = this.backing?.source;
    const [summaries, recent, flows] = source
      ? await Promise.all([
          source.summaries([id]),
          source.recent(id, 12),
          source.flows([id]),
        ])
      : [new Map<string, BackingSummary>(), [], []];
    const summary = summaries.get(id) ?? noBacking;
    const chain = [thesis, parent, grandparent].flatMap((node, role) =>
      node ? [{ role: role as BackingRole, node }] : [],
    );
    const person = await this.identities([
      ...chain.map(({ node }) => node.author),
      ...summary.earlyBackers,
      ...recent.map((event) => event.backer),
    ]);
    return {
      thesisId: id,
      contract: this.backing
        ? { address: this.backing.address, chainId: this.namespace.chainId }
        : null,
      lineage: chain.map(({ role, node }) => ({
        role,
        thesisId: node.thesisId,
        author: person(node.author),
      })),
      summary,
      earlyBackers: summary.earlyBackers.map(person),
      recent: recent.map((event) => ({
        ...event,
        backer: person(event.backer),
      })),
      sent: flows.filter((flow) => flow.sourceThesisId === id),
      received: flows.filter((flow) => flow.creditedThesisId === id),
    };
  }
  async profile(handle: string): Promise<ProfileSummary> {
    // A link to the handle an account started with keeps resolving after a claim.
    const matches = await this.db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.handle, handle),
          eq(schema.users.initialHandle, handle),
        ),
      );
    const user = matches.find((u) => u.handle === handle) ?? matches[0];
    assert(
      user?.primaryWallet,
      "PROFILE_NOT_FOUND",
      "This profile could not be found.",
      404,
      "Return to Explore and open a contributor.",
    );
    const wallet = user.primaryWallet,
      author = await this.graph.author(wallet);
    const evidence = await this.db
      .select()
      .from(schema.executions)
      .where(
        and(
          this.socialWhere(schema.executions),
          eq(schema.executions.verificationStatus, "verified"),
        ),
      )
      .limit(501);
    assert(
      evidence.length <= 500,
      "EVIDENCE_LIMIT",
      "Verified evidence exceeds the read bound.",
      503,
      "Increase the bounded evidence reader before displaying this metric.",
    );
    const credited = new Set<string>();
    for (const e of evidence) {
      if (e.walletAddress === wallet || e.userId === user.id) continue;
      const child = await this.graph.get(e.thesisId);
      if (
        !child ||
        child.executionRef !== e.executionRef ||
        child.author !== e.walletAddress
      )
        continue;
      let p = child.parentId;
      const seen = new Set<string>();
      while (p !== "0" && !seen.has(p) && seen.size < 250) {
        seen.add(p);
        const ancestor = await this.graph.get(p);
        if (!ancestor) break;
        if (ancestor.author === wallet) {
          credited.add(e.fillIdentity!);
          break;
        }
        p = ancestor.parentId;
      }
      assert(
        seen.size < 250 || p === "0",
        "LINEAGE_LIMIT",
        "Execution lineage exceeds the read bound.",
        503,
        "Expand lineage verification before displaying execution credit.",
      );
    }
    return {
      identity: {
        handle: user.handle,
        displayName: user.displayName ?? user.handle,
        wallet,
        userId: user.id,
      },
      bio: user.bio,
      reputation: reputation({
        ...author.counts,
        executionsInspired: credited.size,
      }),
      earnings: this.backing
        ? await this.backing.source.earnings(wallet)
        : noEarnings,
      support: this.backing
        ? await this.backing.source.support(wallet)
        : noSupport,
      backingContract: this.backing?.address ?? null,
      forkEarnings: await this.forkEarnings(wallet, author.nodes),
      recent: await this.compose(author.nodes),
      scope: { ...this.namespace, wallet },
    };
  }
  /** What backing of other people's forks paid this author, one row per fork, largest first. */
  private async forkEarnings(wallet: string, own: GraphThesis[]) {
    if (!this.backing || !own.length) return [];
    const ids = new Set(own.map((n) => n.thesisId));
    const flows = (await this.backing.source.flows([...ids])).filter(
      (flow) => ids.has(flow.creditedThesisId) && flow.recipient === wallet,
    );
    if (!flows.length) return [];
    const bySource = new Map<string, bigint>();
    for (const flow of flows)
      bySource.set(
        flow.sourceThesisId,
        (bySource.get(flow.sourceThesisId) ?? 0n) + BigInt(flow.amountWei),
      );
    const sources = await this.graph.getMany([...bySource.keys()]);
    const person = await this.identities(sources.map((n) => n.author));
    return sources
      .map((n) => ({
        thesisId: n.thesisId,
        author: person(n.author),
        amountWei: bySource.get(n.thesisId)!.toString(),
      }))
      .sort((a, b) => (BigInt(b.amountWei) > BigInt(a.amountWei) ? 1 : -1));
  }
  async explore() {
    const { nodes } = await this.graph.recent(),
      items = (await this.compose(nodes)).filter(
        (n) => n.metadataState === "trusted",
      );
    return {
      items,
      scope:
        "Latest 500 indexed ideas; counts below describe this bounded discovery window.",
      topics: [...new Set(items.flatMap((n) => n.metadata?.tags ?? []))]
        .sort()
        .slice(0, 20),
    };
  }
  async available(id: string) {
    const n = await this.graph.get(id);
    assert(
      n,
      "THESIS_NOT_FOUND",
      "This idea does not exist.",
      404,
      "Return to Feed and choose an existing idea.",
    );
    const [item] = await this.compose([n]);
    assert(
      item?.metadataState === "trusted",
      "CONTENT_UNAVAILABLE",
      "This idea’s content is unavailable or hidden.",
      409,
      "Choose an available idea or retry after indexing completes.",
    );
    return item;
  }
  private draftResult(row: MetadataRow) {
    return {
      draftId: row.id,
      contentHash: row.contentHash,
      intent: {
        ...this.namespace,
        parentId: row.parentId,
        authorWallet: row.authorWallet,
        core: thesisCoreSchema.parse(row.intent),
        contentHash: row.contentHash,
      } satisfies PublishIntent,
      expiresAt: row.expiresAt.toISOString(),
    };
  }
  async draft(
    session: Session,
    input: unknown,
  ): Promise<ReturnType<SocialCore["draftResult"]>> {
    const value = draftInputSchema.parse(input),
      full = { ...this.namespace, ...value };
    const parsed =
      value.parentId === "0"
        ? thesisSchema.parse({
            chainId: full.chainId,
            registryAddress: full.registryAddress,
            parentId: "0",
            core: value.core,
            metadata: value.metadata,
          })
        : forkSchema.parse({
            chainId: full.chainId,
            registryAddress: full.registryAddress,
            parentId: value.parentId,
            core: value.core,
            metadata: value.metadata,
          });
    const hash = thesisContentHash(parsed.metadata);
    const [existing] = await this.db
      .select()
      .from(m)
      .where(
        and(
          eq(m.authorUserId, session.userId),
          eq(m.requestKey, value.requestKey),
        ),
      );
    if (existing) {
      assert(
        existing.chainId === this.namespace.chainId &&
          existing.registryAddress === this.namespace.registryAddress &&
          existing.authorWallet === session.wallet &&
          existing.contentHash === hash &&
          existing.parentId === value.parentId &&
          JSON.stringify(thesisCoreSchema.parse(existing.intent)) ===
            JSON.stringify(parsed.core),
        "IDEMPOTENCY_CONFLICT",
        "This request key belongs to a different draft.",
      );
      return this.draftResult(existing);
    }
    assert(
      (await this.marketIds()).includes(parsed.core.marketId),
      "MARKET_UNAVAILABLE",
      "This MVP market is not currently available.",
      409,
      "Refresh the market context and choose an available market.",
    );
    if (parsed.parentId !== "0") {
      const parent = await this.available(parsed.parentId);
      forkModificationSchema.parse({
        parent: {
          chainId: parent.graph.chainId,
          registryAddress: parent.graph.registryAddress,
          thesisId: parent.graph.thesisId,
          core: parent.graph.core,
          metadata: parent.metadata,
        },
        fork: parsed,
      });
    }
    await this.rate(session, "draft", 20, 3600);
    const [row] = await this.db
      .insert(m)
      .values({
        ...this.namespace,
        authorUserId: session.userId,
        authorWallet: session.wallet,
        parentId: parsed.parentId,
        intent: parsed.core,
        contentHash: hash,
        reasoning: parsed.metadata.reasoning,
        entryNote: parsed.metadata.entryNote,
        tags: parsed.metadata.tags,
        requestKey: value.requestKey,
        expiresAt: new Date(Date.now() + 86400000),
      })
      .onConflictDoNothing({ target: [m.authorUserId, m.requestKey] })
      .returning();
    if (!row) return this.draft(session, input);
    return this.draftResult(row);
  }
  private async publicationState(id: string, hash: string, tx: string) {
    const node = await this.graph.get(id);
    return node?.contentHash === hash && node.txHash === tx
      ? "Published"
      : "Confirmed / indexing";
  }
  async finalize(
    session: Session,
    input: unknown,
  ): Promise<{ thesisId: string; state: string }> {
    const value = z
      .object({
        draftId: z.string().uuid(),
        txHash: z
          .string()
          .regex(/^0x[0-9a-fA-F]{64}$/)
          .transform((v) => v.toLowerCase()),
      })
      .strict()
      .parse(input);
    const [draft] = await this.db
      .select()
      .from(m)
      .where(eq(m.id, value.draftId));
    assert(
      draft,
      "DRAFT_NOT_FOUND",
      "This draft could not be found.",
      404,
      "Return to the composer and create a draft.",
    );
    assert(
      draft.authorUserId === session.userId &&
        draft.authorWallet === session.wallet,
      "WRONG_WALLET",
      "This draft belongs to another wallet.",
      403,
      "Select the original author wallet.",
    );
    assert(
      draft.chainId === this.namespace.chainId &&
        draft.registryAddress === this.namespace.registryAddress,
      "DRAFT_NAMESPACE_MISMATCH",
      "This draft belongs to another registry.",
    );
    await this.rate(session, "finalize", 60, 60);
    if (draft.status === "finalized") {
      assert(
        draft.txHash === value.txHash,
        "IDEMPOTENCY_CONFLICT",
        "This draft is already finalized with another transaction.",
      );
      return {
        thesisId: draft.thesisId!,
        state: await this.publicationState(
          draft.thesisId!,
          draft.contentHash,
          value.txHash,
        ),
      };
    }
    const intent = this.draftResult(draft).intent;
    assert(
      thesisContentHash({
        reasoning: draft.reasoning,
        tags: draft.tags,
        entryNote: draft.entryNote,
      }) === draft.contentHash,
      "DRAFT_HASH_MISMATCH",
      "This draft failed its content integrity check.",
    );
    const event = validateCreation(
      await this.receipts.creation(value.txHash, intent),
      intent,
      value.txHash,
    );
    assert(
      event.createdAt >= Math.floor(draft.createdAt.getTime() / 1000),
      "TX_EVENT_MISMATCH",
      "This transaction predates its draft.",
    );
    assert(
      event.createdAt * 1000 <= draft.expiresAt.getTime(),
      "DRAFT_EXPIRED",
      "This transaction was created after the draft expired.",
      409,
      "Create a new draft before submitting again.",
    );
    // The parent was validated when drafting. Its immutable graph and metadata cannot change; later moderation must not strand an already-confirmed fork.
    const result = await this.db
      .update(m)
      .set({
        status: "finalized",
        thesisId: event.thesisId,
        txHash: value.txHash,
        finalizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(m.id, draft.id), eq(m.status, "draft")))
      .returning();
    if (!result.length) return this.finalize(session, input);
    return {
      thesisId: event.thesisId,
      state: await this.publicationState(
        event.thesisId,
        draft.contentHash,
        value.txHash,
      ),
    };
  }
  async agree(session: Session, id: string, on: boolean) {
    await this.available(id);
    const t = schema.reactions;
    await this.rate(session, "agree", 60, 60);
    if (on)
      await this.db
        .insert(t)
        .values({
          ...this.namespace,
          thesisId: id,
          userId: session.userId,
          type: "agree",
        })
        .onConflictDoNothing();
    else
      await this.db
        .delete(t)
        .where(and(this.socialWhere(t, id), eq(t.userId, session.userId)));
    return { agreed: on };
  }
  async hasAgreed(session: Session, id: string) {
    const [row] = await this.db
      .select()
      .from(schema.reactions)
      .where(
        and(
          this.socialWhere(schema.reactions, id),
          eq(schema.reactions.userId, session.userId),
        ),
      );
    return { agreed: !!row };
  }
  async comment(
    session: Session,
    id: string,
    input: unknown,
  ): Promise<{ id: string }> {
    const value = commentInputSchema.parse(input),
      t = schema.comments;
    const [prior] = await this.db
      .select()
      .from(t)
      .where(
        and(
          eq(t.authorUserId, session.userId),
          eq(t.requestKey, value.requestKey),
        ),
      );
    if (prior) {
      assert(
        prior.chainId === this.namespace.chainId &&
          prior.registryAddress === this.namespace.registryAddress &&
          prior.thesisId === id &&
          prior.body === value.body,
        "IDEMPOTENCY_CONFLICT",
        "This request key belongs to another comment.",
      );
      return { id: prior.id };
    }
    await this.available(id);
    await this.rate(session, "comment-minute", 10, 60);
    await this.rate(session, "comment-hour", 50, 3600);
    const [row] = await this.db
      .insert(t)
      .values({
        ...this.namespace,
        thesisId: id,
        authorUserId: session.userId,
        body: value.body,
        requestKey: value.requestKey,
      })
      .onConflictDoNothing({ target: [t.authorUserId, t.requestKey] })
      .returning();
    if (!row) return this.comment(session, id, input);
    return { id: row.id };
  }
  async deleteComment(session: Session, id: string) {
    const t = schema.comments;
    const [row] = await this.db.select().from(t).where(eq(t.id, id));
    assert(
      row && row.authorUserId === session.userId,
      "COMMENT_OWNERSHIP",
      "Only the comment author may remove it.",
      403,
      "Sign in as the comment author.",
    );
    await this.db
      .update(t)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(t.id, id));
    return { deleted: true };
  }
  async report(
    session: Session,
    id: string,
    input: unknown,
  ): Promise<{ id: string }> {
    const value = reportInputSchema.parse(input),
      t = schema.reports;
    await this.available(id);
    const [prior] = await this.db
      .select()
      .from(t)
      .where(
        and(this.socialWhere(t, id), eq(t.reporterUserId, session.userId)),
      );
    if (prior) return { id: prior.id };
    const [keyOwner] = await this.db
      .select()
      .from(t)
      .where(
        and(
          eq(t.reporterUserId, session.userId),
          eq(t.requestKey, value.requestKey),
        ),
      );
    assert(
      !keyOwner,
      "IDEMPOTENCY_CONFLICT",
      "This request key belongs to another report.",
    );
    await this.rate(session, "report", 10, 3600);
    const [row] = await this.db
      .insert(t)
      .values({
        ...this.namespace,
        thesisId: id,
        reporterUserId: session.userId,
        reason: value.reason,
        note: value.note ?? null,
        requestKey: value.requestKey,
      })
      .onConflictDoNothing()
      .returning();
    if (!row) return this.report(session, id, input);
    return { id: row.id };
  }
  private admin(session: Session) {
    assert(
      this.adminDids.has(session.did),
      "ADMIN_REQUIRED",
      "Moderation requires an authorized admin.",
      403,
      "Sign in with a configured moderator account.",
    );
  }
  async moderationQueue(session: Session) {
    this.admin(session);
    return this.db
      .select()
      .from(schema.reports)
      .where(
        and(
          eq(schema.reports.chainId, this.namespace.chainId),
          eq(schema.reports.registryAddress, this.namespace.registryAddress),
          eq(schema.reports.status, "open"),
        ),
      )
      .orderBy(desc(schema.reports.createdAt))
      .limit(100);
  }
  async moderate(session: Session, id: string, hidden: boolean) {
    this.admin(session);
    const [row] = await this.db
      .update(m)
      .set({ hidden, updatedAt: new Date() })
      .where(and(this.where(id), eq(m.status, "finalized")))
      .returning({ id: m.id });
    assert(
      row,
      "THESIS_NOT_FOUND",
      "Finalized metadata could not be found.",
      404,
      "Refresh the moderation queue.",
    );
    await this.db
      .update(schema.reports)
      .set({ status: hidden ? "actioned" : "reviewed", updatedAt: new Date() })
      .where(this.socialWhere(schema.reports, id));
    return { hidden };
  }
  /** Whether the signed-in user could claim this handle right now. */
  async handleAvailability(session: Session, input: string) {
    const handle = normalizeHandle(input);
    const [owner] = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.handle, handle));
    if (owner?.id === session.userId)
      return { handle, available: true, problem: null };
    const problem =
      handleProblem(handle) ?? (owner ? "This handle is already taken." : null);
    return { handle, available: !problem, problem };
  }
  async updateProfile(session: Session, input: unknown) {
    const v = z
      .object({
        handle: z.string().max(64),
        displayName: z.string().trim().max(60).optional(),
        bio: z.string().trim().max(160).optional(),
      })
      .strict()
      .parse(input);
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId));
    assert(user, "AUTH_INVALID", "Sign in again.", 401, "Sign in again.");
    // Keeping the current handle is always allowed. A new one must pass the claim rules.
    const handle = normalizeHandle(v.handle),
      claiming = handle !== user.handle;
    if (claiming) handleSchema.parse(handle);
    await this.rate(session, "profile", 10, 3600);
    try {
      // The unique index decides a race between two people claiming the same handle.
      await this.db
        .update(schema.users)
        .set({
          handle,
          displayName: v.displayName || user.displayName,
          ...(v.bio === undefined ? {} : { bio: v.bio }),
          ...(claiming
            ? {
                handleClaimedAt: user.handleClaimedAt ?? new Date(),
                initialHandle:
                  user.initialHandle ??
                  (isGeneratedHandle(user.handle) ? user.handle : null),
              }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, session.userId));
    } catch (error) {
      if (uniqueViolation(error))
        throw new AppError(
          "HANDLE_UNAVAILABLE",
          "This handle is already taken.",
          409,
          "Choose another handle and save again.",
        );
      throw error;
    }
    return { handle };
  }
}
// PostgreSQL unique_violation, wherever the driver or the query builder put it.
function uniqueViolation(error: unknown) {
  let current = error as { code?: unknown; cause?: unknown } | undefined;
  for (let depth = 0; current && depth < 4; depth++) {
    if (current.code === "23505") return true;
    current = current.cause as typeof current;
  }
  return false;
}
