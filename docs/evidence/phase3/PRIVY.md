# Privy — PARTIAL

Pinned React SDK 3.47.0 / Node SDK 0.35.0. Existing product implements email/Google auth, embedded EVM wallet, server-verified access token/DID, linked-wallet ownership and primary selection. Authoritative receipt checks bind author and canonical content to Monad transactions. Token/wallet rejection tests pass with explicit provider fixtures.

No real credentials were confirmed; no real email/Google login, embedded-wallet creation, fresh/incognito session, transaction signing or typed-data signing was tested. Allowed domains and wallet type remain unrecorded. Production identity/submit/reset test routes return 404 in the actual local production build.

Required evidence: actual allowed staging origin, two distinct verified identities/public wallets, embedded wallet type, sanitized server verification outcomes, root/fork hashes and typed-data signing outcome. No tokens/email/private keys may enter evidence. This is not bounty-ready.
