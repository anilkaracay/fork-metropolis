import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { schema, type Database } from "@fork/db";
import { addressSchema } from "@fork/shared";
import { AppError, assert, configuration } from "./errors";

export type VerifiedIdentity = {
  did: string;
  wallets: { address: string; kind: "embedded" | "external" }[];
};
export interface AuthVerifier {
  verify(accessToken: string): Promise<VerifiedIdentity>;
}
export type Session = {
  userId: string;
  did: string;
  wallet: string;
  handle: string;
  displayName: string;
  handleClaimed: boolean;
};
export function bearer(request: Request): string {
  const value = request.headers.get("authorization");
  assert(
    value && /^Bearer [^\s]+$/.test(value),
    "AUTH_REQUIRED",
    "Sign in to continue.",
    401,
    "Sign in, then retry your action.",
  );
  return value.slice(7);
}
export function associatedWallet(identity: VerifiedIdentity, address: string) {
  const normalized = addressSchema.parse(address);
  assert(
    identity.wallets.some((w) => w.address.toLowerCase() === normalized),
    "WRONG_WALLET",
    "This wallet is not associated with your signed-in identity.",
    403,
    "Select a wallet linked to your account.",
  );
  return normalized;
}
export async function synchronizeIdentity(
  db: Database,
  identity: VerifiedIdentity,
  selection?: string,
): Promise<Session> {
  assert(
    identity.did.length > 0 && identity.wallets.length > 0,
    "WALLET_REQUIRED",
    "Create or link an EVM wallet to continue.",
    409,
    "Create your embedded wallet, then retry.",
  );
  return db.transaction(async (tx) => {
    const handle = `u_${createHash("sha256").update(identity.did).digest("hex").slice(0, 12)}`;
    await tx
      .insert(schema.users)
      .values({ privyDid: identity.did, handle })
      .onConflictDoNothing({ target: schema.users.privyDid });
    const [user] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.privyDid, identity.did));
    assert(
      user,
      "AUTH_INVALID",
      "Unable to synchronize identity.",
      401,
      "Sign in again.",
    );
    for (const w of identity.wallets) {
      const address = addressSchema.parse(w.address);
      await tx
        .insert(schema.wallets)
        .values({ address, userId: user.id, kind: w.kind })
        .onConflictDoNothing();
      const [owner] = await tx
        .select()
        .from(schema.wallets)
        .where(eq(schema.wallets.address, address));
      assert(
        owner?.userId === user.id,
        "WALLET_OWNERSHIP_CONFLICT",
        "This wallet already belongs to another FORK identity.",
        403,
        "Use the original account or select another linked wallet.",
      );
    }
    const selected = associatedWallet(
      identity,
      selection ??
        user.primaryWallet ??
        [...identity.wallets].sort(
          (a, b) =>
            (a.kind === b.kind ? 0 : a.kind === "embedded" ? -1 : 1) ||
            a.address.toLowerCase().localeCompare(b.address.toLowerCase()),
        )[0]!.address,
    );
    if (user.primaryWallet !== selected)
      await tx
        .update(schema.users)
        .set({ primaryWallet: selected, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
    return {
      userId: user.id,
      did: identity.did,
      wallet: selected,
      handle: user.handle,
      displayName: user.displayName ?? user.handle,
      handleClaimed: user.handleClaimedAt !== null,
    };
  });
}
export async function authenticate(
  db: Database,
  verifier: AuthVerifier,
  request: Request,
): Promise<Session> {
  const identity = await verifier.verify(bearer(request));
  const session = await synchronizeIdentity(db, identity);
  const supplied = request.headers.get("x-fork-wallet");
  assert(
    supplied && associatedWallet(identity, supplied) === session.wallet,
    "WRONG_WALLET",
    "The selected wallet does not match your FORK session.",
    403,
    "Refresh your session or explicitly select your primary wallet again.",
  );
  return session;
}
export function privyVerifier(
  appId?: string,
  appSecret?: string,
): AuthVerifier {
  return {
    async verify(token) {
      if (!appId || !appSecret) configuration("Privy authentication");
      const { PrivyClient, InvalidAuthTokenError } =
        await import("@privy-io/node");
      const client = new PrivyClient({
        appId,
        appSecret,
        timeout: 5000,
        maxRetries: 1,
      });
      try {
        const claims = await client.utils().auth().verifyAccessToken(token);
        const user = await client.users()._get(claims.user_id);
        assert(
          user.id === claims.user_id,
          "AUTH_INVALID",
          "The authenticated identity does not match.",
          401,
          "Sign in again.",
        );
        const wallets = user.linked_accounts.flatMap((account) =>
          account.type === "wallet" && account.chain_type === "ethereum"
            ? [
                {
                  address: account.address.toLowerCase(),
                  kind:
                    account.wallet_client_type === "privy"
                      ? ("embedded" as const)
                      : ("external" as const),
                },
              ]
            : [],
        );
        return { did: user.id, wallets };
      } catch (error) {
        if (error instanceof AppError) throw error;
        if (error instanceof InvalidAuthTokenError)
          throw new AppError(
            "AUTH_INVALID",
            "Your session has expired or is invalid.",
            401,
            "Sign in again and retry.",
          );
        throw new AppError(
          "AUTH_UNAVAILABLE",
          "Identity verification is temporarily unavailable.",
          503,
          "Retry shortly; no wallet mutation has been accepted.",
        );
      }
    },
  };
}
