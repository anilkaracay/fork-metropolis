"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { formatEther, type Hex } from "viem";
import {
  BACKING_PRESETS_MON,
  EARLY_BACKER_LIMIT,
  MIN_BACKING_WEI,
  monadTestnet,
  splitBacking,
  type BackingCredit,
  type ThesisBackingView,
} from "@fork/shared";
import { api, ApiError } from "@/lib/api-client";
import {
  confirmationText,
  saveConfirmation,
  type Confirmation,
} from "@/lib/confirmation";
import { grantConsent } from "@/lib/consent";
import { formatMon, parseMon, percentOf } from "@/lib/mon";
import { Ticker } from "@/components/ui/motion";
import { useSession } from "./session";
import { Avatar } from "./common";
import { Icon } from "./icon";
import { walletKey, type WalletAccount } from "./account-wallet";

export const backingKey = (thesisId: string) => ["thesis-backing", thesisId];
const ONE_MON = 10n ** 18n;
/** Where backing goes, from configuration alone: it answers even when backing reads fail. */
export function useBackingContract() {
  return useQuery({
    queryKey: ["backing-contract"],
    queryFn: () =>
      api<{ contract: ThesisBackingView["contract"] }>("backing").then(
        (result) => result.contract,
      ),
    staleTime: Infinity,
  });
}
const roleNote = (credit: BackingCredit, backedId: string) =>
  credit.role === 0
    ? "wrote this idea"
    : credit.creditedThesisId === backedId
      ? "wrote this idea"
      : credit.role === 1
        ? `wrote #${credit.creditedThesisId}, the idea it forks`
        : `wrote #${credit.creditedThesisId}, the idea before that`;
const amountLabel = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 4 });
type Step = "amount" | "wallet" | "confirming" | "done";
type Outcome = {
  txHash: Hex;
  amount: bigint;
  credits: BackingCredit[];
  confirmation: Confirmation | null;
};

