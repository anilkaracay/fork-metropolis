import "server-only";
import { z } from "zod";

const httpUrl = z
  .url()
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an HTTP(S) application URL.",
  );
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FORK_PHASE: z
    .enum(["foundation", "social-core", "live-integration"])
    .default("social-core"),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//)
    .optional(),
  PRIVY_APP_SECRET: z.string().min(1).optional(),
  NANSEN_API_KEY: z.string().min(1).optional(),
  FORK_NANSEN_DAILY_CREDIT_BUDGET: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(20),
  FORK_REGISTRY_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .transform((v) => v.toLowerCase())
    .optional(),
  FORK_ENVIO_URL: httpUrl.optional(),
  MONAD_RPC_URL: httpUrl.default("https://testnet-rpc.monad.xyz"),
  FORK_ADMIN_DIDS: z.string().default(""),
  // Testnet-only welcome faucet key. Server-only; never logged or sent to the browser.
  FORK_FAUCET_PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .transform((v) => v as `0x${string}`)
    .optional(),
  FORK_TEST_MODE: z.enum(["1"]).optional(),
});

export function parseServerEnv(input: Record<string, unknown>) {
  const result = serverSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Invalid server configuration. Check NODE_ENV and FORK_PHASE in .env.example, then restart.",
    );
  if (result.data.NODE_ENV === "production" && result.data.FORK_TEST_MODE)
    throw new Error("Test adapters cannot be enabled in production.");
  return result.data;
}
