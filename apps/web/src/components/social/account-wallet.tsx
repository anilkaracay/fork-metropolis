"use client";
import { useEffect, useRef, useState } from "react";
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { monadTestnet } from "@fork/shared";
import { api } from "@/lib/api-client";
import { formatMon } from "@/lib/mon";
import type { DripView } from "@/server/faucet";
import { useSession } from "./session";

export type WalletAccount = {
  wallet: string;
  balanceWei: string;
  drip: DripView;
};
export const walletKey = (wallet: string | undefined) => [
  "account-wallet",
  wallet,
];
const FAUCET_URL = "https://faucet.monad.xyz";

const arrivedKey = (wallet: string | undefined) => [
  "welcome-drip-here",
  wallet,
];
function useWalletAccount() {
  const auth = useSession(),
    session = auth.session;
  return useQuery({
    queryKey: walletKey(session?.wallet),
    enabled: Boolean(session),
    staleTime: 15000,
    // While a drip is on its way, keep looking until the balance shows it.
    refetchInterval: (query) =>
      query.state.data?.drip.state === "sent" ? 2500 : false,
    queryFn: async () =>
      api<WalletAccount>("account/wallet", {
        token: await auth.getToken(),
        wallet: session?.wallet,
      }),
  });
}
function useDripRequest() {
  const auth = useSession(),
    client = useQueryClient();
  return useMutation({
    mutationKey: ["welcome-drip"],
    mutationFn: async () =>
      api<WalletAccount>("account/drip", {
        method: "POST",
        token: await auth.getToken(),
        wallet: auth.session?.wallet,
      }),
    onSuccess: (data) => {
      client.setQueryData(walletKey(data.wallet), data);
      client.setQueryData(arrivedKey(data.wallet), true);
    },
  });
}

/**
 * A new wallet gets its welcome drip without asking. Mount once per signed-in user:
 * it requests the drip as soon as the server says one is ready.
 */
export function WelcomeDrip() {
  const state = useWalletAccount().data?.drip.state,
    { mutate } = useDripRequest(),
    started = useRef(false);
  useEffect(() => {
    if (state !== "available" || started.current) return;
    started.current = true;
    mutate();
  }, [state, mutate]);
  return null;
}

/** The signed-in wallet: address, live balance and the one-time welcome drip. */
export function AccountWallet({ className = "" }: { className?: string }) {
  const auth = useSession(),
    session = auth.session,
    account = useWalletAccount(),
    { mutate: requestDrip } = useDripRequest(),
    // The request may have been made by another mounted panel or by WelcomeDrip.
    latestDrip = useMutationState({
      filters: { mutationKey: ["welcome-drip"] },
      select: (mutation) => mutation.state,
    }).at(-1),
    dripError = latestDrip?.status === "error" ? latestDrip.error : null,
    requestedHere = useQuery({
      queryKey: arrivedKey(session?.wallet),
      queryFn: () => false,
      enabled: false,
    }).data,
    [copied, setCopied] = useState(false);
  if (!session) return null;
  const wallet = session.wallet,
    data = account.data,
    drip = data?.drip,
    low = data
      ? BigInt(data.balanceWei) < BigInt(data.drip.amountWei) / 4n
      : false;
  const note =
    drip?.state === "sent"
      ? drip.message
      : drip?.state === "confirmed" && requestedHere
        ? drip.message
        : low &&
            drip &&
            ["empty", "daily-limit", "unavailable"].includes(drip.state)
          ? drip.message
          : null;
  async function copy() {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className={`account-wallet ${className}`} aria-label="Your wallet">
      <div className="account-wallet-row">
        <button
          type="button"
          className="wallet-address"
          onClick={() => void copy()}
          aria-label={copied ? "Wallet address copied" : "Copy wallet address"}
          title={wallet}
        >
          <code>
            {wallet.slice(0, 6)}…{wallet.slice(-4)}
          </code>
          <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
        </button>
        <span className="wallet-balance" aria-live="polite">
          {data ? (
            <>
              <span className="wallet-amount">
                {formatMon(data.balanceWei)}
              </span>{" "}
              MON
            </>
          ) : account.error ? (
            "Balance unavailable"
          ) : (
            "Reading balance…"
          )}
        </span>
      </div>
      {note && (
        <p className="wallet-note" role="status">
          {note}
          {drip?.recovery && (
            <>
              {" "}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer">
                Open the Monad faucet
              </a>
            </>
          )}
        </p>
      )}
      {dripError && (
        <p className="wallet-note" role="alert">
          {dripError.message}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => requestDrip()}
          >
            Try again
          </button>
        </p>
      )}
      <div className="account-wallet-actions">
        <a
          href={`${monadTestnet.blockExplorers.default.url}/address/${wallet}`}
          target="_blank"
          rel="noreferrer"
        >
          View on explorer
        </a>
        {auth.exportWallet && (
          <button type="button" onClick={auth.exportWallet}>
            Export key
          </button>
        )}
        {auth.linkEmail && (
          <button type="button" onClick={auth.linkEmail}>
            Add email
          </button>
        )}
        {auth.linkGoogle && (
          <button type="button" onClick={auth.linkGoogle}>
            Add Google
          </button>
        )}
        <button type="button" onClick={auth.logout}>
          Sign out
        </button>
      </div>
    </section>
  );
}
