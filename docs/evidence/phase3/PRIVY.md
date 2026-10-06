# Privy — PARTIAL

Pinned React SDK 3.47.0 / Node SDK 0.35.0. Existing product implements email/Google auth, embedded EVM wallet, server-verified access token/DID, linked-wallet ownership and primary selection. Authoritative receipt checks bind author and canonical content to Monad transactions. Token/wallet rejection tests pass with explicit provider fixtures.

No real credentials were confirmed; no real email/Google login, embedded-wallet creation, fresh/incognito session, transaction signing or typed-data signing was tested. Allowed domains and wallet type remain unrecorded. Production identity/submit/reset test routes return 404 in the actual local production build.

Required evidence: actual allowed localhost origin, verified real identities/public wallets, embedded wallet type, sanitized server verification outcomes and typed-data signing outcome. Root/fork hashes and a two-user journey belong to the later registry/Envio gates. No tokens/email/private keys may enter evidence. This is not bounty-ready.

## Local preparation — 2026-10-06

User approved the local database and authorized only the Privy localhost gate. DATABASE_URL: PRESENT. NEXT_PUBLIC_PRIVY_APP_ID: MISSING. PRIVY_APP_SECRET: MISSING. Credential inspection emitted presence only; the ignored environment file was not changed. No real user/wallet was synchronized, no real login occurred and no signature or transaction was requested.

Prepared independent account bootstrap before registry/indexer deployment, deterministic persisted primary selection with explicit changes, Ethereum-only embedded wallet creation, generic auth/signature recovery and server-only environment schema isolation (D-040). The optional local proof page uses the existing real signing adapter, recovers a harmless typed-data signature to the selected primary, and checks Monad Testnet balance before any single self transaction attempt. It cannot supply fixture tokens/wallets and is unavailable in production or the isolated test workspace.

The official Node SDK's installed App service exposes app settings retrieval, allowlist/invite reads and testing utilities; it does not create/update app configuration. Testing-token APIs and server-owned agent wallets were not used. No Privy CLI is installed, and the current official setup docs require dashboard app creation before SDK authentication. Local setup therefore stops at the user's requested dashboard handoff, pending configuration/credentials and confirmation.

Dashboard target: development app; Authentication → Email and Google (default Privy development OAuth credentials); user-controlled embedded Ethereum wallets; Configuration → App settings → Domains → Allowed origins → Web & mobile web: http://localhost:3000. Configuration → App settings → Basics supplies NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET for ignored apps/web/.env.local. The React provider configures Monad Testnet 10143 with the existing official public RPC, not a dashboard-only custom network dependency.

Current official sources checked:

- [React setup](https://docs.privy.io/basics/react/setup) and [Node setup](https://docs.privy.io/basics/nodeJS/setup).
- [Dashboard app creation/credentials](https://docs.privy.io/basics/get-started/dashboard/create-new-app), [login methods/default development OAuth](https://docs.privy.io/basics/get-started/dashboard/configure-login-methods) and [allowed localhost URLs](https://docs.privy.io/recipes/dashboard/allowed-domains). Localhost requires its port; production allowed-domain guidance does not force a production domain for this development gate.
- [Automatic embedded wallet creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation) and [custom EVM network configuration](https://docs.privy.io/basics/react/advanced/configuring-evm-networks).
- [Access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens) and [authoritative user/linked account object](https://docs.privy.io/user-management/users/the-user-object).
- [Official viem provider integration](https://docs.privy.io/wallets/connectors/ethereum/integrations/viem), [typed-data signing](https://docs.privy.io/wallets/using-wallets/ethereum/sign-typed-data), [transaction signing](https://docs.privy.io/wallets/using-wallets/ethereum/sign-a-transaction) and [sending transactions](https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction).
- [Monad Testnet network information](https://docs.monad.xyz/developer-essentials/testnet); existing chain/RPC retained.
- [Official Privy MCP server](https://github.com/privy-io/privy-mcp-server) requires existing app credentials and supplies wallet operations, not this application's bootstrap. It was not installed.

Local preparation checks: format/lint/strict workspace typecheck pass; full suite passes 188 root unit tests, 12 indexer tests and 28 contract tests. Eight new tests exercise the real official SDK cryptographic verification with ephemeral unit-only ES256 JWTs and isolated authoritative user responses (valid, expired, invalid, tampered, wrong audience/issuer, subject mismatch and upstream redaction). Four session API tests use an isolated migrated database/verifier to verify independent bootstrap, explicit selection, wrong-wallet rejection, unauthenticated rejection and unavailable test routes. Deterministic/unlinked primary and signature-recovery tests also pass. These do not represent a real account or real wallet signature.

The production build passes with D-034's two existing warnings. Actual production Playwright smoke passes 3/3, including /dev/privy and test identity routes returning 404. Existing isolated social Playwright regressions pass 5/5; these remain fixture journeys, not real Privy evidence. Scanning 203 production browser files finds neither the server secret name nor the configured database URL/password. The Privy secret value check is pending because that credential is missing. Changed-source exact credential and redacted Gitleaks scans pass. No tokens/signatures are logged by the new integration/proof code; authoritative email/social fields are discarded before the application returns or persists identity.
