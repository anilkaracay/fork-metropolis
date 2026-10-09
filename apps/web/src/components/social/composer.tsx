"use client";
import Link from "next/link";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  forkDifference,
  forkModificationSchema,
  parseFixedPoint,
  thesisCoreSchema,
  thesisMetadataSchema,
  type ThesisDetail,
} from "@fork/shared";
import type { PublishIntent } from "@fork/shared";
import { api, ApiError } from "@/lib/api-client";
import { useSession } from "./session";
import { EmptyState, ErrorState, Skeleton, Avatar } from "./common";
import { marketName, price, useMarkets } from "./thesis-card";
import { Icon } from "./icon";
import {
  recordPublishObservation,
  type PublishStage,
} from "@/lib/publish-observation";

export function Composer({
  parentId,
  challenge = false,
}: {
  parentId?: string;
  challenge?: boolean;
}) {
  const parent = useQuery({
    queryKey: ["detail", parentId],
    enabled: !!parentId,
    queryFn: () => api<ThesisDetail>(`theses/${parentId}`),
  });
  if (parentId && parent.isPending) return <Skeleton cards={2} />;
  if (parent.error)
    return (
      <ErrorState error={parent.error} retry={() => void parent.refetch()} />
    );
  if (parentId && parent.data?.metadataState !== "trusted")
    return (
      <EmptyState
        title="This parent’s reasoning is unavailable."
        description="Choose an idea with intact, visible metadata before forking."
        create={false}
      />
    );
  return (
    <ComposerForm
      key={`${parentId ?? "root"}:${challenge}`}
      parent={parent.data}
      challenge={challenge}
    />
  );
}
type Form = {
  marketId: string;
  side: "long" | "short";
  target: string;
  invalidation: string;
  leverage: string;
  reasoning: string;
  entryNote: string;
  tags: string;
};
type Pending = {
  draftId: string;
  intent: PublishIntent;
  form: Form;
  requestKey: string;
  txHash?: string;
};
type State =
  | "Draft"
  | "Awaiting wallet"
  | "Submitted"
  | "Confirming"
  | "Confirmed / indexing"
  | "Published"
  | "Failed";
