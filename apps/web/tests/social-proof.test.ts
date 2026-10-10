import { describe, expect, it } from "vitest";
import type { ThesisDetail } from "@fork/shared";
import { ApiError, type api } from "../src/lib/api-client";
import { checkSocialBoundaries } from "../src/lib/social-proof";

const wallet = "0x2222222222222222222222222222222222222222";
const input = {
  wallet,
  rootId: "1",
  forkId: "2",
  rootDraftId: "11111111-1111-4111-8111-111111111111",
  forkDraftId: "22222222-2222-4222-8222-222222222222",
};
function harness(
  options: {
    allowForeign?: boolean;
    inflated?: boolean;
    wrongCode?: boolean;
    sameAuthor?: boolean;
    ownReplayWrong?: boolean;
  } = {},
) {
  const root = {
    graph: {
      thesisId: "1",
      parentId: "0",
      chainId: 10143,
      registryAddress: "0x3333333333333333333333333333333333333333",
      txHash: "0x" + "a".repeat(64),
      contentHash: "0x" + "b".repeat(64),
      core: {},
    },
    author: {
      wallet: options.sameAuthor
        ? wallet
        : "0x1111111111111111111111111111111111111111",
    },
    metadataState: "trusted",
    metadata: { reasoning: "Public demo" },
    social: { agrees: 1 },
  } as unknown as ThesisDetail;
  const fork = {
    ...root,
    graph: { ...root.graph, thesisId: "2", parentId: "1" },
    author: { wallet },
  };
  let rootReads = 0;
  const calls: { path: string; options: unknown }[] = [];
  const request = async <T>(
    path: string,
    settings?: Parameters<typeof api>[1],
  ): Promise<T> => {
    calls.push({ path, options: settings });
    if (path === "theses/1")
      return {
        ...root,
        social: { agrees: options.inflated && ++rootReads > 1 ? 2 : 1 },
      } as T;
    if (path === "theses/2") return fork as T;
    if (path === "theses/1/agree") {
      if (settings?.wallet)
        throw new ApiError("WRONG_WALLET", "Rejected", "Retry", 403);
      return { agreed: true } as T;
    }
    if (path === "theses/draft")
      throw new ApiError("VALIDATION_FAILED", "Rejected", "Retry", 400);
    if (path === "theses/finalize") {
      if (
        (settings?.body as { draftId: string }).draftId === input.rootDraftId
      ) {
        if (options.allowForeign)
          return { thesisId: "1", state: "Published" } as T;
        throw new ApiError(
          options.wrongCode ? "SERVICE_UNAVAILABLE" : "WRONG_WALLET",
          "Rejected",
          "Retry",
          options.wrongCode ? 503 : 403,
        );
      }
      return {
        thesisId: options.ownReplayWrong ? "3" : "2",
        state: "Published",
      } as T;
    }
    throw Error("Unexpected request");
  };
  return { request, calls };
}
describe("real-session social proof transport", () => {
  it("sends actual repeated PUTs and replays only the existing finalized hash", async () => {
    const h = harness();
    const proof = await checkSocialBoundaries(input, h.request);
    expect(proof).toMatchObject({
      repeatedAgreeRequests: 2,
      agreesBefore: 1,
      agreesAfter: 1,
      ownFinalizeReplays: 2,
      rootMetadataUnchanged: true,
      walletSubmissionRequested: false,
    });
    expect(
      h.calls.filter(
        (c) =>
          c.path === "theses/1/agree" &&
          (c.options as { method?: string })?.method === "PUT",
      ),
    ).toHaveLength(3);
    expect(
      h.calls.filter(
        (c) =>
          c.path === "theses/finalize" &&
          (c.options as { body: { draftId: string } }).body.draftId ===
            input.forkDraftId,
      ),
    ).toHaveLength(2);
    expect(JSON.stringify(proof)).not.toContain(input.rootDraftId);
  });
  it("fails when cross-user finalization unexpectedly succeeds", async () => {
    await expect(
      checkSocialBoundaries(input, harness({ allowForeign: true }).request),
    ).rejects.toMatchObject({ code: "SOCIAL_PROOF_FAILED" });
  });
  it("does not mislabel an outage as authorization rejection", async () => {
    await expect(
      checkSocialBoundaries(input, harness({ wrongCode: true }).request),
    ).rejects.toMatchObject({ code: "SOCIAL_PROOF_FAILED" });
  });
  it("rejects same-author input before any mutation", async () => {
    const h = harness({ sameAuthor: true });
    await expect(checkSocialBoundaries(input, h.request)).rejects.toMatchObject(
      { code: "SOCIAL_PROOF_FAILED" },
    );
    expect(
      h.calls.every((c) => !(c.options as { method?: string })?.method),
    ).toBe(true);
  });
  it("fails if repeating Agree inflates the visible count", async () => {
    await expect(
      checkSocialBoundaries(input, harness({ inflated: true }).request),
    ).rejects.toMatchObject({ code: "SOCIAL_PROOF_FAILED" });
  });
  it("rejects finalize replay for an unexpected thesis", async () => {
    await expect(
      checkSocialBoundaries(input, harness({ ownReplayWrong: true }).request),
    ).rejects.toMatchObject({ code: "SOCIAL_PROOF_FAILED" });
  });
});
