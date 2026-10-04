import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema.ts";
import type { Database } from "./index.ts";
export async function testDatabase(migrationsFolder: string): Promise<{
  db: Database;
  close: () => Promise<void>;
}> {
  if (process.env.NODE_ENV === "production")
    throw new Error("Test database is unavailable in production.");
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return { db, close: () => client.close() };
}
