import { describe, expect, it, vi, beforeEach } from "vitest";
import { databaseHealth } from "../src/server/database-health";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  url: "postgres://test-only",
  execute: vi.fn(),
  close: vi.fn(),
}));
vi.mock("@fork/db", () => ({
  connectDatabase: () => ({
    db: { execute: mocks.execute },
    close: mocks.close,
  }),
}));
vi.mock("../src/lib/env/server", () => ({
  getServerEnv: () => ({ DATABASE_URL: mocks.url }),
}));
beforeEach(() => {
  mocks.url = "postgres://test-only";
  mocks.execute.mockReset();
  mocks.close.mockReset();
});
describe("database health recovery", () => {
  it("requires configuration without involving graph or auth", async () => {
    mocks.url = "";
    await expect(databaseHealth()).rejects.toMatchObject({
      code: "CONFIGURATION_REQUIRED",
      status: 503,
    });
  });
  it("reports ready only after all committed migrations are present", async () => {
    mocks.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: 4 }] });
    expect(await databaseHealth()).toEqual({
      database: "ready",
      migrations: "applied",
    });
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });
  it("an incomplete migration set fails with recovery", async () => {
    mocks.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: 3 }] });
    await expect(databaseHealth()).rejects.toMatchObject({
      code: "DATABASE_UNAVAILABLE",
      status: 503,
    });
  });
  it("connection errors never expose the credential-bearing driver error", async () => {
    mocks.execute.mockRejectedValue(
      new Error("postgres://secret-password@example"),
    );
    try {
      await databaseHealth();
      throw Error("Expected failure");
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain("secret-password");
      expect(mocks.close).toHaveBeenCalledTimes(1);
    }
  });
});
