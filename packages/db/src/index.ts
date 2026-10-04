import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
export { schema };
export function connectDatabase(url: string) {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5,
    query_timeout: 8000,
    statement_timeout: 8000,
  });
  // Idle connections can fail independently of a query. Never log raw driver
  // errors (which can include credentials); the next request maps its failure.
  pool.on("error", () => {
    console.error("Database connection interrupted. Retry the request.");
  });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
