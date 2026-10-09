import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

afterEach(() => vi.unstubAllEnvs());
const request = (
  url = "http://localhost:3000/dev/privy",
  host = "localhost:3000",
) => new NextRequest(url, { headers: { host } });
describe("development signing proof HTTP isolation", () => {
  it("rejects production before a streaming layout can flush HTTP 200", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = proxy(request());
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND", recovery: "Return to Feed." },
    });
  });
  it("rejects the fixture workspace and any non-development mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FORK_TEST_MODE", "1");
    expect(proxy(request()).status).toBe(404);
    vi.stubEnv("FORK_TEST_MODE", undefined);
    vi.stubEnv("NODE_ENV", "test");
    expect(proxy(request()).status).toBe(404);
  });
  it("rejects non-loopback URL/Host independently", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FORK_TEST_MODE", undefined);
    expect(proxy(request("http://remote.example/dev/privy")).status).toBe(404);
    expect(proxy(request(undefined, "remote.example")).status).toBe(404);
    expect(proxy(request(undefined, "")).status).toBe(404);
  });
  it("permits only real local development through to the existing session adapter", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FORK_TEST_MODE", undefined);
    expect(proxy(request()).headers.get("x-middleware-next")).toBe("1");
    expect(
      proxy(
        request("http://127.0.0.1:3000/dev/privy", "127.0.0.1:3000"),
      ).headers.get("x-middleware-next"),
    ).toBe("1");
  });
});
