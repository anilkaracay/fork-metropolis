# Privy Integration Specification

## Bounty objective

Privy must do more than login.

In FORK it powers:

1. user authentication
2. embedded EVM wallet creation/access
3. FORKRegistry contract transaction signing
4. Perpl EIP-712 API-key enrollment signing
5. Perpl exchange-account and forwarding-permission transactions

This is a substantive wallet workflow.

## Authentication

Enable at minimum:

- email
- Google or another social method

Keep login choices short. Do not show every possible provider.

## Embedded wallet

Create an Ethereum-compatible embedded wallet for users who do not already have a selected EVM wallet.

The FORK user identity maps:

```text
Privy DID -> primary FORK wallet address -> public profile
```

Wallet address must be stable for provenance.

## Server authentication

Frontend includes Privy access token in API requests.

Server verifies the token using current Privy server SDK and maps `sub` / Privy DID to FORK user.

Never accept `userId` or `walletAddress` from client as authoritative identity.

## Contract transactions

Use Privy transaction APIs/hooks to send:

- FORKRegistry.createThesis
- FORKRegistry.linkExecution
- Perpl Exchange account creation/setup calls
- Perpl allowOrderForwarding

Capture transaction hash and show progress.

## Typed-data signing

Perpl programmatic enrollment returns EIP-712 typed data that must be signed by the user wallet.

Implementation must use Privy's supported Ethereum provider/wallet signing path for `eth_signTypedData_v4` or current typed-data method.

Do not reconstruct or mutate typed_data unless Perpl docs explicitly require it. Sign exactly the payload returned by Perpl.

## No server custody

MVP does not delegate user wallet control to FORK backend.

Do not provision server signers unless Branch Watch automation is explicitly approved. This keeps the core trust model simple.

If Branch Watch is built, use Privy delegated/session signer controls with strict policies and explicit user consent. Never use an unrestricted server signer.

## Wallet UX

Logged-in user should not see repeated wallet jargon.

Good:

- `Publish on Monad`
- `Enable trading on this device`
- `Approve one-click Perpl orders`

Avoid:

- `Connect RPC signer`
- `Create EOA`
- `Provision keypair`

## Error mapping

Translate common errors:

- user rejected -> `You cancelled the signature.`
- wrong chain -> auto-request/switch Monad Testnet when supported
- insufficient MON -> `You need testnet MON for this onchain action.`
- transaction revert -> decode known contract error and show plain language

## Security

- Privy app secret server-only
- authorization keys never in client bundle
- access tokens verified server-side
- no access token logging
- CSP restricts unexpected origins
- transaction calldata shown in confirmation summary before signing where UX supports it

## Bounty evidence

Demo sequence should visibly show:

1. sign in
2. embedded wallet address
3. publish thesis through wallet transaction
4. later sign Perpl enrollment payload
5. execute another wallet transaction for Perpl setup if needed

Documentation should explain that Privy is the user account and signing layer across both social provenance and trading enablement.

## Acceptance criteria

- fresh user can onboard without browser wallet extension
- same wallet authors onchain thesis
- same wallet signs Perpl enrollment
- backend verifies Privy session token
- logout removes app session without deleting device-local Perpl key unexpectedly
- no secret Privy credentials in client source or network responses

## Phase 2 implementation boundary

`components/social/privy-session.tsx` uses Privy React 3.47.0, email/Google login, Monad chain configuration and Ethereum embedded-wallet creation for users without an EVM wallet. Its adapter uses the selected connected wallet's supported Ethereum provider with viem for registry transaction and typed-data signing. It stores no private key on the server. Primary selection persists a public address preference and is revalidated against verified linked wallets server-side on every mutation.

`server/auth.ts` uses the current **@privy-io/node 0.35.0** SDK, `utils().auth().verifyAccessToken` and `users()._get` with the verified `user_id`. This supersedes older server-auth/sub examples. Product routes consume AuthVerifier and Session interfaces. SDK reads use 5-second timeout and one retry; no credentialed call has been made.

The public app builds without Privy credentials. Sign-in fails with actionable configuration text when absent. Configured database/Envio public browsing does not require Privy credentials. `pnpm test:dev` exposes a separately labelled test identity adapter that production cannot enable. Perpl enrollment and linkExecution signing flows remain next-phase work; the transaction/typed-data adapter interfaces are ready.
