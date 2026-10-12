"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EARLY_BACKER_LIMIT, type ThesisBackingView } from "@fork/shared";
import { api } from "@/lib/api-client";
import { formatMon } from "@/lib/mon";
import { Ticker } from "@/components/ui/motion";
import { formatEther } from "viem";
import { Avatar, age } from "./common";
import { Icon } from "./icon";
import { BackSheet, backingKey } from "./back-sheet";

const total = (flows: { amountWei: string }[]) =>
  flows.reduce((sum, flow) => sum + BigInt(flow.amountWei), 0n);
const monLabel = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 4 });

/** The Back button of a thesis. Renders nothing while backing is not live. */
export function BackButton({ thesisId }: { thesisId: string }) {
  const [open, setOpen] = useState(false);
  const view = useQuery({
    queryKey: backingKey(thesisId),
    queryFn: () => api<ThesisBackingView>(`theses/${thesisId}/backing`),
    staleTime: 10000,
  });
  if (!view.data?.contract) return null;
  return (
    <>
      <button
        type="button"
        className="button secondary back-button"
        onClick={() => setOpen(true)}
      >
        <Icon name="stake" size={17} />
        Back
        {view.data.summary.backers > 0 && (
          <span>{formatMon(view.data.summary.totalWei)}</span>
        )}
      </button>
      <BackSheet
        thesisId={thesisId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/** What a thesis has received, who backed it first and where the value went. */
export function BackingPanel({ thesisId }: { thesisId: string }) {
  const view = useQuery({
    queryKey: backingKey(thesisId),
    queryFn: () => api<ThesisBackingView>(`theses/${thesisId}/backing`),
    staleTime: 10000,
  });
  const data = view.data;
  if (!data?.contract) return null;
  const { summary } = data,
    sent = total(data.sent),
    received = total(data.received);
  return (
    <section className="backing-panel" aria-label="Backing">
      <div className="backing-total">
        <span className="eyebrow">Backed</span>
        <strong>
          <Ticker
            value={Number(formatEther(BigInt(summary.totalWei)))}
            format={monLabel}
          />{" "}
          <small>MON</small>
        </strong>
        <span>
          {summary.backers === 0
            ? "No backers yet. The first ten are recorded as early supporters."
            : `${summary.backers} ${summary.backers === 1 ? "backer" : "backers"} · ${summary.backings} ${summary.backings === 1 ? "backing" : "backings"}`}
        </span>
      </div>
      {data.earlyBackers.length > 0 && (
        <div className="backing-early">
          <span className="eyebrow">
            Early supporters · {data.earlyBackers.length} of{" "}
            {EARLY_BACKER_LIMIT}
          </span>
          <ol>
            {data.earlyBackers.map((person, index) => (
              <li key={person.wallet}>
                <Link
                  href={
                    person.userId
                      ? `/u/${person.handle}`
                      : `#supporter-${index}`
                  }
                  title={`@${person.handle}`}
                >
                  <Avatar
                    small
                    name={person.displayName}
                    wallet={person.wallet}
                  />
                  <span className="sr-only">@{person.handle}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
      {(sent > 0n || received > 0n) && (
        <dl className="backing-flows">
          {sent > 0n && (
            <div>
              <dt>Passed on to the ideas it grew from</dt>
              <dd>{formatMon(sent)} MON</dd>
            </div>
          )}
          {received > 0n && (
            <div>
              <dt>Arrived from backing of its forks</dt>
              <dd>{formatMon(received)} MON</dd>
            </div>
          )}
        </dl>
      )}
      {data.recent.length > 0 && (
        <ul className="backing-recent" aria-label="Recent backings">
          {data.recent.slice(0, 4).map((event) => (
            <li key={event.txHash}>
              <span>
                <strong>@{event.backer.handle}</strong> backed{" "}
                {formatMon(event.amountWei)} MON
              </span>
              <time dateTime={new Date(event.timestamp * 1000).toISOString()}>
                {age(event.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
