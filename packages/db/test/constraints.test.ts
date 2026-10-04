import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { testDatabase } from "../src/testing";
import * as s from "../src/schema";
let connection: Awaited<ReturnType<typeof testDatabase>>;
let user: string, other: string;
const wallet = `0x${"11".repeat(20)}`,
  wallet2 = `0x${"22".repeat(20)}`,
  registry = `0x${"aa".repeat(20)}`,
  hash = `0x${"ab".repeat(32)}`;
const ns = { chainId: 10143, registryAddress: registry, thesisId: "1" };
const metadata = (thesisId = "1", registryAddress = registry) => ({
  chainId: 10143,
  registryAddress,
  thesisId,
  authorUserId: user,
  authorWallet: wallet,
  parentId: "0",
  intent: {},
  contentHash: hash,
  reasoning: "A properly bounded thesis.",
  status: "finalized",
  requestKey: randomUUID(),
  expiresAt: new Date(Date.now() + 86400000),
  finalizedAt: new Date(),
  txHash: `0x${BigInt(thesisId).toString(16).padStart(64, "0")}`,
});
beforeAll(async () => {
  connection = await testDatabase(
    fileURLToPath(new URL("../migrations", import.meta.url)),
  );
  const rows = await connection.db
    .insert(s.users)
    .values([
      { privyDid: "did:a", handle: "alice" },
      { privyDid: "did:b", handle: "borak" },
    ])
    .returning();
  user = rows[0]!.id;
  other = rows[1]!.id;
  await connection.db.insert(s.wallets).values([
    { userId: user, address: wallet, kind: "embedded" },
    { userId: other, address: wallet2, kind: "external" },
  ]);
  await connection.db.insert(s.metadata).values(metadata());
}, 20000);
afterAll(async () => {
  await connection.close();
});
describe("committed PostgreSQL migrations", () => {
  it("enforces unique DID and handle", async () => {
    await expect(
      connection.db
        .insert(s.users)
        .values({ privyDid: "did:a", handle: "another" }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(s.users)
        .values({ privyDid: "did:c", handle: "alice" }),
    ).rejects.toThrow();
  });
  it("normalizes wallet ownership and prevents reassignment", async () => {
    await expect(
      connection.db
        .insert(s.wallets)
        .values({ address: wallet, userId: other, kind: "external" }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .update(s.wallets)
        .set({ userId: other })
        .where(eq(s.wallets.address, wallet)),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(s.wallets).values({
        address: `0x${"AB".repeat(20)}`,
        userId: user,
        kind: "external",
      }),
    ).rejects.toThrow();
  });
  it("selected primary wallet must belong to that user", async () => {
    await expect(
      connection.db
        .update(s.users)
        .set({ primaryWallet: wallet2 })
        .where(eq(s.users.id, user)),
    ).rejects.toThrow();
    await connection.db
      .update(s.users)
      .set({ primaryWallet: wallet })
      .where(eq(s.users.id, user));
  });
  it("metadata author wallet must belong to the author user", async () => {
    await expect(
      connection.db
        .insert(s.metadata)
        .values({ ...metadata("8"), authorWallet: wallet2 }),
    ).rejects.toThrow();
  });
  it("namespace collisions are protected while different registries coexist", async () => {
    await expect(
      connection.db
        .insert(s.metadata)
        .values({ ...metadata(), txHash: `0x${"cd".repeat(32)}` }),
    ).rejects.toThrow();
    await connection.db
      .insert(s.metadata)
      .values(metadata("1", `0x${"bb".repeat(20)}`));
    const rows = await connection.db.select().from(s.metadata);
    expect(rows).toHaveLength(2);
  });
  it("draft request keys and transaction receipts cannot be reused", async () => {
    const key = randomUUID();
    const draft = {
      ...metadata("9"),
      thesisId: null,
      status: "draft",
      txHash: null,
      finalizedAt: null,
      requestKey: key,
    };
    await connection.db.insert(s.metadata).values(draft);
    await expect(
      connection.db.insert(s.metadata).values(draft),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(s.metadata)
        .values({ ...metadata("10"), txHash: metadata().txHash }),
    ).rejects.toThrow();
  });
  it("a finalized row cannot lose its receipt through NULL CHECK semantics", async () => {
    await expect(
      connection.db
        .insert(s.metadata)
        .values({ ...metadata("11"), txHash: null }),
    ).rejects.toThrow();
  });
  it("finalized reasoning and author identity are immutable but moderation is allowed", async () => {
    await expect(
      connection.db
        .update(s.metadata)
        .set({ reasoning: "A substituted thesis." })
        .where(eq(s.metadata.thesisId, "1")),
    ).rejects.toThrow();
    await connection.db
      .update(s.metadata)
      .set({ hidden: true })
      .where(eq(s.metadata.thesisId, "1"));
  });
  it("Agree is idempotent and isolated by namespace", async () => {
    await connection.db
      .insert(s.reactions)
      .values({ ...ns, userId: user })
      .onConflictDoNothing();
    await connection.db
      .insert(s.reactions)
      .values({ ...ns, userId: user })
      .onConflictDoNothing();
    await connection.db
      .insert(s.reactions)
      .values({ ...ns, registryAddress: `0x${"bb".repeat(20)}`, userId: user });
    expect(await connection.db.select().from(s.reactions)).toHaveLength(2);
    await expect(
      connection.db
        .insert(s.reactions)
        .values({ ...ns, thesisId: "99", userId: user }),
    ).rejects.toThrow();
  });
  it("comments preserve ownership and request idempotency", async () => {
    const value = {
      ...ns,
      authorUserId: user,
      body: "A useful counterpoint.",
      requestKey: randomUUID(),
    };
    const [row] = await connection.db
      .insert(s.comments)
      .values(value)
      .returning();
    await expect(
      connection.db.insert(s.comments).values(value),
    ).rejects.toThrow();
    await expect(
      connection.db
        .update(s.comments)
        .set({ authorUserId: other })
        .where(eq(s.comments.id, row!.id)),
    ).rejects.toThrow();
  });
  it("reports reject duplicate reporter/thesis and reused request key", async () => {
    const value = {
      ...ns,
      reporterUserId: other,
      reason: "spam",
      requestKey: randomUUID(),
    };
    await connection.db.insert(s.reports).values(value);
    await expect(
      connection.db
        .insert(s.reports)
        .values({ ...value, requestKey: randomUUID() }),
    ).rejects.toThrow();
  });
  it("one canonical fill cannot earn credit on two different theses", async () => {
    await connection.db.insert(s.metadata).values(metadata("2"));
    const evidence = {
      ...ns,
      userId: user,
      walletAddress: wallet,
      verificationStatus: "verified",
      positionState: "open",
      executionRef: hash,
      fillIdentity: hash,
      exchangeAddress: registry,
      instanceId: 12,
      accountId: "7",
      orderId: "8",
      marketId: 16,
      transactionHash: hash,
      logIndex: 0,
      evidence: { fixture: true },
      verifiedAt: new Date(),
    };
    await connection.db.insert(s.executions).values(evidence);
    await expect(
      connection.db.insert(s.executions).values({ ...evidence, thesisId: "2" }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .update(s.executions)
        .set({ executionRef: `0x${"cd".repeat(32)}` }),
    ).rejects.toThrow();
  });
  it("attestation cannot carry verified fields or a fabricated position", async () => {
    await expect(
      connection.db.insert(s.executions).values({
        ...ns,
        thesisId: "2",
        userId: user,
        walletAddress: wallet,
        fillIdentity: hash,
      }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(s.executions).values({
        ...ns,
        thesisId: "2",
        userId: user,
        walletAddress: wallet,
        positionState: "open",
      }),
    ).rejects.toThrow();
  });
});
