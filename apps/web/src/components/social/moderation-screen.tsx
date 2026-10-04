"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSession } from "./session";
import { EmptyState, ErrorState, Skeleton } from "./common";
export function ModerationScreen() {
  const auth = useSession(),
    query = useQueryClient(),
    reports = useQuery({
      queryKey: ["moderation", auth.session?.userId],
      enabled: !!auth.session,
      queryFn: async () =>
        api<
          {
            id: string;
            thesisId: string;
            reason: string;
            note: string | null;
          }[]
        >("moderation", {
          token: await auth.getToken(),
          wallet: auth.session?.wallet,
        }),
    }),
    mutation = useMutation({
      mutationFn: async (value: { id: string; hidden: boolean }) =>
        api(`moderation/${value.id}`, {
          method: "PUT",
          token: await auth.getToken(),
          wallet: auth.session?.wallet,
          body: { hidden: value.hidden },
        }),
      onSuccess: () => void query.invalidateQueries(),
    });
  if (!auth.session)
    return (
      <EmptyState
        title="Moderator sign-in required."
        description="Use an authorized account to review reports."
        create={false}
      />
    );
  if (reports.isPending) return <Skeleton cards={1} />;
  if (reports.error)
    return (
      <ErrorState error={reports.error} retry={() => void reports.refetch()} />
    );
  return (
    <div className="moderation-screen">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Application content only</span>
          <h1>Moderation queue</h1>
          <p>Hiding reasoning does not change the immutable onchain graph.</p>
        </div>
      </div>
      {reports.data?.map((r) => (
        <article className="moderation-item" key={r.id}>
          <h2>Idea #{r.thesisId}</h2>
          <p>
            {r.reason} · {r.note || "No additional note"}
          </p>
          <button
            className="button secondary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: r.thesisId, hidden: true })}
          >
            Hide metadata
          </button>
          <button
            className="button secondary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: r.thesisId, hidden: false })}
          >
            Keep visible
          </button>
        </article>
      ))}
      {!reports.data?.length && (
        <EmptyState
          title="No open reports."
          description="Reports from signed-in users will appear here."
          create={false}
        />
      )}
      <form
        className="moderation-recovery"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          mutation.mutate({ id: String(data.get("id")), hidden: false });
        }}
      >
        <label>
          Restore hidden idea
          <input
            name="id"
            inputMode="numeric"
            pattern="[1-9][0-9]*"
            required
            placeholder="Thesis ID"
          />
        </label>
        <button className="button secondary" disabled={mutation.isPending}>
          Unhide metadata
        </button>
      </form>
      {mutation.error && (
        <ErrorState
          error={mutation.error}
          retry={() => void reports.refetch()}
        />
      )}
    </div>
  );
}
