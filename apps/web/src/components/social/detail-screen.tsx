"use client";
import Link from "next/link";
import { useRef, useState, ViewTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ThesisDetail } from "@fork/shared";
import { api } from "@/lib/api-client";
import { useSession } from "./session";
import { Avatar, EmptyState, ErrorState, TokenMark, age } from "./common";
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
  const item = query.data!,
    market = marketName(item.graph.core.marketId, context),
    kind =
      item.graph.parentId === "0"
        ? "Original"
        : item.challenge
          ? "Challenge"
          : "Fork";
  return (
    <div className="signature detail-layout">
      <div className="detail-main">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/feed">Feed</Link>
          <Icon name="chevron" size={14} />
          <Link href={`/explore?market=${encodeURIComponent(market)}`}>
            {market}
          </Link>
          <Icon name="chevron" size={14} />
          <span aria-current="page">#{id}</span>
        </nav>
        <article className={`detail-card ${item.parent ? "is-fork" : ""}`}>
          <header className="thesis-heading">
            <div className="card-author">
              <Link
                href={`/u/${item.author.handle}`}
                className="identity-link"
                aria-label={`${item.author.displayName}, @${item.author.handle}`}
              >
                <Avatar
                  size={52}
                  name={item.author.displayName}
                  wallet={item.author.wallet}
                  handle={item.author.handle}
                />
              </Link>
              <div className="card-byline">
                <p>
                  <Link href={`/u/${item.author.handle}`}>
                    <strong>@{item.author.handle}</strong>
                  </Link>{" "}
                  <span>
                    ·{" "}
                    <time
                      dateTime={new Date(
                        item.graph.createdAt * 1000,
                      ).toISOString()}
                      title={new Date(
                        item.graph.createdAt * 1000,
                      ).toUTCString()}
                    >
                      {age(item.graph.createdAt)}
                    </time>
                  </span>
                </p>
                {item.parent ? (
                  <p className="detail-provenance">
                    <Icon name="fork" size={14} />
                    <span>
                      Forked from{" "}
                      <Link href={`/u/${item.parent.author.handle}`}>
                        @{item.parent.author.handle}
                      </Link>
                      ,{" "}
                      <Link href={`/t/${item.parent.thesisId}`}>
                        idea #{item.parent.thesisId}
                      </Link>
                    </span>
                  </p>
                ) : (
                  <p className="card-origin">Original idea</p>
                )}
              </div>
              <span className="idea-label">
                {kind} #{id}
              </span>
            </div>
            <ViewTransition
              name={`thesis-title-${id}`}
              share="morph"
              default="none"
            >
              <div className="market-line detail-market">
                <TokenMark symbol={market} size={34} />
                <h1>{market}</h1>
                <Direction side={item.graph.core.side} />
              </div>
            </ViewTransition>
          </header>
          <div className="parameters detail-parameters">
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
            <SocialActions item={item} />
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
        </article>
        <ParentComparison item={item} />
        {item.metadataState === "trusted" && (
          <section className="detail-section reasoning-card">
            <span className="v2-label">Reasoning</span>
            <p className="detail-reasoning">{item.metadata?.reasoning}</p>
            {item.metadata?.entryNote && (
              <div className="entry-note">
                <span>Entry note</span>
                <p>{item.metadata.entryNote}</p>
              </div>
            )}
            <div className="reasoning-foot">
              <div className="tags">
                {item.metadata?.tags.map((t) => (
                  <Link href={`/explore?tag=${encodeURIComponent(t)}`} key={t}>
                    #{t}
                  </Link>
                ))}
              </div>
              <span className="hash-match">
                <Icon name="check" size={14} />
                Reasoning matches its onchain hash
              </span>
            </div>
          </section>
        )}
        <section id="comments" className="detail-section comments-section">
          <h2 className="comments-title">
            Comments <span>{item.social.comments}</span>
          </h2>
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
      <aside className="detail-rail">
        {item.metadataState === "trusted" && <BackingPanel thesisId={id} />}
        <section className="v2-card rail-card lineage-card">
          <h2 className="rail-heading">Lineage</h2>
          <ol className="lineage-list">
            {item.parent && (
              <li>
                <Link href={`/t/${item.parent.thesisId}`}>
                  <Avatar
                    size={28}
                    name={item.parent.author.displayName}
                    wallet={item.parent.author.wallet}
                    handle={item.parent.author.handle}
                  />
                  <span>@{item.parent.author.handle}</span>
                  <small>#{item.parent.thesisId}</small>
                </Link>
              </li>
            )}
            <li className="lineage-here" aria-current="true">
              <span className="lineage-row">
                <Avatar
                  size={28}
                  name={item.author.displayName}
                  wallet={item.author.wallet}
                  handle={item.author.handle}
                />
                <span>@{item.author.handle}</span>
                <small>#{id}</small>
              </span>
            </li>
            {item.children.map((child) => (
              <li key={child.graph.thesisId} className="lineage-child">
                <Link href={`/t/${child.graph.thesisId}`}>
                  <Avatar
                    size={28}
                    name={child.author.displayName}
                    wallet={child.author.wallet}
                    handle={child.author.handle}
                  />
                  <span>@{child.author.handle}</span>
                  <small>#{child.graph.thesisId}</small>
                </Link>
              </li>
            ))}
          </ol>
          {!item.children.length && (
            <p className="rail-copy">
              No child perspectives yet. The next one could be yours.
            </p>
          )}
          <Link className="rail-link" href={`/t/${id}/tree`}>
            Open Idea Tree <Icon name="arrow" size={15} />
          </Link>
        </section>
        <section className="v2-card thesis-proof">
          <TokenMark symbol="MON" size={18} />
          <p>
            Recorded on Monad Testnet
            <small title={item.author.wallet}>
              Indexed by Envio from {item.author.wallet.slice(0, 6)}…
              {item.author.wallet.slice(-4)}
            </small>
          </p>
          <a
            href={`https://testnet.monadexplorer.com/tx/${item.graph.txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View tx <Icon name="external" size={14} />
          </a>
          <ConfirmationNote txHash={item.graph.txHash} />
        </section>
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
        <Link href="#comments" className="button secondary comment-action">
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
              size={36}
              name={c.author.displayName}
              wallet={c.author.wallet}
              handle={c.author.handle}
            />
            <div>
              <div className="comment-byline">
                <Link
                  href={`/u/${c.author.handle}`}
                  title={c.author.displayName}
                >
                  @{c.author.handle}
                </Link>
                <span>
                  ·{" "}
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
