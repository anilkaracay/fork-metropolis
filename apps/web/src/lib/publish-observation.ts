import { z } from "zod";

export const publishObservationKey = "fork-development-publish-observations";
export const publishObservationEvent = "fork-publish-observation";
export const publishStageSchema = z.enum([
  "Draft",
  "Awaiting wallet",
  "Submitted",
  "Confirming",
  "Confirmed / indexing",
  "Envio visible",
  "Published",
  "Failed",
]);
const scopeSchema = z
  .object({
    chainId: z.literal(10143),
    registryAddress: z.string().regex(/^0x[0-9a-f]{40}$/),
    wallet: z.string().regex(/^0x[0-9a-f]{40}$/),
    parentId: z.string().regex(/^\d+$/),
    txHash: z
      .string()
      .regex(/^0x[0-9a-f]{64}$/)
      .optional(),
    thesisId: z
      .string()
      .regex(/^[1-9]\d*$/)
      .optional(),
  })
  .strict();
const stagesSchema = z.array(
  z
    .object({
      stage: publishStageSchema,
      observedAtMs: z.number().int().nonnegative(),
    })
    .strict(),
);
const observationSchema = z
  .object({
    requestKey: z.uuid(),
    scope: scopeSchema,
    stages: stagesSchema,
  })
  .strict();
const observationsSchema = z.array(observationSchema).max(20);
export type PublishObservation = z.infer<typeof observationSchema>;
export type PublishStage = z.infer<typeof publishStageSchema>;

export function appendPublishObservation(
  existing: PublishObservation[],
  requestKey: string,
  scope: PublishObservation["scope"],
  stage: PublishStage,
  observedAtMs: number,
): PublishObservation[] {
  const previous = observationsSchema
    .parse(existing)
    .find((p) => p.requestKey === requestKey);
  const checked = scopeSchema.parse(scope);
  if (
    previous &&
    [
      "chainId",
      "registryAddress",
      "wallet",
      "parentId",
      "txHash",
      "thesisId",
    ].some((key) => {
      const k = key as keyof typeof checked;
      return (
        previous.scope[k] !== undefined &&
        checked[k] !== undefined &&
        previous.scope[k] !== checked[k]
      );
    })
  )
    throw new Error("Publish observation namespace changed.");
  const stages = previous?.stages ?? [];
  if (stages.length && observedAtMs < stages[stages.length - 1]!.observedAtMs)
    throw new Error("Local observation clock moved backwards.");
  const current = observationSchema.parse({
    requestKey,
    scope: { ...previous?.scope, ...checked },
    stages: stages.some((s) => s.stage === stage)
      ? stages
      : [...stages, { stage, observedAtMs }],
  });
  return [
    ...existing.filter((p) => p.requestKey !== requestKey).slice(-19),
    current,
  ];
}

export function safePublishObservations(value: string | null): string {
  try {
    return JSON.stringify(observationsSchema.parse(JSON.parse(value ?? "[]")));
  } catch {
    return "[]";
  }
}

// Public observations only; storage failure never changes publication/recovery.
export function recordPublishObservation(
  test: boolean,
  requestKey: string,
  scope: PublishObservation["scope"],
  stage: PublishStage,
) {
  if (
    process.env.NODE_ENV !== "development" ||
    test ||
    typeof window === "undefined"
  )
    return;
  try {
    const previous = JSON.parse(
      safePublishObservations(localStorage.getItem(publishObservationKey)),
    ) as PublishObservation[];
    const next = appendPublishObservation(
      previous,
      requestKey,
      scope,
      stage,
      Date.now(),
    );
    localStorage.setItem(publishObservationKey, JSON.stringify(next));
    window.dispatchEvent(new Event(publishObservationEvent));
  } catch {
    /* Diagnostics must not break the actual wallet flow. */
  }
}
