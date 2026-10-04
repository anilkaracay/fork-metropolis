import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { fileURLToPath } from "node:url";
import { connectDatabase } from "./index.ts";
const url = process.env.DATABASE_URL;
if (!url)
  throw new Error(
    "DATABASE_URL is required. Configure the intended Neon database before running migrations.",
  );
const connection = connectDatabase(url);
try {
  await migrate(connection.db, {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
} finally {
  await connection.close();
}
