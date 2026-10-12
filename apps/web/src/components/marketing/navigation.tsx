"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/social/icon";
import { Wordmark } from "@/components/ui/wordmark";

export function MarketingNavigation() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <header className="marketing-header" ref={root}>
      <Link
        href="/"
        className="marketing-logo"
        aria-label="FORK home"
        prefetch={false}
      >
        <Wordmark />
      </Link>
      <nav
        id="marketing-navigation"
        className={`marketing-nav ${open ? "is-open" : ""}`}
        aria-label="Landing navigation"
      >
        <Link href="/feed" prefetch={false} onClick={() => setOpen(false)}>
          Product
        </Link>
        <a href="#how" onClick={() => setOpen(false)}>
          How it works
        </a>
        <a href="#live" onClick={() => setOpen(false)}>
          Live graph
        </a>
      </nav>
      <div className="marketing-header-actions">
        <Link href="/feed" prefetch={false} className="button secondary">
          Open FORK <Icon name="arrow" size={16} />
        </Link>
        <button
          ref={toggle}
          type="button"
          className="marketing-menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="marketing-navigation"
          onClick={() => setOpen(!open)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <path d={open ? "m5 5 10 10M15 5 5 15" : "M3 6h14M3 14h14"} />
          </svg>
        </button>
      </div>
    </header>
  );
}
