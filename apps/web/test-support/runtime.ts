import { createHmac } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { testDatabase } from "@fork/db/testing";
import { schema } from "@fork/db";
import { keccak256, stringToHex } from "viem";
import { resolveMvpContext } from "@fork/shared";
import fixture from "../../../packages/shared/test/fixtures/perpl-context-2026-10-04.json";
import type { Runtime } from "../src/server/runtime";
import type { GraphSource } from "../src/server/graph";
import { normalizeGraph } from "../src/server/graph";
import type { CreationEvidence } from "../src/server/receipt";
import { SocialCore } from "../src/server/social-core";
import {
  synchronizeIdentity,
  type Session,
  type VerifiedIdentity,
} from "../src/server/auth";
import { AppError, assert } from "../src/server/errors";
import { Faucet, TRANSFER_GAS, type FaucetChain } from "../src/server/faucet";

export const testIdentities = {
  alice: {
    did: "did:test:alice",
    wallets: [{ address: `0x${"11".repeat(20)}`, kind: "embedded" }],
  },
  bob: {
    did: "did:test:bob",
    wallets: [{ address: `0x${"22".repeat(20)}`, kind: "embedded" }],
  },
  carol: {
    did: "did:test:carol",
    wallets: [{ address: `0x${"33".repeat(20)}`, kind: "embedded" }],
  },
  // A first-time account: it keeps its generated handle until it claims one.
  dana: {
    did: "did:test:dana",
    wallets: [{ address: `0x${"44".repeat(20)}`, kind: "embedded" }],
  },
} satisfies Record<string, VerifiedIdentity>;
const profiles: Partial<
  Record<keyof typeof testIdentities, { displayName: string; bio: string }>
