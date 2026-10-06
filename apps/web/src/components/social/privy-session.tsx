"use client";
import { useEffect, useState, type ReactNode } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createWalletClient,
  custom,
  type Address,
  type TypedDataDefinition,
} from "viem";
import { monadTestnet } from "@fork/shared";
import { useQueryClient } from "@tanstack/react-query";
import { SessionContext, type SessionValue } from "./session";
import type { Session } from "@/server/auth";
import { walletError } from "@/lib/wallet-error";
import { api, ApiError } from "@/lib/api-client";
import { creationCalldata, type PublishIntent } from "@fork/shared";

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
    query.clear();
  }
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
      query.clear();
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
    signTypedData: async (data: TypedDataDefinition) => {
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
  };
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
