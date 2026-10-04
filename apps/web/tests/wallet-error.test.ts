import { describe, expect, it } from "vitest";
import { walletError } from "../src/lib/wallet-error";
import { ApiError } from "../src/lib/api-client";
describe("wallet recovery mapping", () => {
  it("preserves existing structured errors", () => {
    const e = new ApiError(
      "WRONG_WALLET",
      "Wrong wallet.",
      "Select the author wallet.",
      403,
    );
    expect(walletError(e)).toBe(e);
  });
  it("finds user rejection inside provider causes", () => {
    expect(walletError({ cause: { code: 4001 } }).code).toBe("WALLET_REJECTED");
  });
  it("offers actionable gas and chain recovery without raw RPC details", () => {
    expect(walletError(new Error("insufficient funds for gas")).code).toBe(
      "GAS_REQUIRED",
    );
    expect(walletError(new Error("chain mismatch")).code).toBe("WRONG_CHAIN");
  });
  it("unknown sends require checking activity and recovering the hash", () => {
    expect(walletError(new Error("transport timeout"))).toMatchObject({
      code: "WALLET_RESULT_UNCERTAIN",
      recovery: expect.stringContaining(
        "Check wallet activity before retrying",
      ),
    });
  });
});
