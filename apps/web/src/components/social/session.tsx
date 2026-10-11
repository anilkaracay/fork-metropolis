"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import type { Hex, TypedDataDefinition } from "viem";
import type { Session } from "@/server/auth";
import type { PublishIntent } from "@fork/shared";
import { api, ApiError } from "@/lib/api-client";
import { DevelopmentPublishObservation } from "./publish-observation";

export type SessionValue = {
  session: Session | null;
  ready: boolean;
  test: boolean;
  isAdmin: boolean;
  wallets: string[];
  error: string | null;
  login: () => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
  refresh: () => Promise<void>;
  selectWallet: (address: string) => Promise<void>;
  submit: (intent: PublishIntent, draftId: string) => Promise<Hex>;
  signTypedData: (data: TypedDataDefinition) => Promise<Hex>;
  sendSelfTransaction: () => Promise<Hex>;
};
export const SessionContext = createContext<SessionValue | null>(null);
export const useSession = () => {
  const c = useContext(SessionContext);
  if (!c) throw new Error("Session provider missing.");
  return c;
};
const RealSession = dynamic(() => import("./privy-session"), {
  ssr: false,
  loading: () => (
    <div className="state-box" role="status">
      Preparing sign-in…
    </div>
  ),
});
export function ProductProviders({
  children,
  test,
  appId,
}: {
  children: ReactNode;
  test: boolean;
  appId: string | undefined;
}) {
  const [query] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            retry: (count, error) =>
              count < 1 && error instanceof ApiError && error.status >= 500,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={query}>
      {process.env.NODE_ENV === "development" && !test && (
        <DevelopmentPublishObservation />
      )}
      {test ? (
        <LocalSession test>{children}</LocalSession>
      ) : appId ? (
        <RealSession appId={appId}>{children}</RealSession>
      ) : (
        <LocalSession test={false}>{children}</LocalSession>
      )}
    </QueryClientProvider>
  );
}
function LocalSession({
  children,
  test,
}: {
  children: ReactNode;
  test: boolean;
}) {
  const query = useQueryClient(),
    [session, setSession] = useState<Session | null>(null),
    [accessToken, setToken] = useState<string | null>(null),
    [isAdmin, setAdmin] = useState(false),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!test) return;
    let cancelled = false;
    async function hydrate() {
      const stored = localStorage.getItem("fork-test-session");
      if (!stored) return;
      try {
        const value = JSON.parse(stored) as { token: string; session: Session };
        const response = await api<{ session: Session; isAdmin: boolean }>(
          "session",
          { token: value.token, wallet: value.session.wallet },
        );
        if (!cancelled) {
          setSession(response.session);
          setToken(value.token);
          setAdmin(response.isAdmin);
        }
      } catch {
        localStorage.removeItem("fork-test-session");
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [test]);
  async function identity(name: string) {
    try {
      const response = await api<{
        session: Session;
        token: string;
        isAdmin: boolean;
      }>("test/identity", { method: "POST", body: { name } });
      setSession(response.session);
      setToken(response.token);
      setAdmin(response.isAdmin);
      setError(null);
      localStorage.setItem("fork-test-session", JSON.stringify(response));
      // Reset data without orphaning a mounted, possibly pending public query.
      query.getMutationCache().clear();
      void query.resetQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
    }
  }
  const value: SessionValue = {
    session,
    ready: true,
    test,
    isAdmin,
    wallets: session ? [session.wallet] : [],
    error,
    login: () =>
      setError(
        "Sign-in is not configured in this environment. You can browse public ideas or try again after setup.",
      ),
    logout: () => {
      setSession(null);
      setToken(null);
      setAdmin(false);
      localStorage.removeItem("fork-test-session");
      query.getMutationCache().clear();
      void query.resetQueries();
    },
    getToken: async () => accessToken,
    refresh: async () => {
      if (!session) return;
      const result = await api<{ session: Session; isAdmin: boolean }>(
        "session",
        { token: accessToken, wallet: session.wallet },
      );
      setSession(result.session);
      setAdmin(result.isAdmin);
      localStorage.setItem(
        "fork-test-session",
        JSON.stringify({ ...result, token: accessToken }),
      );
    },
    selectWallet: async () => {},
    submit: async (_intent, draftId) => {
      if (!test)
        throw new ApiError(
          "CONFIGURATION_REQUIRED",
          "Wallet signing is not configured.",
          "Sign in after environment setup.",
          503,
        );
      const response = await api<{ txHash: Hex }>("test/submit", {
        method: "POST",
        body: { draftId },
        token: accessToken,
        wallet: session?.wallet,
      });
      return response.txHash;
    },
    signTypedData: async () => {
      throw new ApiError(
        "TEST_SIGNING_UNAVAILABLE",
        "Typed-data signing requires a real wallet.",
        "Use the configured Privy wallet in the next integration phase.",
        409,
      );
    },
    sendSelfTransaction: async () => {
      throw new ApiError(
        "REAL_WALLET_REQUIRED",
        "A real signed-in wallet is required.",
        "Sign in with Privy in the development environment.",
        409,
      );
    },
  };
  return (
    <SessionContext.Provider value={value}>
      {test && (
        <div className="test-banner">
          <span>Local test workspace · simulated confirmations</span>
          <label>
            Test identity
            <select
              aria-label="Test identity"
              value={session?.did.split(":").at(-1) ?? ""}
              onChange={(e) =>
                e.target.value ? void identity(e.target.value) : value.logout()
              }
            >
              <option value="">Browse publicly</option>
              <option value="alice">Alice</option>
              <option value="bob">Bora</option>
              <option value="carol">Carol · moderator</option>
            </select>
          </label>
        </div>
      )}
      {children}
    </SessionContext.Provider>
  );
}
