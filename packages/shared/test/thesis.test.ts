import { describe, expect, it } from "vitest";
import {
  forkSchema,
  forkModificationSchema,
  qualifyingForkChanges,
  registryNamespaceSchema,
  thesisIdentityKey,
  thesisMetadataSchema,
  thesisSchema,
  UINT64_MAX,
  UINT128_MAX,
  parseFixedPoint,
  formatFixedPoint,
  leverageBpsToPerpl,
} from "../src/index.ts";

const namespace = registryNamespaceSchema.parse({
  chainId: 10143,
  registryAddress: "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefabcd",
});
const core = {
  marketId: 32,
  side: "long" as const,
  leverageBps: 30_000,
  targetPriceE8: "435000000000",
  invalidationPriceE8: "402000000000",
};
const metadata = thesisMetadataSchema.parse({
  reasoning: "Breakout with a clear invalidation.",
});

describe("namespaced thesis schemas", () => {
  it("keeps chain and registry in every identity", () => {
    const key = thesisIdentityKey({ ...namespace, thesisId: "1" });
    expect(key).toBe("10143:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd:1");
    expect(
      thesisIdentityKey({ ...namespace, chainId: 143, thesisId: "1" }),
    ).not.toBe(key);
    expect(
      thesisIdentityKey({
        ...namespace,
        registryAddress: "0x1111111111111111111111111111111111111111",
        thesisId: "1",
      }),
    ).not.toBe(key);
  });
  it("uses different root and fork parent constraints", () => {
    expect(
      thesisSchema.parse({ ...namespace, parentId: "0", core, metadata })
        .parentId,
    ).toBe("0");
    expect(
      forkSchema.parse({
        ...namespace,
        parentId: UINT64_MAX.toString(),
        core,
        metadata,
      }).parentId,
    ).toBe(UINT64_MAX.toString());
    expect(() =>
      forkSchema.parse({ ...namespace, parentId: "0", core, metadata }),
    ).toThrow();
    expect(() =>
      forkSchema.parse({
        ...namespace,
        parentId: (UINT64_MAX + 1n).toString(),
        core,
        metadata,
      }),
    ).toThrow();
    expect(() =>
      forkSchema.parse({ ...namespace, parentId: 42, core, metadata }),
    ).toThrow();
  });
  it("rejects invalid namespaces and integer overflows", () => {
    expect(() =>
      registryNamespaceSchema.parse({
        ...namespace,
        registryAddress: "0x" + "0".repeat(40),
      }),
    ).toThrow();
    expect(() =>
      registryNamespaceSchema.parse({
        ...namespace,
        chainId: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow();
    expect(() =>
      thesisSchema.parse({
        ...namespace,
        parentId: "0",
        core: { ...core, targetPriceE8: (UINT128_MAX + 1n).toString() },
        metadata,
      }),
    ).toThrow();
  });
  it("qualifies core/reasoning changes but not tags/entryNote alone", () => {
    const parent = { core, metadata };
    expect(
      qualifyingForkChanges(parent, {
        core,
        metadata: { ...metadata, tags: ["eth"], entryNote: "Wait." },
      }),
    ).toEqual([]);
    expect(
      qualifyingForkChanges(parent, {
        core: { ...core, leverageBps: 20_000, side: "short" },
        metadata: { ...metadata, reasoning: "A competing bearish thesis." },
      }),
    ).toEqual(["side", "leverageBps", "reasoning"]);
    expect(() =>
      qualifyingForkChanges(parent, {
        core: { ...core, marketId: 16 },
        metadata,
      }),
    ).toThrow("market");
  });
  it("validates a changed fork against canonical parent identity", () => {
    const parent = { ...namespace, thesisId: "1", core, metadata };
    const fork = {
      ...namespace,
      parentId: "1",
      core: { ...core, leverageBps: 20_000 },
      metadata,
    };
    expect(
      forkModificationSchema.parse({ parent, fork }).fork.core.leverageBps,
    ).toBe(20_000);
    expect(() =>
      forkModificationSchema.parse({ parent, fork: { ...fork, core } }),
    ).toThrow("Change");
    expect(() =>
      forkModificationSchema.parse({ parent, fork: { ...fork, chainId: 143 } }),
    ).toThrow("namespace");
    expect(() =>
      forkModificationSchema.parse({
        parent,
        fork: { ...fork, parentId: "2" },
      }),
    ).toThrow("namespace");
    expect(() =>
      forkModificationSchema.parse({
        parent,
        fork: { ...fork, core: { ...fork.core, marketId: 16 } },
      }),
    ).toThrow("market");
  });
});

describe("lossless fixed-point conversion", () => {
  it.each([
    ["4350.01", 8, 435001000000n],
    ["0.00001", 5, 1n],
    ["100", 0, 100n],
    ["0", 8, 0n],
  ] as const)("parses %s at %s decimals", (value, decimals, raw) => {
    expect(parseFixedPoint(value, decimals)).toBe(raw);
    expect(formatFixedPoint(raw, decimals)).toBe(value);
  });
  it("round-trips uint128 maximum without floating point", () => {
    expect(parseFixedPoint(formatFixedPoint(UINT128_MAX, 8), 8)).toBe(
      UINT128_MAX,
    );
  });
  it.each(["1.000000001", "-1", "1e8", "01", "NaN"])(
    "rejects ambiguous/lossy input %s",
    (value) => {
      expect(() => parseFixedPoint(value, 8)).toThrow();
    },
  );
  it("rejects overflow and unsupported decimal precision", () => {
    expect(() => parseFixedPoint((UINT128_MAX + 1n).toString(), 0)).toThrow();
    expect(() => parseFixedPoint("1", 39)).toThrow();
    expect(() => formatFixedPoint(-1n, 8)).toThrow();
  });
  it("converts leverage only when exactly representable", () => {
    expect(leverageBpsToPerpl(30_000)).toBe(300);
    expect(leverageBpsToPerpl(10_100)).toBe(101);
    expect(() => leverageBpsToPerpl(10_001)).toThrow();
    expect(() => leverageBpsToPerpl(9_999)).toThrow();
  });
});
