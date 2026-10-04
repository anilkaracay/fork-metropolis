import { encodeAbiParameters, keccak256, stringToHex, type Hex } from "viem";
import { z } from "zod";
import {
  addressSchema,
  uint64IdSchema,
  UINT32_MAX,
  thesisIdentitySchema,
} from "./namespace.ts";

export const FILL_DOMAIN = keccak256(stringToHex("FORK_PERPL_FILL_V1"));
export const EXECUTION_DOMAIN = keccak256(
  stringToHex("FORK_PERPL_EXECUTION_V1"),
);
const txHash = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/)
  .refine(
    (value) => !/^0x0{64}$/.test(value),
    "Transaction hash must be nonzero.",
  )
  .transform((value) => value.toLowerCase() as Hex);
export const fillIdentitySchema = z
  .object({
    chainId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    exchangeAddress: addressSchema,
    instanceId: z.number().int().positive().max(UINT32_MAX),
    accountId: uint64IdSchema,
    marketId: z.number().int().positive().max(UINT32_MAX),
    orderId: uint64IdSchema,
    transactionHash: txHash,
    logIndex: z.number().int().nonnegative().max(UINT32_MAX),
  })
  .strict();
export type FillIdentity = z.output<typeof fillIdentitySchema>;
export const FILL_IDENTITY_ABI = [
  { type: "bytes32" },
  { type: "uint64" },
  { type: "address" },
  { type: "uint32" },
  { type: "uint64" },
  { type: "uint32" },
  { type: "uint64" },
  { type: "bytes32" },
  { type: "uint32" },
] as const;
export const EXECUTION_REF_ABI = [
  { type: "bytes32" },
  { type: "uint64" },
  { type: "address" },
  { type: "uint64" },
  { type: "address" },
  { type: "bytes32" },
] as const;

export function encodeFillIdentity(input: FillIdentity): Hex {
  const fill = fillIdentitySchema.parse(input);
  return encodeAbiParameters(FILL_IDENTITY_ABI, [
    FILL_DOMAIN,
    BigInt(fill.chainId),
    fill.exchangeAddress,
    fill.instanceId,
    BigInt(fill.accountId),
    fill.marketId,
    BigInt(fill.orderId),
    fill.transactionHash,
    fill.logIndex,
  ]);
}
export function perplFillIdentity(input: FillIdentity): Hex {
  return keccak256(encodeFillIdentity(input));
}
export const executionReferenceSchema = thesisIdentitySchema
  .extend({ walletAddress: addressSchema, fill: fillIdentitySchema })
  .strict()
  .refine(
    (input) => input.chainId === input.fill.chainId,
    "Thesis and Perpl chain must agree.",
  );
export type ExecutionReferenceInput = z.output<typeof executionReferenceSchema>;
export function encodeExecutionReference(input: ExecutionReferenceInput): Hex {
  const value = executionReferenceSchema.parse(input);
  return encodeAbiParameters(EXECUTION_REF_ABI, [
    EXECUTION_DOMAIN,
    BigInt(value.chainId),
    value.registryAddress,
    BigInt(value.thesisId),
    value.walletAddress,
    perplFillIdentity(value.fill),
  ]);
}
// Pure identifier helper. This does not authenticate or independently verify a fill.
export function executionReference(input: ExecutionReferenceInput): Hex {
  return keccak256(encodeExecutionReference(input));
}

const safePositiveInteger = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
export const perplOpeningFillSchema = z.object({
  at: z.object({
    txid: txHash,
    l: z.number().int().nonnegative().max(UINT32_MAX),
  }),
  acc: safePositiveInteger,
  mkt: z.number().int().positive().max(UINT32_MAX),
  oid: safePositiveInteger,
  t: z.union([z.literal(1), z.literal(2)]),
  l: z.union([z.literal(1), z.literal(2)]),
  p: safePositiveInteger,
  s: safePositiveInteger,
});
export function openingFillIdentity(
  input: unknown,
  venue: Pick<FillIdentity, "chainId" | "exchangeAddress" | "instanceId">,
): FillIdentity {
  const fill = perplOpeningFillSchema.parse(input);
  return fillIdentitySchema.parse({
    chainId: venue.chainId,
    exchangeAddress: venue.exchangeAddress,
    instanceId: venue.instanceId,
    accountId: fill.acc.toString(),
    marketId: fill.mkt,
    orderId: fill.oid.toString(),
    transactionHash: fill.at.txid,
    logIndex: fill.at.l,
  });
}
