import { describe, expect, it } from "vitest";
import { decodeFunctionData } from "viem";
import {
  backCalldata,
  forkBackingAbi,
  MIN_BACKING_WEI,
  splitBacking,
  withdrawCalldata,
} from "../src/backing";

const MON = 10n ** 18n;
const tenth = MON / 10n;
const alice = "0x1111111111111111111111111111111111111111";
const bob = "0x2222222222222222222222222222222222222222";
const carol = "0x3333333333333333333333333333333333333333";
const total = (credits: { amount: bigint }[]) =>
  credits.reduce((sum, credit) => sum + credit.amount, 0n);

// The same cases as contracts/test/FORKBacking.t.sol, so the preview matches the chain.
describe("backing split preview", () => {
  it("gives a root's author everything", () => {
    expect(splitBacking({ thesisId: "1", author: alice }, MON)).toEqual([
      { recipient: alice, creditedThesisId: "1", role: 0, amount: MON },
    ]);
  });
  it("splits a fork 80 and 20", () => {
    expect(
      splitBacking(
        {
          thesisId: "2",
          author: bob,
          parent: { thesisId: "1", author: alice },
        },
        MON,
      ),
    ).toEqual([
      { recipient: bob, creditedThesisId: "2", role: 0, amount: 8n * tenth },
      { recipient: alice, creditedThesisId: "1", role: 1, amount: 2n * tenth },
    ]);
  });
  it("splits three levels 70, 20 and 10", () => {
    expect(
      splitBacking(
        {
          thesisId: "3",
          author: carol,
          parent: { thesisId: "2", author: bob },
          grandparent: { thesisId: "1", author: alice },
        },
        MON,
      ),
    ).toEqual([
      { recipient: carol, creditedThesisId: "3", role: 0, amount: 7n * tenth },
      { recipient: bob, creditedThesisId: "2", role: 1, amount: 2n * tenth },
      { recipient: alice, creditedThesisId: "1", role: 2, amount: tenth },
    ]);
  });
  it("credits an author who also wrote the parent once", () => {
    expect(
      splitBacking(
        {
          thesisId: "3",
          author: alice,
          parent: {
            thesisId: "2",
            author: alice.toUpperCase().replace("0X", "0x"),
          },
          grandparent: { thesisId: "1", author: carol },
        },
        MON,
      ),
    ).toEqual([
      { recipient: alice, creditedThesisId: "3", role: 0, amount: 9n * tenth },
      { recipient: carol, creditedThesisId: "1", role: 2, amount: tenth },
    ]);
  });
  it("credits an author who also wrote the grandparent once", () => {
    expect(
      splitBacking(
        {
          thesisId: "3",
          author: alice,
          parent: { thesisId: "2", author: bob },
          grandparent: { thesisId: "1", author: alice },
        },
        MON,
      ),
    ).toEqual([
      { recipient: alice, creditedThesisId: "3", role: 0, amount: 8n * tenth },
      { recipient: bob, creditedThesisId: "2", role: 1, amount: 2n * tenth },
    ]);
  });
  it("credits a parent who also wrote the grandparent once, as parent", () => {
    expect(
      splitBacking(
        {
          thesisId: "3",
          author: alice,
          parent: { thesisId: "2", author: bob },
          grandparent: { thesisId: "1", author: bob },
        },
        MON,
      ),
    ).toEqual([
      { recipient: alice, creditedThesisId: "3", role: 0, amount: 7n * tenth },
      { recipient: bob, creditedThesisId: "2", role: 1, amount: 3n * tenth },
    ]);
  });
  it("credits a single-author lineage in full", () => {
    expect(
      splitBacking(
        {
          thesisId: "3",
          author: alice,
          parent: { thesisId: "2", author: alice },
          grandparent: { thesisId: "1", author: alice },
        },
        MON,
      ),
    ).toEqual([
      { recipient: alice, creditedThesisId: "3", role: 0, amount: MON },
    ]);
  });
  it("leaves rounding dust with the author and always sums to the amount", () => {
    const lineage = {
      thesisId: "3",
      author: carol,
      parent: { thesisId: "2", author: bob },
      grandparent: { thesisId: "1", author: alice },
    };
    const credits = splitBacking(lineage, MIN_BACKING_WEI + 9n);
    expect(credits.map((c) => c.amount)).toEqual([
      7n * (MIN_BACKING_WEI / 10n) + 8n,
      2n * (MIN_BACKING_WEI / 10n) + 1n,
      MIN_BACKING_WEI / 10n,
    ]);
    for (const amount of [MIN_BACKING_WEI, 1n, 7n, 123456789012345678901n])
      expect(total(splitBacking(lineage, amount))).toBe(amount);
  });
});
describe("backing calldata", () => {
  it("encodes back and withdraw for the tested ABI", () => {
    expect(
      decodeFunctionData({ abi: forkBackingAbi, data: backCalldata("42") }),
    ).toEqual({ functionName: "back", args: [42n] });
    expect(
      decodeFunctionData({ abi: forkBackingAbi, data: withdrawCalldata() })
        .functionName,
    ).toBe("withdraw");
  });
});
