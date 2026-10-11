// Production builds never bundle fixture identities or simulated chain data.
export async function getTestRuntime(): Promise<never> {
  throw new Error("Test adapters are unavailable in production.");
}
