import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { clientEnv } from "@/lib/env/client";
import { getServerEnv } from "@/lib/env/server";
import "./globals.css";

const sans = localFont({
  src: "./fonts/Geist.woff2",
  variable: "--geist-sans",
  display: "swap",
  weight: "100 900",
});
const mono = localFont({
  src: "./fonts/GeistMono.woff2",
  variable: "--geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: { default: "FORK · Ideas evolve in public", template: "%s | FORK" },
  description:
    "A social network for trading ideas. Publish an idea, fork a better one, back the ones you believe in, and every backing is split onchain between everyone who shaped it.",
  openGraph: { type: "website", siteName: "FORK", url: "/" },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#0B0D10" };
export default function RootLayout({ children }: { children: ReactNode }) {
  getServerEnv();
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
