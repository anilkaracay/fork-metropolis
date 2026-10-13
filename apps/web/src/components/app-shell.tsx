"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "./social/session";
import { Icon } from "./social/icon";
import { BrandMark } from "./ui/brand-mark";
import { Avatar, TokenMark } from "./social/common";
import { AccountWallet, WelcomeDrip } from "./social/account-wallet";
import { HandleClaim, requestHandleClaim } from "./social/handle-claim";
import { shortWallet, useProfile, useWithdraw } from "./social/withdraw";
import { formatMon } from "@/lib/mon";
import { ApiError } from "@/lib/api-client";
const navigation = [
  { name: "Feed", href: "/feed", icon: "feed" },
  { name: "Explore", href: "/explore", icon: "explore" },
  { name: "Create", href: "/new", icon: "create" },
  { name: "Profile", href: "/u/me", icon: "profile" },
] as const;
function Logo() {
  return (
    <>
      <span className="brand-mark">
        <BrandMark height={26} />
      </span>
      FORK<span className="brand-dot">.</span>
    </>
  );
}
/** The signed-in author's claimable MON, with the same Withdraw the profile offers. */
function ClaimableCard() {
  const auth = useSession(),
    profile = useProfile(auth.session?.handle).data,
    { step, error, withdraw, wallet } = useWithdraw(profile);
  if (!profile?.backingContract) return null;
  const claimable = BigInt(profile.earnings.claimableWei);
  if (claimable === 0n && step === "idle" && !error) return null;
  return (
    <section className="v2-card claimable-card" aria-label="Claimable">
      <span className="v2-label">Claimable</span>
      <p className="claimable-amount">
        <span>{formatMon(claimable)}</span>
        <small>MON</small>
      </p>
      <button
        type="button"
        className="v2-btn v2-back v2-sm"
        disabled={step !== "idle" || claimable === 0n}
        onClick={(event) => void withdraw(event.nativeEvent)}
      >
        {step === "wallet"
          ? "Signing…"
          : step === "confirming"
            ? "Waiting for Monad…"
            : `Withdraw ${formatMon(claimable)} MON`}
      </button>
      {claimable > 0n && step === "idle" && wallet && (
        <p className="withdraw-to">To your wallet {shortWallet(wallet)}</p>
      )}
      {error ? (
        <p role="alert" className="claimable-error">
          {error instanceof Error
            ? error.message
            : "The withdrawal did not go through."}{" "}
          {error instanceof ApiError ? error.recovery : "Try again."}
        </p>
      ) : null}
    </section>
  );
}
function MobileClaimable() {
  const auth = useSession(),
    profile = useProfile(auth.session?.handle).data;
  if (!auth.session || !profile?.backingContract) return null;
  const claimable = BigInt(profile.earnings.claimableWei);
  if (claimable === 0n) return null;
  return (
    <Link className="mobile-claimable" href={`/u/${auth.session.handle}`}>
      {formatMon(claimable)} claimable
    </Link>
  );
}
function TopSearch() {
  const router = useRouter();
  return (
    <form
      role="search"
      className="top-search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = new FormData(e.currentTarget).get("q");
        router.push(
          `/explore${typeof term === "string" && term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`,
        );
      }}
    >
      <Icon name="search" size={18} />
      <input
        type="search"
        name="q"
        placeholder="Search ideas, markets and people"
        aria-label="Search"
        maxLength={100}
      />
    </form>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    auth = useSession();
  const active = pathname.startsWith("/explore")
    ? "Explore"
    : pathname.startsWith("/new") || pathname.endsWith("/fork")
      ? "Create"
      : pathname.startsWith("/u/")
        ? "Profile"
        : "Feed";
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className={`sidebar ${auth.session ? "signed-in" : ""}`}>
        <Link className="brand" href="/feed" aria-label="FORK home">
          <Logo />
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          {navigation.map((n) => (
            <Link
              className={`nav-link ${active === n.name ? "active" : ""} nav-${n.icon}`}
              aria-current={active === n.name ? "page" : undefined}
              key={n.name}
              href={n.href}
            >
              <Icon name={n.icon} />
              <span>{n.name}</span>
              {active === n.name && <i />}
            </Link>
          ))}
        </nav>
        <p className="sidebar-network">
          <TokenMark symbol="MON" size={18} />
          Monad Testnet
        </p>
        <div className="sidebar-spacer" />
        {auth.session && <ClaimableCard />}
        <div className="sidebar-account v2-card">
          {auth.session ? (
            <>
              <Link href={`/u/${auth.session.handle}`} className="account-row">
                <Avatar
                  size={40}
                  name={auth.session.displayName}
                  wallet={auth.session.wallet}
                  handle={auth.session.handle}
                />
                <span>
                  <strong>{auth.session.displayName}</strong>
                  <small>@{auth.session.handle}</small>
                </span>
              </Link>
              {!auth.session.handleClaimed && (
                <button className="text-button" onClick={requestHandleClaim}>
                  Claim your handle
                </button>
              )}
              <AccountWallet />
            </>
          ) : (
            <button
              className="v2-btn v2-ghost full"
              onClick={auth.login}
              aria-busy={!auth.ready}
            >
              Sign in
            </button>
          )}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link className="mobile-brand" href="/feed" aria-label="FORK home">
            <Logo />
          </Link>
          <TopSearch />
          <div className="topbar-actions">
            <Link className="v2-btn v2-fork new-idea" href="/new">
              <Icon name="create" size={18} />
              <span>New idea</span>
            </Link>
            <MobileClaimable />
            {auth.session ? (
              <Link
                className="v2-btn v2-ghost mini-account"
                href={`/u/${auth.session.handle}`}
                aria-label="Open your profile"
              >
                <Avatar
                  size={30}
                  name={auth.session.displayName}
                  wallet={auth.session.wallet}
                  handle={auth.session.handle}
                />
              </Link>
            ) : (
              <button className="v2-btn v2-ghost" onClick={auth.login}>
                Sign in
              </button>
            )}
          </div>
        </header>
        {auth.error && (
          <div role="alert" className="inline-alert">
            {auth.error} <Link href="/feed">Browse Feed</Link>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      {auth.session && <WelcomeDrip key={auth.session.userId} />}
      <HandleClaim />
    </div>
  );
}
