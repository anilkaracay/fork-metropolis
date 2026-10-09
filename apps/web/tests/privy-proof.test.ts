import { describe, expect, it } from "vitest";
import {
  createWalletClient,
  custom,
  hashTypedData,
  type TypedDataDefinition,
} from "viem";
import { developmentTypedData } from "../src/lib/privy-proof";

const wallet = "0x1111111111111111111111111111111111111111";
describe("development proof RPC serialization", () => {
  it("preserves EIP-712 integer semantics without an unsafe JSON number", () => {
    const proof = developmentTypedData(wallet, "nonce", 1791543802);
    const bigintReference: TypedDataDefinition = {
      ...proof,
      message: { ...proof.message, issuedAt: 1791543802n },
    };
    expect(hashTypedData(proof)).toBe(hashTypedData(bigintReference));
    for (const timestamp of [-1, 1.5, NaN, 2 ** 48])
      expect(() => developmentTypedData(wallet, "nonce", timestamp)).toThrow(
        RangeError,
      );
  });
  it("sends a valid uint48 through the real viem adapter despite BigInt JSON overrides", async () => {
    const previous = Object.getOwnPropertyDescriptor(
      BigInt.prototype,
      "toJSON",
    );
    let sent: string | undefined;
    Object.defineProperty(BigInt.prototype, "toJSON", {
      configurable: true,
      value(this: bigint) {
        return `${this.toString()}n`;
      },
    });
    try {
      const client = createWalletClient({
        account: wallet,
        transport: custom({
          async request({ method, params }) {
            expect(method).toBe("eth_signTypedData_v4");
            sent = (params as [string, string])[1];
            return "0x";
          },
        }),
      });
      await client.signTypedData(
        developmentTypedData(wallet, "keep string 123n", 1791543802),
      );
      expect(JSON.parse(sent!).message).toMatchObject({
        issuedAt: 1791543802,
        nonce: "keep string 123n",
      });
    } finally {
      if (previous) Object.defineProperty(BigInt.prototype, "toJSON", previous);
      else Reflect.deleteProperty(BigInt.prototype, "toJSON");
    }
  });
});
