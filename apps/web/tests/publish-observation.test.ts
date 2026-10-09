import { describe, expect, it, vi } from "vitest";
import {
  appendPublishObservation,
  recordPublishObservation,
  safePublishObservations,
} from "../src/lib/publish-observation";
const key = "00000000-0000-4000-8000-000000000001";
const scope = {
  chainId: 10143 as const,
  registryAddress: `0x${"1".repeat(40)}`,
  wallet: `0x${"2".repeat(40)}`,
  parentId: "0",
};
describe("development publish observations", () => {
  it("retains original observed times after replay/refresh rather than inventing a new submission", () => {
    const first = appendPublishObservation(
      [],
      key,
      { ...scope, txHash: `0x${"3".repeat(64)}` },
      "Submitted",
      1000,
    );
    const resumed = appendPublishObservation(
      first,
      key,
      scope,
      "Submitted",
      5000,
    );
    expect(resumed[0]?.stages).toEqual([
      { stage: "Submitted", observedAtMs: 1000 },
    ]);
    expect(resumed[0]?.scope.txHash).toBe(`0x${"3".repeat(64)}`);
  });
  it("leaves T0 absent when recovery started without a submission observation", () => {
    const recovered = appendPublishObservation(
      [],
      key,
      scope,
      "Confirmed / indexing",
      5000,
    );
    expect(recovered[0]?.stages.some((s) => s.stage === "Submitted")).toBe(
      false,
    );
  });
  it.each(["wallet", "registryAddress", "parentId"])(
    "rejects a changed %s for the same publication",
    (field) => {
      const first = appendPublishObservation([], key, scope, "Draft", 1000);
      expect(() =>
        appendPublishObservation(
          first,
          key,
          {
            ...scope,
            [field]: field === "parentId" ? "1" : `0x${"4".repeat(40)}`,
          },
          "Submitted",
          2000,
        ),
      ).toThrow("namespace");
    },
  );
  it("rejects backward clocks and secret-bearing diagnostic records", () => {
    const first = appendPublishObservation([], key, scope, "Submitted", 2000);
    expect(() =>
      appendPublishObservation(first, key, scope, "Confirming", 1000),
    ).toThrow("clock");
    expect(
      safePublishObservations(
        JSON.stringify([{ ...first[0], token: "must never render" }]),
      ),
    ).toBe("[]");
    expect(safePublishObservations("corrupted")).toBe("[]");
  });
  it("never touches storage in production or the isolated test workspace", () => {
    const storage = { getItem: vi.fn(() => "[]"), setItem: vi.fn() };
    const window = { dispatchEvent: vi.fn() };
    vi.stubGlobal("window", window);
    vi.stubGlobal("localStorage", storage);
    try {
      vi.stubEnv("NODE_ENV", "production");
      recordPublishObservation(false, key, scope, "Submitted");
      vi.stubEnv("NODE_ENV", "development");
      recordPublishObservation(true, key, scope, "Submitted");
      expect(storage.getItem).not.toHaveBeenCalled();
      recordPublishObservation(false, key, scope, "Submitted");
      expect(storage.getItem).toHaveBeenCalledOnce();
      expect(storage.setItem).toHaveBeenCalledOnce();
      expect(window.dispatchEvent).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });
});
