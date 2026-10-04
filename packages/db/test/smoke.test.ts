import { fileURLToPath } from "node:url";
import { count } from "drizzle-orm";
import { expect, it } from "vitest";
import { testDatabase } from "../src/testing";
import { databaseSmoke } from "../src/smoke-check";
import * as s from "../src/schema";

it("the staging constraint smoke checks all six boundaries and leaves no fixtures", async () => {
  const connection = await testDatabase(
    fileURLToPath(new URL("../migrations", import.meta.url)),
  );
  try {
    const result = await databaseSmoke(connection.db);
    expect(result.rolledBack).toBe(true);
    expect(result.checks).toHaveLength(7);
    for (const table of [
      s.users,
      s.wallets,
      s.metadata,
      s.comments,
      s.reactions,
      s.reports,
      s.executions,
    ]) {
      const rows = await connection.db.select({ count: count() }).from(table);
      expect(rows[0]!.count).toBe(0);
    }
  } finally {
    await connection.close();
  }
}, 20000);
