import { randomBytes, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { Database } from "./index.ts";
import * as s from "./schema.ts";

function databaseCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? databaseCode(error.cause) : undefined;
}

// Every fixture lives in one transaction that always rolls back. No DELETE,
// TRUNCATE, schema push, or persistent simulated publication is performed.
export async function databaseSmoke(db: Database) {
  const passed: string[] = [];
  const rollback = new Error("Intentional smoke rollback");
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL statement_timeout = '8000ms'`);
      await tx.execute(sql`SET LOCAL lock_timeout = '2000ms'`);
      const reject = async (
        name: string,
        code: string,
        operation: (savepoint: typeof tx) => Promise<unknown>,
      ) => {
        let rejected = false;
        try {
          await tx.transaction(operation);
        } catch (error) {
          if (databaseCode(error) !== code) throw error;
          rejected = true;
        }
        if (!rejected) throw new Error(`Constraint not enforced: ${name}`);
        passed.push(name);
      };
      const key = randomUUID().replaceAll("-", "").slice(0, 16);
      const wallet = `0x${randomBytes(20).toString("hex")}`;
      const otherWallet = `0x${randomBytes(20).toString("hex")}`;
      const registry = `0x${randomBytes(20).toString("hex")}`;
      const hash = () => `0x${randomBytes(32).toString("hex")}`;
      const rows = await tx
        .insert(s.users)
        .values([
          { privyDid: `smoke:${key}:a`, handle: `smoke_${key}a` },
          { privyDid: `smoke:${key}:b`, handle: `smoke_${key}b` },
        ])
        .returning();
      const user = rows[0]!.id,
        other = rows[1]!.id;
      await tx.insert(s.wallets).values([
        { address: wallet, userId: user, kind: "external" },
        { address: otherWallet, userId: other, kind: "external" },
      ]);
      await reject("wallet uniqueness", "23505", (sp) =>
        sp.insert(s.wallets).values({
          address: wallet,
          userId: other,
          kind: "external",
        }),
      );
      await reject("wallet ownership immutable", "P0001", (sp) =>
        sp
          .update(s.wallets)
          .set({ userId: other })
          .where(eq(s.wallets.address, wallet)),
      );
      await reject("wallet association", "23503", async (sp) => {
        await sp
          .update(s.users)
          .set({ primaryWallet: otherWallet })
          .where(eq(s.users.id, user));
        await sp.execute(sql`SET CONSTRAINTS selected_wallet_owner IMMEDIATE`);
      });
      await tx
        .update(s.users)
        .set({ primaryWallet: wallet })
        .where(eq(s.users.id, user));
      await tx.execute(sql`SET CONSTRAINTS selected_wallet_owner IMMEDIATE`);
      const ns = { chainId: 10143, registryAddress: registry, thesisId: "1" };
      const metadata = (thesisId: string, registryAddress = registry) => ({
        ...ns,
        thesisId,
        registryAddress,
        authorUserId: user,
        authorWallet: wallet,
        parentId: "0",
        intent: {},
        contentHash: hash(),
        reasoning: "Rollback-only live constraint smoke check.",
        status: "finalized",
        requestKey: randomUUID(),
        txHash: hash(),
        finalizedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      });
      await tx.insert(s.metadata).values(metadata("1"));
      await reject("metadata wallet ownership", "23503", (sp) =>
        sp
          .insert(s.metadata)
          .values({ ...metadata("3"), authorWallet: otherWallet }),
      );
      await reject("namespace uniqueness", "23505", (sp) =>
        sp.insert(s.metadata).values(metadata("1")),
      );
      await tx.insert(s.metadata).values(metadata("1", otherWallet));
      passed.push("distinct registry namespace");
      await tx
        .insert(s.reactions)
        .values({ ...ns, userId: other })
        .onConflictDoNothing();
      await tx
        .insert(s.reactions)
        .values({ ...ns, userId: other })
        .onConflictDoNothing();
      const agrees = await tx
        .select()
        .from(s.reactions)
        .where(eq(s.reactions.registryAddress, registry));
      if (agrees.length !== 1) throw new Error("Agree is not idempotent");
      passed.push("reaction idempotency");
      const [comment] = await tx
        .insert(s.comments)
        .values({
          ...ns,
          authorUserId: other,
          requestKey: randomUUID(),
          body: "Rollback-only comment.",
        })
        .returning();
      await reject("comment ownership", "P0001", (sp) =>
        sp
          .update(s.comments)
          .set({ authorUserId: user })
          .where(eq(s.comments.id, comment!.id)),
      );
      await tx.insert(s.reports).values({
        ...ns,
        reporterUserId: other,
        requestKey: randomUUID(),
        reason: "other",
      });
      await reject("report uniqueness", "23505", (sp) =>
        sp.insert(s.reports).values({
          ...ns,
          reporterUserId: other,
          requestKey: randomUUID(),
          reason: "other",
        }),
      );
      await tx.insert(s.metadata).values(metadata("2"));
      const evidence = {
        ...ns,
        userId: user,
        walletAddress: wallet,
        verificationStatus: "verified",
        positionState: "unknown",
        executionRef: hash(),
        fillIdentity: hash(),
        exchangeAddress: registry,
        instanceId: 12,
        accountId: "1",
        orderId: "1",
        marketId: 16,
        transactionHash: hash(),
        logIndex: 0,
        evidence: { rollbackOnlyConstraintCheck: true },
        verifiedAt: new Date(),
      };
      await tx.insert(s.executions).values(evidence);
      await reject("fillIdentity uniqueness", "23505", (sp) =>
        sp.insert(s.executions).values({ ...evidence, thesisId: "2" }),
      );
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  return {
    status: "passed" as const,
    rolledBack: true as const,
    checks: passed,
  };
}
