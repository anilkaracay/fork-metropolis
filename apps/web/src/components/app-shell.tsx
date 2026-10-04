import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Feed", href: "/feed", glyph: "◫" },
  { name: "Explore", href: "/explore", glyph: "◇" },
  { name: "Create", href: "/new", glyph: "+" },
  { name: "Profile", href: "/u/me", glyph: "○" },
] as const;

export function AppShell({
  active,
  children,
}: {
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto min-h-dvh max-w-7xl md:grid md:grid-cols-[216px_1fr]">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="border-b border-border px-4 py-6 md:min-h-dvh md:border-r md:border-b-0 md:px-6 md:py-10">
        <Link
          href="/feed"
          aria-label="FORK home"
          className="inline-flex items-center gap-3 text-2xl font-semibold tracking-[-0.06em]"
        >
          <span aria-hidden="true" className="text-primary">
            ⑂
          </span>
          FORK<span className="text-primary">.</span>
        </Link>
        <p className="mt-3 hidden text-xs leading-5 text-muted-foreground md:block">
          Ideas evolve in public.
        </p>
        <nav
          aria-label="Main navigation"
          className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-border bg-background px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:static md:mt-12 md:block md:space-y-2 md:border-0 md:bg-transparent md:p-0"
        >
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active === item.name ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:flex-row md:justify-start md:gap-3 md:px-4 md:text-sm",
                active === item.name && "bg-secondary text-foreground",
              )}
            >
              <span aria-hidden="true" className="text-xl leading-5 md:w-5">
                {item.glyph}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 px-4 pb-28 md:px-12 md:pb-12">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-border text-xs text-muted-foreground">
          <span>Collaborative trading ideas</span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary"
            />
            Foundation preview
          </span>
        </header>
        <main id="main-content" tabIndex={-1} className="py-12 md:py-20">
          {children}
        </main>
      </div>
    </div>
  );
}
