import { connectDatabase } from "./index.ts";
import { databaseSmoke } from "./smoke-check.ts";

if (process.env.FORK_DATABASE_SMOKE !== "development") {
  console.error(
    "Set FORK_DATABASE_SMOKE=development only for the intended PostgreSQL development database.",
  );
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is absent. Configure apps/web/.env.local; never paste it into chat.",
  );
  process.exit(1);
}
let connection: ReturnType<typeof connectDatabase> | undefined;
try {
  connection = connectDatabase(url);
  console.log(JSON.stringify(await databaseSmoke(connection.db), null, 2));
} catch {
  // Driver errors can contain SQL parameters or the connection URL.
  console.error(
    "Database smoke failed. Check the development connection, committed migrations, and constraints. No smoke rows were committed.",
  );
  process.exitCode = 1;
} finally {
  try {
    await connection?.close();
  } catch {
    console.error(
      "Database connection cleanup failed. Retry the development smoke; no driver details are logged.",
    );
    process.exitCode = 1;
  }
}
