import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { envioQuery, forgetEnvioAnswers } from "../src/server/graph";

const endpoint = "https://envio.test/graphql";
let calls = 0;
let answer: () => Response;
beforeEach(() => {
  // Only the clock is faked: the network retry waits on real timers.
  vi.useFakeTimers({ now: new Date("2026-10-13T12:00:00Z"), toFake: ["Date"] });
  calls = 0;
  answer = () => Response.json({ data: { Thesis: [{ thesisId: "1" }] } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      calls += 1;
      return answer();
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  forgetEnvioAnswers();
});

it("asks once for identical queries that arrive together or within five seconds", async () => {
  const query = envioQuery(endpoint);
  const [a, b] = await Promise.all([
    query("{ Thesis { thesisId } }", {}),
    query("{ Thesis { thesisId } }", {}),
  ]);
  expect(a).toEqual(b);
  expect(calls).toBe(1);
  vi.setSystemTime(new Date("2026-10-13T12:00:04Z"));
  await query("{ Thesis { thesisId } }", {});
  expect(calls).toBe(1);
  // Different variables are a different question.
  await query("{ Thesis { thesisId } }", { id: "2" });
  expect(calls).toBe(2);
  vi.setSystemTime(new Date("2026-10-13T12:00:06Z"));
  await query("{ Thesis { thesisId } }", {});
  expect(calls).toBe(3);
});

it("stands in with the last answer for a minute when the indexer refuses, then fails closed", async () => {
  const query = envioQuery(endpoint);
  const first = await query("{ Thesis { thesisId } }", {});
  answer = () => new Response("rate limited", { status: 429 });
  vi.setSystemTime(new Date("2026-10-13T12:00:30Z"));
  expect(await query("{ Thesis { thesisId } }", {})).toEqual(first);
  vi.setSystemTime(new Date("2026-10-13T12:01:01Z"));
  await expect(query("{ Thesis { thesisId } }", {})).rejects.toBeDefined();
});

it("never holds a failed or partial answer", async () => {
  const query = envioQuery(endpoint);
  answer = () => Response.json({ errors: [{ message: "bad" }] });
  await expect(query("{ Thesis { thesisId } }", {})).rejects.toMatchObject({
    code: "ENVIO_UNAVAILABLE",
  });
  answer = () => Response.json({ data: { Thesis: [] } });
  expect(await query("{ Thesis { thesisId } }", {})).toEqual({ Thesis: [] });
  expect(calls).toBe(2);
});
