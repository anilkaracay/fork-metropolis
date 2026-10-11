import {
  forkDifference,
  parseFixedPoint,
  thesisCoreSchema,
  thesisMetadataSchema,
  type ThesisCore,
  type ThesisMetadata,
} from "@fork/shared";

export type ForkDraft = {
  side: "long" | "short";
  target: string;
  invalidation: string;
  leverage: string;
  reasoning: string;
  entryNote: string;
  tags: string;
};

// Preview uses the same field schemas and canonical comparison as publication.
// Incomplete fields are explicitly pending, rather than erasing other valid changes.
export function compareDraft(
  parent: { core: ThesisCore; metadata: ThesisMetadata },
  draft: ForkDraft,
) {
  const core = { ...parent.core },
    metadata = { ...parent.metadata };
  const invalidFields: string[] = [];
  function assign(
    field: keyof ThesisCore | keyof ThesisMetadata,
    parse: () => unknown,
  ) {
    try {
      if (field in core)
        Object.assign(core, {
          [field]:
            thesisCoreSchema.shape[field as keyof ThesisCore].parse(parse()),
        });
      else
        Object.assign(metadata, {
          [field]:
            thesisMetadataSchema.shape[field as keyof ThesisMetadata].parse(
              parse(),
            ),
        });
    } catch {
      invalidFields.push(field);
    }
  }
  assign("side", () => draft.side);
  assign("targetPriceE8", () => parseFixedPoint(draft.target, 8).toString());
  assign("invalidationPriceE8", () =>
    parseFixedPoint(draft.invalidation, 8).toString(),
  );
  assign("leverageBps", () =>
    Number(parseFixedPoint(draft.leverage, 4, 4294967295n)),
  );
  assign("reasoning", () => draft.reasoning);
  assign("entryNote", () => draft.entryNote);
  assign("tags", () =>
    draft.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  );
  return {
    core,
    metadata,
    invalidFields,
    changes: forkDifference(parent, { core, metadata }),
  };
}
