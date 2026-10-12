import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { schema } from "@fork/db";
import { testDatabase } from "@fork/db/testing";
import { synchronizeIdentity, type Session } from "../src/server/auth";
import {
  DAILY_DRIP_CAP,
  Faucet,
  WELCOME_DRIP_WEI,
  type FaucetChain,
} from "../src/server/faucet";

const FEE = 21_000n * 102_000_000_000n;
// A faucet account whose broadcast transfers land when the test says so.
function fakeChain(balance = 10n * WELCOME_DRIP_WEI) {
  const state = {
    balance,
    nonce: 0,
    signed: [] as { hash: string; to: string; nonce: number }[],
    broadcasts: [] as string[],
    landed: new Set<string>(),
    wallets: new Map<string, bigint>(),
    failBroadcast: false,
    autoLand: true,
  };
  const chain: FaucetChain = {
    balanceOf: async (address) => state.wallets.get(address) ?? 0n,
    funds: async () => ({ balance: state.balance, transferFee: FEE }),
    async sign(to) {
      const hash = `0x${(state.signed.length + 1).toString(16).padStart(64, "0")}`;
      state.signed.push({ hash, to, nonce: state.nonce });
      return { hash, raw: hash, nonce: state.nonce };
    },
    async broadcast(raw) {
      if (state.failBroadcast) throw new Error("rpc down");
      state.broadcasts.push(raw);
      if (state.autoLand) land(raw);
    },
    receipt: async (hash) => (state.landed.has(hash) ? "success" : null),
    minedNonce: async () => state.nonce,
  };
  function land(hash: string) {
    const transfer = state.signed.find((s) => s.hash === hash)!;
    if (state.landed.has(hash)) return;
    state.landed.add(hash);
    state.nonce = transfer.nonce + 1;
    state.balance -= WELCOME_DRIP_WEI + FEE;
    state.wallets.set(
      transfer.to,
      (state.wallets.get(transfer.to) ?? 0n) + WELCOME_DRIP_WEI,
    );
  }
  return { chain, state, land };
}

let connection: Awaited<ReturnType<typeof testDatabase>>;
let now = new Date("2026-10-12T10:00:00Z");
const user = (n: number): Promise<Session> =>
  synchronizeIdentity(connection.db, {
    did: `did:test:faucet:${n}`,
    wallets: [
      {
        address: `0x${n.toString(16).padStart(40, "0")}`,
        kind: "embedded",
      },
    ],
  });
const faucet = (chain?: FaucetChain) =>
  new Faucet(
    connection.db,
    chain ?? { balanceOf: async () => 0n },
    chain,
    () => now,
  );
const rows = () => connection.db.select().from(schema.faucetDrips);

beforeEach(async () => {
  now = new Date("2026-10-12T10:00:00Z");
  connection = await testDatabase(
    fileURLToPath(new URL("../../../packages/db/migrations", import.meta.url)),
  );
}, 60000);
afterEach(async () => {
  await connection.close();
});

