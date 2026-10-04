import { z } from "zod";

const httpUrl = z
  .url()
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an HTTP(S) application URL.",
  );
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: httpUrl.default("http://localhost:3000"),
});
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FORK_PHASE: z.literal("foundation").default("foundation"),
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
  return result.data;
}
