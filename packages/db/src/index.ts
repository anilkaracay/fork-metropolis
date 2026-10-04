import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import WebSocket from "ws";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
export { schema };
export function connectDatabase(url: string) {
  neonConfig.webSocketConstructor = WebSocket;
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5,
    query_timeout: 8000,
    statement_timeout: 8000,
  });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
