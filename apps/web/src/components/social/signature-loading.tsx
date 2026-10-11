export function SignatureLoading({
  kind,
}: {
  kind: "thesis" | "lineage" | "fork";
}) {
  return (
    <div
      className="signature signature-loading"
      role="status"
      aria-label={`Loading ${kind}`}
    >
      <span className="eyebrow">
        {kind === "lineage"
          ? "Reading the idea graph"
          : kind === "fork"
            ? "Opening the parent perspective"
            : "Reading this perspective"}
      </span>
      <div className="signature-loading-title" />
      <div className="signature-loading-grid">
        <div>
          <div className="signature-loading-parameters" />
          <div className="signature-loading-copy" />
        </div>
        <div className="signature-loading-context" />
      </div>
    </div>
  );
}
