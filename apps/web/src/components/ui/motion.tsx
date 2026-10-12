"use client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  domAnimation,
  LazyMotion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";

/** Loads only the animation features the product uses and honors reduced motion. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

/**
 * A number that glides to its new value. Layout never shifts: digits are tabular.
 * With `from`, it also glides from that value when it first appears.
 */
export function Ticker({
  value,
  format,
  className,
  from,
  delay = 0,
}: {
  value: number;
  format: (value: number) => string;
  className?: string;
  from?: number;
  delay?: number;
}) {
  const node = useRef<HTMLSpanElement>(null),
    shown = useRef(from ?? value),
    still = useReducedMotion();
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    if (still || shown.current === value) {
      shown.current = value;
      element.textContent = format(value);
      return;
    }
    element.textContent = format(shown.current);
    const controls = animate(shown.current, value, {
      duration: 0.6,
      delay,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (current) => {
        shown.current = current;
        element.textContent = format(current);
      },
    });
    return () => controls.stop();
  }, [value, format, still, delay]);
  return (
    <span
      ref={node}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {format(value)}
    </span>
  );
}