> = {
  alice: {
    displayName: "Alice Chen",
    bio: "Writing ideas worth improving.",
  },
  bob: {
    displayName: "Bora Kaya",
    bio: "A better question can change the whole thesis.",
  },
  carol: {
    displayName: "Carol Bennett",
    bio: "A better question can change the whole thesis.",
  },
};
const FAUCET_START = 100n * 10n ** 18n;
type TestRuntime = Runtime & {
  login(
    name: keyof typeof testIdentities,
  ): Promise<{ session: Session; token: string }>;
  submit(session: Session, draftId: string): Promise<{ txHash: string }>;
  setFaucetBalance(balance: bigint): void;
  reset(): Promise<void>;
  context: ReturnType<typeof resolveMvpContext>;
};
const globalRuntime = globalThis as typeof globalThis & {
  forkPhase2Test?: Promise<TestRuntime>;
};
export function getTestRuntime(): Promise<TestRuntime> {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.FORK_TEST_MODE !== "1" ||
    !process.env.FORK_TEST_SECRET ||
    !process.env.FORK_TEST_MIGRATIONS_DIR
  )
    throw new Error("Local test adapters are disabled.");
  return (globalRuntime.forkPhase2Test ??= create());
}
async function create(): Promise<TestRuntime> {
  const secret = process.env.FORK_TEST_SECRET!;
  const token = (name: string) =>
    createHmac("sha256", secret).update(`test:${name}`).digest("hex");
  const bridge = async (path: string, body?: unknown) => {
    const response = await fetch(
      `http://127.0.0.1:${process.env.FORK_TEST_INDEXER_PORT ?? 4319}${path}`,
      {
        method: body === undefined ? "GET" : "POST",
        headers: {
          authorization: `Bearer ${secret}`,
          "content-type": "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new AppError(
        "TEST_INDEXER_UNAVAILABLE",
        "The isolated handler harness did not respond.",
        503,
        "Restart pnpm test:dev and retry the same draft.",
      );
    return response.json() as Promise<{
      nodes: unknown[];
      stats: {
        id: string;
        eligibleRoots: number;
        successfulRoots: number;
        eligibleForks: number;
        successfulForks: number;
        influence: number;
      }[];
    }>;
  };
  const snapshot = async () => {
    const response = await bridge("/graph");
    return { nodes: response.nodes.map(normalizeGraph), stats: response.stats };
  };
  const ns = { chainId: 10143, registryAddress: `0x${"aa".repeat(20)}` };
  const graph: GraphSource = {
    provenance: "envio-test",
    async get(id) {
      return (await snapshot()).nodes.find((n) => n.thesisId === id) ?? null;
    },
    async getMany(ids) {
      return (await snapshot()).nodes.filter((n) => ids.includes(n.thesisId));
    },
    async recent() {
      const nodes = (await snapshot()).nodes;
      return { nodes, activity: nodes, bounded: false };
    },
    async tree(root) {
      const nodes = (await snapshot()).nodes.filter((n) => n.rootId === root);
      return { nodes: nodes.slice(0, 250), truncated: nodes.length > 250 };
    },
    async author(wallet) {
      const s = await snapshot();
      const stats = s.stats.find(
        (a) => a.id === `${ns.chainId}:${ns.registryAddress}:${wallet}`,
      );
      return {
        nodes: s.nodes.filter((n) => n.author === wallet),
        counts: {
          eligibleRoots: stats?.eligibleRoots ?? 0,
          successfulRoots: stats?.successfulRoots ?? 0,
          eligibleForks: stats?.eligibleForks ?? 0,
          successfulForks: stats?.successfulForks ?? 0,
          influence: stats?.influence ?? 0,
          executionsInspired: 0,
        },
      };
    },
  };
  const connection = await testDatabase(process.env.FORK_TEST_MIGRATIONS_DIR!),
    receipts = new Map<string, CreationEvidence>(),
    indexed = new Set<string>(),
    draftHashes = new Map<string, string>();
  let nextId = 1n;
  const context = resolveMvpContext(fixture);
  // Simulated faucet account and wallet balances. A broadcast transfer lands at once.
  const ledger = new Map<string, bigint>(),
    transfers = new Map<string, { to: string; value: bigint; nonce: number }>(),
    landed = new Set<string>();
  let faucetBalance = FAUCET_START,
    faucetNonce = 0;
  const faucetChain: FaucetChain = {
    balanceOf: async (address) => ledger.get(address) ?? 0n,
    funds: async () => ({
      balance: faucetBalance,
      transferFee: TRANSFER_GAS * 102_000_000_000n,
    }),
    async sign(to, value) {
      const hash = keccak256(stringToHex(`drip:${to}:${faucetNonce}`));
      transfers.set(hash, { to, value, nonce: faucetNonce });
      return { hash, raw: hash, nonce: faucetNonce };
    },
    async broadcast(raw) {
      const transfer = transfers.get(raw);
      if (!transfer || landed.has(raw)) return;
      landed.add(raw);
      faucetNonce = transfer.nonce + 1;
      faucetBalance -= transfer.value;
      ledger.set(transfer.to, (ledger.get(transfer.to) ?? 0n) + transfer.value);
    },
    receipt: async (hash) => (landed.has(hash) ? "success" : null),
    minedNonce: async () => faucetNonce,
  };
  const auth = {
    async verify(accessToken: string) {
      const name = (
        Object.keys(testIdentities) as (keyof typeof testIdentities)[]
      ).find((name) => token(name) === accessToken);
      assert(
        name,
        "AUTH_INVALID",
        "Unknown test identity.",
        401,
        "Select a test identity again.",
      );
      return testIdentities[name];
    },
  };
  const core = new SocialCore(
    connection.db,
    graph,
    {
      async creation(hash) {
        const evidence = receipts.get(hash);
        assert(
          evidence,
          "TX_PENDING",
          "This test confirmation is not available.",
          202,
          "Retry the same test transaction.",
        );
        if (!indexed.has(hash)) {
          await bridge("/simulate", evidence);
          indexed.add(hash);
        }
        return evidence;
      },
    },
    ns,
    async () => Object.values(context.markets).map((m) => m.id),
    new Set([testIdentities.carol.did]),
  );
  return {
    core,
    auth,
    faucet: new Faucet(connection.db, faucetChain, faucetChain),
    test: true,
    context,
    setFaucetBalance(balance) {
      faucetBalance = balance;
    },
    async login(name) {
      let session = await synchronizeIdentity(
        connection.db,
        testIdentities[name],
      );
      const profile = profiles[name];
      if (profile && session.handle !== name) {
        await core.updateProfile(session, { handle: name, ...profile });
        session = await synchronizeIdentity(
          connection.db,
          testIdentities[name],
        );
      }
      return { session, token: token(name) };
    },
    async submit(session, draftId) {
      const [draft] = await connection.db
        .select()
        .from(schema.metadata)
        .where(eq(schema.metadata.id, draftId));
      assert(
        draft &&
          draft.authorUserId === session.userId &&
          draft.authorWallet === session.wallet,
        "WRONG_WALLET",
        "This test draft belongs to another identity.",
        403,
        "Switch to the draft author.",
      );
      const previous = draftHashes.get(draft.id);
      if (previous) return { txHash: previous };
      const id = nextId++,
        txHash = keccak256(stringToHex(`synthetic:${draft.id}:${id}`));
      draftHashes.set(draft.id, txHash);
      receipts.set(txHash, {
        ...ns,
        thesisId: String(id),
        parentId: draft.parentId,
        author: session.wallet,
        contentHash: draft.contentHash,
        core: draft.intent as CreationEvidence["core"],
        txHash,
        blockNumber: String(id),
        blockHash: keccak256(stringToHex(`test-block:${id}`)),
        createdAt: Math.floor(Date.now() / 1000),
        success: true,
      });
      return { txHash };
    },
    async reset() {
      await connection.db.execute(
        sql`TRUNCATE users, wallets, thesis_metadata, comments, reactions, reports, execution_evidence, rate_buckets, faucet_drips CASCADE`,
      );
      await bridge("/reset", {});
      receipts.clear();
      indexed.clear();
      draftHashes.clear();
      nextId = 1n;
      ledger.clear();
      transfers.clear();
      landed.clear();
      faucetBalance = FAUCET_START;
      faucetNonce = 0;
    },
  };
}
