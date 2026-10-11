try {
  const port = process.env.PORT ?? "3000";
  const response = await fetch(`http://127.0.0.1:${port}/api/health/database`, {
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.json();
  if (!response.ok || body.data?.database !== "ready") process.exitCode = 1;
} catch {
  process.exitCode = 1;
}
