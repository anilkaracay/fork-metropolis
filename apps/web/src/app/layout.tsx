import type { Metadata } from "next";
import type { ReactNode } from "react";
import { clientEnv } from "@/lib/env/client";
import { getServerEnv } from "@/lib/env/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: { default: "FORK — Ideas evolve in public", template: "%s | FORK" },
  description:
    "A social network for collaborative trading ideas. Publish a thesis, fork a perspective, and keep the lineage visible.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  getServerEnv();
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
