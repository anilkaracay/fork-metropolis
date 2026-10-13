import type { Metadata } from "next";
import { connection } from "next/server";
import { Hero } from "@/components/marketing/hero";
import { MotionGate } from "@/components/marketing/motion-gate";
import { MarketingNavigation } from "@/components/marketing/navigation";
import {
  ActivityStrip,
  Audience,
  BuiltOn,
  Finale,
  LandingFooter,
  LiveGraph,
  Problem,
  Profiles,
} from "@/components/marketing/sections";
import { Story } from "@/components/marketing/story";
import { MEASURED_RUN } from "@/lib/measured";
import { readLandingLive } from "@/server/landing";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "FORK · Trading ideas evolve here" },
  description:
    "Publish a trading idea, fork a better one, back the ones you believe in. Everyone who shaped an idea shares what it attracts. On Monad.",
  alternates: { canonical: "/" },
};
// The deployed registry, shown when the live read is unavailable. Public, not a credential.
const REGISTRY = "0x1889a7216b1ecad9a44910dd0996834d0894b9e1";

// Runs before first paint: turns motion on unless the visitor asked for less of it, and
// lets the intro play once per session. Without it the page is complete and still.
const BOOT = `(function(){try{var d=document.currentScript.parentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion");if(!sessionStorage.getItem("fork-intro")){d.classList.add("intro");sessionStorage.setItem("fork-intro","1")}}}catch(e){}})()`;

export default async function LandingPage() {
  await connection();
  const live = await readLandingLive();
  const registry = live?.registry ?? REGISTRY;
  return (
    // The boot script adds classes to this element before React hydrates it.
    <div className="landing" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      <div className="l-intro" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none">
          <g className="l-intro-rays" strokeWidth="5" strokeLinecap="round">
            <path d="M36 28 12 6" stroke="var(--publish)" pathLength="1" />
            <path d="M36 28 30 2" stroke="var(--fork)" pathLength="1" />
            <path d="M84 28 90 2" stroke="var(--back)" pathLength="1" />
            <path d="M84 28 108 6" stroke="var(--tree)" pathLength="1" />
          </g>
          <g
            className="l-intro-glyph"
            stroke="var(--ink)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M36 98V38" pathLength="1" />
            <path d="M84 38v14c0 14-11 25-25 25H36" pathLength="1" />
            <circle cx="36" cy="28" r="9" pathLength="1" />
            <circle cx="84" cy="28" r="9" pathLength="1" />
            <circle cx="36" cy="106" r="9" pathLength="1" />
          </g>
        </svg>
      </div>
      <a className="skip-link" href="#landing-content">
        Skip to content
      </a>
      <MarketingNavigation ideas={live?.ideas ?? null} />
      <main id="landing-content" tabIndex={-1}>
        <Hero />
        {live && <ActivityStrip events={live.events} now={live.readAt} />}
        <Problem />
        <Story />
        <LiveGraph live={live} />
        <Profiles />
        <Audience />
        <BuiltOn
          registry={registry}
          backing={live?.backingContract ?? null}
          measured={MEASURED_RUN}
        />
        <Finale />
      </main>
      <LandingFooter
        registry={registry}
        backing={live?.backingContract ?? null}
      />
      <MotionGate />
    </div>
  );
}
