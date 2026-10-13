/**
 * The FORK mark: a branch drawn as an F, its three ends in the publish, fork and back colours.
 * Traced from the logo artwork; decorative, so the wordmark beside it carries the name.
 */
export function BrandMark({ height = 28 }: { height?: number }) {
  return (
    <svg
      className="brand-mark-svg"
      viewBox="0 0 334 436"
      height={height}
      width={Math.round((height * 334) / 436)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M61 375V123q0-62 62-62h150M61 252q0-43 43-43h113"
        stroke="#B1D6AC"
        strokeWidth="40"
        strokeLinecap="round"
      />
      <circle cx="273" cy="61" r="41" fill="#B1D6AC" />
      <circle cx="217" cy="209" r="41" fill="#C5B6FF" />
      <circle cx="61" cy="375" r="41" fill="#FFE38F" />
    </svg>
  );
}
