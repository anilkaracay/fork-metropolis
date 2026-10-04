import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { fileURLToPath } from "node:url";
import { connectDatabase } from "./index.ts";
const url = process.env.DATABASE_URL;
if (!url)
  throw new Error(
    "DATABASE_URL is required. Configure the intended Neon database before running migrations.",
  );
let connection: ReturnType<typeof connectDatabase> | undefined;
try {
  connection = connectDatabase(url);
  await migrate(connection.db, {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
  console.log("Committed database migrations applied successfully.");
} catch {
  console.error(
    "Database migration failed. Check the intended Neon development connection and migration state. Credentials and SQL parameters are not logged.",
  );
  process.exitCode = 1;
} finally {
  try {
    await connection?.close();
  } catch {
    console.error(
      "Database connection cleanup failed. Retry the migration-state check; no driver details are logged.",
    );
    process.exitCode = 1;
  }
}
