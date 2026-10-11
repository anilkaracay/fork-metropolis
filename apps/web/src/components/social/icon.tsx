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
    | "check";
  size?: number;
  style?: CSSProperties;
}) {
  const paths = {
    feed: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    explore: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-3 5-5 3 3-5Z" />
      </>
    ),
    create: <path d="M12 5v14M5 12h14" />,
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    fork: (
      <>
        <circle cx="7" cy="4" r="2" />
        <circle cx="17" cy="4" r="2" />
        <circle cx="7" cy="20" r="2" />
        <path d="M7 6v12M17 6v3a5 5 0 0 1-5 5H7" />
      </>
    ),
    comment: (
      <path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" />
    ),
    agree: (
      <path d="m9 11 3-7c1-2 4 0 3 3l-1 4h5c1 0 2 1 1 3l-2 6H9Zm-5 0h5v9H4Z" />
    ),
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
