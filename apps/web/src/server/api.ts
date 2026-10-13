import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fetchPerplPublicContext, uint64IdSchema } from "@fork/shared";
import { authenticate, bearer, synchronizeIdentity } from "./auth";
import { getRuntime, getIdentityRuntime, testMode } from "./runtime";
import { AppError, assert, mapError } from "./errors";
import { prepareReadOnlyRelay } from "./perpl-relay";
import { databaseHealth } from "./database-health";
import { nansenContext } from "./nansen";
import { getServerEnv } from "../lib/env/server";
import { schema as dbSchema } from "@fork/db";
import { eq } from "drizzle-orm";
async function body(request: Request): Promise<unknown> {
  assert(
    request.headers.get("content-type")?.startsWith("application/json"),
    "VALIDATION_FAILED",
    "Send a JSON request.",
    400,
    "Retry with a supported form.",
  );
  const reader = request.body?.getReader();
  assert(
    reader,
    "VALIDATION_FAILED",
    "This form is empty.",
    400,
    "Complete the form and retry.",
  );
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.byteLength;
    if (size > 16000) {
      await reader.cancel();
      throw new AppError(
        "REQUEST_TOO_LARGE",
        "This form exceeds the request limit.",
        413,
        "Shorten the text and retry.",
      );
    }
    chunks.push(r.value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(all));
  } catch {
    throw new AppError(
      "VALIDATION_FAILED",
      "This request is not valid JSON.",
      400,
      "Refresh the form and try again.",
    );
  }
}
export async function handleApi(request: Request, path: string[]) {
  const requestId = randomUUID(),
    route = path.join("/"),
    method = request.method,
    url = new URL(request.url);
  const reply = (data: unknown, status = 200) =>
    Response.json(
      { ok: true, data },
      {
        status,
        headers: { "x-request-id": requestId, "cache-control": "no-store" },
      },
    );
  try {
    if (route === "health/database" && method === "GET")
      return reply(await databaseHealth());
    if (route.startsWith("test/")) {
      assert(
        testMode() && ["localhost", "127.0.0.1"].includes(url.hostname),
        "NOT_FOUND",
        "This route does not exist.",
        404,
        "Return to Feed.",
      );
      const origin = request.headers.get("origin"),
        host = request.headers.get("host");
      assert(
        host &&
          ["localhost", "127.0.0.1"].includes(
            new URL(`http://${host}`).hostname,
          ),
        "FORBIDDEN",
        "Test routes require a loopback host.",
        403,
        "Use the local test workspace.",
      );
      assert(
        !origin ||
          (new URL(origin).host === host &&
            new URL(origin).protocol === url.protocol),
        "FORBIDDEN",
        "Cross-origin test access is not allowed.",
        403,
        "Use the local test workspace.",
      );
      const { getTestRuntime } = await import("../../test-support/runtime");
      const runtime = await getTestRuntime();
      if (route === "test/identity" && method === "POST") {
        const v = z
          .object({ name: z.enum(["alice", "bob", "carol", "dana"]) })
          .strict()
          .parse(await body(request));
        const result = await runtime.login(v.name);
        return reply({ ...result, isAdmin: v.name === "carol" });
      }
      if (route === "test/reset" && method === "POST") {
        await runtime.reset();
        return reply({ reset: true });
      }
      if (route === "test/back" && method === "POST") {
        const session = await authenticate(
          runtime.core.db,
          runtime.auth,
          request,
        );
        const v = z
          .object({
            thesisId: uint64IdSchema,
            amountWei: z.string().regex(/^\d{1,30}$/),
          })
          .strict()
          .parse(await body(request));
        return reply(
          await runtime.back(session, v.thesisId, BigInt(v.amountWei)),
        );
      }
      if (route === "test/preview-split" && method === "GET") {
        const credits = await runtime.previewSplit(
          uint64IdSchema.parse(url.searchParams.get("thesisId")),
          BigInt(
            z
              .string()
              .regex(/^\d{1,30}$/)
              .parse(url.searchParams.get("amountWei")),
          ),
        );
        return reply(
          credits.map((credit) => ({
            ...credit,
            amount: credit.amount.toString(),
          })),
        );
      }
      if (route === "test/withdraw" && method === "POST")
        return reply(
          await runtime.withdraw(
            await authenticate(runtime.core.db, runtime.auth, request),
          ),
        );
      if (route === "test/faucet" && method === "POST") {
        const v = z
          .object({ balanceWei: z.string().regex(/^\d{1,30}$/) })
          .strict()
          .parse(await body(request));
        runtime.setFaucetBalance(BigInt(v.balanceWei));
        return reply({ balanceWei: v.balanceWei });
      }
      if (route === "test/submit" && method === "POST") {
        const session = await authenticate(
          runtime.core.db,
          runtime.auth,
          request,
        );
        const v = z
          .object({ draftId: z.string().uuid() })
          .strict()
          .parse(await body(request));
        return reply(await runtime.submit(session, v.draftId));
      }
      throw new AppError(
        "NOT_FOUND",
        "This route does not exist.",
        404,
        "Return to Feed.",
      );
    }
    if (route === "lineage/top" && method === "GET") {
      // The largest real lineage, as the landing page reads it. Null when there is none.
      const { readLandingLive } = await import("./landing");
      return reply((await readLandingLive())?.tree ?? null);
    }
    if (route === "context" && method === "GET") {
      if (testMode()) {
        const { getTestRuntime } = await import("../../test-support/runtime");
        return reply((await getTestRuntime()).context);
      }
      return reply(await fetchPerplPublicContext());
    }
    if (route === "session" && (method === "POST" || method === "GET")) {
      const token = bearer(request);
      const account = await getIdentityRuntime();
      let session;
      if (method === "POST") {
        const identity = await account.auth.verify(token);
        const v = z
          .object({ wallet: z.string().optional() })
          .strict()
          .parse(await body(request));
        session = await synchronizeIdentity(account.db, identity, v.wallet);
      } else {
        session = await authenticate(account.db, account.auth, request);
      }
      return reply({ session, isAdmin: account.adminDids.has(session.did) });
    }
    if (method !== "GET") bearer(request);
    const runtime = await getRuntime(),
      core = runtime.core;
    if (method === "GET") {
      if (route === "feed") {
        const mode = z
            .enum(["fresh", "most-forked", "smart-signal"])
            .parse(url.searchParams.get("mode") ?? "fresh"),
          offset = z.coerce
            .number()
            .int()
            .min(0)
            .max(500)
            .parse(url.searchParams.get("offset") ?? 0);
        return reply(await core.feed(mode, offset));
      }
      if (route === "explore") return reply(await core.explore());
      // Read without the indexer, so Back stays usable when backing reads fail.
      if (route === "backing")
        return reply({ contract: core.backingContract() });
      if (path[0] === "theses" && path.length === 2)
        return reply(await core.detail(uint64IdSchema.parse(path[1])));
      if (path[0] === "theses" && path[2] === "backing" && path.length === 3)
        return reply(await core.backingView(uint64IdSchema.parse(path[1])));
      if (path[0] === "theses" && path[2] === "tree" && path.length === 3)
        return reply(await core.tree(uint64IdSchema.parse(path[1])));
      if (path[0] === "profiles" && path.length === 2)
        return reply(
          await core.profile(
            z
              .string()
              .regex(/^[a-z0-9_]{3,24}$/)
              .parse(path[1]),
          ),
        );
      if (
        path[0] === "profiles" &&
        path[2] === "context" &&
        path.length === 3
      ) {
        const handle = z
          .string()
          .regex(/^[a-z0-9_]{3,24}$/)
          .parse(path[1]);
        const [user] = await core.db
          .select()
          .from(dbSchema.users)
          .where(eq(dbSchema.users.handle, handle));
        assert(
          user?.primaryWallet,
          "PROFILE_NOT_FOUND",
          "This profile is not available.",
          404,
          "Return to Explore.",
        );
        if (runtime.test)
          return reply(
            await nansenContext(
              core.db,
              undefined,
              0,
            )(user.id, user.primaryWallet),
          );
        const env = getServerEnv();
        return reply(
          await nansenContext(
            core.db,
            env.NANSEN_API_KEY,
            env.FORK_NANSEN_DAILY_CREDIT_BUDGET,
          )(user.id, user.primaryWallet),
        );
      }
    }
    const session = await authenticate(core.db, runtime.auth, request);
    if (route === "profile" && method === "POST")
      return reply(await core.updateProfile(session, await body(request)));
    if (path[0] === "handles" && path.length === 2 && method === "GET")
      return reply(await core.handleAvailability(session, path[1]!));
    if (route === "account/wallet" && method === "GET") {
      const balance = await runtime.faucet.balanceOf(session.wallet);
      return reply({
        wallet: session.wallet,
        balanceWei: balance.toString(),
        drip: await runtime.faucet.status(session, balance),
      });
    }
    if (route === "account/drip" && method === "POST") {
      await core.rate(session, "welcome-drip", 6, 3600);
      const drip = await runtime.faucet.drip(session);
      return reply({
        wallet: session.wallet,
        balanceWei: (await runtime.faucet.balanceOf(session.wallet)).toString(),
        drip,
      });
    }
    if (route === "theses/draft" && method === "POST")
      return reply(await core.draft(session, await body(request)));
    if (route === "theses/finalize" && method === "POST")
      return reply(await core.finalize(session, await body(request)));
    if (path[0] === "theses" && path[2] === "agree" && path.length === 3) {
      const id = uint64IdSchema.parse(path[1]);
      if (method === "GET") return reply(await core.hasAgreed(session, id));
      if (method === "PUT" || method === "DELETE")
        return reply(await core.agree(session, id, method === "PUT"));
    }
    if (
      path[0] === "theses" &&
      path[2] === "comments" &&
      path.length === 3 &&
      method === "POST"
    )
      return reply(
        await core.comment(
          session,
          uint64IdSchema.parse(path[1]),
          await body(request),
        ),
      );
    if (path[0] === "comments" && path.length === 2 && method === "DELETE")
      return reply(
        await core.deleteComment(session, z.string().uuid().parse(path[1])),
      );
    if (
      path[0] === "theses" &&
      path[2] === "report" &&
      path.length === 3 &&
      method === "POST"
    )
      return reply(
        await core.report(
          session,
          uint64IdSchema.parse(path[1]),
          await body(request),
        ),
      );
    if (route === "moderation" && method === "GET")
      return reply(await core.moderationQueue(session));
    if (path[0] === "moderation" && path.length === 2 && method === "PUT") {
      const v = z
        .object({ hidden: z.boolean() })
        .strict()
        .parse(await body(request));
      return reply(
        await core.moderate(session, uint64IdSchema.parse(path[1]), v.hidden),
      );
    }
    if (route === "executions/relay" && method === "POST") {
      await core.rate(session, "relay-boundary", 10, 60);
      prepareReadOnlyRelay(await body(request));
      throw new AppError(
        "RELAY_NOT_ENABLED",
        "Execution verification is not available.",
        501,
        "Nothing was sent. Your idea and its lineage are unaffected.",
      );
    }
    throw new AppError(
      "NOT_FOUND",
      "This route does not exist.",
      404,
      "Return to Feed.",
    );
  } catch (error) {
    const e = mapError(error);
    return Response.json(
      {
        ok: false,
        error: {
          code: e.code,
          message: e.message,
          recovery: e.recovery,
          requestId,
        },
      },
      {
        status: e.status,
        headers: { "x-request-id": requestId, "cache-control": "no-store" },
      },
    );
  }
}
