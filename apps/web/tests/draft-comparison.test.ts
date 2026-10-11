import { describe, expect, it } from "vitest";
import { compareDraft, type ForkDraft } from "../src/lib/draft-comparison";
import { forkModificationSchema } from "@fork/shared";

const parent = {
  core: {
    marketId: 32,
    side: "long" as const,
    targetPriceE8: "420000000000",
    invalidationPriceE8: "360000000000",
    leverageBps: 20000,
  },
  metadata: {
    version: 1 as const,
    reasoning: "The original reasoning holds support.",
    entryNote: null,
    tags: ["demo", "eth"],
  },
};
const draft: ForkDraft = {
  side: "long",
  target: "4200",
  invalidation: "3600",
  leverage: "2",
  reasoning: parent.metadata.reasoning,
  entryNote: "",
  tags: "eth, demo",
};
describe("live fork comparison", () => {
  it("normalizes equivalent prices, whitespace and tag order", () => {
    expect(
      compareDraft(parent, {
        ...draft,
        target: "4200.00000000",
        reasoning: ` ${draft.reasoning} `,
        tags: "eth, demo, eth",
      }).changes,
    ).toEqual([]);
  });
  it("compares numeric and reasoning changes then removes reverted values", () => {
    const value = compareDraft(parent, {
      ...draft,
      target: "4400",
      leverage: "3",
      reasoning: "A new angle changes the expected continuation.",
    });
    expect(value.changes.map((c) => c.field)).toEqual([
      "targetPriceE8",
      "leverageBps",
      "reasoning",
    ]);
    expect(value.changes[0]).toMatchObject({
      before: "420000000000",
      after: "440000000000",
      meaningful: true,
    });
    expect(compareDraft(parent, draft).changes).toEqual([]);
  });
  it("does not let incomplete reasoning hide another valid modification", () => {
    const value = compareDraft(parent, {
      ...draft,
      target: "4400",
      reasoning: "",
    });
    expect(value.invalidFields).toEqual(["reasoning"]);
    expect(value.changes.map((c) => c.field)).toEqual(["targetPriceE8"]);
  });
  it("uses shared bounds for invalid numbers without claiming they are unchanged", () => {
    const value = compareDraft(parent, {
      ...draft,
      target: "-1",
      invalidation: "",
      leverage: "0",
      reasoning: "A valid changed explanation of the same idea.",
    });
    expect(value.invalidFields).toEqual([
      "targetPriceE8",
      "invalidationPriceE8",
      "leverageBps",
    ]);
    expect(value.changes.map((c) => c.field)).toEqual(["reasoning"]);
  });
  it("preserves exact fixed-point precision", () => {
    const value = compareDraft(parent, { ...draft, target: "4400.12345678" });
    expect(value.changes[0]?.after).toBe("440012345678");
  });
  it("keeps tags-only edits non-meaningful under publication validation", () => {
    const value = compareDraft(parent, { ...draft, tags: "different" });
    expect(value.changes[0]?.meaningful).toBe(false);
    expect(
      forkModificationSchema.safeParse({
        parent: {
          chainId: 10143,
          registryAddress: `0x${"1".repeat(40)}`,
          thesisId: "1",
          ...parent,
        },
        fork: {
          chainId: 10143,
          registryAddress: `0x${"1".repeat(40)}`,
          parentId: "1",
          core: value.core,
          metadata: value.metadata,
        },
      }).success,
    ).toBe(false);
  });
});