function ComposerForm({
  parent,
  challenge,
}: {
  parent: ThesisDetail | undefined;
  challenge: boolean;
}) {
  const auth = useSession(),
    markets = useMarkets(),
    router = useRouter(),
    query = useQueryClient();
  const initial: Form = {
    marketId: parent ? String(parent.graph.core.marketId) : "",
    side: parent
      ? challenge
        ? parent.graph.core.side === "long"
          ? "short"
          : "long"
        : parent.graph.core.side
      : "long",
    target: parent ? price(parent.graph.core.targetPriceE8) : "",
    invalidation: parent ? price(parent.graph.core.invalidationPriceE8) : "",
    leverage: parent ? String(parent.graph.core.leverageBps / 10000) : "2",
    reasoning: parent?.metadata?.reasoning ?? "",
    entryNote: parent?.metadata?.entryNote ?? "",
    tags: parent?.metadata?.tags.join(", ") ?? "",
  };
  const [form, setForm] = useState(initial),
    [state, setState] = useState<State>("Draft"),
    [error, setError] = useState<unknown>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [busy, setBusy] = useState(false),
    [recoveryHash, setRecoveryHash] = useState(""),
    requestKey = useRef<string | null>(null),
    abort = useRef(false);
  const storageKey = `fork-pending:${auth.session?.wallet ?? "anonymous"}:${parent?.graph.thesisId ?? "0"}`;
  useEffect(() => {
    abort.current = false;
    async function restore() {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      try {
        const p = JSON.parse(saved) as Pending;
        await Promise.resolve();
        setPending(p);
        setForm(p.form);
        setState(p.txHash ? "Confirming" : "Draft");
        requestKey.current = p.requestKey;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    void restore();
    return () => {
      abort.current = true;
    };
  }, [storageKey]);
  function parse() {
    const core = thesisCoreSchema.parse({
        marketId: Number(form.marketId),
        side: form.side,
        targetPriceE8: parseFixedPoint(form.target, 8).toString(),
        invalidationPriceE8: parseFixedPoint(form.invalidation, 8).toString(),
        leverageBps: Number(parseFixedPoint(form.leverage, 4, 4294967295n)),
      }),
      metadata = thesisMetadataSchema.parse({
        reasoning: form.reasoning,
        entryNote: form.entryNote,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    return { core, metadata };
  }
  let changes: ReturnType<typeof forkDifference> = [];
  try {
    if (parent?.metadata) {
      const value = parse();
      changes = forkDifference(
        { core: parent.graph.core, metadata: parent.metadata },
        value,
      );
    }
  } catch {}
  const opposite = parent && form.side !== parent.graph.core.side;
  function save(value: Pending) {
    setPending(value);
    localStorage.setItem(storageKey, JSON.stringify(value));
  }
  function observe(p: Pending, stage: PublishStage, thesisId?: string) {
    recordPublishObservation(
      auth.test,
      p.requestKey,
      {
        chainId: 10143,
        registryAddress: p.intent.registryAddress.toLowerCase(),
        wallet: p.intent.authorWallet.toLowerCase(),
        parentId: p.intent.parentId,
        ...(p.txHash ? { txHash: p.txHash.toLowerCase() } : {}),
        ...(thesisId ? { thesisId } : {}),
      },
      stage,
    );
  }
  useEffect(() => {
    if (state === "Published" && pending?.txHash) {
      recordPublishObservation(
        auth.test,
        pending.requestKey,
        {
          chainId: 10143,
          registryAddress: pending.intent.registryAddress.toLowerCase(),
          wallet: pending.intent.authorWallet.toLowerCase(),
          parentId: pending.intent.parentId,
          txHash: pending.txHash.toLowerCase(),
        },
        "Published",
      );
    }
  }, [state, pending, auth.test]);
  async function finish(p: Pending) {
    const token = await auth.getToken();
    let result: { thesisId: string; state: string } | undefined;
    for (let attempt = 0; attempt < 20 && !abort.current; attempt++) {
      setState("Confirming");
      observe(p, "Confirming");
      try {
        result = await api("theses/finalize", {
          method: "POST",
          token,
          wallet: auth.session?.wallet,
          body: { draftId: p.draftId, txHash: p.txHash },
        });
        break;
      } catch (e) {
        if (!(e instanceof ApiError) || e.code !== "TX_PENDING") throw e;
        if (attempt === 19) throw e;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!result || abort.current) return;
    setState("Confirmed / indexing");
    observe(p, "Confirmed / indexing", result.thesisId);
    for (let attempt = 0; attempt < 15 && !abort.current; attempt++) {
      try {
        const item = await api<ThesisDetail>(`theses/${result.thesisId}`);
        if (item.metadataState === "trusted") {
          observe(p, "Envio visible", result.thesisId);
          setState("Published");
          localStorage.removeItem(storageKey);
          await query.invalidateQueries();
          router.push(`/t/${result.thesisId}`);
          return;
        }
        if (item.metadataState === "integrity-mismatch")
          throw new ApiError(
            "INTEGRITY_MISMATCH",
            "Confirmed metadata failed its integrity check.",
            "Contact the operator; do not send another transaction.",
            409,
          );
      } catch (e) {
        if (e instanceof ApiError && e.code === "INTEGRITY_MISMATCH") throw e;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new ApiError(
      "INDEXING_DELAY",
      "Your transaction is confirmed. The idea graph is still catching up.",
      "Check indexing again; do not submit another transaction.",
      202,
    );
  }
  async function submit() {
    if (!auth.session) {
      auth.login();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (pending?.txHash) {
        await finish(pending);
        return;
      }
      const value = parse();
      if (parent?.metadata)
        forkModificationSchema.parse({
          parent: {
            chainId: parent.graph.chainId,
            registryAddress: parent.graph.registryAddress,
            thesisId: parent.graph.thesisId,
            core: parent.graph.core,
            metadata: parent.metadata,
          },
          fork: {
            chainId: parent.graph.chainId,
            registryAddress: parent.graph.registryAddress,
            parentId: parent.graph.thesisId,
            ...value,
          },
        });
      requestKey.current ??= crypto.randomUUID();
      const draft = await api<{ draftId: string; intent: PublishIntent }>(
        "theses/draft",
        {
          method: "POST",
          token: await auth.getToken(),
          wallet: auth.session.wallet,
          body: {
            parentId: parent?.graph.thesisId ?? "0",
            ...value,
            requestKey: requestKey.current,
          },
        },
      );
      const p: Pending = { ...draft, form, requestKey: requestKey.current };
      save(p);
      observe(p, "Draft");
      setState("Awaiting wallet");
      observe(p, "Awaiting wallet");
      const hash = await auth.submit(draft.intent, draft.draftId);
      const sent = { ...p, txHash: hash };
      save(sent);
      setState("Submitted");
      observe(sent, "Submitted");
      await finish(sent);
    } catch (e) {
      setError(e);
      setState(
        e instanceof ApiError && e.code === "INDEXING_DELAY"
          ? "Confirmed / indexing"
          : "Failed",
      );
    } finally {
      setBusy(false);
    }
  }
  const update = (field: keyof Form, value: string) => {
    setForm({ ...form, [field]: value });
    if (!pending?.txHash) {
      requestKey.current = null;
      setPending(null);
      localStorage.removeItem(storageKey);
      setState("Draft");
    }
  };
  return (
    <div className="composer-layout">
      <section>
        <Link
          href={parent ? `/t/${parent.graph.thesisId}` : "/feed"}
          className="back-link"
        >
          <Icon name="back" size={16} />
          {parent ? "Back to parent idea" : "Back to Feed"}
        </Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              {parent ? "Build on a perspective" : "Start a conversation"}
            </span>
            <h1>
              {opposite
                ? "Challenge this idea."
                : parent
                  ? "Make this idea your own."
                  : "What’s your thesis?"}
            </h1>
            <p>
              {parent
                ? "Change the reasoning or setup. Keep the origin in view."
                : "Give others something to question, improve and build on."}
            </p>
          </div>
        </div>
        {parent && (
          <div className="parent-attribution">
            <Avatar
              small
              name={parent.author.displayName}
              wallet={parent.author.wallet}
            />
            <span>
              Forking{" "}
              <Link href={`/t/${parent.graph.thesisId}`}>
                @{parent.author.handle}’s{" "}
                {marketName(parent.graph.core.marketId, markets.data)} idea
              </Link>
            </span>
            <span className="idea-label">
              {opposite ? "Challenge" : "Fork"}
            </span>
          </div>
        )}
        <form
          className="composer-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={busy || !!pending?.txHash}>
            <div className="form-row two">
              <label>
                Market
                <select
                  required
                  value={form.marketId}
                  onChange={(e) => update("marketId", e.target.value)}
                  disabled={!!parent}
                >
                  <option value="">Select a market</option>
                  {Object.entries(markets.data?.markets ?? {}).map(
                    ([symbol, m]) => (
                      <option key={symbol} value={m.id}>
                        {symbol}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <div>
                <span className="field-label">Perspective</span>
                <div className="side-control">
                  <button
                    type="button"
                    aria-pressed={form.side === "long"}
                    className={form.side === "long" ? "long selected" : ""}
                    onClick={() => update("side", "long")}
                  >
                    ↗ Long
                  </button>
                  <button
                    type="button"
                    aria-pressed={form.side === "short"}
                    className={form.side === "short" ? "short selected" : ""}
                    onClick={() => update("side", "short")}
                  >
                    ↘ Short
                  </button>
                </div>
              </div>
            </div>
            <div className="form-row three">
              <label>
                Target <span>USD</span>
                <input
                  aria-label="Target"
                  inputMode="decimal"
                  value={form.target}
                  onChange={(e) => update("target", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label>
                Invalidation <span>USD</span>
                <input
                  aria-label="Invalidation"
                  inputMode="decimal"
                  value={form.invalidation}
                  onChange={(e) => update("invalidation", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label>
                Leverage <span>×</span>
                <input
                  aria-label="Leverage"
                  inputMode="decimal"
                  value={form.leverage}
                  onChange={(e) => update("leverage", e.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Reasoning <span>{form.reasoning.length}/500</span>
              <textarea
                aria-label="Reasoning"
                value={form.reasoning}
                onChange={(e) => update("reasoning", e.target.value)}
                placeholder="What do you see, and what would change your mind?"
                minLength={10}
                maxLength={500}
                required
                rows={6}
              />
            </label>
            <label>
              Entry note <span>Optional</span>
              <input
                aria-label="Entry note"
                value={form.entryNote}
                onChange={(e) => update("entryNote", e.target.value)}
                maxLength={160}
                placeholder="A condition or timing detail worth sharing"
              />
            </label>
            <label>
              Tags <span>Up to 3 · separated by commas</span>
              <input
                aria-label="Tags"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
                placeholder="breakout, macro, momentum"
                maxLength={100}
              />
            </label>
          </fieldset>
          {markets.error && (
            <ErrorState
              error={markets.error}
              retry={() => void markets.refetch()}
            />
          )}
          <div className="publish-bar">
            <div>
              <strong>{state}</strong>
              <small>
                {auth.session
                  ? `Publishing as @${auth.session.handle}`
                  : "Sign in to publish through your wallet"}
              </small>
            </div>
            <button
              className="button primary"
              disabled={busy || markets.isPending}
            >
              {busy
                ? "Working…"
                : pending?.txHash
                  ? "Check confirmation again"
                  : parent
                    ? opposite
                      ? "Publish Challenge"
                      : "Publish fork"
                    : "Publish on Monad"}
              <Icon name={parent ? "fork" : "arrow"} size={17} />
            </button>
          </div>
        </form>
        {pending?.txHash && (
          <div className="transaction-recovery">
            <p>
              Transaction submitted. Refreshing this page keeps the confirmation
              check; it does not submit again.
            </p>
            <code>{pending.txHash.slice(0, 18)}…</code>
          </div>
        )}
        {pending &&
          !pending.txHash &&
          error instanceof ApiError &&
          error.code === "WALLET_RESULT_UNCERTAIN" && (
            <form
              className="transaction-recovery"
              onSubmit={(e) => {
                e.preventDefault();
                const recovered = {
                  ...pending,
                  txHash: recoveryHash.toLowerCase(),
                };
                save(recovered);
                setError(null);
                setBusy(true);
                void finish(recovered)
                  .catch(setError)
                  .finally(() => setBusy(false));
              }}
            >
              <label>
                Recover transaction hash
                <input
                  aria-label="Recover transaction hash"
                  value={recoveryHash}
                  onChange={(e) => setRecoveryHash(e.target.value)}
                  pattern="0x[0-9a-fA-F]{64}"
                  required
                  placeholder="0x…"
                />
              </label>
              <button className="button secondary" disabled={busy}>
                Check existing transaction
              </button>
            </form>
          )}
        {error != null && (
          <ErrorState
            error={
              error instanceof ApiError
                ? error
                : new ApiError(
                    "VALIDATION_FAILED",
                    error instanceof z.ZodError
                      ? (error.issues[0]?.message ?? "Check the form.")
                      : error instanceof Error
                        ? error.message
                        : "Check the form.",
                    "Review your fields and try again.",
                    400,
                  )
            }
            retry={() => void submit()}
          />
        )}
      </section>
      <aside className="composer-rail">
        {parent ? (
          <>
            <span className="eyebrow">Your contribution</span>
            <h2>What changes?</h2>
            {changes.length ? (
              <div className="diff-list">
                {changes.map((c) => (
                  <div key={c.field}>
                    <strong>{c.label}</strong>
                    <div>
                      <del>
                        {c.field.endsWith("PriceE8")
                          ? `$${price(c.before)}`
                          : c.field === "leverageBps"
                            ? `${Number(c.before) / 10000}×`
                            : c.before}
                      </del>
                      <Icon name="arrow" size={15} />
                      <span>
                        {c.field.endsWith("PriceE8")
                          ? `$${price(c.after)}`
                          : c.field === "leverageBps"
                            ? `${Number(c.after) / 10000}×`
                            : c.after}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="subtle-note">
                Start with one meaningful change: direction, target,
                invalidation, leverage or reasoning.
              </p>
            )}
            <p className="subtle-note">
              Notes and tags can change alongside a meaningful change.
            </p>
          </>
        ) : (
          <>
            <span className="eyebrow">A good starting point</span>
            <h2>
              Make your thinking
              <br />
              visible.
            </h2>
            <ol className="writing-guide">
              <li>
                <span>01</span>
                <div>
                  <strong>Say what you see.</strong>
                  <p>Explain the evidence behind the perspective.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Name the uncertainty.</strong>
                  <p>Show what would invalidate your idea.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Leave room to improve.</strong>
                  <p>Another person may see a better angle.</p>
                </div>
              </li>
            </ol>
          </>
        )}
        <div className="rail-note">
          <Icon name="tree" />
          <p>
            Your authorship and lineage are public. Publishing creates an
            immutable idea record.
          </p>
        </div>
      </aside>
    </div>
  );
}
