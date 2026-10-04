import { z } from "zod";
import {
  registryNamespaceSchema,
  thesisIdentitySchema,
  uint64IdSchema,
  UINT32_MAX,
  UINT128_MAX,
} from "./namespace.ts";

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Text contains unsupported control characters.",
    );
const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{0,23}$/, "Use a short word or hyphenated tag.");
const tagsSchema = z
  .array(tagSchema)
  .max(32, "Too many input tags.")
  .default([])
  .transform((tags) => [...new Set(tags)].sort())
  .refine((tags) => tags.length <= 3, "Use at most three unique tags.");

export const thesisMetadataSchema = z
  .object({
    version: z.literal(1).default(1),
    reasoning: safeText(500).min(
      10,
      "Explain the thesis in at least 10 characters.",
    ),
    tags: tagsSchema,
    entryNote: safeText(160)
      .nullish()
      .transform((value) => value || null),
  })
  .strict();
export type ThesisMetadata = z.output<typeof thesisMetadataSchema>;
export type ThesisMetadataInput = z.input<typeof thesisMetadataSchema>;

const positivePrice = z
  .string()
  .max(39)
  .regex(/^[1-9]\d*$/)
  .refine((value) => BigInt(value) <= UINT128_MAX, "Price exceeds uint128.");
export const thesisCoreSchema = z
  .object({
    marketId: z.number().int().min(1).max(UINT32_MAX),
    side: z.enum(["long", "short"]),
    leverageBps: z.number().int().min(10_000).max(UINT32_MAX),
    targetPriceE8: positivePrice,
    invalidationPriceE8: positivePrice,
  })
  .strict();
export const thesisSchema = registryNamespaceSchema
  .extend({
    parentId: z.literal("0"),
    core: thesisCoreSchema,
    metadata: thesisMetadataSchema,
  })
  .strict();
export const forkSchema = registryNamespaceSchema
  .extend({
    parentId: uint64IdSchema,
    core: thesisCoreSchema,
    metadata: thesisMetadataSchema,
  })
  .strict();
export type ThesisCore = z.output<typeof thesisCoreSchema>;
export type Fork = z.output<typeof forkSchema>;

export function qualifyingForkChanges(
  parent: { core: ThesisCore; metadata: ThesisMetadata },
  child: { core: ThesisCore; metadata: ThesisMetadata },
): string[] {
  const a = thesisCoreSchema.parse(parent.core);
  const b = thesisCoreSchema.parse(child.core);
  if (a.marketId !== b.marketId)
    throw new Error("A fork must keep its parent's market.");
  const changes = (
    ["side", "targetPriceE8", "invalidationPriceE8", "leverageBps"] as const
  ).filter((key) => a[key] !== b[key]) as string[];
  if (
    thesisMetadataSchema.parse(parent.metadata).reasoning !==
    thesisMetadataSchema.parse(child.metadata).reasoning
  )
    changes.push("reasoning");
  return changes;
}

// The parent must later be loaded from canonical data, never trusted from a caller.
export const forkModificationSchema = z
  .object({
    parent: thesisIdentitySchema.extend({
      core: thesisCoreSchema,
      metadata: thesisMetadataSchema,
    }),
    fork: forkSchema,
  })
  .strict()
  .superRefine(({ parent, fork }, context) => {
    if (
      parent.chainId !== fork.chainId ||
      parent.registryAddress !== fork.registryAddress ||
      parent.thesisId !== fork.parentId
    ) {
      context.addIssue({
        code: "custom",
        path: ["fork", "parentId"],
        message:
          "Fork must reference its parent in the same registry namespace.",
      });
      return;
    }
    if (parent.core.marketId !== fork.core.marketId) {
      context.addIssue({
        code: "custom",
        path: ["fork", "core", "marketId"],
        message: "A fork must keep its parent's market.",
      });
      return;
    }
    if (qualifyingForkChanges(parent, fork).length === 0)
      context.addIssue({
        code: "custom",
        path: ["fork"],
        message:
          "Change side, target, invalidation, leverage or reasoning to fork.",
      });
  });
