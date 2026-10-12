"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HANDLE_MAX,
  HANDLE_MIN,
  handleProblem,
  normalizeHandle,
} from "@fork/shared";
import { api, ApiError } from "@/lib/api-client";
import { useSession } from "./session";

type Availability = {
  handle: string;
  available: boolean;
  problem: string | null;
};
const laterKey = (userId: string) => `fork-handle-later:${userId}`;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
let requested = false;
function deferred(userId: string) {
  try {
    return sessionStorage.getItem(laterKey(userId)) !== null;
  } catch {
    return false;
  }
}
function defer(userId: string) {
  try {
    sessionStorage.setItem(laterKey(userId), "1");
  } catch {
    // Storage can be unavailable; the prompt then simply returns on the next visit.
  }
  requested = false;
  notify();
}
/** Opens the handle dialog from anywhere, for example a "Claim your handle" button. */
export function requestHandleClaim() {
  requested = true;
  notify();
}
// A first sign-in is asked once; after "Not now" the dialog opens only on request.
// Server rendering never prompts.
function useOffered(userId: string | undefined, claimed: boolean) {
  const wanted = useSyncExternalStore(
    subscribe,
    () => (userId ? requested || !deferred(userId) : false),
    () => false,
  );
  return Boolean(userId) && !claimed && wanted;
}

export function HandleClaim() {
  const auth = useSession(),
    session = auth.session,
    open = useOffered(session?.userId, session?.handleClaimed ?? true),
    client = useQueryClient(),
    dialog = useRef<HTMLDialogElement>(null),
    hint = useId(),
    [handle, setHandle] = useState(""),
    [name, setName] = useState(""),
    [checked, setChecked] = useState("");
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  // Ask the server only after typing pauses and the handle already passes the local rules.
  const problem = handle ? handleProblem(handle) : null;
  useEffect(() => {
    const timer = setTimeout(() => setChecked(problem ? "" : handle), 300);
    return () => clearTimeout(timer);
  }, [handle, problem]);
  const availability = useQuery({
    queryKey: ["handle-availability", checked],
    enabled: open && checked.length > 0 && Boolean(session),
    staleTime: 10000,
    queryFn: async () =>
      api<Availability>(`handles/${checked}`, {
        token: await auth.getToken(),
        wallet: session?.wallet,
      }),
  });
  const claim = useMutation({
    mutationFn: async () =>
      api<{ handle: string }>("profile", {
        method: "POST",
        token: await auth.getToken(),
        wallet: session?.wallet,
        body: { handle, ...(name.trim() ? { displayName: name.trim() } : {}) },
      }),
    onSuccess: async () => {
      requested = false;
      await auth.refresh();
      await client.invalidateQueries();
    },
  });
  if (!session) return null;
  const settled = checked === handle && availability.data?.handle === handle;
  const taken = settled && !availability.data!.available;
  const status = !handle
    ? `${HANDLE_MIN} to ${HANDLE_MAX} characters: lowercase letters, numbers and underscores.`
    : (problem ??
      (taken
        ? availability.data!.problem
        : settled
          ? `@${handle} is available.`
          : "Checking availability…"));
  const later = () => defer(session.userId);
  return (
    <dialog
      ref={dialog}
      className="report-dialog handle-claim"
      aria-labelledby={`${hint}-title`}
      onCancel={(event) => {
        event.preventDefault();
        later();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!problem && !taken) claim.mutate();
        }}
      >
        <span className="eyebrow">One more thing</span>
        <h2 id={`${hint}-title`}>Choose your handle</h2>
        <p className="handle-claim-lead">
          Your ideas and forks are credited to this name. Your profile lives at
          /u/{handle || "your_handle"}.
        </p>
        <label htmlFor={`${hint}-handle`}>Handle</label>
        <div className="handle-field">
          <span aria-hidden="true">@</span>
          <input
            id={`${hint}-handle`}
            value={handle}
            onChange={(event) => {
              claim.reset();
              setHandle(normalizeHandle(event.target.value));
            }}
            maxLength={HANDLE_MAX}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={hint}
            aria-invalid={Boolean(problem) || taken}
            required
          />
        </div>
        <p
          id={hint}
          className={`handle-status ${problem || taken ? "invalid" : settled ? "valid" : ""}`}
          role="status"
        >
          {status}
        </p>
        <label>
          Display name <span>Optional</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            autoComplete="name"
          />
        </label>
        {claim.error && (
          <p role="alert" className="handle-status invalid">
            {claim.error.message}{" "}
            {claim.error instanceof ApiError
              ? claim.error.recovery
              : "Try again."}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={later}>
            Not now
          </button>
          <button
            className="button primary"
            disabled={claim.isPending || !handle || Boolean(problem) || taken}
          >
            {claim.isPending ? "Claiming…" : "Claim handle"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
