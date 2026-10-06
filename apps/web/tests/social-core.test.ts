import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { schema } from "@fork/db";
import { testDatabase } from "@fork/db/testing";
import {
  thesisMetadataSchema,
  thesisContentHash,
  type GraphThesis,
  type PublishIntent,
  type ReputationCounts,
  type ThesisCore,
} from "@fork/shared";
import { SocialCore } from "../src/server/social-core";
import {
  synchronizeIdentity,
  authenticate,
  associatedWallet,
  bearer,
  privyVerifier,
  type Session,
  type VerifiedIdentity,
} from "../src/server/auth";
import type { GraphSource } from "../src/server/graph";
import { validateCreation, type CreationEvidence } from "../src/server/receipt";
const ns = {
  chainId: 10143,
  registryAddress: `0x${"aa".repeat(20)}` as `0x${string}`,
};
const alice: VerifiedIdentity = {
  did: "did:test:a",
  wallets: [
    { address: `0x${"11".repeat(20)}`, kind: "embedded" },
    { address: `0x${"44".repeat(20)}`, kind: "external" },
  ],
};
const bob: VerifiedIdentity = {
  did: "did:test:b",
  wallets: [{ address: `0x${"22".repeat(20)}`, kind: "embedded" }],
};
let connection: Awaited<ReturnType<typeof testDatabase>>,
  core: SocialCore,
  a: Session,
  b: Session;
const nodes: GraphThesis[] = [],
  receipts = new Map<string, CreationEvidence>();
