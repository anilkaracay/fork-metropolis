"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  PrivyProvider,
  useExportWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type TypedDataDefinition,
} from "viem";
import { monadTestnet } from "@fork/shared";
import { useQueryClient } from "@tanstack/react-query";
import { SessionContext, type SessionValue } from "./session";
import type { Session } from "@/server/auth";
import { walletError } from "@/lib/wallet-error";
import { api, ApiError } from "@/lib/api-client";
import { RECEIPT_POLL_MS } from "@/lib/confirmation";
import { takeConsent } from "@/lib/consent";
import {
  backCalldata,
  creationCalldata,
  withdrawCalldata,
  type PublishIntent,
} from "@fork/shared";

// Read-only client for receipts, independent of the wallet provider.
const monad = createPublicClient({
  chain: monadTestnet,
  transport: http(undefined, { timeout: 5000, retryCount: 2, retryDelay: 150 }),
});
export default function PrivySession({
  appId,
  children,
}: {
  appId: string;
  children: ReactNode;
}) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#8be28b",
          walletChainType: "ethereum-only",
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        embeddedWallets: {
          ethereum: { createOnLogin: "all-users" },
          // FORK's own buttons are the consent (D-061). Privy's screens returned the hash
          // only after their success step, so no confirmation time could be measured.
          showWalletUIs: false,
        },
      }}
    >
      <SessionBridge>{children}</SessionBridge>
    </PrivyProvider>
  );
}
function SessionBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy(),
    connected = useWallets(),
    { exportWallet } = useExportWallet(),
    query = useQueryClient(),
    [session, setSession] = useState<Session | null>(null),
    [isAdmin, setAdmin] = useState(false),
    [error, setError] = useState<string | null>(null);
  const { ready: authReady, authenticated, getAccessToken, user } = privy;
  const hasWallet = connected.wallets.length > 0;
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (!authenticated) {
        setSession(null);
        setAdmin(false);
        setError(null);
        return;
      }
      if (!authReady || !connected.ready || !hasWallet) return;
      try {
        const token = await getAccessToken();
        const value = await api<{ session: Session; isAdmin: boolean }>(
          "session",
          { method: "POST", body: {}, token },
        );
        if (!cancelled) {
          setSession(value.session);
          setAdmin(value.isAdmin);
          setError(null);
        }
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof ApiError
              ? `${e.message} ${e.recovery}`
              : "Sign-in verification could not complete. Sign in again and retry.",
          );
      }
    }
    void sync();
    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    authenticated,
    getAccessToken,
    connected.ready,
    hasWallet,
    user?.id,
  ]);
  async function signer() {
    const wallet = connected.wallets.find(
      (w) => w.address.toLowerCase() === session?.wallet,
    );
    if (!wallet || !session || session.did !== privy.user?.id)
      throw new ApiError(
        "WALLET_REQUIRED",
        "Select your primary wallet.",
        "Sign in and select a linked wallet.",
        409,
      );
    await wallet.switchChain(monadTestnet.id);
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      account: session.wallet as Address,
      chain: monadTestnet,
      transport: custom(provider, { retryCount: 0 }),
    });
  }
  async function selectWallet(wallet: string) {
    const token = await getAccessToken();
    const result = await api<{ session: Session; isAdmin: boolean }>(
      "session",
      { method: "POST", body: { wallet }, token },
    );
    setSession(result.session);
    setAdmin(result.isAdmin);
    // Keep active observers connected when the primary identity changes.
    query.getMutationCache().clear();
    void query.resetQueries();
  }
  // Only a Privy embedded wallet has a key the user can export.
  const embedded = privy.user?.linkedAccounts.some(
    (account) =>
      account.type === "wallet" &&
      account.walletClientType === "privy" &&
      account.address.toLowerCase() === session?.wallet,
  );
  const value: SessionValue = {
    session:
      privy.authenticated && session?.did === privy.user?.id ? session : null,
    ready: privy.ready && connected.ready,
    test: false,
    isAdmin: privy.authenticated && session?.did === privy.user?.id && isAdmin,
    error,
    wallets: connected.wallets.map((w) => w.address.toLowerCase()),
    login: () => privy.login(),
    logout: () => {
      void privy.logout();
      setSession(null);
      setAdmin(false);
      setError(null);
      query.getMutationCache().clear();
      void query.resetQueries();
    },
    getToken: privy.getAccessToken,
    refresh: async () => {
      if (!session) return;
      const result = await api<{ session: Session; isAdmin: boolean }>(
        "session",
        { token: await privy.getAccessToken(), wallet: session.wallet },
      );
      setSession(result.session);
      setAdmin(result.isAdmin);
    },
    selectWallet,
    submit: async (intent: PublishIntent) => {
      takeConsent("publish");
      try {
        return await (
          await signer()
        ).sendTransaction({
          to: intent.registryAddress as Address,
          data: creationCalldata(intent),
        });
      } catch (error) {
        throw walletError(error);
      }
    },
    back: async (contract, thesisId, amountWei) => {
      takeConsent("back");
      try {
        return await (
          await signer()
        ).sendTransaction({
          to: contract as Address,
          data: backCalldata(thesisId),
          value: amountWei,
        });
      } catch (error) {
        throw walletError(error);
      }
    },
    withdraw: async (contract) => {
      takeConsent("withdraw");
      try {
        return await (
          await signer()
        ).sendTransaction({
          to: contract as Address,
          data: withdrawCalldata(),
        });
      } catch (error) {
        throw walletError(error);
      }
    },
    confirm: async (txHash, started) => {
      // A receipt that already exists means the hash arrived after the block: there is
      // nothing honest to measure, so no time is shown.
      const early = await monad
        .getTransactionReceipt({ hash: txHash })
        .catch(() => null);
      const receipt =
        early ??
        (await monad.waitForTransactionReceipt({
          hash: txHash,
          pollingInterval: RECEIPT_POLL_MS,
          timeout: 30000,
        }));
      if (receipt.status !== "success")
        throw new ApiError(
          "TX_REVERTED",
          "The transaction did not succeed.",
          "Review the details and try again.",
          409,
        );
      if (early) return null;
      return {
        txHash,
        latencyMs: performance.now() - started,
        simulated: false,
      };
    },
    signTypedData: async (data: TypedDataDefinition) => {
      if (process.env.NODE_ENV !== "development")
        throw new ApiError(
          "NOT_AVAILABLE",
          "Development signing check is unavailable.",
          "Return to Feed.",
          404,
        );
      try {
        return await (await signer()).signTypedData(data);
      } catch (error) {
        throw walletError(error, "signature");
      }
    },
    sendSelfTransaction: async () => {
      if (process.env.NODE_ENV !== "development")
        throw new ApiError(
          "NOT_AVAILABLE",
          "Development signing check is unavailable.",
          "Return to Feed.",
          404,
        );
      try {
        const client = await signer();
        return await client.sendTransaction({
          to: client.account.address,
          value: 0n,
          data: "0x",
        });
      } catch (error) {
        throw walletError(error);
      }
    },
    exportWallet:
      session && embedded
        ? () => void exportWallet({ address: session.wallet })
        : null,
    linkEmail: privy.user && !privy.user.email ? privy.linkEmail : null,
    linkGoogle: privy.user && !privy.user.google ? privy.linkGoogle : null,
  };
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
