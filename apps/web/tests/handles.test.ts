import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "@fork/db/testing";
import { SocialCore } from "../src/server/social-core";
import {
  synchronizeIdentity,
  type Session,
  type VerifiedIdentity,
} from "../src/server/auth";
import type { GraphSource } from "../src/server/graph";
import { mapError } from "../src/server/errors";

const counts = {
  eligibleRoots: 0,
  successfulRoots: 0,
  eligibleForks: 0,
  successfulForks: 0,
  influence: 0,
  executionsInspired: 0,
};
const graph: GraphSource = {
  provenance: "envio-test",
  get: async () => null,
  getMany: async () => [],
  recent: async () => ({ nodes: [], activity: [], bounded: false }),
  tree: async () => ({ nodes: [], truncated: false }),
  author: async () => ({ nodes: [], counts }),
};
const identity = (n: number): VerifiedIdentity => ({
  did: `did:test:handle:${n}`,
  wallets: [
    { address: `0x${n.toString(16).padStart(40, "0")}`, kind: "embedded" },
  ],
});
let connection: Awaited<ReturnType<typeof testDatabase>>, core: SocialCore;
const signIn = (n: number): Promise<Session> =>
  synchronizeIdentity(connection.db, identity(n));

beforeAll(async () => {
  connection = await testDatabase(
    fileURLToPath(new URL("../../../packages/db/migrations", import.meta.url)),
  );
  core = new SocialCore(
    connection.db,
    graph,
    { creation: async () => Promise.reject(new Error("unused")) },
    { chainId: 10143, registryAddress: `0x${"aa".repeat(20)}` },
    async () => [],
  );
}, 60000);
afterAll(async () => {
  await connection.close();
});

describe("claiming a handle", () => {
  it("starts every account with a generated handle that is not yet claimed", async () => {
    const session = await signIn(1);
    expect(session.handle).toMatch(/^u_[0-9a-f]{12}$/);
    expect(session.handleClaimed).toBe(false);
  });

  it("claims a normalized handle and keeps links to the old one working", async () => {
    const before = await signIn(1);
    await core.updateProfile(before, { handle: "  Anil_K " });
    const after = await signIn(1);
    expect(after).toMatchObject({
      handle: "anil_k",
      displayName: "anil_k",
      handleClaimed: true,
    });
    expect((await core.profile("anil_k")).identity.handle).toBe("anil_k");
    expect((await core.profile(before.handle)).identity.handle).toBe("anil_k");
  });

  it("keeps the first alias and the claim time across later changes", async () => {
    const first = await signIn(2);
    await core.updateProfile(first, { handle: "second_user" });
    await core.updateProfile(await signIn(2), { handle: "renamed_user" });
    expect((await core.profile(first.handle)).identity.handle).toBe(
      "renamed_user",
    );
    await expect(core.profile("second_user")).rejects.toMatchObject({
      code: "PROFILE_NOT_FOUND",
    });
  });

  it("rejects handles that break the rules with the reason", async () => {
    const session = await signIn(3),
      other = await signIn(4);
    for (const [handle, message] of [
      ["ab", "Use 3 to 20 characters."],
      ["a".repeat(21), "Use 3 to 20 characters."],
      ["no-dashes", "Use lowercase letters, numbers and underscores."],
      ["admin", "That handle is reserved. Choose another."],
      [other.handle, "That handle is reserved. Choose another."],
    ] as const)
      expect(
        await core
          .updateProfile(session, { handle })
          .then(() => null, mapError),
      ).toMatchObject({ code: "VALIDATION_FAILED", status: 400, message });
    expect((await signIn(3)).handleClaimed).toBe(false);
  });

  it("lets exactly one of two simultaneous claims win", async () => {
    const [one, two] = [await signIn(5), await signIn(6)];
    const results = await Promise.allSettled([
      core.updateProfile(one, { handle: "contested" }),
      core.updateProfile(two, { handle: "contested" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const lost = results.find((r) => r.status === "rejected");
    expect(lost).toMatchObject({
      reason: { code: "HANDLE_UNAVAILABLE", status: 409 },
    });
    const claimed = [await signIn(5), await signIn(6)].filter(
      (s) => s.handle === "contested",
    );
    expect(claimed).toHaveLength(1);
  });

  it("edits the display name without claiming, and keeps it when omitted", async () => {
    const session = await signIn(7);
    await core.updateProfile(session, {
      handle: session.handle,
      displayName: "Deniz",
      bio: "Notes on rates.",
    });
    expect(await signIn(7)).toMatchObject({
      handle: session.handle,
      displayName: "Deniz",
      handleClaimed: false,
    });
    await core.updateProfile(session, { handle: "deniz" });
    expect(await signIn(7)).toMatchObject({
      handle: "deniz",
      displayName: "Deniz",
      handleClaimed: true,
    });
    expect((await core.profile("deniz")).bio).toBe("Notes on rates.");
  });

  it("answers availability for free, taken, reserved and own handles", async () => {
    const session = await signIn(8);
    expect(await core.handleAvailability(session, "Free_Name")).toEqual({
      handle: "free_name",
      available: true,
      problem: null,
    });
    expect(await core.handleAvailability(session, "anil_k")).toMatchObject({
      available: false,
      problem: "This handle is already taken.",
    });
    expect(await core.handleAvailability(session, "privy")).toMatchObject({
      available: false,
      problem: "That handle is reserved. Choose another.",
    });
    expect(
      await core.handleAvailability(session, session.handle),
    ).toMatchObject({ available: true });
  });
});
