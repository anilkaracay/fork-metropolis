import fs from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { thesisContentHash } from "../packages/shared/src/content-hash.ts";

export const columns = {
  users: [
    "id",
    "privy_did",
    "handle",
    "display_name",
    "bio",
    "primary_wallet",
    "created_at",
    "updated_at",
  ],
  wallets: ["address", "user_id", "kind", "created_at", "updated_at"],
  thesis_metadata: [
    "id",
    "chain_id",
    "registry_address",
    "thesis_id",
    "author_user_id",
    "author_wallet",
    "parent_id",
    "intent",
    "content_hash",
    "reasoning",
    "entry_note",
    "tags",
    "status",
    "hidden",
    "tx_hash",
    "request_key",
    "expires_at",
    "finalized_at",
    "created_at",
    "updated_at",
  ],
  reactions: [
    "chain_id",
    "registry_address",
    "thesis_id",
    "user_id",
    "type",
    "created_at",
  ],
  comments: [
    "id",
    "chain_id",
    "registry_address",
    "thesis_id",
    "author_user_id",
    "body",
    "status",
    "request_key",
    "created_at",
    "updated_at",
  ],
};
const counts = {
  users: 2,
  wallets: 2,
  thesis_metadata: 2,
  reactions: 1,
  comments: 1,
};
const registry = "0x1889a7216b1ecad9a44910dd0996834d0894b9e1";
const publicWallets = [
  "0xe281d002b4c2d0cf2cc2edfd1b3b57045101aba4",
  "0xd86946d01ed9de86a8a16406e73acb5b312a2d03",
];
function check(value) {
  if (!value)
    throw Error(
      "Demo transfer validation failed; no private record details are logged.",
    );
}
export function validateDemo(data) {
  check(
    data?.version === 1 &&
      data?.chainId === 10143 &&
      data?.registry === registry,
  );
  check(
    isDeepStrictEqual(
      Object.keys(data).sort(),
      ["version", "chainId", "registry", "tables"].sort(),
    ),
  );
  check(
    isDeepStrictEqual(
      Object.keys(data.tables ?? {}).sort(),
      Object.keys(columns).sort(),
    ),
  );
  for (const [table, fields] of Object.entries(columns)) {
    check(
      Array.isArray(data.tables[table]) &&
        data.tables[table].length === counts[table],
    );
    for (const row of data.tables[table])
      check(isDeepStrictEqual(Object.keys(row).sort(), [...fields].sort()));
  }
  const users = new Map(data.tables.users.map((u) => [u.id, u]));
  check(users.size === 2);
  for (const u of users.values()) {
    check(
      /^[0-9a-f-]{36}$/.test(u.id) &&
        /^did:privy:[a-zA-Z0-9]+$/.test(u.privy_did),
    );
    check(/^[a-z0-9_]{3,24}$/.test(u.handle));
    check(
      (u.display_name === null ||
        (typeof u.display_name === "string" && u.display_name.length <= 80)) &&
        (u.bio === null || (typeof u.bio === "string" && u.bio.length <= 160)),
    );
    check(
      ![u.display_name, u.bio].some(
        (v) => typeof v === "string" && /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(v),
      ),
    );
  }
  const wallets = new Map(data.tables.wallets.map((w) => [w.address, w]));
  check(wallets.size === 2 && publicWallets.every((w) => wallets.has(w)));
  for (const w of wallets.values())
    check(users.has(w.user_id) && ["embedded", "external"].includes(w.kind));
  for (const u of users.values())
    check(wallets.get(u.primary_wallet)?.user_id === u.id);
  const metadata = new Map(
    data.tables.thesis_metadata.map((m) => [String(m.thesis_id), m]),
  );
  check(metadata.size === 2 && metadata.has("1") && metadata.has("2"));
  for (const m of metadata.values()) {
    check(
      Number(m.chain_id) === 10143 &&
        m.registry_address === registry &&
        m.status === "finalized" &&
        !m.hidden,
    );
    check(
      wallets.get(m.author_wallet)?.user_id === m.author_user_id &&
        typeof m.finalized_at === "string",
    );
    check(
      /^0x[0-9a-f]{64}$/.test(m.tx_hash) &&
        /^0x[0-9a-f]{64}$/.test(m.content_hash),
    );
    check(
      typeof m.reasoning === "string" &&
        m.reasoning.length >= 10 &&
        m.reasoning.length <= 500,
    );
    check(
      m.intent &&
        isDeepStrictEqual(
          Object.keys(m.intent).sort(),
          [
            "marketId",
            "side",
            "leverageBps",
            "targetPriceE8",
            "invalidationPriceE8",
          ].sort(),
        ),
    );
    check(
      m.content_hash ===
        thesisContentHash({
          reasoning: m.reasoning,
          entryNote: m.entry_note ?? "",
          tags: m.tags,
        }),
    );
  }
  check(
    String(metadata.get("1").parent_id) === "0" &&
      String(metadata.get("2").parent_id) === "1",
  );
  check(
    metadata.get("1").author_wallet === publicWallets[0] &&
      metadata.get("2").author_wallet === publicWallets[1],
  );
  for (const row of [...data.tables.reactions, ...data.tables.comments])
    check(
      Number(row.chain_id) === 10143 &&
        row.registry_address === registry &&
        String(row.thesis_id) === "1",
    );
  const b = wallets.get(publicWallets[1]).user_id;
  check(
    data.tables.reactions[0].user_id === b &&
      data.tables.reactions[0].type === "agree",
  );
  check(
    data.tables.comments[0].author_user_id === b &&
      data.tables.comments[0].status === "visible",
  );
  check(
    typeof data.tables.comments[0].body === "string" &&
      data.tables.comments[0].body.length > 0 &&
      data.tables.comments[0].body.length <= 280,
  );
  return {
    version: 1,
    chainId: 10143,
    registry,
    rows: counts,
    columns,
    identityFields: [
      "users.id",
      "users.privy_did",
      "wallets.user_id",
      "author/user foreign keys",
    ],
    excluded: [
      "access tokens",
      "cookies",
      "emails",
      "provider credentials",
      "private keys",
      "drafts",
      "rate_buckets",
      "wallet_context_cache",
      "reports",
      "execution_evidence",
    ],
  };
}
async function snapshot(client) {
  const tables = {};
  for (const table of ["thesis_metadata", "reactions", "comments"]) {
    const q = await client.query(
      `SELECT ${columns[table].join(",")} FROM ${table} WHERE chain_id=10143 AND registry_address=$1 AND thesis_id IN (1,2)`,
      [registry],
    );
    tables[table] = q.rows;
  }
  const ids = [
    ...new Set([
      ...tables.thesis_metadata.map((m) => m.author_user_id),
      ...tables.reactions.map((r) => r.user_id),
      ...tables.comments.map((c) => c.author_user_id),
    ]),
  ];
  tables.users = (
    await client.query(
      `SELECT ${columns.users.join(",")} FROM users WHERE id=ANY($1::uuid[])`,
      [ids],
    )
  ).rows;
  tables.wallets = (
    await client.query(
      `SELECT ${columns.wallets.join(",")} FROM wallets WHERE address=ANY($1::text[])`,
      [publicWallets],
    )
  ).rows;
  return JSON.parse(
    JSON.stringify({ version: 1, chainId: 10143, registry, tables }),
  );
}
export function comparable(data) {
  return Object.fromEntries(
    Object.keys(columns).map((t) => [
      t,
      data.tables[t].map((r) => JSON.stringify(r)).sort(),
    ]),
  );
}
async function main() {
  const [command, file] = process.argv.slice(2);
  check(["manifest", "export", "import", "verify"].includes(command));
  check(!!process.env.DATABASE_URL);
  const { Pool } = createRequire(
    new URL("../packages/db/package.json", import.meta.url),
  )("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    query_timeout: 8000,
    statement_timeout: 8000,
    max: 1,
  });
  pool.on("error", () => {});
  let client;
  try {
    client = await pool.connect();
    if (command === "manifest" || command === "export") {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const data = await snapshot(client);
      const manifest = validateDemo(data);
      await client.query("COMMIT");
      if (command === "export") {
        check(!!file);
        const fd = fs.openSync(file, "wx", 0o600);
        try {
          fs.writeFileSync(fd, JSON.stringify(data));
        } finally {
          fs.closeSync(fd);
        }
      }
      console.log(JSON.stringify({ status: "passed", command, manifest }));
    } else {
      check(!!file && fs.statSync(file).size < 256000);
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      validateDemo(data);
      await client.query("BEGIN");
      // Lock the target application tables before checking emptiness. Import
      // refuses any existing application data; no overwrite/reset path exists.
      if (command === "import") {
        await client.query(
          "LOCK TABLE users,wallets,thesis_metadata,reactions,comments,execution_evidence,reports,rate_buckets,wallet_context_cache IN ACCESS EXCLUSIVE MODE",
        );
        for (const table of [
          ...Object.keys(columns),
          "execution_evidence",
          "reports",
          "rate_buckets",
          "wallet_context_cache",
        ])
          check(
            Number(
              (await client.query(`SELECT count(*) FROM ${table}`)).rows[0]
                .count,
            ) === 0,
          );
        for (const table of [
          "users",
          "wallets",
          "thesis_metadata",
          "reactions",
          "comments",
        ]) {
          const fields = columns[table];
          for (const row of data.tables[table]) {
            const vals = fields.map((k) =>
              table === "users" && k === "primary_wallet"
                ? null
                : k === "intent"
                  ? JSON.stringify(row[k])
                  : row[k],
            );
            await client.query(
              `INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map((_, i) => `$${i + 1}`).join(",")})`,
              vals,
            );
          }
        }
        for (const u of data.tables.users)
          await client.query("UPDATE users SET primary_wallet=$1 WHERE id=$2", [
            u.primary_wallet,
            u.id,
          ]);
      }
      const result = await snapshot(client);
      validateDemo(result);
      check(isDeepStrictEqual(comparable(data), comparable(result)));
      await client.query("COMMIT");
      console.log(
        JSON.stringify({
          status: "passed",
          command,
          exactRoundTrip: true,
          rows: counts,
        }),
      );
    }
  } catch {
    try {
      await client?.query("ROLLBACK");
    } catch {
      /* no raw driver logging */
    }
    process.exitCode = 1;
    console.error(
      "Demo transfer failed. Inspect scope, fresh database and committed migrations; no secrets or record values are logged.",
    );
  } finally {
    client?.release();
    await pool.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
