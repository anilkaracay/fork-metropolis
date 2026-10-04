import { describe, expect, it } from "vitest";
import { parseClientEnv, parseServerEnv } from "../src/lib/env/schema";

describe("environment boundaries", () => {
  it("boots foundation without any secret", () => {
    expect(parseClientEnv({})).toEqual({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(parseServerEnv({})).toEqual({
      NODE_ENV: "development",
      FORK_PHASE: "foundation",
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
    expect(JSON.stringify(parseServerEnv(input))).not.toContain("secret");
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
