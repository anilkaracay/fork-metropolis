import "server-only";
import { connectDatabase } from "@fork/db";
import { sql } from "drizzle-orm";
import { getServerEnv } from "../lib/env/server";
import { AppError, configuration } from "./errors";

export async function databaseHealth() {
  const url = getServerEnv().DATABASE_URL;
  if (!url) configuration("Application database");
  const connection = connectDatabase(url);
  try {
    await connection.db.execute(sql`SELECT 1`);
    const result = await connection.db.execute(sql`SELECT count(*)::int AS count
      FROM drizzle.__drizzle_migrations`);
    if (Number(result.rows[0]?.count) < 3)
      throw new Error("Migrations incomplete");
    return { database: "ready", migrations: "applied" };
  } catch {
    throw new AppError(
      "DATABASE_UNAVAILABLE",
      "The application database is unavailable or migrations are incomplete.",
      503,
      "Check the Neon development connection and apply committed migrations, then retry.",
    );
  } finally {
    await connection.close();
  }
}