describe("welcome drip", () => {
  it("reports a clear state and sends nothing when no faucet is configured", async () => {
    const session = await user(1),
      service = faucet();
    expect(await service.status(session, 0n)).toMatchObject({
      state: "unavailable",
      recovery: expect.stringContaining("faucet.monad.xyz"),
    });
    expect((await service.drip(session)).state).toBe("unavailable");
    expect(await rows()).toHaveLength(0);
  });

  it("sends one drip, then reports it as confirmed", async () => {
    const { chain, state } = fakeChain(),
      session = await user(1),
      service = faucet(chain);
    expect((await service.status(session, 0n)).state).toBe("available");
    const sent = await service.drip(session);
    expect(sent).toMatchObject({
      state: "sent",
      amountWei: WELCOME_DRIP_WEI.toString(),
      txHash: state.signed[0]!.hash,
    });
    expect(state.wallets.get(session.wallet)).toBe(WELCOME_DRIP_WEI);
    expect(await service.status(session, WELCOME_DRIP_WEI)).toMatchObject({
      state: "confirmed",
      txHash: sent.txHash,
    });
    expect(await rows()).toMatchObject([
      {
        userId: session.userId,
        wallet: session.wallet,
        status: "confirmed",
        reservedDay: "2026-10-12",
        nonce: 0,
      },
    ]);
  });

  it("is idempotent: repeat and concurrent requests sign exactly one transfer", async () => {
    const { chain, state } = fakeChain(),
      session = await user(1),
      service = faucet(chain);
    const results = await Promise.all([
      service.drip(session),
      service.drip(session),
      service.drip(session),
    ]);
    await service.drip(session);
    expect(state.signed).toHaveLength(1);
    expect(new Set(results.map((r) => r.txHash)).size).toBe(1);
    expect(state.wallets.get(session.wallet)).toBe(WELCOME_DRIP_WEI);
    expect(await rows()).toHaveLength(1);
  });

  it("stops at the daily cap and opens again on the next UTC day", async () => {
    const { chain, state } = fakeChain(100n * WELCOME_DRIP_WEI),
      service = faucet(chain);
    for (let n = 1; n <= DAILY_DRIP_CAP; n++)
      expect((await service.drip(await user(n))).state).toBe("sent");
    const late = await user(DAILY_DRIP_CAP + 1);
    expect(await service.status(late, 0n)).toMatchObject({
      state: "daily-limit",
      recovery: expect.stringContaining("00:00 UTC"),
    });
    expect((await service.drip(late)).state).toBe("daily-limit");
    expect(state.signed).toHaveLength(DAILY_DRIP_CAP);
    expect(await rows()).toHaveLength(DAILY_DRIP_CAP);
    now = new Date("2026-10-13T00:00:01Z");
    expect((await service.drip(late)).state).toBe("sent");
    expect(state.signed).toHaveLength(DAILY_DRIP_CAP + 1);
  });

  it("fails closed when the faucet cannot cover a full drip and its fee", async () => {
    const { chain, state } = fakeChain(WELCOME_DRIP_WEI + FEE - 1n),
      session = await user(1),
      service = faucet(chain);
    expect(await service.status(session, 0n)).toMatchObject({
      state: "empty",
      recovery: expect.stringContaining("faucet.monad.xyz"),
    });
    expect((await service.drip(session)).state).toBe("empty");
    expect(state.signed).toHaveLength(0);
    expect(await rows()).toHaveLength(0);
    state.balance = WELCOME_DRIP_WEI + FEE;
    expect((await service.drip(session)).state).toBe("sent");
  });

  it("does not spend the allowance on a wallet that already holds MON", async () => {
    const { chain, state } = fakeChain(),
      session = await user(1),
      service = faucet(chain);
    state.wallets.set(session.wallet, WELCOME_DRIP_WEI);
    expect((await service.status(session, WELCOME_DRIP_WEI)).state).toBe(
      "funded",
    );
    expect((await service.drip(session)).state).toBe("funded");
    expect(state.signed).toHaveLength(0);
    expect(await rows()).toHaveLength(0);
  });

  it("resends the same signed transfer after a failed broadcast", async () => {
    const { chain, state } = fakeChain(),
      session = await user(1),
      service = faucet(chain);
    state.failBroadcast = true;
    await expect(service.drip(session)).rejects.toMatchObject({
      code: "FAUCET_UNAVAILABLE",
      status: 503,
    });
    expect(await rows()).toMatchObject([{ status: "signed" }]);
    state.failBroadcast = false;
    const retried = await service.drip(session);
    expect(retried).toMatchObject({
      state: "sent",
      txHash: state.signed[0]!.hash,
    });
    expect(state.signed).toHaveLength(1);
    expect(state.broadcasts).toEqual([state.signed[0]!.hash]);
    expect(state.wallets.get(session.wallet)).toBe(WELCOME_DRIP_WEI);
  });

  it("signs a fresh transfer only when the first can never arrive", async () => {
    const { chain, state } = fakeChain(),
      session = await user(1),
      service = faucet(chain);
    state.autoLand = false;
    await service.drip(session);
    // Still pending: asking again resends the same transfer, never a second one.
    expect((await service.drip(session)).txHash).toBe(state.signed[0]!.hash);
    expect(state.signed).toHaveLength(1);
    // Another transaction used the nonce, so the first transfer is dead.
    state.nonce = 1;
    state.autoLand = true;
    const replaced = await service.drip(session);
    expect(state.signed).toHaveLength(2);
    expect(replaced).toMatchObject({
      state: "sent",
      txHash: state.signed[1]!.hash,
    });
    expect(state.wallets.get(session.wallet)).toBe(WELCOME_DRIP_WEI);
    expect(await rows()).toHaveLength(1);
  });

  it("reads status without sending or reserving anything", async () => {
    const { chain, state } = fakeChain(),
      session = await user(1),
      service = faucet(chain);
    for (let i = 0; i < 3; i++) await service.status(session, 0n);
    expect(state.signed).toHaveLength(0);
    expect(await rows()).toHaveLength(0);
  });

  it("allows one drip row per user and per wallet in the database", async () => {
    const first = await user(1),
      second = await user(2);
    const row = {
      amountWei: "1",
      status: "reserved",
      reservedDay: "2026-10-12",
    };
    await connection.db
      .insert(schema.faucetDrips)
      .values({ ...row, userId: first.userId, wallet: first.wallet });
    await expect(
      connection.db
        .insert(schema.faucetDrips)
        .values({ ...row, userId: first.userId, wallet: second.wallet }),
    ).rejects.toThrow();
    await expect(
      connection.db
        .insert(schema.faucetDrips)
        .values({ ...row, userId: second.userId, wallet: first.wallet }),
    ).rejects.toThrow();
    await expect(
      connection.db.insert(schema.faucetDrips).values({
        ...row,
        status: "sent",
        userId: second.userId,
        wallet: second.wallet,
      }),
    ).rejects.toThrow();
  });
});
