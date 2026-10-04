import { fetchPerplPublicContext } from "../packages/shared/src/perpl-context.ts";

try {
  const context = await fetchPerplPublicContext();
  console.log(
    JSON.stringify(
      { observedAt: new Date().toISOString(), ...context },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Public context check failed.",
  );
  console.error(
    "Check connectivity and rerun pnpm perpl:context; no authenticated request was made.",
  );
  process.exitCode = 1;
}
