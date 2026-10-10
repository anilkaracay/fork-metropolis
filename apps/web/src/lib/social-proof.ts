import { z } from "zod";
import type { ThesisDetail } from "@fork/shared";
import { ApiError, type api } from "./api-client";

type Request = <T>(
  path: string,
  options?: Parameters<typeof api>[1],
) => Promise<T>;
const inputs = z.object({
  wallet: z.string().regex(/^0x[0-9a-f]{40}$/),
  rootId: z.string().regex(/^[1-9]\d{0,19}$/),
  forkId: z.string().regex(/^[1-9]\d{0,19}$/),
  rootDraftId: z.string().uuid(),
  forkDraftId: z.string().uuid(),
});

function requireProof(condition: unknown): asserts condition {
  if (!condition)
    throw new ApiError(
      "SOCIAL_PROOF_FAILED",
      "A live social boundary check failed.",
      "Review the selected account and published root/fork before retrying.",
      409,
    );
}

// Only normal authenticated API routes; no test adapter, signer or chain call.
// The caller keeps the real token inside the existing session adapter.
export async function checkSocialBoundaries(
  input: z.infer<typeof inputs>,
  request: Request,
) {
  const value = inputs.parse(input);
  const [root, fork, agree] = await Promise.all([
    request<ThesisDetail>(`theses/${value.rootId}`),
    request<ThesisDetail>(`theses/${value.forkId}`),
    request<{ agreed: boolean }>(`theses/${value.rootId}/agree`),
  ]);
  requireProof(
    root.metadataState === "trusted" &&
      fork.metadataState === "trusted" &&
      root.graph.thesisId === value.rootId &&
      fork.graph.thesisId === value.forkId &&
      root.graph.parentId === "0" &&
      fork.graph.parentId === value.rootId &&
      root.graph.chainId === fork.graph.chainId &&
      root.graph.registryAddress === fork.graph.registryAddress &&
      fork.author.wallet === value.wallet &&
      root.author.wallet !== value.wallet &&
      agree.agreed,
  );
  async function reject(
    path: string,
    options: Parameters<typeof api>[1],
    status: number,
    code: string,
  ) {
    let rejected = false;
    try {
      await request(path, options);
    } catch (error) {
      rejected =
        error instanceof ApiError &&
        error.status === status &&
        error.code === code;
    }
    requireProof(rejected);
  }
  for (let i = 0; i < 2; i++) {
    const repeated = await request<{ agreed: boolean }>(
      `theses/${value.rootId}/agree`,
      { method: "PUT" },
    );
    requireProof(repeated.agreed);
  }
  await reject(
    `theses/${value.rootId}/agree`,
    { method: "PUT", wallet: root.author.wallet },
    403,
    "WRONG_WALLET",
  );
  await reject(
    "theses/finalize",
    {
      method: "POST",
      body: { draftId: value.rootDraftId, txHash: root.graph.txHash },
    },
    403,
    "WRONG_WALLET",
  );
  await reject(
    "theses/draft",
    {
      method: "POST",
      body: {
        parentId: "invalid-parent",
        core: root.graph.core,
        metadata: root.metadata,
        requestKey: crypto.randomUUID(),
      },
    },
    400,
    "VALIDATION_FAILED",
  );
  // Same finalized transaction is replayed, never another wallet submission.
  for (let i = 0; i < 2; i++) {
    const replay = await request<{ thesisId: string; state: string }>(
      "theses/finalize",
      {
        method: "POST",
        body: { draftId: value.forkDraftId, txHash: fork.graph.txHash },
      },
    );
    requireProof(
      replay.thesisId === value.forkId && replay.state === "Published",
    );
  }
  const after = await request<ThesisDetail>(`theses/${value.rootId}`);
  requireProof(
    after.social.agrees === root.social.agrees &&
      after.graph.contentHash === root.graph.contentHash &&
      after.graph.txHash === root.graph.txHash &&
      JSON.stringify(after.metadata) === JSON.stringify(root.metadata),
  );
  return {
    namespace: {
      chainId: root.graph.chainId,
      registryAddress: root.graph.registryAddress,
    },
    wallet: value.wallet,
    rootId: value.rootId,
    forkId: value.forkId,
    repeatedAgreeRequests: 2,
    agreesBefore: root.social.agrees,
    agreesAfter: after.social.agrees,
    wrongWalletMutation: { status: 403, code: "WRONG_WALLET" },
    crossUserFinalize: { status: 403, code: "WRONG_WALLET" },
    malformedParent: { status: 400, code: "VALIDATION_FAILED" },
    ownFinalizeReplays: 2,
    rootMetadataUnchanged: true,
    walletSubmissionRequested: false,
  } as const;
}
