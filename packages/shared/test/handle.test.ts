import { describe, expect, it } from "vitest";
import {
  handleProblem,
  handleSchema,
  isGeneratedHandle,
  RESERVED_HANDLES,
} from "../src/handle";

describe("handle rules", () => {
  it("accepts 3 to 20 lowercase letters, digits and underscores", () => {
    for (const handle of ["abc", "anil_k", "trader_42", "a".repeat(20)])
      expect(handleProblem(handle)).toBeNull();
  });
  it("normalizes case and outer whitespace before checking", () => {
    expect(handleSchema.parse("  Anil_K ")).toBe("anil_k");
  });
  it("rejects handles outside the length bounds", () => {
    expect(handleProblem("ab")).toBe("Use 3 to 20 characters.");
    expect(handleProblem("a".repeat(21))).toBe("Use 3 to 20 characters.");
    expect(handleProblem("")).toBe("Use 3 to 20 characters.");
  });
  it("rejects other characters", () => {
    for (const handle of ["anil-k", "anil.k", "anıl", "anil k", "a@b_c"])
      expect(handleProblem(handle)).toBe(
        "Use lowercase letters, numbers and underscores.",
      );
  });
  it("blocks reserved words in any case", () => {
    for (const handle of [...RESERVED_HANDLES, "ADMIN", " Fork "])
      expect(handleProblem(handle)).toBe(
        "That handle is reserved. Choose another.",
      );
  });
  it("blocks the generated starting form but not lookalikes", () => {
    expect(isGeneratedHandle("u_4dcde4749ffd")).toBe(true);
    expect(handleProblem("u_4dcde4749ffd")).toBe(
      "That handle is reserved. Choose another.",
    );
    expect(handleProblem("u_anil")).toBeNull();
    expect(handleProblem("u_4dcde4749ffz")).toBeNull();
  });
  it("reports the problem through the schema", () => {
    const result = handleSchema.safeParse("no");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Use 3 to 20 characters.");
  });
});
