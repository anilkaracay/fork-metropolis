"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  DrawSVGPlugin,
  MorphSVGPlugin,
  Flip,
);

const FRAME_TITLES = ["New idea", "Fork of #1", "Back an idea", "Idea Tree"];
const all = <T extends Element = HTMLElement>(
  root: ParentNode,
  query: string,
) => Array.from(root.querySelectorAll<T>(query));

/** The opening scene, replayed from its first frame: fork, change, back, and value going home. */
function heroLoop(stage: HTMLElement) {
  const theo = stage.querySelector<HTMLElement>(".fc-theo")!,
    mira = stage.querySelector<HTMLElement>(".fc-mira")!,
    branch = stage.querySelector<SVGPathElement>("[data-hero=branch]")!,
    target = theo.querySelector<HTMLElement>("[data-hero=target]")!,
    leverage = theo.querySelector<HTMLElement>("[data-hero=leverage]")!,
    backers = all(theo, ".fc-backer"),
    backed = theo.querySelector<HTMLElement>("[data-hero=backed]")!,
    earned = mira.querySelector<HTMLElement>("[data-hero=earned]")!,
    coin = stage.querySelector<HTMLElement>("[data-hero=coin]")!;
  const length = branch.getTotalLength(),
    counter = { value: 4200 },
    travel = { at: 1 };
  const place = () => {
    const point = branch.getPointAtLength(travel.at * length);
    coin.style.left = `${(point.x / 560) * 100}%`;
    coin.style.top = `${(point.y / 620) * 100}%`;
  };
  const timeline = gsap.timeline({
    repeat: -1,
    repeatDelay: 0.6,
    defaults: { ease: "power3.out" },
  });
  timeline
    .set(theo, { autoAlpha: 0, y: 26, scale: 0.96 })
    .set(branch, { drawSVG: "0%" })
    .set(backers, { autoAlpha: 0, scale: 0 })
    .set([backed, earned], { autoAlpha: 0, y: 8 })
    .set(coin, { autoAlpha: 0, scale: 0.6 })
    .call(() => {
      counter.value = 4200;
      travel.at = 1;
      target.textContent = "$4,200";
      leverage.textContent = "2×";
      target.classList.remove("is-changed");
      leverage.classList.remove("is-changed");
      place();
    })
    .to(mira, { scale: 1.025, duration: 0.22, yoyo: true, repeat: 1 }, "+=0.7")
    .to(branch, { drawSVG: "100%", duration: 0.7, ease: "power2.inOut" })
    .to(theo, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55 }, "-=0.2")
    .to(
      counter,
      {
        value: 4400,
        duration: 0.7,
        ease: "power2.inOut",
        snap: { value: 1 },
        onStart: () => target.classList.add("is-changed"),
        onUpdate: () => {
          target.textContent = `$${Math.round(counter.value).toLocaleString("en-US")}`;
        },
      },
      "+=0.3",
    )
    .to(leverage, { yPercent: -60, autoAlpha: 0, duration: 0.16 })
    .call(() => {
      leverage.textContent = "3×";
      leverage.classList.add("is-changed");
    })
    .fromTo(
      leverage,
      { yPercent: 60, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.24 },
    )
    .to(
      backers,
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.4,
        ease: "back.out(2.2)",
        stagger: 0.13,
      },
      "+=0.25",
    )
    .to(backed, { autoAlpha: 1, y: 0, duration: 0.3 }, "-=0.1")
    .to(coin, { autoAlpha: 1, scale: 1, duration: 0.25 }, "+=0.15")
    .to(travel, {
      at: 0,
      duration: 0.95,
      ease: "power2.inOut",
      onUpdate: place,
    })
    .to(coin, { autoAlpha: 0, scale: 0.4, duration: 0.2 })
    .to(earned, { autoAlpha: 1, y: 0, duration: 0.35 }, "-=0.1")
    .to(mira, { scale: 1.025, duration: 0.2, yoyo: true, repeat: 1 }, "<")
    .to({}, { duration: 2.6 })
    .to([theo, earned], { autoAlpha: 0, duration: 0.45, ease: "power1.in" })
    .to(branch, { drawSVG: "0%", duration: 0.35, ease: "power1.in" }, "<");
  return timeline;
}

