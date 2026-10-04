import "server-only";
import { parseServerEnv } from "./schema";

export function getServerEnv() {
  return parseServerEnv({
    NODE_ENV: process.env.NODE_ENV,
    FORK_PHASE: process.env.FORK_PHASE,
    DATABASE_URL: process.env.DATABASE_URL,
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
    FORK_REGISTRY_ADDRESS: process.env.FORK_REGISTRY_ADDRESS,
    FORK_ENVIO_URL: process.env.FORK_ENVIO_URL,
    MONAD_RPC_URL: process.env.MONAD_RPC_URL,
    FORK_ADMIN_DIDS: process.env.FORK_ADMIN_DIDS,
    FORK_TEST_MODE: process.env.FORK_TEST_MODE,
  });
}
