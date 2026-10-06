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
// Accept an input record for tests, but return only explicitly allowed keys.
export function parseClientEnv(input: Record<string, unknown>) {
  const result = clientSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Invalid public configuration. Check NEXT_PUBLIC_APP_URL in .env.example, then restart.",
    );
  return result.data;
}
