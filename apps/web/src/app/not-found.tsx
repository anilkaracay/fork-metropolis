import Link from "next/link";

export default function NotFound() {
  return (
    <div className="state-box">
      <h1 className="text-3xl font-semibold tracking-tight">
        This page isn’t here.
      </h1>
      <p className="mt-5 text-muted-foreground">
        The link may have changed. You can return to the Feed.
      </p>
      <Link
        href="/feed"
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Return to Feed
      </Link>
    </div>
  );
}
