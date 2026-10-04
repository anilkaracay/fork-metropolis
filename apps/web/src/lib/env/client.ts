import { parseClientEnv } from "./schema";

// Next replaces literal NEXT_PUBLIC accesses. Never pass process.env wholesale.
export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
});
