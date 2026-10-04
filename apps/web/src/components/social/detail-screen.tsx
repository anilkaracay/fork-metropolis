"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ThesisDetail } from "@fork/shared";
import { api } from "@/lib/api-client";
import { useSession } from "./session";
import { Avatar, EmptyState, ErrorState, Skeleton, age } from "./common";
import {
  Direction,
  Parameters,
  marketName,
  useMarkets,
  price,
} from "./thesis-card";
import { Icon } from "./icon";

export function DetailScreen({ id }: { id: string }) {
  const query = useQuery({
      queryKey: ["detail", id],
      queryFn: () => api<ThesisDetail>(`theses/${id}`),
    }),
    context = useMarkets().data;
  if (query.isPending) return <Skeleton cards={2} />;
  if (query.error)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const item = query.data!;
  return (
    <div className="detail-layout">
      <section>
        <Link href="/feed" className="back-link">
          <Icon name="back" size={16} />
          Back to Feed
        </Link>
        <article className="detail-card">
          <div className="card-author">
            <Link href={`/u/${item.author.handle}`} className="identity-link">
              <Avatar
                name={item.author.displayName}
                wallet={item.author.wallet}
              />
              <span>
                <strong>{item.author.displayName}</strong>
                <small>
                  @{item.author.handle} · {age(item.graph.createdAt)}
                </small>
              </span>
            </Link>
            <span className={`idea-label ${item.challenge ? "challenge" : ""}`}>
              {item.challenge
                ? "Challenge"
                : item.graph.parentId === "0"
                  ? "Original idea"
                  : "Fork"}
            </span>
          </div>
          {item.parent && (
            <div className="provenance detail-provenance">
              <Icon name="fork" size={16} />
              <span>
                Forked from{" "}
                <Link href={`/t/${item.parent.thesisId}`}>
                  @{item.parent.author.handle}
                </Link>
              </span>
            </div>
          )}
          <div className="market-line detail-market">
            <h1>{marketName(item.graph.core.marketId, context)}</h1>
            <Direction side={item.graph.core.side} />
          </div>
          {item.metadataState === "trusted" ? (
            <>
              <p className="detail-reasoning">{item.metadata?.reasoning}</p>
              {item.metadata?.entryNote && (
                <div className="entry-note">
                  <span className="eyebrow">Entry note</span>
                  <p>{item.metadata.entryNote}</p>
                </div>
              )}
              <div className="tags">
                {item.metadata?.tags.map((t) => (
                  <Link href={`/explore?tag=${t}`} key={t}>
                    #{t}
                  </Link>
                ))}
              </div>
              {item.changes.length > 0 && (
                <div className="changed-panel">
                  <h3>What changed</h3>
                  {item.changes.map((c) => (
                    <div key={c.field}>
                      <span>{c.label}</span>
                      {["targetPriceE8", "invalidationPriceE8"].includes(
                        c.field,
                      ) ? (
                        <>
                          <del>${price(c.before)}</del>
                          <Icon name="arrow" size={14} />
                          <strong>${price(c.after)}</strong>
                        </>
                      ) : c.field === "leverageBps" ? (
                        <>
                          <del>{Number(c.before) / 10000}×</del>
                          <Icon name="arrow" size={14} />
                          <strong>{Number(c.after) / 10000}×</strong>
                        </>
                      ) : (
                        <strong>
                          {c.field === "reasoning"
                            ? "A new perspective"
                            : c.after}
                        </strong>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="inline-alert" role="alert">
              <strong>
                {item.metadataState === "hidden"
                  ? "This content is hidden after moderation."
                  : item.metadataState === "integrity-mismatch"
                    ? "Content integrity check failed."
                    : "Reasoning is not available yet."}
              </strong>
              <p>
                {item.metadataState === "hidden"
                  ? "The onchain lineage remains visible."
                  : item.metadataState === "integrity-mismatch"
                    ? "This metadata does not match the onchain content hash and is not shown as trusted."
                    : "Confirmation and metadata indexing may still be catching up."}
              </p>
              <button
                className="text-button"
                onClick={() => void query.refetch()}
              >
                Check again
              </button>
            </div>
          )}
          <Parameters item={item} />
          {item.metadataState === "trusted" && <SocialActions item={item} />}
          <div className="execution-note">
            <span className="tiny-dot" />
            <strong>
              {item.execution.state === "not-executed"
                ? "Not executed"
                : item.execution.state === "attested"
                  ? "Attested · independently unverified"
                  : `Verified execution${item.execution.position === "unknown" ? "" : ` · ${item.execution.position}`}`}
            </strong>
            <span>
              {item.execution.state === "attested"
                ? "An onchain link alone is not proof of execution."
                : "Execution is a proof layer; the idea starts here."}
            </span>
          </div>
        </article>
        <section id="comments" className="comments-section">
          <div className="section-title">
            <h2>The conversation</h2>
            <span>{item.social.comments} comments</span>
          </div>
          {item.metadataState === "trusted" ? (
            <Comments item={item} />
          ) : (
            <p className="subtle-note">
              Comments are unavailable while the content is hidden or untrusted.
            </p>
          )}
        </section>
      </section>
      <aside className="detail-rail">
        <div className="rail-heading">
          <span className="eyebrow">This idea’s lineage</span>
          <Icon name="tree" />
        </div>
        <Link href={`/t/${id}/tree`} className="tree-preview-root">
          <span className="eyebrow">
            {item.graph.parentId === "0" ? "The original" : "Current branch"}
          </span>
          <strong>@{item.author.handle}</strong>
          <Direction side={item.graph.core.side} />
          <span>
            {item.graph.uniqueExternalForkers} unique external forkers
          </span>
        </Link>
        {item.children.length > 0 ? (
          <div className="preview-branches">
            {item.children.map((child) => (
              <Link
                href={`/t/${child.graph.thesisId}`}
                key={child.graph.thesisId}
              >
                <Icon name="fork" size={16} />
                <span>
                  <strong>@{child.author.handle}</strong>
                  <small>
                    {child.challenge
                      ? "Challenge"
                      : child.changes
                          .map((c) => c.label)
                          .slice(0, 2)
                          .join(" · ") || "Fork"}
                  </small>
                </span>
                <Direction side={child.graph.core.side} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="subtle-note">The next perspective could be yours.</p>
        )}
        <Link className="button secondary full" href={`/t/${id}/tree`}>
          Open Idea Tree <Icon name="arrow" size={16} />
        </Link>
        <div className="rail-note">
          <p>
            Graph provenance:{" "}
            {item.provenance.graph === "envio-test"
              ? "isolated Envio test handlers"
              : "Envio"}
            . Reasoning is checked against its onchain hash.
          </p>
        </div>
      </aside>
    </div>
  );
}
function SocialActions({ item }: { item: ThesisDetail }) {
  const auth = useSession(),
    query = useQueryClient(),
    id = item.graph.thesisId,
    dialog = useRef<HTMLDialogElement>(null),
    [reason, setReason] = useState("spam"),
    [note, setNote] = useState("");
  const agreed = useQuery({
    queryKey: ["agree", auth.session?.userId, id],
    enabled: !!auth.session,
    queryFn: async () =>
      api<{ agreed: boolean }>(`theses/${id}/agree`, {
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
      }),
  });
  const mutation = useMutation({
    mutationFn: async (on: boolean) =>
      api(`theses/${id}/agree`, {
        method: on ? "PUT" : "DELETE",
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
      }),
    onMutate: async (on) => {
      await query.cancelQueries({ queryKey: ["detail", id] });
      const prior = query.getQueryData<ThesisDetail>(["detail", id]),
        previous = agreed.data?.agreed ?? false;
      query.setQueryData(["agree", auth.session?.userId, id], { agreed: on });
      if (prior)
        query.setQueryData(["detail", id], {
          ...prior,
          social: {
            ...prior.social,
            agrees: Math.max(0, prior.social.agrees + (on ? 1 : -1)),
          },
        });
      return { prior, previous };
    },
    onError: (_e, _on, context) => {
      query.setQueryData(["detail", id], context?.prior);
      query.setQueryData(["agree", auth.session?.userId, id], {
        agreed: context?.previous ?? false,
      });
    },
    onSettled: () => {
      void query.invalidateQueries({ queryKey: ["detail", id] });
      void query.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  const report = useMutation({
    mutationFn: async () =>
      api(`theses/${id}/report`, {
        method: "POST",
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
        body: { reason, note, requestKey: crypto.randomUUID() },
      }),
    onSuccess: () => dialog.current?.close(),
  });
  return (
    <>
      <div className="detail-actions">
        <Link href={`/t/${id}/fork`} className="button primary">
          <Icon name="fork" size={18} />
          Fork this idea
        </Link>
        <button
          className={`button secondary ${agreed.data?.agreed ? "agreed" : ""}`}
          aria-pressed={agreed.data?.agreed ?? false}
          disabled={mutation.isPending || (!!auth.session && agreed.isPending)}
          onClick={() =>
            auth.session
              ? mutation.mutate(!(agreed.data?.agreed ?? false))
              : auth.login()
          }
        >
          <Icon name="agree" size={17} />
          {agreed.data?.agreed ? "Agreed" : "Agree"}{" "}
          <span>{item.social.agrees}</span>
        </button>
        <Link href={`/t/${id}/fork?challenge=1`} className="text-button">
          Challenge
        </Link>
        <button
          className="text-button report-button"
          onClick={() =>
            auth.session ? dialog.current?.showModal() : auth.login()
          }
        >
          Report
        </button>
      </div>
      {mutation.error && (
        <ErrorState
          error={mutation.error}
          retry={() => mutation.mutate(!(agreed.data?.agreed ?? false))}
        />
      )}
      <dialog ref={dialog} className="report-dialog">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            report.mutate();
          }}
        >
          <span className="eyebrow">Keep the conversation useful</span>
          <h2>Report this idea</h2>
          <label>
            Reason
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="spam">Spam</option>
              <option value="abuse">Abuse</option>
              <option value="misinformation">Misinformation</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Additional context <span>Optional</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              rows={3}
            />
          </label>
          {report.error && (
            <p role="alert">{report.error.message} Try again.</p>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button className="button primary" disabled={report.isPending}>
              Submit report
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
function Comments({ item }: { item: ThesisDetail }) {
  const auth = useSession(),
    query = useQueryClient(),
    [body, setBody] = useState(""),
    key = useRef({ body: "", requestKey: "" }),
    id = item.graph.thesisId;
  const mutation = useMutation({
    mutationFn: async () => {
      if (key.current.body !== body)
        key.current = { body, requestKey: crypto.randomUUID() };
      return api(`theses/${id}/comments`, {
        method: "POST",
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
        body: { body, requestKey: key.current.requestKey },
      });
    },
    onSuccess: () => {
      setBody("");
      void query.invalidateQueries({ queryKey: ["detail", id] });
      void query.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  const remove = useMutation({
    mutationFn: async (commentId: string) =>
      api(`comments/${commentId}`, {
        method: "DELETE",
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
      }),
    onSuccess: () => void query.invalidateQueries({ queryKey: ["detail", id] }),
  });
  return (
    <>
      {auth.session ? (
        <form
          className="comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <label htmlFor="comment-body">Add a perspective</label>
          <textarea
            id="comment-body"
            placeholder="A question, a counterpoint, a better angle…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minLength={1}
            maxLength={280}
            required
            rows={3}
          />
          <div>
            <span>{body.length}/280</span>
            <button
              className="button secondary"
              disabled={mutation.isPending || !body.trim()}
            >
              Post comment <Icon name="arrow" size={15} />
            </button>
          </div>
        </form>
      ) : (
        <button className="button secondary" onClick={auth.login}>
          Sign in to join the conversation
        </button>
      )}
      {mutation.error && (
        <ErrorState error={mutation.error} retry={() => mutation.mutate()} />
      )}
      <div className="comment-list">
        {item.comments.map((c) => (
          <article className="comment" key={c.id}>
            <Avatar
              small
              name={c.author.displayName}
              wallet={c.author.wallet}
            />
            <div>
              <div className="comment-byline">
                <Link href={`/u/${c.author.handle}`}>
                  {c.author.displayName}
                </Link>
                <span>
                  @{c.author.handle} ·{" "}
                  <time dateTime={c.createdAt}>
                    {age(Date.parse(c.createdAt) / 1000)}
                  </time>
                </span>
              </div>
              <p>{c.body}</p>
              {auth.session?.userId === c.author.userId && (
                <button
                  className="text-button"
                  onClick={() => remove.mutate(c.id)}
                  disabled={remove.isPending}
                >
                  Remove comment
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {remove.error && (
        <ErrorState
          error={remove.error}
          retry={() => {
            if (remove.variables) remove.mutate(remove.variables);
          }}
        />
      )}{" "}
      {!item.comments.length && (
        <EmptyState
          title="Bring another perspective."
          description="Good reasoning gets better through discussion."
          create={false}
        />
      )}{" "}
      {item.commentsHasMore && (
        <p className="subtle-note">Showing the latest 50 comments.</p>
      )}
    </>
  );
}
