import { describe, expect, it } from "vitest";
import { columns, validateDemo, comparable } from "../deploy/demo-transfer.mjs";
import { thesisContentHash } from "../packages/shared/src/content-hash.ts";

function demo() {
  const stamp = "2026-10-10T00:00:00.000Z";
  const registry = "0x1889a7216b1ecad9a44910dd0996834d0894b9e1";
  const addresses = [
    "0xe281d002b4c2d0cf2cc2edfd1b3b57045101aba4",
    "0xd86946d01ed9de86a8a16406e73acb5b312a2d03",
  ];
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  const row = (table, data) =>
    Object.fromEntries(
      columns[table].map((key) => [
        key,
        data[key] ?? (key.endsWith("_at") ? stamp : null),
      ]),
    );
  const reasoning = "A synthetic transfer validation thesis.";
  const hash = thesisContentHash({ reasoning, entryNote: "", tags: [] });
  const ns = { chain_id: "10143", registry_address: registry, thesis_id: "1" };
  return {
    version: 1,
    chainId: 10143,
    registry,
    tables: {
      users: ids.map((id, i) =>
        row("users", {
          id,
          privy_did: `did:privy:testuser${i}`,
          handle: `testuser${i}`,
          primary_wallet: addresses[i],
        }),
      ),
      wallets: addresses.map((address, i) =>
        row("wallets", { address, user_id: ids[i], kind: "embedded" }),
      ),
      thesis_metadata: ids.map((id, i) =>
        row("thesis_metadata", {
          ...ns,
          thesis_id: String(i + 1),
          parent_id: String(i),
          id,
          author_user_id: id,
          author_wallet: addresses[i],
          intent: {
            marketId: 32,
            side: 0,
            leverageBps: 20000,
            targetPriceE8: "420000000000",
            invalidationPriceE8: "360000000000",
          },
          content_hash: hash,
          reasoning,
          entry_note: "",
          tags: [],
          status: "finalized",
          hidden: false,
          tx_hash: `0x${String(i + 1).repeat(64)}`,
          request_key: id,
        }),
      ),
      reactions: [row("reactions", { ...ns, user_id: ids[1], type: "agree" })],
      comments: [
        row("comments", {
          ...ns,
          id: ids[1],
          author_user_id: ids[1],
          body: "A synthetic public comment.",
          status: "visible",
          request_key: ids[1],
        }),
      ],
    },
  };
}
describe("bounded demo transfer manifest", () => {
  it("allows only the required five tables and records the necessary identity mappings", () => {
    const manifest = validateDemo(demo());
    expect(manifest.rows).toEqual({
      users: 2,
      wallets: 2,
      thesis_metadata: 2,
      reactions: 1,
      comments: 1,
    });
    expect(manifest.excluded).toContain("access tokens");
    expect(manifest.excluded).toContain("rate_buckets");
  });
  it("rejects unnecessary provider identity fields or extra tables", () => {
    const data = demo();
    data.tables.users[0].email = "synthetic@example.test";
    expect(() => validateDemo(data)).toThrow();
    const extra = demo();
    extra.tables.rate_buckets = [];
    expect(() => validateDemo(extra)).toThrow();
  });
  it("rejects private contact data embedded in optional profile text", () => {
    const data = demo();
    data.tables.users[0].bio = "Contact synthetic@example.test";
    expect(() => validateDemo(data)).toThrow();
  });
  it("rejects reassigned wallets and non-finalized metadata", () => {
    const data = demo();
    data.tables.wallets[0].user_id = data.tables.users[1].id;
    expect(() => validateDemo(data)).toThrow();
    const draft = demo();
    draft.tables.thesis_metadata[0].status = "draft";
    expect(() => validateDemo(draft)).toThrow();
  });
  it("rejects metadata that differs from its anchored content hash", () => {
    const data = demo();
    data.tables.thesis_metadata[0].reasoning =
      "An altered but plausible public thesis.";
    expect(() => validateDemo(data)).toThrow();
  });
  it("compares complete rows while tolerating query row ordering", () => {
    const data = demo(),
      reversed = structuredClone(data);
    reversed.tables.users.reverse();
    expect(comparable(reversed)).toEqual(comparable(data));
    reversed.tables.comments[0].body = "A different comment.";
    expect(comparable(reversed)).not.toEqual(comparable(data));
  });
});
