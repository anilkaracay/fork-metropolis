"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-semibold">This page couldn’t load.</h1>
      <p className="mt-4 text-muted-foreground">
        Try again to recover the page.
      </p>
      <div className="mt-8 flex items-center gap-6">
        <Button onClick={reset}>Try again</Button>
        <Link href="/feed" className="text-sm text-link">
          Return to Feed
        </Link>
      </div>
    </div>
  );
}
