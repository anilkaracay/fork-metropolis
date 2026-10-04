import { describe, expect, it } from "vitest";
import { parseClientEnv, parseServerEnv } from "../src/lib/env/schema";

describe("environment boundaries", () => {
  it("boots social core without any secret", () => {
    expect(parseClientEnv({})).toEqual({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(parseServerEnv({})).toEqual({
      NODE_ENV: "development",
      FORK_PHASE: "social-core",
      MONAD_RPC_URL: "https://testnet-rpc.monad.xyz",
      FORK_ADMIN_DIDS: "",
      FORK_NANSEN_DAILY_CREDIT_BUDGET: 20,
    });
  });
  it("only returns allowed public configuration", () => {
    const input = {
      NEXT_PUBLIC_APP_URL: "https://fork.example",
      DATABASE_URL: "secret",
      NANSEN_API_KEY: "secret",
      PRIVY_APP_SECRET: "secret",
    };
    expect(parseClientEnv(input)).toEqual({
      NEXT_PUBLIC_APP_URL: "https://fork.example",
    });
    expect(JSON.stringify(parseClientEnv(input))).not.toContain("secret");
    expect(
      parseServerEnv({
        PRIVY_APP_SECRET: "server-secret",
        NANSEN_API_KEY: "unused-secret",
      }),
    ).toMatchObject({ PRIVY_APP_SECRET: "server-secret" });
    expect(parseServerEnv({ NANSEN_API_KEY: "server-key" })).toHaveProperty(
      "NANSEN_API_KEY",
      "server-key",
    );
  });
  it("rejects production test bypass configuration", () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: "production", FORK_TEST_MODE: "1" }),
    ).toThrow("Test adapters cannot be enabled in production.");
  });
  it("fails safely on invalid configuration without printing input", () => {
    expect(() =>
      parseClientEnv({ NEXT_PUBLIC_APP_URL: "javascript:secret" }),
    ).toThrow("Check NEXT_PUBLIC_APP_URL");
    expect(() => parseServerEnv({ FORK_PHASE: "secret" })).toThrow(
      "Check NODE_ENV and FORK_PHASE",
    );
    try {
      parseClientEnv({ NEXT_PUBLIC_APP_URL: "invalid-sensitive-value" });
    } catch (error) {
      expect((error as Error).message).not.toContain("invalid-sensitive-value");
    }
  });
});