let sequence = 0;
const counts: ReputationCounts = {
  eligibleRoots: 0,
  successfulRoots: 0,
  eligibleForks: 0,
  successfulForks: 0,
  influence: 0,
  executionsInspired: 0,
};
const graph: GraphSource = {
  provenance: "envio-test",
  async get(id) {
    return nodes.find((n) => n.thesisId === id) ?? null;
  },
  async getMany(ids) {
    return nodes.filter((n) => ids.includes(n.thesisId));
  },
  async recent() {
    return { nodes, activity: nodes, bounded: false };
  },
  async tree(root) {
    return { nodes: nodes.filter((n) => n.rootId === root), truncated: false };
  },
  async author(wallet) {
    return { nodes: nodes.filter((n) => n.author === wallet), counts };
  },
};
const input = (parentId = "0") => ({
  parentId,
  core: {
    marketId: 16,
    side: "long" as "long" | "short",
    targetPriceE8: "7000000000000",
    invalidationPriceE8: "6000000000000",
    leverageBps: 20000,
  } satisfies ThesisCore,
  metadata: {
    reasoning: "A measured thesis with a clear invalidation.",
    tags: ["macro"],
  },
  requestKey: randomUUID(),
});
function evidence(intent: PublishIntent): CreationEvidence {
  const id = String(++sequence);
  return {
    ...intent,
    author: intent.authorWallet,
    thesisId: id,
    txHash: `0x${sequence.toString(16).padStart(64, "0")}`,
    blockNumber: id,
    blockHash: `0x${"cd".repeat(32)}`,
    createdAt: Math.floor(Date.now() / 1000),
    success: true,
  };
}
function index(e: CreationEvidence) {
  const parent = nodes.find((n) => n.thesisId === e.parentId);
  nodes.push({
    ...ns,
    thesisId: e.thesisId,
    parentId: e.parentId,
    rootId: parent?.rootId ?? e.thesisId,
    depth: parent ? parent.depth + 1 : 0,
    author: e.author as `0x${string}`,
    core: e.core,
    contentHash: e.contentHash,
    createdAt: e.createdAt,
    blockNumber: e.blockNumber,
    txHash: e.txHash,
    executionRef: null,
    directForkCount: 0,
    uniqueExternalForkers: 0,
  });
}
async function publish(session: Session, value: ReturnType<typeof input>) {
  const draft = await core.draft(session, value),
    e = evidence(draft.intent);
  receipts.set(e.txHash, e);
  const result = await core.finalize(session, {
    draftId: draft.draftId,
    txHash: e.txHash,
  });
  index(e);
  return { draft, e, result };
}
let root: Awaited<ReturnType<typeof publish>>;
beforeAll(async () => {
  connection = await testDatabase(
    fileURLToPath(new URL("../../../packages/db/migrations", import.meta.url)),
  );
  a = await synchronizeIdentity(connection.db, alice);
  b = await synchronizeIdentity(connection.db, bob);
  core = new SocialCore(
    connection.db,
    graph,
    {
      async creation(hash) {
        const e = receipts.get(hash);
        if (!e) throw new Error("Missing fixture");
        return e;
      },
    },
    ns,
    async () => [16, 32, 48, 64],
    new Set([alice.did]),
  );
  root = await publish(a, input());
}, 20000);
afterAll(async () => connection.close());
describe("auth trust boundary", () => {
  it("requires a well-formed bearer token", () => {
    expect(() => bearer(new Request("http://local"))).toThrow("Sign in");
    expect(
      bearer(
        new Request("http://local", {
          headers: { authorization: "Bearer verified" },
        }),
      ),
    ).toBe("verified");
  });
  it("rejects a browser wallet not in the verified identity", () => {
    expect(() => associatedWallet(alice, b.wallet)).toThrow("not associated");
    expect(
      associatedWallet(alice, a.wallet.toUpperCase().replace("0X", "0x")),
    ).toBe(a.wallet);
  });
  it("synchronizes idempotently and preserves selected primary wallet", async () => {
    expect((await synchronizeIdentity(connection.db, alice)).userId).toBe(
      a.userId,
    );
    const external = alice.wallets[1]!.address;
    await synchronizeIdentity(connection.db, alice, external);
    expect((await synchronizeIdentity(connection.db, alice)).wallet).toBe(
      external,
    );
    await synchronizeIdentity(connection.db, alice, a.wallet);
  });
  it("rejects linked but unselected and forged-wallet mutations", async () => {
    const verifier = {
      async verify() {
        return alice;
      },
    };
    for (const wallet of [alice.wallets[1]!.address, b.wallet])
      await expect(
        authenticate(
          connection.db,
          verifier,
          new Request("http://local", {
            headers: {
              authorization: "Bearer verified",
              "x-fork-wallet": wallet,
            },
          }),
        ),
      ).rejects.toMatchObject({ code: "WRONG_WALLET" });
  });
  it("does not reassign a wallet to a second verified DID", async () => {
    await expect(
      synchronizeIdentity(connection.db, { ...alice, did: "did:impersonator" }),
    ).rejects.toMatchObject({ code: "WALLET_OWNERSHIP_CONFLICT" });
  });
  it("absent Privy credentials fail clearly without a network request", async () => {
    await expect(privyVerifier().verify("token")).rejects.toMatchObject({
      code: "CONFIGURATION_REQUIRED",
    });
  });
  it("chooses deterministically and requires explicit recovery when a primary is unlinked", async () => {
    const identity: VerifiedIdentity = {
      did: "did:test:deterministic",
      wallets: [
        { address: `0x${"77".repeat(20)}`, kind: "external" },
        { address: `0x${"66".repeat(20)}`, kind: "embedded" },
        { address: `0x${"55".repeat(20)}`, kind: "embedded" },
      ],
    };
    const first = await synchronizeIdentity(connection.db, identity);
    expect(first.wallet).toBe(identity.wallets[2]!.address);
    expect(
      (
        await synchronizeIdentity(connection.db, {
          ...identity,
          wallets: [...identity.wallets].reverse(),
        })
      ).wallet,
    ).toBe(first.wallet);
    const external = identity.wallets[0]!.address;
    await synchronizeIdentity(connection.db, identity, external);
    expect((await synchronizeIdentity(connection.db, identity)).wallet).toBe(
      external,
    );
    const unlinked = { ...identity, wallets: identity.wallets.slice(1) };
    await expect(
      synchronizeIdentity(connection.db, unlinked),
    ).rejects.toMatchObject({ code: "WRONG_WALLET" });
    expect((await synchronizeIdentity(connection.db, identity)).wallet).toBe(
      external,
    );
    expect(
      (await synchronizeIdentity(connection.db, unlinked, first.wallet)).wallet,
    ).toBe(first.wallet);
  });
});
describe("publish and fork finalization", () => {
  it("distinguishes confirmed/indexing from Published and finalizes idempotently", async () => {
    expect(root.result.state).toBe("Confirmed / indexing");
    expect(
      await core.finalize(a, {
        draftId: root.draft.draftId,
        txHash: root.e.txHash,
      }),
    ).toEqual({ thesisId: root.e.thesisId, state: "Published" });
  });
  it("returns the same draft for retry but rejects a changed payload key", async () => {
    const value = input(),
      draft = await core.draft(a, value);
    expect(await core.draft(a, value)).toEqual(draft);
    await expect(
      core.draft(a, { ...value, core: { ...value.core, leverageBps: 30000 } }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("second wallet can fork the first root and shows changes and attribution", async () => {
    const value = input(root.e.thesisId);
    value.core.targetPriceE8 = "7200000000000";
    value.core.leverageBps = 30000;
    const fork = await publish(b, value),
      detail = await core.detail(fork.e.thesisId);
    expect(detail.graph.parentId).toBe(root.e.thesisId);
    expect(detail.parent?.author.wallet).toBe(a.wallet);
    expect(detail.author.wallet).toBe(b.wallet);
    expect(detail.changes.map((c) => c.field)).toEqual([
      "targetPriceE8",
      "leverageBps",
    ]);
    expect(detail.provenance).toEqual({
      graph: "envio-test",
      metadata: "postgres",
      verification: "postgres",
      enrichment: "absent",
    });
  });
  it("rejects nonexistent, unchanged and note/tag-only parents", async () => {
    await expect(core.draft(b, input("999"))).rejects.toMatchObject({
      code: "THESIS_NOT_FOUND",
    });
    await expect(core.draft(b, input(root.e.thesisId))).rejects.toThrow();
    await expect(
      core.draft(b, {
        ...input(root.e.thesisId),
        metadata: {
          ...input().metadata,
          entryNote: "Different note",
          tags: ["breakout"],
        },
      }),
    ).rejects.toThrow();
  });
  it("cannot accept spoofed parent metadata or a changed inherited market", async () => {
    await expect(
      core.draft(b, { ...input(root.e.thesisId), parentAuthor: a.wallet }),
    ).rejects.toThrow();
    await expect(
      core.draft(b, {
        ...input(root.e.thesisId),
        core: { ...input().core, marketId: 32 },
      }),
    ).rejects.toThrow();
  });
  it("opposite-side forks remain in lineage and are labelled Challenge", async () => {
    const value = input(root.e.thesisId);
    const fork = await publish(b, {
      ...value,
      core: { ...value.core, side: "short" },
    });
    expect((await core.detail(fork.e.thesisId)).challenge).toBe(true);
    const tree = await core.tree(fork.e.thesisId);
    expect(tree.rootId).toBe(root.e.thesisId);
    expect(tree.ancestors).toEqual([root.e.thesisId]);
  });
  it("wrong wallet cannot finalize another user’s draft", async () => {
    await expect(
      core.finalize(b, { draftId: root.draft.draftId, txHash: root.e.txHash }),
    ).rejects.toMatchObject({ code: "WRONG_WALLET" });
  });
  it("rejects wrong hash, registry, chain, author, event, reverted transaction", () => {
    const d = root.draft.intent,
      e = root.e;
    const failures: [Partial<CreationEvidence>, string][] = [
      [{ contentHash: `0x${"00".repeat(32)}` }, "DRAFT_HASH_MISMATCH"],
      [{ registryAddress: `0x${"bb".repeat(20)}` }, "TX_NAMESPACE_MISMATCH"],
      [{ chainId: 1 }, "TX_NAMESPACE_MISMATCH"],
      [{ author: b.wallet }, "WRONG_WALLET"],
      [{ parentId: "900" }, "TX_EVENT_MISMATCH"],
      [{ success: false }, "TX_REVERTED"],
    ];
    for (const [change, code] of failures) {
      try {
        validateCreation({ ...e, ...change }, d, e.txHash);
        throw new Error("Expected rejection");
      } catch (err) {
        expect(err).toMatchObject({ code });
      }
    }
  });
  it("a wrong hash cannot finalize metadata", async () => {
    const draft = await core.draft(a, input()),
      e = { ...evidence(draft.intent), contentHash: `0x${"ef".repeat(32)}` };
    receipts.set(e.txHash, e);
    await expect(
      core.finalize(a, { draftId: draft.draftId, txHash: e.txHash }),
    ).rejects.toMatchObject({ code: "DRAFT_HASH_MISMATCH" });
  });
  it("an indexed event with mismatched hash remains indexing and untrusted", async () => {
    const n = nodes.find((n) => n.thesisId === root.e.thesisId)!;
    const prior = n.contentHash;
    n.contentHash = `0x${"ef".repeat(32)}`;
    expect(
      (
        await core.finalize(a, {
          draftId: root.draft.draftId,
          txHash: root.e.txHash,
        })
      ).state,
    ).toBe("Confirmed / indexing");
    expect((await core.detail(n.thesisId)).metadataState).toBe(
      "integrity-mismatch",
    );
    expect((await core.detail(n.thesisId)).metadata).toBeNull();
    n.contentHash = prior;
  });
  it("does not trust a graph from a different namespace", async () => {
    await expect(
      core.compose([{ ...nodes[0]!, registryAddress: `0x${"bb".repeat(20)}` }]),
    ).rejects.toMatchObject({ code: "GRAPH_NAMESPACE_MISMATCH" });
  });
  it("canonical metadata hash survives PostgreSQL JSON order", () => {
    expect(
      thesisContentHash(thesisMetadataSchema.parse(input().metadata)),
    ).toBe(root.draft.contentHash);
  });
});
describe("social actions and exact evidence credit", () => {
  it("Agree is duplicate-safe and reversible", async () => {
    await core.agree(b, root.e.thesisId, true);
    await core.agree(b, root.e.thesisId, true);
    expect((await core.detail(root.e.thesisId)).social.agrees).toBe(1);
    await core.agree(b, root.e.thesisId, false);
    expect((await core.detail(root.e.thesisId)).social.agrees).toBe(0);
  });
  it("comments are idempotent, bounded and only deletable by their author", async () => {
    const value = {
        body: "<script>alert(1)</script> is plain text.",
        requestKey: randomUUID(),
      },
      c = await core.comment(b, root.e.thesisId, value);
    expect(await core.comment(b, root.e.thesisId, value)).toEqual(c);
    expect((await core.detail(root.e.thesisId)).comments[0]?.body).toBe(
      value.body,
    );
    await expect(core.deleteComment(a, c.id)).rejects.toMatchObject({
      code: "COMMENT_OWNERSHIP",
    });
    await core.deleteComment(b, c.id);
    expect((await core.detail(root.e.thesisId)).comments).toHaveLength(0);
    await expect(
      core.comment(b, root.e.thesisId, {
        body: "a".repeat(281),
        requestKey: randomUUID(),
      }),
    ).rejects.toThrow();
  });
  it("uses persistent atomic buckets shared across service instances", async () => {
    const other = new SocialCore(
      connection.db,
      graph,
      core.receipts,
      ns,
      async () => [16],
    );
    await core.rate(b, "fixture-limit", 1, 3600);
    await expect(other.rate(b, "fixture-limit", 1, 3600)).rejects.toMatchObject(
      { code: "RATE_LIMITED" },
    );
  });
  it("reports are idempotent and cannot reuse a key for another thesis", async () => {
    const value = {
        reason: "spam",
        note: "Review this reasoning.",
        requestKey: randomUUID(),
      },
      r = await core.report(b, root.e.thesisId, value);
    expect(await core.report(b, root.e.thesisId, value)).toEqual(r);
    const other = nodes.find((n) => n.thesisId !== root.e.thesisId)!;
    await expect(core.report(b, other.thesisId, value)).rejects.toMatchObject({
      code: "IDEMPOTENCY_CONFLICT",
    });
  });
  it("only server-authorized moderators hide content; lineage stays", async () => {
    await expect(core.moderate(b, root.e.thesisId, true)).rejects.toMatchObject(
      { code: "ADMIN_REQUIRED" },
    );
    await core.moderate(a, root.e.thesisId, true);
    expect((await core.detail(root.e.thesisId)).metadataState).toBe("hidden");
    expect(
      (await core.feed()).items.some(
        (n) => n.graph.thesisId === root.e.thesisId,
      ),
    ).toBe(false);
    expect(
      (await core.tree(root.e.thesisId)).nodes.some(
        (n) => n.graph.thesisId === root.e.thesisId,
      ),
    ).toBe(true);
    await expect(core.agree(b, root.e.thesisId, true)).rejects.toMatchObject({
      code: "CONTENT_UNAVAILABLE",
    });
    await core.moderate(a, root.e.thesisId, false);
  });
  it("later parent moderation cannot strand an already-submitted valid fork", async () => {
    const value = input(root.e.thesisId);
    value.core.leverageBps = 40000;
    const draft = await core.draft(b, value),
      e = evidence(draft.intent);
    receipts.set(e.txHash, e);
    await core.moderate(a, root.e.thesisId, true);
    expect(
      await core.finalize(b, { draftId: draft.draftId, txHash: e.txHash }),
    ).toMatchObject({ thesisId: e.thesisId });
    index(e);
    await core.moderate(a, root.e.thesisId, false);
  });
  it("unverified links are Attested and inspire zero executions", async () => {
    nodes[0]!.executionRef = `0x${"ab".repeat(32)}`;
    expect((await core.detail(root.e.thesisId)).execution.state).toBe(
      "attested",
    );
    expect((await core.profile(a.handle)).reputation.executionsInspired).toBe(
      0,
    );
  });
  it("counts a verified descendant once across overlapping authored ancestors", async () => {
    const value = input(root.e.thesisId);
    value.core.leverageBps = 50000;
    const authored = await publish(a, value),
      descValue = input(authored.e.thesisId);
    descValue.core.leverageBps = 60000;
    const child = await publish(b, descValue),
      ref = `0x${"99".repeat(32)}`;
    nodes.find((n) => n.thesisId === child.e.thesisId)!.executionRef = ref;
    await connection.db.insert(schema.executions).values({
      ...ns,
      thesisId: child.e.thesisId,
      userId: b.userId,
      walletAddress: b.wallet,
      verificationStatus: "verified",
      positionState: "open",
      executionRef: ref,
      fillIdentity: `0x${"88".repeat(32)}`,
      exchangeAddress: ns.registryAddress,
      instanceId: 12,
      accountId: "7",
      orderId: "8",
      marketId: 16,
      transactionHash: child.e.txHash,
      logIndex: 0,
      evidence: { explicitTestFixture: true },
      verifiedAt: new Date(),
    });
    expect((await core.detail(child.e.thesisId)).execution).toEqual({
      state: "verified",
      position: "open",
    });
    expect((await core.profile(a.handle)).reputation.executionsInspired).toBe(
      1,
    );
    expect((await core.profile(b.handle)).reputation.executionsInspired).toBe(
      0,
    );
  });
  it("profile handles remain unique with a recoverable conflict", async () => {
    await core.updateProfile(a, { handle: "alice", displayName: "Alice" });
    await expect(
      core.updateProfile(b, { handle: "alice", displayName: "Bora" }),
    ).rejects.toMatchObject({ code: "HANDLE_UNAVAILABLE" });
  });
});
