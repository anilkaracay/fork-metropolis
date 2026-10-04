import "server-only";
import { parseServerEnv } from "./schema";

export function getServerEnv() {
  return parseServerEnv({
    NODE_ENV: process.env.NODE_ENV,
    FORK_PHASE: process.env.FORK_PHASE,
  });
}
