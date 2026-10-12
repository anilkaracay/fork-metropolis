"use client";
import Link from "next/link";
import { useRef, useState, ViewTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ThesisDetail } from "@fork/shared";
import { api } from "@/lib/api-client";
import { useSession } from "./session";
import { Avatar, EmptyState, ErrorState, age } from "./common";
import { SignatureLoading } from "./signature-loading";
import { Direction, marketName, useMarkets } from "./thesis-card";
import { Icon } from "./icon";
import { ConfirmationNote } from "./confirmation-note";
import { BackButton, BackingPanel } from "./backing-panel";
import { ParentComparison, differenceValue } from "./fork-diff";

export function DetailScreen({ id }: { id: string }) {
  const query = useQuery({
      queryKey: ["detail", id],
      queryFn: () => api<ThesisDetail>(`theses/${id}`),
    }),
    context = useMarkets().data;
  if (query.isPending) return <SignatureLoading kind="thesis" />;
  if (query.error)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const item = query.data!;
  return (
    <div className="signature detail-layout">
      <article className="detail-card">
        <Link href="/feed" className="back-link">
          <Icon name="back" size={16} />
          Back to Feed
        </Link>
        <header className="thesis-heading">
          <div className="thesis-identity">
            <span>
              {item.graph.parentId === "0"
                ? "Original thesis"
                : item.challenge
                  ? "Challenge"
                  : "Fork"}{" "}
              #{id}
            </span>
            <Link href={`/t/${id}/tree`}>
              {item.graph.directForkCount}{" "}
              {item.graph.directForkCount === 1 ? "fork" : "forks"} · View
              lineage <Icon name="tree" size={15} />
            </Link>
          </div>
          <ViewTransition
            name={`thesis-title-${id}`}
            share="morph"
            default="none"
          >
            <div className="market-line detail-market">
              <h1>{marketName(item.graph.core.marketId, context)}</h1>
              <Direction side={item.graph.core.side} />
            </div>
          </ViewTransition>
          <div className="card-author">
            <Link href={`/u/${item.author.handle}`} className="identity-link">
              <Avatar
                name={item.author.displayName}
                wallet={item.author.wallet}
              />
              <span>
                <strong>{item.author.displayName}</strong>
                <small>
                  @{item.author.handle} ·{" "}
                  <time
                    dateTime={new Date(
                      item.graph.createdAt * 1000,
                    ).toISOString()}
                    title={new Date(item.graph.createdAt * 1000).toUTCString()}
                  >
                    {age(item.graph.createdAt)}
                  </time>
                </small>
              </span>
            </Link>
          </div>
          {item.parent && (
            <div className="detail-provenance">
              <Icon name="fork" size={16} />
              <span>
                Forked from{" "}
                <Link href={`/t/${item.parent.thesisId}`}>
                  #{item.parent.thesisId} · @{item.parent.author.handle}
                </Link>
              </span>
            </div>
          )}
        </header>
        <div className="parameters">
          {(
            [
              ["targetPriceE8", "Target"],
              ["invalidationPriceE8", "Invalidation"],
              ["leverageBps", "Leverage"],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <span>{label}</span>
              <strong>
                {differenceValue(field, String(item.graph.core[field]))}
              </strong>
            </div>
          ))}
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
                <Link href={`/explore?tag=${encodeURIComponent(t)}`} key={t}>
                  #{t}
                </Link>
              ))}
            </div>
            <SocialActions item={item} />
            <BackingPanel thesisId={id} />
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
                  ? "This metadata does not match its onchain hash. Open the public transaction for provenance."
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
        <div className="thesis-proof">
          <span className="eyebrow">On Monad Testnet</span>
          <a
            href={`https://testnet.monadexplorer.com/tx/${item.graph.txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            Monad transaction <Icon name="arrow" size={14} />
          </a>
          <span title={item.author.wallet}>
            {item.author.wallet.slice(0, 8)}…{item.author.wallet.slice(-6)}
          </span>
          <span>
            {item.metadataState === "trusted"
              ? "Indexed by Envio · reasoning matches its onchain hash"
              : "Indexed by Envio"}
          </span>
          <ConfirmationNote txHash={item.graph.txHash} />
        </div>
      </article>
      <aside className="detail-rail">
        <div className="rail-heading">
          <span className="eyebrow">This idea’s lineage</span>
          <Icon name="tree" />
        </div>
        {item.parent && (
          <Link className="lineage-parent" href={`/t/${item.parent.thesisId}`}>
            <span>Parent #{item.parent.thesisId}</span>
            <strong>@{item.parent.author.handle}</strong>
          </Link>
        )}
        <div className="lineage-current">
          <span>
            {item.graph.parentId === "0" ? "Origin" : "This perspective"} #{id}
          </span>
          <strong>@{item.author.handle}</strong>
        </div>
        {item.children.length ? (
          <div className="preview-branches">
            {item.children.map((child) => (
              <Link
                href={`/t/${child.graph.thesisId}`}
                key={child.graph.thesisId}
              >
                <Icon name="fork" size={16} />
                <span>
                  <strong>
                    Fork #{child.graph.thesisId} · @{child.author.handle}
                  </strong>
                  <small>
                    {child.changes
                      .map((c) => c.label)
                      .slice(0, 3)
                      .join(" · ") || "Independent perspective"}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="subtle-note">
            No child perspectives yet. The next one could be yours.
          </p>
        )}
        <Link className="button secondary full" href={`/t/${id}/tree`}>
          Open Idea Tree <Icon name="arrow" size={16} />
        </Link>
        <ParentComparison item={item} />
      </aside>
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
            Check the metadata again to continue.
          </p>
        )}
      </section>
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
        <BackButton thesisId={id} />
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
        <Link href="#comments" className="text-button comment-action">
          <Icon name="comment" size={16} />
          Comment
        </Link>
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
