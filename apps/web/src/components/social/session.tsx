"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import type { Hex, TypedDataDefinition } from "viem";
import type { Session } from "@/server/auth";
import type { PublishIntent } from "@fork/shared";
import { api, ApiError } from "@/lib/api-client";
import type { Confirmation } from "@/lib/confirmation";
import { DevelopmentPublishObservation } from "./publish-observation";
import { MotionRoot } from "@/components/ui/motion";

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
  // Sends native MON to FORKBacking for one thesis, or collects the caller's credits.
  back: (contract: string, thesisId: string, amountWei: bigint) => Promise<Hex>;
  withdraw: (contract: string) => Promise<Hex>;
  // Resolves when this browser first sees the receipt; started is a performance.now() value.
  confirm: (txHash: Hex, started: number) => Promise<Confirmation>;
  signTypedData: (data: TypedDataDefinition) => Promise<Hex>;
  sendSelfTransaction: () => Promise<Hex>;
  // Account actions the sign-in provider offers for this user; null when not applicable.
  exportWallet: (() => void) | null;
  linkEmail: (() => void) | null;
  linkGoogle: (() => void) | null;
};
export const SessionContext = createContext<SessionValue | null>(null);
export const useSession = () => {
  const c = useContext(SessionContext);
  if (!c) throw new Error("Session provider missing.");
  return c;
};
const loading = () =>
  new ApiError(
    "SIGN_IN_LOADING",
    "Sign-in is still loading.",
    "Try again in a moment.",
    409,
  );
// What the product sees until the sign-in provider has loaded: signed out, not ready.
const pendingSession: SessionValue = {
  session: null,
  ready: false,
  test: false,
  isAdmin: false,
  wallets: [],
  error: null,
  login: () => {},
  logout: () => {},
  getToken: async () => null,
  refresh: async () => {},
  selectWallet: async () => {},
  submit: async () => Promise.reject(loading()),
  back: async () => Promise.reject(loading()),
  withdraw: async () => Promise.reject(loading()),
  confirm: async () => Promise.reject(loading()),
  signTypedData: async () => Promise.reject(loading()),
  sendSelfTransaction: async () => Promise.reject(loading()),
  exportWallet: null,
  linkEmail: null,
  linkGoogle: null,
};
const ReportSession = createContext<((value: SessionValue) => void) | null>(
  null,
);
// Sits inside the sign-in provider and hands its session up to the page.
function SessionReporter() {
  const value = useSession(),
    report = useContext(ReportSession);
  useEffect(() => report?.(value), [value, report]);
  return null;
}
/**
 * Pages render at once, signed out, while the sign-in provider downloads. The provider
 * then mounts beside the page and its session replaces the pending one, so nothing the
 * user is looking at is unmounted.
 */
function RealSession({
  appId,
  children,
}: {
  appId: string;
  children: ReactNode;
}) {
  const [value, setValue] = useState(pendingSession),
    [Provider, setProvider] = useState<ComponentType<{
      appId: string;
      children: ReactNode;
    }> | null>(null),
    [wantsLogin, setWantsLogin] = useState(false);
  useEffect(() => {
    let mounted = true;
    import("./privy-session").then(
      (module) => mounted && setProvider(() => module.default),
      () =>
        mounted &&
        setValue({
          ...pendingSession,
          error: "Sign-in could not load. Reload the page to try again.",
        }),
    );
    return () => {
      mounted = false;
    };
  }, []);
  // A stable element: the page re-rendering never re-renders the provider.
  const provider = useMemo(
    () =>
      Provider ? (
        <Provider appId={appId}>
          <SessionReporter />
        </Provider>
      ) : null,
    [Provider, appId],
  );
  // A "Sign in" pressed before the provider was ready opens it as soon as it is.
  const { ready, login } = value;
  useEffect(() => {
    if (!wantsLogin || !ready) return;
    login();
    const reset = setTimeout(() => setWantsLogin(false), 0);
    return () => clearTimeout(reset);
  }, [wantsLogin, ready, login]);
  const shared = useMemo(
    () =>
      value.ready ? value : { ...value, login: () => setWantsLogin(true) },
    [value],
  );
  return (
    <ReportSession.Provider value={setValue}>
      {provider}
      <SessionContext.Provider value={shared}>
        {children}
      </SessionContext.Provider>
    </ReportSession.Provider>
  );
}
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
      <MotionRoot>
        {test ? (
          <LocalSession test>{children}</LocalSession>
        ) : appId ? (
          <RealSession appId={appId}>{children}</RealSession>
        ) : (
          <LocalSession test={false}>{children}</LocalSession>
        )}
      </MotionRoot>
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
    back: async (_contract, thesisId, amountWei) => {
      const response = await api<{ txHash: Hex }>("test/back", {
        method: "POST",
        body: { thesisId, amountWei: amountWei.toString() },
        token: accessToken,
        wallet: session?.wallet,
      });
      return response.txHash;
    },
    withdraw: async () => {
      const response = await api<{ txHash: Hex }>("test/withdraw", {
        method: "POST",
        token: accessToken,
        wallet: session?.wallet,
      });
      return response.txHash;
    },
    // The test workspace has no chain: a submitted transaction is confirmed at once.
    confirm: async (txHash, started) => ({
      txHash,
      latencyMs: performance.now() - started,
      simulated: true,
    }),
    signTypedData: async () => {
      throw new ApiError(
        "TEST_SIGNING_UNAVAILABLE",
        "Typed-data signing requires a real wallet.",
        "Sign in with a real wallet to sign typed data.",
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
    exportWallet: null,
    linkEmail: null,
    linkGoogle: null,
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
              <option value="dana">Dana · new account</option>
            </select>
          </label>
        </div>
      )}
      {children}
    </SessionContext.Provider>
  );
}