export function BackSheet({
  thesisId,
  open,
  onClose,
}: {
  thesisId: string;
  open: boolean;
  onClose: () => void;
}) {
  const auth = useSession(),
    session = auth.session,
    client = useQueryClient(),
    dialog = useRef<HTMLDialogElement>(null),
    title = useId(),
    [choice, setChoice] = useState<string>(BACKING_PRESETS_MON[1]),
    [custom, setCustom] = useState(""),
    [step, setStep] = useState<Step>("amount"),
    [error, setError] = useState<unknown>(null),
    [outcome, setOutcome] = useState<Outcome | null>(null);
  // The wallet's approval prompt renders in the page, below the browser's top layer. Once a
  // signature is requested the sheet leaves the top layer (show, not showModal), or it would
  // cover that prompt. Its own backdrop and the key handling below stand in for the modal.
  const modal = step === "amount";
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      if (element.open) element.close();
      return;
    }
    if (element.open && element.matches(":modal") === modal) return;
    if (element.open) element.close();
    if (modal) element.showModal();
    else element.show();
  }, [open, modal]);
  useEffect(() => {
    const element = dialog.current;
    if (!open || modal || !element) return;
    const sheet = element;
    function onKey(event: KeyboardEvent) {
      if (!sheet.contains(document.activeElement)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...sheet.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled), input:not(:disabled)",
        ),
      ];
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const view = useQuery({
    queryKey: backingKey(thesisId),
    queryFn: () => api<ThesisBackingView>(`theses/${thesisId}/backing`),
    staleTime: 10000,
    retry: 1,
    retryOnMount: false,
  });
  const configured = useBackingContract();
  const account = client.getQueryData<WalletAccount>(
    walletKey(session?.wallet),
  );
  const data = view.data,
    author = data?.lineage[0]?.author,
    amount = choice === "custom" ? parseMon(custom) : parseMon(choice),
    // When the backing read fails, the sheet still knows the contract and asks it for the split.
    contract = data ? data.contract : configured.data,
    onChain = !data && Boolean(view.error) && Boolean(contract),
    fromLineage = useMemo(() => {
      if (!data || !amount) return [];
      const [own, parent, grandparent] = data.lineage;
      return splitBacking(
        {
          thesisId: data.thesisId,
          author: own!.author.wallet,
          parent: parent && {
            thesisId: parent.thesisId,
            author: parent.author.wallet,
          },
          grandparent: grandparent && {
            thesisId: grandparent.thesisId,
            author: grandparent.author.wallet,
          },
        },
        amount,
      );
    }, [data, amount]);
  const preview = useQuery({
    queryKey: ["back-split", thesisId, String(amount ?? ONE_MON)],
    queryFn: () =>
      auth.previewSplit(contract!.address, thesisId, amount ?? ONE_MON),
    enabled: open && onChain,
    staleTime: 30000,
    retry: 1,
  });
  const credits = data ? fromLineage : amount ? (preview.data ?? []) : [];
  const people = new Map(
    data?.lineage.map((entry) => [entry.author.wallet, entry.author]),
  );
  const writer =
      author?.wallet ??
      preview.data?.find((credit) => credit.role === 0)?.recipient,
    own = Boolean(session && writer && session.wallet === writer),
    balance = account ? BigInt(account.balanceWei) : null,
    alreadyBacker = data?.recent.some(
      (event) => event.backer.wallet === session?.wallet,
    ),
    problem = !amount
      ? choice === "custom" && custom
        ? "Enter an amount such as 0.1."
        : null
      : amount < MIN_BACKING_WEI
        ? `The smallest backing is ${formatMon(MIN_BACKING_WEI)} MON.`
        : balance !== null && amount > balance
          ? `Your wallet holds ${formatMon(balance)} MON.`
          : null;
  const busy = step === "wallet" || step === "confirming";

  async function back() {
    if (!session) return auth.login();
    if (!contract || !amount || problem || own) return;
    setError(null);
    setStep("wallet");
    try {
      const txHash = await auth.back(contract.address, thesisId, amount);
      const started = performance.now();
      setStep("confirming");
      const confirmation = await auth.confirm(txHash, started);
      if (confirmation) saveConfirmation(confirmation);
      setOutcome({ txHash, amount, credits, confirmation });
      setStep("done");
      // The indexer follows the chain. Refresh once it has this backing, or after a short wait.
      for (let attempt = 0; attempt < 15; attempt++) {
        const latest = await api<ThesisBackingView>(
          `theses/${thesisId}/backing`,
        ).catch(() => null);
        if (latest?.recent.some((event) => event.txHash === txHash)) {
          client.setQueryData(backingKey(thesisId), latest);
          break;
        }
        await new Promise((done) => setTimeout(done, 1000));
      }
      await client.invalidateQueries();
    } catch (failure) {
      setError(failure);
      setStep("amount");
    }
  }
  function close() {
    if (busy) return;
    onClose();
    if (step === "done") {
      setStep("amount");
      setOutcome(null);
    }
    setError(null);
  }
  const mine = outcome
    ? view.data?.recent.find((event) => event.txHash === outcome.txHash)
    : undefined;
  return (
    <dialog
      ref={dialog}
      className={modal ? "back-sheet" : "back-sheet in-page"}
      aria-labelledby={title}
      aria-modal={!modal && step !== "wallet" ? true : undefined}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      {open &&
        !modal &&
        createPortal(
          <div
            className="back-sheet-backdrop"
            aria-hidden="true"
            onClick={close}
          />,
          document.body,
        )}
      <div className="back-sheet-body">
        <header className="back-sheet-head">
          <span className="back-sheet-kicker">Idea #{thesisId}</span>
          <button
            type="button"
            className="back-sheet-close"
            aria-label="Close"
            onClick={close}
            disabled={busy}
          >
            <Icon name="close" size={16} />
          </button>
        </header>
        <AnimatePresence mode="wait" initial={false}>
          {step === "done" && outcome ? (
            <m.div
              key="done"
              className="back-done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <svg
                className="back-check"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <m.circle
                  cx="24"
                  cy="24"
                  r="21"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <m.path
                  d="M15 24.5l6.2 6.2L33.5 18"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
                />
              </svg>
              <h2 id={title}>Backed with {formatMon(outcome.amount)} MON</h2>
              {outcome.confirmation && (
                <p className="confirmation-note" role="status">
                  {confirmationText(outcome.confirmation)}
                </p>
              )}
              <ul className="back-split" aria-label="Where it went">
                {outcome.credits.map((credit) => (
                  <SplitRow
                    key={credit.creditedThesisId + credit.role}
                    credit={credit}
                    total={outcome.amount}
                    person={people.get(credit.recipient.toLowerCase())}
                    backedId={thesisId}
                  />
                ))}
              </ul>
              <p className="back-position" role="status">
                {mine
                  ? mine.early
                    ? `You are supporter ${mine.position} of the first ${EARLY_BACKER_LIMIT}.`
                    : `You are supporter ${mine.position}.`
                  : "Adding your backing to the idea graph…"}
              </p>
              <div className="back-actions">
                <a
                  className="text-button"
                  href={`${monadTestnet.blockExplorers.default.url}/tx/${outcome.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction <Icon name="arrow" size={14} />
                </a>
                <Link
                  className="text-button"
                  href={`/t/${thesisId}/tree`}
                  onClick={close}
                >
                  See the lineage <Icon name="arrow" size={14} />
                </Link>
                <button
                  type="button"
                  className="button primary"
                  onClick={close}
                >
                  Done
                </button>
              </div>
            </m.div>
          ) : (
            <m.form
              key="amount"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onSubmit={(event) => {
                event.preventDefault();
                grantConsent("back", event.nativeEvent);
                void back();
              }}
            >
              <h2 id={title}>
                Back {author ? `@${author.handle}'s idea` : "this idea"}
              </h2>
              <p className="back-lead">
                Your MON goes to the people who wrote this idea and the ideas it
                grew from.
              </p>
              <fieldset className="back-amounts" disabled={busy}>
                <legend>Amount</legend>
                <div className="back-presets">
                  {BACKING_PRESETS_MON.map((preset) => (
                    <label key={preset} className="back-preset">
                      <input
                        type="radio"
                        name="amount"
                        value={preset}
                        checked={choice === preset}
                        onChange={() => setChoice(preset)}
                      />
                      <span>
                        {preset}
                        <span className="sr-only"> MON</span>
                      </span>
                    </label>
                  ))}
                  <label className="back-preset">
                    <input
                      type="radio"
                      name="amount"
                      value="custom"
                      checked={choice === "custom"}
                      onChange={() => setChoice("custom")}
                    />
                    <span>Custom</span>
                  </label>
                </div>
                {choice === "custom" && (
                  <label className="back-custom">
                    Custom amount in MON
                    <input
                      inputMode="decimal"
                      value={custom}
                      onChange={(event) => setCustom(event.target.value)}
                      placeholder="0.1"
                      autoFocus
                      aria-invalid={Boolean(problem)}
                    />
                  </label>
                )}
              </fieldset>
              {problem && (
                <p className="back-problem" role="alert">
                  {problem}
                </p>
              )}
              <section aria-label="Where it goes" className="back-preview">
                <div className="back-preview-head">
                  <span>Where it goes</span>
                  {balance !== null && (
                    <span>Wallet {formatMon(balance)} MON</span>
                  )}
                </div>
                {view.isPending ? (
                  <div className="back-split-skeleton" role="status">
                    Reading the lineage…
                  </div>
                ) : onChain && preview.data ? (
                  <ul className="back-split">
                    {preview.data.map((credit) => (
                      <SplitRow
                        key={credit.creditedThesisId + credit.role}
                        credit={credit}
                        total={amount ?? ONE_MON}
                        person={undefined}
                        backedId={thesisId}
                        pending={!amount}
                      />
                    ))}
                  </ul>
                ) : onChain && preview.isFetching ? (
                  <div className="back-split-skeleton" role="status">
                    Reading the split from Monad…
                  </div>
                ) : !data ? (
                  <p className="back-problem" role="alert">
                    The split could not be read.{" "}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        void (onChain ? preview.refetch() : view.refetch())
                      }
                    >
                      Try again
                    </button>
                  </p>
                ) : (
                  <ul className="back-split">
                    {(amount ? credits : splitPlaceholder(data)).map(
                      (credit) => (
                        <SplitRow
                          key={credit.creditedThesisId + credit.role}
                          credit={credit}
                          total={amount ?? 10n ** 18n}
                          person={people.get(credit.recipient.toLowerCase())}
                          backedId={thesisId}
                          pending={!amount}
                        />
                      ),
                    )}
                  </ul>
                )}
              </section>
              {own && (
                <p className="back-problem" role="status">
                  You wrote this idea. Backing comes from other people.
                </p>
              )}
              {error ? (
                <p className="back-problem" role="alert">
                  {error instanceof Error
                    ? error.message
                    : "That did not go through."}{" "}
                  {error instanceof ApiError ? error.recovery : "Try again."}
                </p>
              ) : null}
              <button
                className="button primary back-submit"
                disabled={
                  busy ||
                  own ||
                  (Boolean(session) &&
                    (!amount || Boolean(problem) || !contract))
                }
              >
                {!session
                  ? "Sign in to back"
                  : step === "wallet"
                    ? "Signing…"
                    : step === "confirming"
                      ? "Waiting for Monad…"
                      : amount
                        ? `Back with ${formatMon(amount)} MON`
                        : "Choose an amount"}
              </button>
              <p className="back-footnote">
                {alreadyBacker
                  ? "You already back this idea. Backing again adds to your support."
                  : data && data.summary.backers < EARLY_BACKER_LIMIT && !own
                    ? `You will be supporter ${data.summary.backers + 1} of the first ${EARLY_BACKER_LIMIT}.`
                    : null}{" "}
                Signed with your wallet on Monad Testnet. Testnet MON has no
                monetary value.
              </p>
            </m.form>
          )}
        </AnimatePresence>
      </div>
    </dialog>
  );
}
// Before an amount is chosen, show who shares in a backing using one MON as the example.
function splitPlaceholder(view: ThesisBackingView): BackingCredit[] {
  const [own, parent, grandparent] = view.lineage;
  return splitBacking(
    {
      thesisId: view.thesisId,
      author: own!.author.wallet,
      parent: parent && {
        thesisId: parent.thesisId,
        author: parent.author.wallet,
      },
      grandparent: grandparent && {
        thesisId: grandparent.thesisId,
        author: grandparent.author.wallet,
      },
    },
    10n ** 18n,
  );
}
function SplitRow({
  credit,
  total,
  person,
  backedId,
  pending = false,
}: {
  credit: BackingCredit;
  total: bigint;
  person: ThesisBackingView["lineage"][number]["author"] | undefined;
  backedId: string;
  pending?: boolean;
}) {
  const share = percentOf(credit.amount, total),
    name = person?.displayName ?? `${credit.recipient.slice(0, 6)}…`;
  return (
    <li className="back-split-row">
      <Avatar
        size={36}
        name={name}
        wallet={credit.recipient}
        handle={person?.handle}
      />
      <span className="back-split-who">
        <strong>{person ? `@${person.handle}` : name}</strong>
        <small>{roleNote(credit, backedId)}</small>
      </span>
      <span className="back-split-amount">
        {pending ? (
          <strong>{share}%</strong>
        ) : (
          <>
            <strong>
              <Ticker
                value={Number(formatEther(credit.amount))}
                format={amountLabel}
              />{" "}
              MON
            </strong>
            <small>{share}%</small>
          </>
        )}
      </span>
      <m.span
        className="back-split-bar"
        aria-hidden="true"
        initial={false}
        animate={{ scaleX: share / 100 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      />
    </li>
  );
}
