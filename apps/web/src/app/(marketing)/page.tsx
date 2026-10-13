import type { Metadata } from "next";
import { connection } from "next/server";
import { LandingV3 } from "@/components/marketing/landing-v3";
import { MotionGate } from "@/components/marketing/motion-gate";
import { MEASURED_RUN } from "@/lib/measured";
import { readLandingLive } from "@/server/landing";
import "./landing-v3.css";
import "./landing-v3-live.css";

export const metadata: Metadata = {
  title: { absolute: "FORK · Trading ideas evolve here" },
  description:
    "Publish a trading idea, fork a better one, back the ones you believe in. Every backing is split onchain between everyone who shaped the idea. On Monad.",
  alternates: { canonical: "/" },
};

export default async function LandingPage() {
  await connection();
  const live = await readLandingLive();
  return (
    <>
      <a className="skip-link" href="#how">
        Skip to how it works
      </a>
      <main className="l3-main">
        <LandingV3 live={live} run={MEASURED_RUN} />
      </main>
      <MotionGate />
    </>
  );
}
