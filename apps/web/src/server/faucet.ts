import { and, eq, ne, sql } from "drizzle-orm";
import { schema, type Database } from "@fork/db";
import type { Session } from "./auth";
import { AppError } from "./errors";

export const WELCOME_DRIP_WEI = 200_000_000_000_000_000n; // 0.2 testnet MON
export const DAILY_DRIP_CAP = 15;
export const TRANSFER_GAS = 21_000n;
const PUBLIC_FAUCET = "the public Monad faucet at https://faucet.monad.xyz";

export interface BalanceReader {
  balanceOf(address: string): Promise<bigint>;
}
/** The faucet account on Monad Testnet. Only plain transfers, one nonce at a time. */
export interface FaucetChain extends BalanceReader {
  /** What the faucet holds and the most one transfer can cost in gas. */
  funds(): Promise<{ balance: bigint; transferFee: bigint }>;
  /** Signs one transfer at the next nonce without sending it. */
  sign(
    to: string,
    value: bigint,
  ): Promise<{ hash: string; raw: string; nonce: number }>;
  broadcast(raw: string): Promise<void>;
  receipt(hash: string): Promise<"success" | "reverted" | null>;
  /** The next nonce the chain will accept, counting mined transactions only. */
  minedNonce(): Promise<number>;
}
export type DripState =
  | "unavailable"
  | "available"
  | "funded"
  | "sent"
  | "confirmed"
  | "daily-limit"
  | "empty";
export type DripView = {
  state: DripState;
  amountWei: string;
  txHash: string | null;
  message: string;
  recovery: string | null;
};
type Row = typeof schema.faucetDrips.$inferSelect;

const copy: Record<DripState, [message: string, recovery: string | null]> = {
  unavailable: [
    "The welcome drip is not set up in this environment.",
    `Get testnet MON from ${PUBLIC_FAUCET}.`,
  ],
  available: ["A welcome drip of testnet MON is ready for this wallet.", null],
  funded: ["This wallet already holds testnet MON.", null],
  sent: ["Your welcome drip is on its way.", null],
  confirmed: ["Your welcome drip has arrived.", null],
  "daily-limit": [
    "Today's welcome drips are used up.",
    `Try again after 00:00 UTC, or use ${PUBLIC_FAUCET}.`,
  ],
  empty: [
    "The welcome faucet is empty right now.",
    `Use ${PUBLIC_FAUCET}, then retry your action.`,
  ],
};
const view = (state: DripState, txHash: string | null = null): DripView => ({
  state,
  amountWei: WELCOME_DRIP_WEI.toString(),
  txHash,
  message: copy[state][0],
  recovery: copy[state][1],
});
const unreachable = () =>
  new AppError(
    "FAUCET_UNAVAILABLE",
    "The welcome faucet could not be reached.",
    503,
    `Retry shortly, or use ${PUBLIC_FAUCET}.`,
  );
const utcDay = (now: Date) => now.toISOString().slice(0, 10);

export class Faucet {
  // One send at a time in this process: the faucet account has a single nonce sequence.
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private readonly db: Database,
    private readonly balances: BalanceReader,
    private readonly chain?: FaucetChain,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async balanceOf(wallet: string) {
    try {
      return await this.balances.balanceOf(wallet);
    } catch {
      throw new AppError(
        "BALANCE_UNAVAILABLE",
        "Your wallet balance could not be read.",
        503,
        "Retry shortly. Nothing was sent.",
      );
    }
  }
  private async row(session: Session) {
    const [row] = await this.db
      .select()
      .from(schema.faucetDrips)
      .where(eq(schema.faucetDrips.userId, session.userId));
    return row;
  }
  private async mark(row: Row, values: Partial<Row>) {
    const [next] = await this.db
      .update(schema.faucetDrips)
      .set({ ...values, updatedAt: this.now() })
      .where(eq(schema.faucetDrips.id, row.id))
      .returning();
    return next!;
  }
  private log(session: Session, state: string, txHash: string | null) {
    console.info(
      JSON.stringify({
        event: "welcome_drip",
        state,
        userId: session.userId,
        wallet: session.wallet,
        txHash,
      }),
    );
  }

  /** Follows a signed transfer to its end. Resending can only repeat the same transfer. */
  private async settle(session: Session, row: Row, chain: FaucetChain) {
    if (row.status === "confirmed") return row;
    const outcome = await chain.receipt(row.txHash!);
    if (outcome === "success") {
      this.log(session, "confirmed", row.txHash);
      return this.mark(row, { status: "confirmed" });
    }
    // Reverted, or another transfer used its nonce: this one can never arrive.
    if (outcome === "reverted" || (await chain.minedNonce()) > row.nonce!) {
      this.log(session, "failed", row.txHash);
      return this.mark(row, { status: "failed" });
    }
    try {
      await chain.broadcast(row.rawTransaction!);
    } catch {
      return row;
    }
    return row.status === "sent" ? row : this.mark(row, { status: "sent" });
  }

