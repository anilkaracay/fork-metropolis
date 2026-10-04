import { AppShell } from "./app-shell";

export function FoundationScreen({
  active,
  title,
  description,
}: {
  active: string;
  title: string;
  description: string;
}) {
  return (
    <AppShell active={active}>
      <div className="max-w-xl">
        <p className="mb-5 text-xs font-medium tracking-wide text-primary">
          {active}
        </p>
        <h1 className="text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
          {description}
        </p>
        <div className="mt-12 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
          Phase 1 establishes the foundation. Publishing, wallets and live
          social data will arrive in the next authorized phases.
        </div>
      </div>
    </AppShell>
  );
}
