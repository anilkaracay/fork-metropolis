"use client";
import { useState } from "react";
import {
  createPublicClient,
  http,
  recoverTypedDataAddress,
  type Address,
} from "viem";
import { monadTestnet } from "@fork/shared";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { developmentTypedData } from "@/lib/privy-proof";
import { useSession } from "./session";

// Opt-in local proof page, outside product navigation; no tokens or signatures
// are displayed, persisted or logged. Every action uses the real session adapter.
export function PrivyProof() {
  const auth = useSession();
  const [result, setResult] = useState(
    "Sign in to run the real account checks.",
  );
  const [busy, setBusy] = useState(false);
  const [attemptedTransaction, setAttemptedTransaction] = useState(false);
  const [transaction, setTransaction] = useState<string | null>(null);
  async function check(kind: "identity" | "signature" | "transaction") {
    if (!auth.session || auth.test || busy) return;
    setBusy(true);
    try {
      await auth.refresh();
      const wallet = auth.session.wallet as Address;
      if (kind === "signature") {
        const data = developmentTypedData(
          wallet,
          crypto.randomUUID(),
          BigInt(Math.floor(Date.now() / 1000)),
        );
        const signature = await auth.signTypedData(data);
        const recovered = await recoverTypedDataAddress({ ...data, signature });
        if (recovered.toLowerCase() !== wallet.toLowerCase())
          throw new ApiError(
            "SIGNER_MISMATCH",
            "The signature does not match the selected account.",
            "Refresh the account and repeat the check.",
            409,
          );
        setResult(`EIP-712 signature verified: ${recovered.toLowerCase()}`);
      } else if (kind === "transaction") {
        if (attemptedTransaction) return;
        const client = createPublicClient({
          chain: monadTestnet,
          transport: http(undefined, { timeout: 5000, retryCount: 1 }),
        });
        if ((await client.getChainId()) !== 10143)
          throw new ApiError(
            "WRONG_CHAIN",
            "The RPC is not Monad Testnet.",
            "Check the development RPC and retry.",
            503,
          );
        if ((await client.getBalance({ address: wallet })) === 0n) {
          setResult(`READY / NEEDS TESTNET MON: fund ${wallet}`);
          return;
        }
        // Mark before the wallet request: an uncertain result never auto-resends.
        setAttemptedTransaction(true);
        const hash = await auth.sendSelfTransaction();
        setTransaction(hash);
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 20000,
          retryCount: 0,
        });
        setResult(
          receipt.status === "success"
            ? "Zero-value self transaction confirmed on Monad Testnet."
            : "Self transaction reverted. Review the transaction before another action.",
        );
      } else {
        const token = await auth.getToken();
        if (!token)
          throw new ApiError(
            "AUTH_REQUIRED",
            "Sign in to run the check.",
            "Sign in again.",
            401,
          );
        setResult(
          "Real access token present; backend identity and selected wallet verified.",
        );
      }
    } catch (error) {
      setResult(
        error instanceof ApiError
          ? `${error.message} ${error.recovery}`
          : "The check could not complete. Refresh the account and retry; review wallet activity if a transaction was requested.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <h1>Local Privy integration check</h1>
      <p>
        This development-only page checks your real account and signing adapter.
      </p>
      <p>Monad Testnet · chain 10143</p>
      {auth.session && (
        <p>
          Primary account: <code>{auth.session.wallet}</code>
        </p>
      )}
      {!auth.session ? (
        <Button onClick={auth.login} disabled={!auth.ready}>
          Continue with email or Google
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => void check("identity")}>
            Verify account
          </Button>
          <Button disabled={busy} onClick={() => void check("signature")}>
            Sign development proof
          </Button>
          <Button
            disabled={busy || attemptedTransaction}
            onClick={() => void check("transaction")}
          >
            Send one zero-value self transaction
          </Button>
          <Button disabled={busy} onClick={auth.logout}>
            Sign out
          </Button>
        </div>
      )}
      <p role="status">{auth.error ?? result}</p>
      {transaction && (
        <p>
          Self transaction: <code>{transaction}</code>
        </p>
      )}
    </section>
  );
}
