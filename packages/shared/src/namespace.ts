import { isAddress, zeroAddress, type Address } from "viem";
import { z } from "zod";

export const UINT64_MAX = (1n << 64n) - 1n;
export const UINT128_MAX = (1n << 128n) - 1n;
export const UINT32_MAX = 2 ** 32 - 1;

export const addressSchema = z
  .string()
  .refine(
    (value) =>
      isAddress(value, { strict: false }) &&
      value.toLowerCase() !== zeroAddress,
    "Use a nonzero EVM address.",
  )
  .transform((value) => value.toLowerCase() as Address);

// API-facing IDs use decimal strings; reject precision-losing JS numbers.
export const uint64IdSchema = z
  .string()
  .max(20)
  .regex(/^[1-9]\d*$/, "Use a positive decimal ID.")
  .refine((value) => BigInt(value) <= UINT64_MAX, "ID exceeds uint64.");

export const registryNamespaceSchema = z
  .object({
    chainId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    registryAddress: addressSchema,
  })
  .strict();
export const thesisIdentitySchema = registryNamespaceSchema.extend({
  thesisId: uint64IdSchema,
});
export type RegistryNamespace = z.output<typeof registryNamespaceSchema>;
export type ThesisIdentity = z.output<typeof thesisIdentitySchema>;

export function thesisIdentityKey(identity: ThesisIdentity): string {
  const parsed = thesisIdentitySchema.parse(identity);
  return `${parsed.chainId}:${parsed.registryAddress}:${parsed.thesisId}`;
}
