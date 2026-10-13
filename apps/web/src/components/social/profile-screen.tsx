"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HANDLE_MAX, type ProfileSummary } from "@fork/shared";
import { api } from "@/lib/api-client";
import { useSession } from "./session";
import { Avatar, EmptyState, ErrorState, Skeleton, ReadStatus } from "./common";
import { ThesisCard } from "./thesis-card";
import { Icon } from "./icon";
import { ExternalWalletContext } from "./wallet-context";
import { AccountWallet } from "./account-wallet";
import { requestHandleClaim } from "./handle-claim";
import { formatMon } from "@/lib/mon";
import { ApiError } from "@/lib/api-client";
import { confirmationText } from "@/lib/confirmation";
import { useWithdraw } from "./withdraw";
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
      staleTime: 30000,
    }),
    [tab, setTab] = useState<"all" | "roots" | "forks">("all"),
    [editing, setEditing] = useState(false),
    router = useRouter();
  // A link to the handle an account started with lands on its current profile.
  const canonical = query.data?.identity.handle;
  useEffect(() => {
    if (canonical && canonical !== handle) router.replace(`/u/${canonical}`);
  }, [canonical, handle, router]);
  const [copyState, setCopyState] = useState("Copy wallet");
  async function copyWallet(wallet: string) {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopyState("Copied");
    } catch {
      setCopyState("Select wallet to copy");
    }
  }
  if (query.isPending)
    return (
      <div className="social-polish">
        <Skeleton cards={2} />
      </div>
    );
  if (query.error && !query.data)
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
    <div className="profile-screen social-polish">
      <header className="profile-header">
        <Avatar
          size={88}
          name={p.identity.displayName}
          wallet={p.identity.wallet}
          handle={p.identity.handle}
        />
        <div className="profile-name">
          <h1>@{p.identity.handle}</h1>
          <span>{p.identity.displayName}</span>
          {p.bio && <p className="profile-bio">{p.bio}</p>}
          <div className="profile-wallet">
            <code title={p.identity.wallet}>
              {p.identity.wallet.slice(0, 6)}…{p.identity.wallet.slice(-4)}
            </code>
            <button
              className="v2-btn v2-ghost v2-sm"
              aria-label="Copy wallet address"
              onClick={() => void copyWallet(p.identity.wallet)}
            >
              {copyState}
            </button>
            <span className="sr-only" role="status">
              {copyState === "Copied"
                ? "Wallet address copied."
                : copyState === "Select wallet to copy"
                  ? "Clipboard unavailable. Expand the wallet address below to select it."
                  : ""}
            </span>
            <span>
              {r.eligibleRoots}{" "}
              {r.eligibleRoots === 1 ? "original idea" : "original ideas"},{" "}
              {r.eligibleForks} {r.eligibleForks === 1 ? "fork" : "forks"}
            </span>
            {copyState === "Select wallet to copy" && (
              <details className="wallet-copy-fallback" open>
                <summary>Wallet address</summary>
                <code>{p.identity.wallet}</code>
              </details>
            )}
          </div>
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
      {isOwner && (
        <div className="profile-account">
          {auth.session?.handleClaimed === false && (
            <button className="text-button" onClick={requestHandleClaim}>
              Claim your handle
            </button>
          )}
          <AccountWallet />
        </div>
      )}
      {editing && <ProfileEditor profile={p} />}
      <h2 className="sr-only">A reputation you can trace</h2>
      <div className="reputation-grid">
        <div>
          <span>Originality</span>
          <strong>{r.originality.label}</strong>
          <p>
            {r.successfulRoots} of {r.eligibleRoots} original ideas that others
            forked
          </p>
        </div>
        <div>
          <span>Contribution</span>
          <strong>{r.contribution.label}</strong>
          <p>
            {r.successfulForks} of {r.eligibleForks} forks that others forked
          </p>
        </div>
        <div>
          <span>Influence</span>
          <strong>{r.influence}</strong>
          <p>Distinct people who forked these ideas</p>
        </div>
      </div>
      <Earnings profile={p} owner={isOwner} />
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
          or influence.
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
      <h2 className="sr-only">Ideas and contributions</h2>
      <ReadStatus
        error={query.error}
        refreshing={query.isFetching}
        retry={() => void query.refetch()}
      />
      <div className="v2-seg" role="group" aria-label="Profile activity">
        {(["all", "roots", "forks"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t === "all" ? "Ideas" : t === "roots" ? "Originals" : "Forks"}
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
          maxLength={HANDLE_MAX}
          autoCapitalize="none"
          spellCheck={false}
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
/** What backing has brought this author, and the owner's way to collect it. */
function Earnings({
  profile,
  owner,
}: {
  profile: ProfileSummary;
  owner: boolean;
}) {
  const { step, error, confirmation, withdraw } = useWithdraw(profile);
  if (!profile.backingContract) return null;
  const { earnings, support } = profile,
    claimable = BigInt(earnings.claimableWei);
  return (
    <section aria-label="Backing earned and given">
      <h2 className="sr-only">Value that followed the ideas</h2>
      <dl className="earnings">
        <div className="earnings-forks">
          <dt>Earned from forks</dt>
          <dd>
            {formatMon(earnings.earnedFromForksWei)} <small>MON</small>
          </dd>
          <p>Income that arrives because someone else improved these ideas.</p>
        </div>
        <div>
          <dt>Earned as author</dt>
          <dd>
            {formatMon(earnings.earnedAsAuthorWei)} <small>MON</small>
          </dd>
          <p>From backing of ideas this author wrote.</p>
        </div>
        <div>
          <dt>Early support</dt>
          <dd>{support.earlySupportCount}</dd>
          <p>
            Ideas backed among their first ten. {support.thesesBacked}{" "}
            {support.thesesBacked === 1 ? "idea" : "ideas"} backed with{" "}
            {formatMon(support.totalBackedWei)} MON in total.
          </p>
        </div>
        <div className="earnings-claimable">
          <dt>Claimable</dt>
          <dd>
            {formatMon(claimable)} <small>MON</small>
          </dd>
          <p>{formatMon(earnings.withdrawnWei)} MON withdrawn so far.</p>
          {owner && claimable > 0n && (
            <button
              className="v2-btn v2-back"
              disabled={step !== "idle"}
              onClick={() => void withdraw()}
            >
              {step === "wallet"
                ? "Confirm in your wallet…"
                : step === "confirming"
                  ? "Waiting for Monad…"
                  : `Withdraw ${formatMon(claimable)} MON`}
            </button>
          )}
          {confirmation && (
            <p className="confirmation-note" role="status">
              {confirmationText(confirmation)}
            </p>
          )}
          {error ? (
            <p role="alert">
              {error instanceof Error
                ? error.message
                : "The withdrawal did not go through."}{" "}
              {error instanceof ApiError ? error.recovery : "Try again."}
            </p>
          ) : null}
        </div>
      </dl>
    </section>
  );
}
