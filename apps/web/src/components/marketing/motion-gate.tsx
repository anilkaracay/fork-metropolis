"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LandingMotion = dynamic(
  () => import("./landing-motion").then((module) => module.LandingMotion),
  { ssr: false },
);

/**
 * Loads the animation code after the page is readable, and only for visitors who have not
 * asked for reduced motion. Without it the page is complete: every section renders its
 * finished state on the server.
 */
export function MotionGate() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".fk");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1800 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 400);
    return () => clearTimeout(id);
  }, []);
  return ready ? <LandingMotion /> : null;
}
