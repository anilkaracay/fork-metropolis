"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0b0d10",
          color: "#f4f6f8",
          fontFamily: "system-ui",
          padding: "48px",
        }}
      >
        <h1>FORK couldn’t load.</h1>
        <p>Try again to recover the application.</p>
        <button
          onClick={reset}
          style={{ padding: "12px 20px", cursor: "pointer" }}
        >
          Try again
        </button>
        <p>
          <a href="/feed" style={{ color: "#8ab4ff" }}>
            Return to Feed
          </a>
        </p>
      </body>
    </html>
  );
}
