import { createHash } from "node:crypto";
import { z } from "zod";
import { openingFillIdentity, type FillIdentity } from "@fork/shared";
import { assert } from "./errors";

export const RELAY_ORIGIN = "https://testnet.perpl.xyz" as const;
export const ALLOWED_RELAY_METHODS = ["GET"] as const;
const query = z
  .object({
    count: z.number().int().min(1).max(100).default(100),
    page: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9_=-]+$/)
      .optional(),
  })
  .strict();
const intentSchema = z.discriminatedUnion("endpoint", [
  z.object({ endpoint: z.literal("wallet") }).strict(),
  z.object({ endpoint: z.literal("fills"), query }).strict(),
]);
export const relayProofSchema = z
  .object({
    request: intentSchema,
    proof: z
      .object({
        apiKey: z
          .string()
          .min(1)
          .max(1024)
          .regex(/^[\x21-\x7e]+$/),
        timestampMs: z.string().regex(/^\d{13}$/),
        nonce: z
          .string()
          .min(16)
          .max(128)
          .regex(/^[A-Za-z0-9_-]+$/),
        signature: z
          .string()
          .length(86)
          .regex(/^[A-Za-z0-9_-]+$/),
      })
      .strict(),
  })
  .strict();
export function canonicalRelayTarget(request: z.input<typeof intentSchema>) {
  const r = intentSchema.parse(request);
  if (r.endpoint === "wallet") return "/v1/trading/wallet";
  const params = new URLSearchParams({ count: String(r.query.count) });
  if (r.query.page) params.set("page", r.query.page);
  return `/v1/trading/fills?${params.toString()}`;
}
export function prepareReadOnlyRelay(input: unknown, now = Date.now()) {
  const value = relayProofSchema.parse(input),
    timestamp = Number(value.proof.timestampMs);
  assert(
    timestamp <= now + 3000 && now - timestamp <= 20000,
    "PROOF_EXPIRED",
    "This read-only authorization has expired.",
    400,
    "Prepare a fresh proof for this exact request and page.",
  );
  const target = canonicalRelayTarget(value.request),
    emptyHash = createHash("sha256").update("").digest("hex");
  return {
    url: `${RELAY_ORIGIN}/api${target}`,
    method: "GET" as const,
    target,
    body: undefined,
    canonical: [
      10143,
      "GET",
      target,
      value.proof.timestampMs,
      value.proof.nonce,
      emptyHash,
    ].join("\n"),
    headers: {
      "X-API-Key": value.proof.apiKey,
      "X-API-Timestamp": value.proof.timestampMs,
      "X-API-Nonce": value.proof.nonce,
      "X-API-Signature": value.proof.signature,
    },
  };
}
// Logging is an allowlist, never a recursive redactor that can miss a new credential field.
export function relayLog(input: unknown, result: "prepared" | "rejected") {
  const parsed = relayProofSchema.safeParse(input);
  return {
    event: "perpl_read_boundary",
    result,
    endpoint: parsed.success ? parsed.data.request.endpoint : "invalid",
  };
}
export interface EvidenceNormalizer {
  normalize(
    response: unknown,
    venue: Pick<FillIdentity, "chainId" | "exchangeAddress" | "instanceId">,
  ): { fills: FillIdentity[]; nextPage: string | null };
}
export const fillNormalizer: EvidenceNormalizer = {
  normalize(response, venue) {
    const page = z
      .object({
        d: z.array(z.unknown()).max(100),
        np: z.string().max(512).optional(),
      })
      .parse(response);
    return {
      fills: page.d.map((fill) => openingFillIdentity(fill, venue)),
      nextPage: page.np || null,
    };
  },
};
export interface ExecutionEvidenceVerifier {
  verify(input: {
    wallet: string;
    accountId: string;
    thesisId: string;
    marketId: number;
    side: "long" | "short";
    createdAt: number;
    authoritativeWallet: unknown;
    authoritativeFills: unknown;
  }): Promise<{ fillIdentity: FillIdentity; verifiedAt: Date }>;
}
// No transport and no database verification write in Phase 2. A prepared proof is not evidence.
