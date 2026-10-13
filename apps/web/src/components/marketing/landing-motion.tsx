"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The parts of the landing page's motion that CSS cannot do: smooth scrolling, and the
 * measured Monad figures counting up to themselves. Everything else (the hero loop, the
 * reveals, the sticky story) is CSS, and the page is complete without this chunk.
 */
export function LandingMotion() {
  useGSAP(() => {
    const lenis = new Lenis({ anchors: { offset: -88 } });
    lenis.on("scroll", ScrollTrigger.update);
    const frame = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(frame);
    gsap.ticker.lagSmoothing(0);

    for (const node of document.querySelectorAll<HTMLElement>(
      ".fk [data-ticker]",
    )) {
      const text = node.textContent ?? "",
        sign = text.startsWith("+") ? "+" : "",
        end = Number(text.replace("+", "")),
        places = text.split(".")[1]?.length ?? 0;
      if (!Number.isFinite(end) || end === 0) continue;
      const tick = { value: 0 };
      gsap.to(tick, {
        value: end,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 90%", once: true },
        onUpdate: () => {
          node.textContent = sign + tick.value.toFixed(places);
        },
        // The page states the figure exactly as it was recorded.
        onComplete: () => {
          node.textContent = text;
        },
      });
    }
    return () => {
      gsap.ticker.remove(frame);
      lenis.destroy();
    };
  });
  return null;
}
