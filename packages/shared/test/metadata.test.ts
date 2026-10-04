import { describe, expect, it } from "vitest";
import vectors from "./fixtures/metadata-v1.json";
import {
  canonicalThesisMetadata,
  thesisContentHash,
  thesisMetadataSchema,
} from "../src/index.ts";

describe("metadata version 1", () => {
  it.each(vectors)(
    "matches independently generated canonical/hash vector %#",
    (vector) => {
      const input = thesisMetadataSchema.parse(vector.input);
      expect(canonicalThesisMetadata(input)).toBe(vector.canonical);
      expect(thesisContentHash(input)).toBe(vector.contentHash);
    },
  );
  it.each([undefined, null, "", " \n "])(
    "represents absent entryNote as null (%s)",
    (entryNote) => {
      const value = canonicalThesisMetadata({
        reasoning: "A sufficiently explained idea.",
        entryNote,
      });
      expect(value).toBe(
        '{"version":1,"reasoning":"A sufficiently explained idea.","tags":[],"entryNote":null}',
      );
    },
  );
  it("deduplicates before the three-tag limit", () => {
    expect(
      thesisMetadataSchema.parse({
        reasoning: "An explained thesis.",
        tags: [" B ", "a", "b", "C"],
      }).tags,
    ).toEqual(["a", "b", "c"]);
  });
  it("rejects four distinct tags", () => {
    expect(() =>
      thesisMetadataSchema.parse({
        reasoning: "An explained thesis.",
        tags: ["a", "b", "c", "d"],
      }),
    ).toThrow();
  });
  it.each(["", "two words", "x_y", "İdea"])("rejects invalid tag %s", (tag) => {
    expect(() =>
      thesisMetadataSchema.parse({
        reasoning: "An explained thesis.",
        tags: [tag],
      }),
    ).toThrow();
  });
  it("preserves internal whitespace and Unicode sequences", () => {
    const a = { reasoning: "Thesis: café  breakout.\nWait." };
    const b = { reasoning: "Thesis: cafe\u0301  breakout.\nWait." };
    expect(thesisContentHash(a)).not.toBe(thesisContentHash(b));
    expect(JSON.parse(canonicalThesisMetadata(a)).reasoning).toBe(a.reasoning);
  });
  it.each(["short", "x".repeat(501), "Explained\u0000 thesis"])(
    "rejects invalid reasoning %#",
    (reasoning) => {
      expect(() => thesisMetadataSchema.parse({ reasoning })).toThrow();
    },
  );
  it("accepts limits and rejects overlong note and unknown fields", () => {
    expect(
      thesisMetadataSchema.parse({
        reasoning: "x".repeat(500),
        entryNote: "y".repeat(160),
      }).reasoning.length,
    ).toBe(500);
    expect(() =>
      thesisMetadataSchema.parse({
        reasoning: "An explained thesis.",
        entryNote: "y".repeat(161),
      }),
    ).toThrow();
    expect(() =>
      thesisMetadataSchema.parse({
        reasoning: "An explained thesis.",
        smartMoney: true,
      }),
    ).toThrow();
  });
});
