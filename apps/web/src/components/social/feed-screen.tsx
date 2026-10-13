"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FeedMode, FeedThesis } from "@fork/shared";
import { api } from "@/lib/api-client";
import { ThesisCard } from "./thesis-card";
import {
  Avatar,
  EmptyState,
  ErrorState,
  Skeleton,
  ReadStatus,
  TokenMark,
} from "./common";
import { useSession } from "./session";
import { useProfile } from "./withdraw";
import { formatMon } from "@/lib/mon";
import { Icon } from "./icon";
type Page = {
  items: FeedThesis[];
  nextOffset: number | null;
  bounded: boolean;
  ranking: string;
};
export function FeedScreen() {
  const [mode, setMode] = useState<FeedMode>("fresh"),
    [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["feed", mode, offset],
    queryFn: () => api<Page>(`feed?mode=${mode}&offset=${offset}`),
    staleTime: 30000,
  });
  return (
    <div className="content-grid social-polish">
      <section className="feed-column">
        <div className="page-heading">
          <div>
            <h1>Feed</h1>
            <p>Good ideas get better.</p>
          </div>
          <div className="v2-seg" role="group" aria-label="Feed ranking">
            {(["fresh", "most-forked", "smart-signal"] as const).map((m) => (
              <button
                key={m}
                className={mode === m ? "selected" : ""}
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  setOffset(0);
                }}
              >
                {m === "fresh"
                  ? "Fresh"
                  : m === "most-forked"
                    ? "Most forked"
                    : "Smart signal"}
              </button>
            ))}
          </div>
        </div>
        <p className="ranking-note">
          {mode === "fresh"
            ? "Newest indexed perspectives first."
            : "Unique external forkers: 24h, then 7d, then newest."}{" "}
          {mode === "smart-signal" &&
            "Social signals only; no execution ranking."}
        </p>
        {query.data && (
          <ReadStatus
            error={query.error}
            refreshing={query.isFetching}
            retry={() => void query.refetch()}
          />
        )}
        {query.isPending ? (
          <Skeleton />
        ) : query.error && !query.data ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : query.data?.items.length ? (
          <>
            <div className="feed-list">
              {query.data.items.map((item, index) => (
                <ThesisCard
                  key={item.graph.thesisId}
                  item={item}
                  index={index}
                />
              ))}
            </div>
            <div className="pagination">
              {offset > 0 && (
                <button
                  className="button secondary"
                  onClick={() => setOffset(Math.max(0, offset - 20))}
                >
                  Previous ideas
                </button>
              )}
              {query.data.nextOffset !== null && (
                <button
                  className="button secondary"
                  onClick={() => setOffset(query.data!.nextOffset!)}
                >
                  More ideas
                </button>
              )}
            </div>
            {query.data.bounded && (
              <p className="subtle-note">
                Showing the latest 500 indexed ideas.
              </p>
            )}
          </>
        ) : (
          <EmptyState
            title="The first idea starts with you."
            description="Give the network a thesis to discuss and improve."
          />
        )}
      </section>
      <aside className="context-rail">
        <YourEarnings />
        <TopLineage />
        <div className="v2-card rail-card">
          <h4>Markets</h4>
          <div className="rail-markets">
            {["MON", "ETH", "BTC", "SOL"].map((symbol) => (
              <Link
                className="v2-chip"
                href={`/explore?market=${symbol}`}
                key={symbol}
              >
                <TokenMark symbol={symbol} size={18} />
                {symbol}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
type TopTree = {
  rootId: string;
  nodes: {
    id: string;
    depth: number;
    handle: string;
    backedMon: string | null;
    arrivedMon: string | null;
  }[];
} | null;
/** The largest real lineage on FORK, with what each idea received. */
function TopLineage() {
  const top = useQuery({
    queryKey: ["lineage-top"],
    queryFn: () => api<TopTree>("lineage/top"),
    staleTime: 30000,
  }).data;
  if (!top) return null;
  return (
    <div className="v2-card rail-card">
      <h4>Most forked lineage</h4>
      <ol className="rail-lineage">
        {top.nodes.slice(0, 5).map((node) => (
          <li key={node.id} style={{ paddingLeft: `${node.depth * 18}px` }}>
            <Avatar
              name={node.handle}
              wallet={node.handle}
              handle={node.handle}
              size={26}
            />
            <Link href={`/t/${node.id}`}>@{node.handle}</Link>
            <span className="rail-id">#{node.id}</span>
            <span className="rail-value">
              {node.arrivedMon
                ? `+${node.arrivedMon}`
                : node.backedMon
                  ? `${node.backedMon} MON`
                  : ""}
            </span>
          </li>
        ))}
      </ol>
      <Link href={`/t/${top.rootId}/tree`} className="rail-link">
        Open Idea Tree <Icon name="arrow" size={15} />
      </Link>
    </div>
  );
}
/** The signed-in author's earnings, straight from their public profile. */
function YourEarnings() {
  const auth = useSession(),
    profile = useProfile(auth.session?.handle).data;
  if (!auth.session || !profile?.backingContract) return null;
  const { earnings } = profile;
  return (
    <div className="v2-card rail-card">
      <h4>Your ideas</h4>
      <p className="v2-k">Earned from forks</p>
      <p className="rail-figure">
        <span>{formatMon(earnings.earnedFromForksWei)}</span>
        <small>MON</small>
      </p>
      <p className="rail-copy">
        {formatMon(earnings.earnedAsAuthorWei)} MON more from backing of ideas
        you wrote.
      </p>
      <Link href={`/u/${auth.session.handle}`} className="rail-link">
        Open your profile <Icon name="arrow" size={15} />
      </Link>
    </div>
  );
}
