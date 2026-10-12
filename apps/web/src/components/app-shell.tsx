"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "./social/session";
import { Icon } from "./social/icon";
import { Avatar } from "./social/common";
import { AccountWallet, WelcomeDrip } from "./social/account-wallet";
import { HandleClaim, requestHandleClaim } from "./social/handle-claim";
const navigation = [
  { name: "Feed", href: "/feed", icon: "feed" },
  { name: "Explore", href: "/explore", icon: "explore" },
  { name: "Create", href: "/new", icon: "create" },
  { name: "Profile", href: "/u/me", icon: "profile" },
] as const;
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
          <span className="brand-mark">
            <Icon name="fork" size={28} />
          </span>
          FORK<span className="brand-dot">.</span>
        </Link>
        <p className="brand-caption">Ideas evolve in public.</p>
        <nav aria-label="Main navigation" className="main-nav">
          {navigation.map((n) => (
            <Link
              className={`nav-link ${active === n.name ? "active" : ""}`}
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
        <div className="sidebar-note">
          <Icon name="tree" />
          <p>
            A thesis is a beginning.
            <br />
            See where it branches.
          </p>
          <Link href="/explore">
            Explore the idea graph <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="sidebar-account">
          {auth.session ? (
            <>
              <Link href={`/u/${auth.session.handle}`} className="account-row">
                <Avatar
                  name={auth.session.displayName}
                  wallet={auth.session.wallet}
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
            <button className="button secondary full" onClick={auth.login}>
              Sign in
            </button>
          )}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link className="mobile-brand" href="/feed">
            FORK<span>.</span>
          </Link>
          <span className="topbar-caption">
            A network of ideas, built together.
          </span>
          <div className="topbar-actions">
            <span className="network-label">
              <i />
              Monad Testnet
            </span>
            {auth.session ? (
              <Link
                className="mini-account"
                href={`/u/${auth.session.handle}`}
                aria-label="Open your profile"
              >
                <Avatar
                  small
                  name={auth.session.displayName}
                  wallet={auth.session.wallet}
                />
              </Link>
            ) : (
              <button className="text-button" onClick={auth.login}>
                Sign in <Icon name="arrow" size={14} />
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
        <footer className="product-footer">
          Ideas are perspectives, not promises. Keep your reasoning visible.
        </footer>
      </div>
      {auth.session && <WelcomeDrip key={auth.session.userId} />}
      <HandleClaim />
    </div>
  );
}