/** What plays inside each story panel when its step arrives. */
function panelTimeline(panel: HTMLElement, index: number) {
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.out" },
  });
  if (index === 0) {
    const mark = panel.querySelector<SVGPathElement>("[data-morph]")!;
    const check = mark.getAttribute("d")!;
    timeline
      .from(all(panel, "[data-fill]"), {
        autoAlpha: 0,
        y: 10,
        duration: 0.35,
        stagger: 0.09,
      })
      .fromTo(
        panel.querySelector("[data-press]"),
        { scale: 1 },
        { scale: 0.95, duration: 0.12, yoyo: true, repeat: 1 },
        "+=0.15",
      )
      .from(panel.querySelector("[data-confirm]"), {
        autoAlpha: 0,
        x: -8,
        duration: 0.3,
      })
      .fromTo(
        mark,
        { morphSVG: "M5 12h14" },
        { morphSVG: check, duration: 0.45, ease: "power2.inOut" },
        "<",
      );
  } else if (index === 1) {
    timeline
      .from(all(panel, "[data-line]"), {
        autoAlpha: 0,
        x: -14,
        duration: 0.32,
        stagger: 0.08,
      })
      .fromTo(
        all<SVGPathElement>(panel, "[data-draw]"),
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.6, ease: "power2.inOut" },
        0.1,
      );
  } else if (index === 2) {
    const counts = all(panel, "[data-count]");
    timeline
      .fromTo(
        panel.querySelector("[data-coin]"),
        { scale: 0.7 },
        { scale: 1, duration: 0.35, ease: "back.out(2)" },
      )
      .fromTo(
        all<SVGPathElement>(panel, "[data-stream]"),
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.7, ease: "power2.inOut", stagger: 0.08 },
        0.1,
      );
    counts.forEach((node, at) => {
      const end = Number(node.dataset.count),
        tick = { value: 0 };
      timeline.to(
        tick,
        {
          value: end,
          duration: 0.6,
          ease: "power1.out",
          onUpdate: () => {
            node.textContent = `${tick.value.toFixed(tick.value === end ? 1 : 2)} MON`;
          },
          onComplete: () => {
            node.textContent = `${end} MON`;
          },
        },
        0.45 + at * 0.08,
      );
    });
  } else {
    timeline
      .from(all(panel, "[data-node]"), {
        autoAlpha: 0,
        x: -12,
        "--draw": 0,
        duration: 0.45,
        stagger: 0.14,
      })
      .from(
        all(panel, "[data-flow]"),
        { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.15 },
        "-=0.1",
      );
  }
  return timeline;
}

