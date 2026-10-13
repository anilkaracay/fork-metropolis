"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProfileSummary } from "@fork/shared";
import { api } from "@/lib/api-client";
import type { Confirmation } from "@/lib/confirmation";
import { grantConsent } from "@/lib/consent";
import { useSession } from "./session";

/** A public profile, shared by the profile screen and the shell's earnings card. */
export function useProfile(handle: string | undefined) {
  return useQuery({
    queryKey: ["profile", handle],
    queryFn: () => api<ProfileSummary>(`profiles/${handle}`),
    enabled: Boolean(handle),
    staleTime: 30000,
  });
}

/** "0x7ba5…cfc0": the wallet a withdrawal pays, as the consent line names it. */
export const shortWallet = (wallet: string) =>
  `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;

/** Withdraws the signed-in author's claimable MON and waits for the indexer to follow. */
export function useWithdraw(profile: ProfileSummary | undefined) {
  const auth = useSession(),
    client = useQueryClient(),
    [step, setStep] = useState<"idle" | "wallet" | "confirming">("idle"),
    [error, setError] = useState<unknown>(null),
    [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  /** Call from the Withdraw button's click handler, with its native event. */
  async function withdraw(event: { isTrusted: boolean }) {
    grantConsent("withdraw", event);
    const contract = profile?.backingContract;
    if (!profile || !contract) return;
    setError(null);
    setStep("wallet");
    try {
      const txHash = await auth.withdraw(contract);
      const started = performance.now();
      setStep("confirming");
      setConfirmation(await auth.confirm(txHash, started));
      // The indexer follows the chain: refresh once it shows the balance as collected.
      for (let attempt = 0; attempt < 15; attempt++) {
        const latest = await api<ProfileSummary>(
          `profiles/${profile.identity.handle}`,
        ).catch(() => null);
        if (latest?.earnings.claimableWei === "0") break;
        await new Promise((done) => setTimeout(done, 1000));
      }
      await client.invalidateQueries();
    } catch (failure) {
      setError(failure);
    } finally {
      setStep("idle");
    }
  }
  return { step, error, confirmation, withdraw, wallet: auth.session?.wallet };
}
