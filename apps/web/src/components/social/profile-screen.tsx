"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProfileSummary } from "@fork/shared";
import { api } from "@/lib/api-client";
import { useSession } from "./session";
import { Avatar, EmptyState, ErrorState, Skeleton } from "./common";
import { ThesisCard } from "./thesis-card";
import { Icon } from "./icon";
import { ExternalWalletContext } from "./wallet-context";
export function MyProfile() {
  const auth = useSession(),
    router = useRouter();
  useEffect(() => {
    if (auth.session) router.replace(`/u/${auth.session.handle}`);
  }, [auth.session, router]);
  return auth.session ? (
    <Skeleton cards={1} />
  ) : (
    <div className="profile-signin">
      <EmptyState
        title="Your ideas leave a trace."
        description="Sign in to publish perspectives, contribute to branches and see your graph participation."
        create={false}
      />
      <button className="button primary" onClick={auth.login}>
        Sign in
      </button>
    </div>
  );
}
export function ProfileScreen({ handle }: { handle: string }) {
  const auth = useSession(),
    query = useQuery({
      queryKey: ["profile", handle],
      queryFn: () => api<ProfileSummary>(`profiles/${handle}`),
    }),
    [tab, setTab] = useState<"all" | "roots" | "forks">("all"),
    [editing, setEditing] = useState(false);
  if (query.isPending) return <Skeleton cards={2} />;
  if (query.error)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const p = query.data!,
    r = p.reputation,
    isOwner = auth.session?.userId === p.identity.userId,
    items = p.recent.filter(
      (n) =>
        tab === "all" ||
        (tab === "roots" ? n.graph.parentId === "0" : n.graph.parentId !== "0"),
    );
  return (
    <div className="profile-screen">
      <div className="profile-cover">
        <Icon name="fork" size={96} />
        <span>Ideas evolve in public.</span>
      </div>
      <header className="profile-header">
        <Avatar name={p.identity.displayName} wallet={p.identity.wallet} />
        <div className="profile-name">
          <h1>{p.identity.displayName}</h1>
          <span>@{p.identity.handle}</span>
        </div>
        {isOwner && (
          <button
            className="button secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Close editor" : "Edit profile"}
          </button>
        )}
      </header>
      {p.bio && <p className="profile-bio">{p.bio}</p>}
      <div className="profile-wallet">
        <span className="network-label">
          <i />
          Monad Testnet
        </span>
        <code title={p.identity.wallet}>
          {p.identity.wallet.slice(0, 8)}…{p.identity.wallet.slice(-6)}
        </code>
        <span>
          {r.eligibleRoots} original ideas · {r.eligibleForks} contributions
        </span>
      </div>
      {editing && <ProfileEditor profile={p} />}
      <div className="section-title reputation-heading">
        <h2>A reputation you can trace.</h2>
        <span>FORK-native · wallet scoped</span>
      </div>
      <div className="reputation-grid">
        <div>
          <span>Originality</span>
          <strong>{r.originality.label}</strong>
          <p>
            {r.successfulRoots} / {r.eligibleRoots} roots received an external
            fork
          </p>
        </div>
        <div>
          <span>Contribution</span>
          <strong>{r.contribution.label}</strong>
          <p>
            {r.successfulForks} / {r.eligibleForks} forks received an external
            fork
          </p>
        </div>
        <div>
          <span>Influence</span>
          <strong>{r.influence}</strong>
          <p>Unique external wallets directly forking authored ideas</p>
        </div>
        <div>
          <span>Executions Inspired</span>
          <strong>{r.executionsInspired}</strong>
          <p>Independently verified executions on descendant branches</p>
        </div>
      </div>
      <details className="reputation-explanation">
        <summary>
          How these numbers work <Icon name="create" size={15} />
        </summary>
        <p>
          Originality = roots receiving an external fork / authored roots.
          Contribution = forks receiving an external fork / authored forks. A
          sample below 3 is Emerging; otherwise the percentage and raw counts
          are shown.
        </p>
        <p>
          Influence counts each external wallet once across directly forked
          authored ideas. Self-forks and repeated wallets do not inflate success
          or influence. Execution credit requires independently verified
          evidence below an authored idea, deduplicated across overlapping
          ancestors; self-owned executions and arbitrary onchain links do not
          count.
        </p>
        <p>
          Scope: chain {p.scope.chainId}, registry{" "}
          <code>{p.scope.registryAddress}</code>, displayed primary wallet. This
          measures participation, not profitability or Sybil resistance.
        </p>
      </details>
      <ExternalWalletContext handle={handle} />
      {isOwner && auth.wallets.length > 1 && (
        <label className="wallet-select">
          Primary wallet
          <select
            value={auth.session?.wallet}
            onChange={(e) => void auth.selectWallet(e.target.value)}
          >
            {auth.wallets.map((w) => (
              <option value={w} key={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
      )}
      {isOwner && auth.isAdmin && (
        <Link className="quiet-link" href="/moderation">
          Moderation queue <Icon name="arrow" size={15} />
        </Link>
      )}
      <div className="feed-tabs" role="group" aria-label="Profile activity">
        {(["all", "roots", "forks"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t === "all"
              ? "Recent activity"
              : t === "roots"
                ? "Original ideas"
                : "Forks"}
          </button>
        ))}
      </div>
      <div className="profile-ideas">
        {items.map((n) => (
          <ThesisCard key={n.graph.thesisId} item={n} />
        ))}
      </div>
      {!items.length && (
        <EmptyState
          title="The next idea is unwritten."
          description="Authored ideas and public contributions will appear here."
          create={isOwner}
        />
      )}
    </div>
  );
}
function ProfileEditor({ profile }: { profile: ProfileSummary }) {
  const auth = useSession(),
    query = useQueryClient(),
    router = useRouter(),
    [handle, setHandle] = useState(profile.identity.handle),
    [name, setName] = useState(profile.identity.displayName),
    [bio, setBio] = useState(profile.bio ?? "");
  const mutation = useMutation({
    mutationFn: async () =>
      api<{ handle: string }>("profile", {
        method: "POST",
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
        body: { handle, displayName: name, bio },
      }),
    onSuccess: async (result) => {
      await auth.refresh();
      await query.invalidateQueries();
      router.push(`/u/${result.handle}`);
    },
  });
  return (
    <form
      className="profile-editor"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <label>
        Handle
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          minLength={3}
          maxLength={24}
          required
        />
      </label>
      <label>
        Display name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
        />
      </label>
      <label>
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={2}
        />
      </label>
      <button className="button primary" disabled={mutation.isPending}>
        Save profile
      </button>
      {mutation.error && (
        <ErrorState error={mutation.error} retry={() => mutation.mutate()} />
      )}
    </form>
  );
}
