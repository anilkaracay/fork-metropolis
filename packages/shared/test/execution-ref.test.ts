import { describe, expect, it } from "vitest";
import fixture from "./fixtures/execution-v1.json";
import {
  encodeExecutionReference,
  encodeFillIdentity,
  executionReference,
  perplFillIdentity,
  openingFillIdentity,
  executionReferenceSchema,
  FILL_DOMAIN,
  EXECUTION_DOMAIN,
} from "../src/execution-ref.ts";

const sample = () => executionReferenceSchema.parse(fixture.vectors[0]!.input);
describe("execution reference v1", () => {
  it("fixes domain separators", () => {
    expect(FILL_DOMAIN).toBe(fixture.fillDomain);
    expect(EXECUTION_DOMAIN).toBe(fixture.executionDomain);
  });
  it.each(fixture.vectors)(
    "matches independent cast ABI and hash vector %#",
    (vector) => {
      const input = executionReferenceSchema.parse(vector.input);
      expect(encodeFillIdentity(input.fill)).toBe(vector.fillAbi);
      expect(perplFillIdentity(input.fill)).toBe(vector.fillIdentity);
      expect(encodeExecutionReference(input)).toBe(vector.executionAbi);
      expect(executionReference(input)).toBe(vector.executionRef);
    },
  );
  it.each(["thesis", "registry", "wallet", "chain"])(
    "binds %s without allowing fill reuse",
    (field) => {
      const original = sample();
      const changed = sample();
      if (field === "thesis") changed.thesisId = "43";
      if (field === "registry")
        changed.registryAddress = "0x3333333333333333333333333333333333333333";
      if (field === "wallet")
        changed.walletAddress = "0x3333333333333333333333333333333333333333";
      if (field === "chain") {
        changed.chainId = 143;
        changed.fill.chainId = 143;
      }
      expect(executionReference(changed)).not.toBe(
        executionReference(original),
      );
      if (field !== "chain")
        expect(perplFillIdentity(changed.fill)).toBe(
          perplFillIdentity(original.fill),
        );
    },
  );
  it.each([
    "account",
    "order",
    "market",
    "transaction",
    "log",
    "venue",
    "instance",
  ])("binds immutable %s identity", (field) => {
    const original = sample();
    const changed = sample();
    if (field === "account") changed.fill.accountId = "8";
    if (field === "order") changed.fill.orderId = "124";
    if (field === "market") changed.fill.marketId = 16;
    if (field === "transaction")
      changed.fill.transactionHash = `0x${"55".repeat(32)}`;
    if (field === "log") changed.fill.logIndex = 6;
    if (field === "venue")
      changed.fill.exchangeAddress =
        "0x3333333333333333333333333333333333333333";
    if (field === "instance") changed.fill.instanceId = 13;
    expect(perplFillIdentity(changed.fill)).not.toBe(
      perplFillIdentity(original.fill),
    );
  });
  it("rejects inconsistent chains and zero hash", () => {
    const input = sample();
    expect(() => executionReference({ ...input, chainId: 143 })).toThrow();
    expect(() =>
      perplFillIdentity({
        ...input.fill,
        transactionHash: `0x${"00".repeat(32)}`,
      }),
    ).toThrow();
  });
});

const rawFill = {
  at: { txid: `0x${"44".repeat(32)}`, l: 5 },
  acc: 7,
  mkt: 32,
  oid: 123,
  t: 1,
  l: 2,
  p: 435000,
  s: 1200,
  f: "3",
};
describe("documented Perpl fill adapter", () => {
  it("uses existing response fields without positionId", () => {
    expect(openingFillIdentity(rawFill, sample().fill)).toEqual(sample().fill);
  });
  it.each([
    "transaction",
    "log",
    "price",
    "size",
    "unsafe account",
    "unsafe order",
    "closed order",
  ])("fails closed for missing/invalid %s", (field) => {
    const input: Record<string, unknown> = structuredClone(rawFill);
    if (field === "transaction") input.at = { l: 5 };
    if (field === "log") input.at = { txid: rawFill.at.txid };
    if (field === "price") delete input.p;
    if (field === "size") input.s = 0;
    if (field === "unsafe account") input.acc = Number.MAX_SAFE_INTEGER + 1;
    if (field === "unsafe order") input.oid = Number.MAX_SAFE_INTEGER + 1;
    if (field === "closed order") input.t = 3;
    expect(() => openingFillIdentity(input, sample().fill)).toThrow();
  });
});