export function LandingMotion() {
  useGSAP(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root) return;
    // Smooth scrolling drives ScrollTrigger; anchors glide instead of jumping.
    const lenis = new Lenis({ anchors: { offset: -72 } });
    lenis.on("scroll", ScrollTrigger.update);
    const frame = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(frame);
    gsap.ticker.lagSmoothing(0);

    const media = gsap.matchMedia();
    const cleanups: (() => void)[] = [];
    const listen = <K extends keyof HTMLElementEventMap>(
      node: HTMLElement,
      type: K,
      handler: (event: HTMLElementEventMap[K]) => void,
    ) => {
      node.addEventListener(type, handler);
      cleanups.push(() => node.removeEventListener(type, handler));
    };

    // Hero: the looping scene pauses whenever it is off screen.
    const stage = root.querySelector<HTMLElement>("[data-stage]");
    if (stage) {
      const loop = heroLoop(stage);
      // Render the first frame before the stylesheet stops holding it.
      loop.progress(0.0001);
      ScrollTrigger.create({
        trigger: stage,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      });
    }

    root.classList.add("motion-live");

    // Headings rise word by word as they arrive.
    for (const heading of all(root, "[data-split]"))
      SplitText.create(heading, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 110,
            duration: 0.75,
            ease: "power4.out",
            stagger: 0.045,
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          }),
      });
    ScrollTrigger.batch(all(root, "[data-reveal]"), {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.from(batch, {
          autoAlpha: 0,
          y: 28,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.09,
        }),
    });

    // The thread: the improved reply is noticed, buried, and survives only as a screenshot.
    const problem = root.querySelector<HTMLElement>("[data-problem]");
    if (problem) {
      const reply = problem.querySelector("[data-msg=reply]"),
        shot = problem.querySelector("[data-shot]");
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: problem,
            start: "top 62%",
            end: "bottom 78%",
            scrub: 0.6,
          },
        })
        .fromTo(
          reply,
          { opacity: 1, "--ring": 0 },
          { "--ring": 1, duration: 0.6 },
        )
        .from(all(problem, "[data-msg=noise]"), {
          autoAlpha: 0,
          y: 26,
          duration: 0.5,
          stagger: 0.35,
        })
        .to(reply, { opacity: 0.32, "--ring": 0, duration: 0.8 }, "-=1")
        .fromTo(
          shot,
          { autoAlpha: 0, xPercent: -30, yPercent: 30, rotate: 0 },
          {
            autoAlpha: 1,
            xPercent: 0,
            yPercent: 0,
            rotate: 7,
            duration: 1,
          },
          "-=0.9",
        );
    }

    // How it works.
    const story = root.querySelector<HTMLElement>("[data-story]");
    if (story) {
      const copies = all(story, ".story-copy"),
        panels = all(story, ".story-panel"),
        timelines = panels.map(panelTimeline),
        title = story.querySelector<HTMLElement>("[data-story-title]");
      media.add("(min-width: 1024px)", () => {
        story.classList.add("is-pinned");
        let current = -1;
        const show = (next: number) => {
          if (next === current) return;
          const before = panels[current],
            after = panels[next]!;
          const state = before
            ? Flip.getState(all(before, "[data-flip-id]"))
            : null;
          copies.forEach((copy, at) => {
            copy.toggleAttribute("data-active", at === next);
            if (at !== next) gsap.set(copy, { autoAlpha: 0 });
          });
          panels.forEach((panel, at) =>
            panel.toggleAttribute("data-active", at === next),
          );
          story.style.setProperty(
            "--tone",
            after.style.getPropertyValue("--tone"),
          );
          if (title) title.textContent = FRAME_TITLES[next]!;
          if (state)
            Flip.from(state, {
              targets: all(after, "[data-flip-id]"),
              duration: 0.6,
              ease: "power3.inOut",
              absolute: true,
              scale: true,
            });
          gsap.fromTo(
            copies[next]!,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" },
          );
          timelines[next]!.restart();
          current = next;
        };
        show(0);
        const pin = ScrollTrigger.create({
          trigger: story,
          start: "top top+=96",
          end: "+=280%",
          pin: true,
          onUpdate: (self) => show(Math.min(3, Math.floor(self.progress * 4))),
        });
        return () => {
          pin.kill();
          story.classList.remove("is-pinned");
          story.style.removeProperty("--tone");
          for (const node of [...copies, ...panels]) {
            node.removeAttribute("data-active");
            // Only what this code set: React owns the tone and the order on these nodes.
            gsap.set(node, { clearProps: "opacity,visibility,transform" });
          }
          for (const timeline of timelines) timeline.progress(1).pause();
        };
      });
      media.add("(max-width: 1023.98px)", () => {
        const triggers = panels.map((panel, at) =>
          ScrollTrigger.create({
            trigger: panel,
            start: "top 80%",
            once: true,
            onEnter: () => timelines[at]!.restart(),
          }),
        );
        return () => triggers.forEach((trigger) => trigger.kill());
      });
    }

    // The real tree draws branch by branch, and the real figures count up to themselves.
    const tree = root.querySelector<HTMLElement>("[data-realtree]");
    if (tree)
      gsap.from(all(tree, "[data-node]"), {
        autoAlpha: 0,
        x: -14,
        "--draw": 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.16,
        scrollTrigger: { trigger: tree, start: "top 80%", once: true },
      });
    for (const node of all(root, "[data-ticker]")) {
      const text = node.textContent ?? "",
        end = Number(text),
        places = text.split(".")[1]?.length ?? 0;
      if (!Number.isFinite(end) || end === 0) continue;
      const tick = { value: 0 };
      gsap.to(tick, {
        value: end,
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 92%", once: true },
        onUpdate: () => {
          node.textContent = tick.value.toFixed(places);
        },
        // The page states the figure exactly as the indexer gave it.
        onComplete: () => {
          node.textContent = text;
        },
      });
    }

    // Pointer effects, only where there is a real pointer.
    media.add("(hover: hover) and (pointer: fine)", () => {
      const before = cleanups.length;
      const hero = root.querySelector<HTMLElement>("[data-hero-root]");
      if (hero && stage) {
        const layers = all(stage, ".fc").map((card, at) => ({
          x: gsap.quickTo(card, "x", { duration: 0.7, ease: "power3.out" }),
          y: gsap.quickTo(card, "y", { duration: 0.7, ease: "power3.out" }),
          depth: card.classList.contains("fc-ghost") ? 6 + at * 2 : 14,
        }));
        listen(hero, "pointermove", (event) => {
          const box = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", `${event.clientX - box.left}px`);
          hero.style.setProperty("--my", `${event.clientY - box.top}px`);
          const dx = (event.clientX - box.left) / box.width - 0.5,
            dy = (event.clientY - box.top) / box.height - 0.5;
          for (const layer of layers) {
            layer.x(dx * layer.depth);
            layer.y(dy * layer.depth);
          }
        });
      }
      for (const card of all(
        root,
        "[data-glow], .l-audience-list > li, .l-built-list > li",
      ))
        listen(card, "pointermove", (event) => {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--gx", `${event.clientX - box.left}px`);
          card.style.setProperty("--gy", `${event.clientY - box.top}px`);
        });
      for (const button of all(root, "[data-magnetic]")) {
        const x = gsap.quickTo(button, "x", {
            duration: 0.4,
            ease: "power3.out",
          }),
          y = gsap.quickTo(button, "y", { duration: 0.4, ease: "power3.out" });
        listen(button, "pointermove", (event) => {
          const box = button.getBoundingClientRect();
          x((event.clientX - box.left - box.width / 2) * 0.22);
          y((event.clientY - box.top - box.height / 2) * 0.3);
        });
        listen(button, "pointerleave", () => {
          x(0);
          y(0);
        });
      }
      return () => {
        for (const cleanup of cleanups.splice(before)) cleanup();
      };
    });

    return () => {
      for (const cleanup of cleanups) cleanup();
      media.revert();
      gsap.ticker.remove(frame);
      lenis.destroy();
      root.classList.remove("motion-live");
    };
  });
  return null;
}
