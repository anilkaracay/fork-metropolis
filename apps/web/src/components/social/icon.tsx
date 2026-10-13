import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 20,
  style,
}: {
  name:
    | "feed"
    | "explore"
    | "create"
    | "profile"
    | "fork"
    | "comment"
    | "agree"
    | "arrow"
    | "tree"
    | "back"
    | "more"
    | "check"
    | "close"
    | "stake"
    | "search"
    | "diamond"
    | "chevron"
    | "external";
  size?: number;
  style?: CSSProperties;
}) {
  const paths = {
    feed: <path d="M4 6h16M4 12h16M4 18h10" />,
    explore: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z" />
    ),
    create: <path d="M12 5v14M5 12h14" />,
    profile: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
    ),
    fork: (
      <>
        <circle cx="7" cy="4" r="2" />
        <circle cx="17" cy="4" r="2" />
        <circle cx="7" cy="20" r="2" />
        <path d="M7 6v12M17 6v3a5 5 0 0 1-5 5H7" />
      </>
    ),
    comment: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
    agree: <path d="M5 12l4 4L19 6" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    tree: (
      <>
        <rect x="9" y="2" width="6" height="5" rx="1" />
        <path d="M12 7v5M5 12h14M5 12v4M19 12v4" />
        <rect x="2" y="16" width="6" height="5" rx="1" />
        <rect x="16" y="16" width="6" height="5" rx="1" />
      </>
    ),
    back: <path d="M19 12H5m5-5-5 5 5 5" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />,
    diamond: <path d="M12 3 21 12 12 21 3 12Z" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    external: <path d="M7 17 17 7M8 7h9v9" />,
    stake: (
      <>
        <ellipse cx="12" cy="6.5" rx="7" ry="2.75" />
        <path d="M5 6.5v5.25c0 1.5 3.1 2.75 7 2.75s7-1.25 7-2.75V6.5" />
        <path d="M5 11.75V17c0 1.5 3.1 2.75 7 2.75s7-1.25 7-2.75v-5.25" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
