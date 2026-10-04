import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql, sum } from "drizzle-orm";
import { schema as s, type Database } from "@fork/db";
import { z } from "zod";
import { addressSchema } from "@fork/shared";

const ENDPOINT = "https://api.nansen.ai/api/v1/profiler/address/pnl-summary";
const ACTION = "nansen:pnl-summary:reserved-credits";
const rawSummary = z.object({
  traded_token_count: z.number().int().nonnegative(),
  traded_times: z.number().int().nonnegative(),
  realized_pnl_usd: z.number().finite(),
  realized_pnl_percent: z.number().finite(),
  win_rate: z.number().finite().min(0).max(1),
});
const contextSchema = z
  .object({
    source: z.literal("nansen"),
    chain: z.literal("monad-mainnet"),
    wallet: addressSchema,
    status: z.enum(["available", "empty", "unavailable", "disabled"]),
    window: z.object({ from: z.string(), to: z.string() }).strict(),
    fetchedAt: z.string().nullable(),
    stale: z.boolean(),
    summary: z
      .object({
        realizedPnlUsd: z.number().finite(),
        realizedPnlFraction: z.number().finite(),
        winRate: z.number().min(0).max(1),
        tradedTokens: z.number().int().nonnegative(),
        sales: z.number().int().nonnegative(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type WalletContext = z.output<typeof contextSchema>;
export function nansenWindow(now: Date) {
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return {
    from: new Date(to.getTime() - 30 * 86400000).toISOString(),
    to: to.toISOString(),
  };
}
export function normalizeNansen(
  input: unknown,
  wallet: string,
  now: Date,
): WalletContext {
  const r = rawSummary.parse(input);
  const empty = r.traded_token_count === 0 && r.traded_times === 0;
  return contextSchema.parse({
    source: "nansen",
    chain: "monad-mainnet",
    wallet,
    status: empty ? "empty" : "available",
    window: nansenWindow(now),
    fetchedAt: now.toISOString(),
    stale: false,
    summary: empty
      ? null
      : {
          realizedPnlUsd: r.realized_pnl_usd,
          realizedPnlFraction: r.realized_pnl_percent,
          winRate: r.win_rate,
          tradedTokens: r.traded_token_count,
          sales: r.traded_times,
        },
  });
}
export function nansenContext(
  db: Database,
  apiKey: string | undefined,
  dailyCreditBudget: number,
  fetcher: typeof fetch = fetch,
  clock: () => Date = () => new Date(),
) {
  return async (
    userId: string,
    inputWallet: string,
  ): Promise<WalletContext> => {
    const wallet = addressSchema.parse(inputWallet),
      now = clock(),
      window = nansenWindow(now);
    const fallback: WalletContext = {
      source: "nansen",
      chain: "monad-mainnet",
      wallet,
      status: apiKey ? "unavailable" : "disabled",
      window,
      fetchedAt: null,
      stale: false,
      summary: null,
    };
    if (!apiKey || dailyCreditBudget < 10) return fallback;
    const key = `monad:${wallet}:${window.to}`,
      day = new Date(window.to),
      leaseId = randomUUID();
    let previous: WalletContext | undefined;
    try {
      const [cached] = await db
        .select()
        .from(s.walletContext)
        .where(eq(s.walletContext.key, key));
      if (cached?.value) {
        const parsed = contextSchema.safeParse(cached.value);
        if (
          parsed.success &&
          parsed.data.wallet === wallet &&
          parsed.data.window.to === window.to
        )
          previous = parsed.data;
      }
      if (previous && cached!.expiresAt > now) return previous;
      const reserved = await db.transaction(async (tx) => {
        // Serialize reservations only; the external request never holds a DB transaction.
        const [lock] = await tx
          .select({
            acquired: sql<boolean>`pg_try_advisory_xact_lock(10143, 703)`,
          })
          .from(s.users)
          .where(eq(s.users.id, userId))
          .limit(1);
        if (!lock?.acquired) return false;
        const [fresh] = await tx
          .select()
          .from(s.walletContext)
          .where(eq(s.walletContext.key, key));
        if (
          fresh &&
          (fresh.expiresAt > now ||
            (fresh.leaseExpiresAt && fresh.leaseExpiresAt > now))
        )
          return false;
        const [usage] = await tx
          .select({ credits: sum(s.rateBuckets.count) })
          .from(s.rateBuckets)
          .where(
            and(
              eq(s.rateBuckets.action, ACTION),
              eq(s.rateBuckets.windowStart, day),
            ),
          );
        // Reserve the documented Free-tier cost (10), even for Pro (1). Never retry a billed read.
        if (Number(usage?.credits ?? 0) + 10 > dailyCreditBudget) return false;
        await tx
          .insert(s.rateBuckets)
          .values({ userId, action: ACTION, windowStart: day, count: 10 })
          .onConflictDoUpdate({
            target: [
              s.rateBuckets.userId,
              s.rateBuckets.action,
              s.rateBuckets.windowStart,
            ],
            set: { count: sql`${s.rateBuckets.count} + 10` },
          });
        await tx
          .insert(s.walletContext)
          .values({
            key,
            walletAddress: wallet,
            expiresAt: new Date(0),
            leaseId,
            leaseExpiresAt: new Date(now.getTime() + 30000),
          })
          .onConflictDoUpdate({
            target: s.walletContext.key,
            set: {
              leaseId,
              leaseExpiresAt: new Date(now.getTime() + 30000),
              updatedAt: now,
            },
          });
        return true;
      });
      if (!reserved) return previous ? { ...previous, stale: true } : fallback;
      let result = fallback;
      try {
        const response = await fetcher(ENDPOINT, {
          method: "POST",
          redirect: "error",
          cache: "no-store",
          headers: { "content-type": "application/json", apikey: apiKey },
          body: JSON.stringify({
            chain: "monad",
            wallet_address: wallet,
            date: window,
          }),
          signal: AbortSignal.timeout(6000),
        });
        if (response.ok)
          result = normalizeNansen(await response.json(), wallet, now);
      } catch {
        /* Fixed fallback; never log auth headers or raw upstream data. */
      }
      const successful =
        result.status === "available" || result.status === "empty";
      const display = successful
        ? result
        : previous
          ? { ...previous, stale: true }
          : fallback;
      await db
        .update(s.walletContext)
        .set({
          value: display,
          expiresAt: new Date(now.getTime() + (successful ? 3600000 : 300000)),
          leaseId: null,
          leaseExpiresAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(s.walletContext.key, key),
            eq(s.walletContext.leaseId, leaseId),
          ),
        );
      return display;
    } catch {
      return previous ? { ...previous, stale: true } : fallback;
    }
  };
}
