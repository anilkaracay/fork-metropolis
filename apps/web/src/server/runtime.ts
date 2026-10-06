import "server-only";
import { connectDatabase } from "@fork/db";
import { fetchPerplPublicContext } from "@fork/shared";
import { clientEnv } from "../lib/env/client";
import { getServerEnv } from "../lib/env/server";
import { configuration } from "./errors";
import { privyVerifier, type AuthVerifier } from "./auth";
import type { Database } from "@fork/db";
import { envioGraph } from "./graph";
import { rpcReceipts } from "./receipt";
import { SocialCore } from "./social-core";
export type Runtime = { core: SocialCore; auth: AuthVerifier; test: boolean };
let live: Runtime | undefined;
export type IdentityRuntime = {
  db: Database;
  auth: AuthVerifier;
  adminDids: ReadonlySet<string>;
};
let identity: IdentityRuntime | undefined;
export function testMode() {
  return (
    process.env.NODE_ENV === "development" && process.env.FORK_TEST_MODE === "1"
  );
}
// Identity is independently live before registry deployment or indexing.
// Only the existing explicitly isolated test workspace gets its test verifier.
export async function getIdentityRuntime(): Promise<IdentityRuntime> {
  const env = getServerEnv();
  if (testMode()) {
    const runtime = await getRuntime();
    return {
      db: runtime.core.db,
      auth: runtime.auth,
      adminDids: runtime.core.adminDids,
    };
  }
  if (identity) return identity;
  if (!env.DATABASE_URL) configuration("Application database");
  const connection = connectDatabase(env.DATABASE_URL);
  identity = {
    db: connection.db,
    auth: privyVerifier(
      clientEnv.NEXT_PUBLIC_PRIVY_APP_ID,
      env.PRIVY_APP_SECRET,
    ),
    adminDids: new Set(
      env.FORK_ADMIN_DIDS.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  };
  return identity;
}
export async function getRuntime(): Promise<Runtime> {
  const env = getServerEnv();
  if (process.env.NODE_ENV === "development" && env.FORK_TEST_MODE === "1") {
    const { getTestRuntime } = await import("../../test-support/runtime");
    return getTestRuntime();
  }
  if (live) return live;
  if (!env.DATABASE_URL) configuration("Application database");
  if (!env.FORK_REGISTRY_ADDRESS || /^0x0{40}$/.test(env.FORK_REGISTRY_ADDRESS))
    configuration("FORK registry namespace");
  if (!env.FORK_ENVIO_URL) configuration("Envio graph reader");
  const ns = { chainId: 10143, registryAddress: env.FORK_REGISTRY_ADDRESS },
    account = await getIdentityRuntime();
  live = {
    core: new SocialCore(
      account.db,
      envioGraph(env.FORK_ENVIO_URL, ns.chainId, ns.registryAddress),
      rpcReceipts(env.MONAD_RPC_URL),
      ns,
      async () =>
        Object.values((await fetchPerplPublicContext()).markets).map(
          (m) => m.id,
        ),
      account.adminDids,
    ),
    auth: account.auth,
    test: false,
  };
  return live;
}
