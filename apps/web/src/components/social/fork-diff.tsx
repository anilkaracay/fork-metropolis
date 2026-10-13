"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  forkDifference,
  type FeedThesis,
  type ForkDifference,
  type ThesisCore,
  type ThesisDetail,
} from "@fork/shared";
import { api } from "@/lib/api-client";
import { price } from "./thesis-card";
import { Icon } from "./icon";

export function differenceValue(field: string, value: string) {
  if (field.endsWith("PriceE8")) {
    const [whole, fraction] = price(value).split(".");
    return `$${whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
  }
  if (field === "leverageBps") return `${Number(value) / 10000}×`;
  if (field === "side") return value.toUpperCase();
  return value;
}

export function ForkDiff({
  changes,
  core,
  parentId,
  invalidFields = [],
  draft = false,
}: {
  changes: ForkDifference[];
  core: ThesisCore;
  parentId: string;
  invalidFields?: string[];
  draft?: boolean;
}) {
  const unchanged = (
    [
      ["targetPriceE8", "Target"],
      ["invalidationPriceE8", "Invalidation"],
      ["leverageBps", "Leverage"],
      ["side", "Direction"],
    ] as const
  ).filter(
    ([field]) =>
      !changes.some((c) => c.field === field) && !invalidFields.includes(field),
  );
  return (
    <section
      className="fork-diff"
      aria-label={draft ? "Live draft comparison" : "Parent comparison"}
    >
      <div className="comparison-heading">
        <Icon name="fork" size={16} />
        <span className="sr-only">
          {draft ? "Your contribution" : `Changes from #${parentId}`}
        </span>
        <h2>{draft ? "What changes?" : "What changed"}</h2>
        <span className="diff-from">
          from <Link href={`/t/${parentId}`}>#{parentId}</Link>
        </span>
        <p className="diff-status" role="status" aria-live="polite">
          {changes.length
            ? `${changes.length} ${changes.length === 1 ? "change" : "changes"}${draft ? " in your draft" : ""}`
            : draft
              ? "No changes yet. Make this perspective your own."
              : "No differences available."}
        </p>
      </div>
      <div className="diff-list">
        {changes.map((c) =>
          c.field === "reasoning" ||
          c.field === "entryNote" ||
          c.field === "tags" ? (
            <details className="diff-text" key={c.field}>
              <summary>
                <span className="diff-sign" aria-hidden="true">
                  ~
                </span>
                <strong>{c.label}</strong>
                <span>modified</span>
              </summary>
              <div className="text-comparison">
                <div>
                  <span>Parent</span>
                  <p>{c.before}</p>
                </div>
                <div>
                  <span>{draft ? "Your draft" : "This fork"}</span>
                  <p>{c.after}</p>
                </div>
              </div>
            </details>
          ) : (
            <div className="diff-row" data-diff-field={c.field} key={c.field}>
              <div className="diff-line removed">
                <span className="diff-sign" aria-hidden="true">
                  −
                </span>
                <strong>{c.label}</strong>
                <del>{differenceValue(c.field, c.before)}</del>
              </div>
              <div className="diff-line added">
                <span className="diff-sign" aria-hidden="true">
                  +
                </span>
                <strong aria-hidden="true">{c.label}</strong>
                <ins>
                  <span className="sr-only">changed to </span>
                  {differenceValue(c.field, c.after)}
                </ins>
              </div>
            </div>
          ),
        )}
      </div>
      {invalidFields.length > 0 && (
        <p className="diff-pending" role="status">
          Finish{" "}
          {invalidFields
            .map(
              (f) =>
                (
                  ({
                    targetPriceE8: "target",
                    invalidationPriceE8: "invalidation",
                    leverageBps: "leverage",
                    reasoning: "reasoning",
                    entryNote: "entry note",
                    tags: "tags",
                    side: "direction",
                  }) as Record<string, string>
                )[f] ?? f,
            )
            .join(", ")}{" "}
          to compare those fields. Other valid changes remain visible.
        </p>
      )}
      {!!unchanged.length && (
        <div className="unchanged-list">
          <span className="sr-only">Unchanged</span>
          {unchanged.map(([field, label]) => (
            <div key={field}>
              <span className="diff-sign" aria-hidden="true" />
              <span>{label}</span>
              <strong>{differenceValue(field, String(core[field]))}</strong>
            </div>
          ))}
        </div>
      )}
      {draft && (
        <p className="subtle-note">
          Change direction, target, invalidation, leverage or reasoning to
          publish a fork. Notes and tags can accompany that change.
        </p>
      )}
    </section>
  );
}

export function ParentComparison({
  item,
  parent,
}: {
  item: FeedThesis;
  parent?: FeedThesis | undefined;
}) {
  // The existing API computes these differences only after validating both
  // metadata hashes against their canonical graph nodes. Reuse that snapshot
  // instead of requiring another parent-detail network request.
  const canonicalChanges =
    !parent &&
    item.metadataState === "trusted" &&
    !!item.metadata &&
    item.parent?.thesisId === item.graph.parentId &&
    item.changes.length > 0;
  const query = useQuery({
    queryKey: ["detail", item.graph.parentId],
    enabled:
      item.graph.parentId !== "0" &&
      !parent &&
      !canonicalChanges &&
      item.metadataState === "trusted",
    queryFn: () => api<ThesisDetail>(`theses/${item.graph.parentId}`),
  });
  if (item.graph.parentId === "0")
    return (
      <div className="root-context">
        <span className="eyebrow">The original perspective</span>
        <p>
          This idea begins the lineage. Every fork keeps this origin and its own
          author.
        </p>
      </div>
    );
  if (canonicalChanges)
    return (
      <ForkDiff
        changes={item.changes}
        core={item.graph.core}
        parentId={item.graph.parentId}
      />
    );
  const source = parent ?? query.data;
  if (
    item.metadataState !== "trusted" ||
    !source ||
    source.metadataState !== "trusted" ||
    !item.metadata ||
    !source.metadata ||
    source.graph.thesisId !== item.graph.parentId ||
    source.graph.core.marketId !== item.graph.core.marketId ||
    source.graph.chainId !== item.graph.chainId ||
    source.graph.registryAddress !== item.graph.registryAddress
  )
    return (
      <div className="comparison-unavailable">
        <h2>Parent comparison</h2>
        <p>
          {query.isFetching && !parent
            ? "Loading the parent perspective…"
            : "Verified metadata is needed for both ideas. Their onchain relationship remains visible."}
        </p>
        <button
          className="button secondary"
          onClick={() => void query.refetch()}
        >
          Check parent again
        </button>
        <Link href={`/t/${item.graph.parentId}`}>
          Open parent #{item.graph.parentId}
        </Link>
      </div>
    );
  return (
    <ForkDiff
      changes={forkDifference(
        { core: source.graph.core, metadata: source.metadata },
        { core: item.graph.core, metadata: item.metadata },
      )}
      core={item.graph.core}
      parentId={source.graph.thesisId}
    />
  );
}
