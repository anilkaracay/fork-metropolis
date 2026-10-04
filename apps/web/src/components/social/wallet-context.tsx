"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { WalletContext } from "@/server/nansen";
import { useSession } from "./session";

export function ExternalWalletContext({ handle }: { handle: string }) {
  const auth = useSession();
  const query = useQuery({
    queryKey: ["wallet-context", handle],
    queryFn: () => api<WalletContext>(`profiles/${handle}/context`),
    enabled: !auth.test,
    staleTime: 3600000,
    retry: false,
  });
  const value = query.data;
  if (!value || value.status === "disabled") return null;
  const summary = value.summary;
  return (
    <aside
      className="reputation-explanation"
      aria-label="External wallet context"
    >
      <h2>External wallet context</h2>
      <p>
        Monad mainnet · previous 30 complete UTC days · separate from FORK
        reputation and Testnet executions.
      </p>
      {summary ? (
        <p>
          Realized wallet PnL:{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          }).format(summary.realizedPnlUsd)}
          {" · "}
          {summary.sales} sales across {summary.tradedTokens} tokens.
          {value.stale
            ? " Cached context; refresh is temporarily unavailable."
            : ""}
        </p>
      ) : (
        <p>
          {value.status === "empty"
            ? "No trading history returned for this wallet and window."
            : "Wallet context is temporarily unavailable. FORK participation remains current."}
        </p>
      )}
      {value.fetchedAt && (
        <p>Observed {new Date(value.fetchedAt).toLocaleString()}</p>
      )}
      {(value.stale || value.status === "unavailable") && (
        <button
          className="button secondary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Retry context
        </button>
      )}
      <p>
        <a href="https://nansen.ai" target="_blank" rel="noreferrer">
          Context from Nansen
        </a>
      </p>
    </aside>
  );
}
