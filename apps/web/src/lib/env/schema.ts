import { z } from "zod";

const httpUrl = z
  .url()
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an HTTP(S) application URL.",
  );
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: httpUrl.default("http://localhost:3000"),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1).optional(),
});
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FORK_PHASE: z.enum(["foundation", "social-core"]).default("social-core"),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//)
    .optional(),
  PRIVY_APP_SECRET: z.string().min(1).optional(),
  FORK_REGISTRY_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .transform((v) => v.toLowerCase())
    .optional(),
  FORK_ENVIO_URL: httpUrl.optional(),
  MONAD_RPC_URL: httpUrl.default("https://testnet-rpc.monad.xyz"),
  FORK_ADMIN_DIDS: z.string().default(""),
  FORK_TEST_MODE: z.enum(["1"]).optional(),
});

// Accept an input record for tests, but return only explicitly allowed keys.
export function parseClientEnv(input: Record<string, unknown>) {
  const result = clientSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Invalid public configuration. Check NEXT_PUBLIC_APP_URL in .env.example, then restart.",
    );
  return result.data;
}
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