  /** What the signed-in user can expect, without sending anything. */
  async status(session: Session, balance: bigint): Promise<DripView> {
    if (!this.chain) return view("unavailable");
    const row = await this.row(session);
    try {
      if (row?.status === "signed" || row?.status === "sent") {
        const settled = await this.settle(session, row, this.chain);
        if (settled.status !== "failed")
          return view(
            settled.status === "confirmed" ? "confirmed" : "sent",
            settled.txHash,
          );
      }
      if (row?.status === "confirmed") return view("confirmed", row.txHash);
      if (balance >= WELCOME_DRIP_WEI) return view("funded");
      const { balance: held, transferFee } = await this.chain.funds();
      if (held < WELCOME_DRIP_WEI + transferFee) return view("empty");
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw unreachable();
    }
    // A reservation this user already holds today does not count against them.
    const held =
      row?.status === "reserved" && row.reservedDay === utcDay(this.now());
    return view(
      !held && (await this.reservedToday()) >= DAILY_DRIP_CAP
        ? "daily-limit"
        : "available",
    );
  }
  private async reservedToday(db: Pick<Database, "select"> = this.db) {
    const [counted] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.faucetDrips)
      .where(
        and(
          eq(schema.faucetDrips.reservedDay, utcDay(this.now())),
          ne(schema.faucetDrips.status, "failed"),
        ),
      );
    return counted?.count ?? 0;
  }

  /** Sends the one welcome drip this user and wallet can receive. Safe to call again. */
  async drip(session: Session): Promise<DripView> {
    const chain = this.chain;
    if (!chain) return view("unavailable");
    const send = this.queue
      .catch(() => undefined)
      .then(() => this.send(session, chain));
    this.queue = send;
    try {
      return await send;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw unreachable();
    }
  }
  private async send(session: Session, chain: FaucetChain): Promise<DripView> {
    let row = await this.row(session);
    if (row && row.status !== "reserved" && row.status !== "failed") {
      row = await this.settle(session, row, chain);
      if (row.status !== "failed")
        return view(
          row.status === "confirmed" ? "confirmed" : "sent",
          row.txHash,
        );
    }
    if ((await chain.balanceOf(session.wallet)) >= WELCOME_DRIP_WEI)
      return view("funded");
    // Fail closed: never start a transfer the faucet cannot fully cover.
    const { balance, transferFee } = await chain.funds();
    if (balance < WELCOME_DRIP_WEI + transferFee) {
      this.log(session, "empty", null);
      return view("empty");
    }
    const reserved = await this.db.transaction(async (tx) => {
      // Serializes reservations across requests so the daily cap is exact.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(7074001)`);
      const [existing] = await tx
        .select()
        .from(schema.faucetDrips)
        .where(eq(schema.faucetDrips.userId, session.userId));
      if (existing && !["reserved", "failed"].includes(existing.status))
        return existing;
      const today = utcDay(this.now());
      const countsToday =
        existing?.status === "reserved" && existing.reservedDay === today;
      if (!countsToday && (await this.reservedToday(tx)) >= DAILY_DRIP_CAP)
        return null;
      const values = {
        wallet: session.wallet,
        status: "reserved",
        reservedDay: today,
        amountWei: WELCOME_DRIP_WEI.toString(),
        nonce: null,
        txHash: null,
        rawTransaction: null,
        updatedAt: this.now(),
      };
      const [next] = existing
        ? await tx
            .update(schema.faucetDrips)
            .set(values)
            .where(eq(schema.faucetDrips.id, existing.id))
            .returning()
        : await tx
            .insert(schema.faucetDrips)
            .values({ ...values, userId: session.userId })
            .returning();
      return next!;
    });
    if (!reserved) {
      this.log(session, "daily-limit", null);
      return view("daily-limit");
    }
    if (reserved.status !== "reserved")
      return view(
        reserved.status === "confirmed" ? "confirmed" : "sent",
        reserved.txHash,
      );
    // Store the signed transfer before it leaves, so any retry resends this exact one.
    const signed = await chain.sign(session.wallet, WELCOME_DRIP_WEI);
    const stored = await this.mark(reserved, {
      status: "signed",
      txHash: signed.hash,
      rawTransaction: signed.raw,
      nonce: signed.nonce,
    });
    await chain.broadcast(signed.raw);
    await this.mark(stored, { status: "sent" });
    this.log(session, "sent", signed.hash);
    return view("sent", signed.hash);
  }
}
