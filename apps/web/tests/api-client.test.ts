import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../src/lib/api-client";
afterEach(() => vi.restoreAllMocks());
describe("bounded social request budgets", () => {
  it("allows both upstream read attempts while retaining the mutation budget", async () => {
    const budget = vi.spyOn(AbortSignal, "timeout");
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ ok: true, data: { items: [] } })),
    );
    await api("feed");
    await api("profile", { method: "POST", body: {} });
    expect(budget.mock.calls).toEqual([[25000], [10000]]);
  });
  it("preserves explicit server recovery without substituting successful data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "UPSTREAM_UNAVAILABLE",
            message: "The data source did not respond.",
            recovery: "Retry shortly. Your data has not been changed.",
          },
        }),
        { status: 503 },
      ),
    );
    await expect(api("explore")).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      status: 503,
      recovery: "Retry shortly. Your data has not been changed.",
    });
  });
  it("maps interrupted response bodies into a recoverable connection failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Expired", "TimeoutError"),
    );
    await expect(api("feed")).rejects.toBeInstanceOf(ApiError);
    await expect(api("feed")).rejects.toMatchObject({
      code: "NETWORK_UNAVAILABLE",
      status: 503,
    });
  });
});
