# Monad Testnet registry deployment

Status: READY. FORKRegistry was deployed exactly once on Monad Testnet and source verification returned exact_match. This gate stops before Envio Cloud and real thesis publication.

## Canonical public evidence

- [Deployment artifact](../../../../contracts/deployments/10143.json): chain/network, address, transaction/block, block timestamp, public deployer, pinned compiler/Foundry, reviewed git commit and ABI/bytecode hashes.
- [Independent viem read](monad-live-read.json): exact runtime code, successful receipt, empty initial state and 154 observed confirmations.
- [Public single-attempt journal](monad-deployment-attempt.json): preflight block, nonce 0, predicted CREATE address, fixed fees and the only broadcast's confirmed hash. No raw signing material is recorded.
- [Contract explorer](https://testnet.monadvision.com/address/0x1889a7216b1ecad9a44910dd0996834d0894b9e1).
- [Transaction explorer](https://testnet.monadvision.com/tx/0xc1ba5d4fc31bc0a45e973ec8a63c0583a3fb4f643c0f46053a7ee5dd5fbf4a86).

Reviewed source/config commit: dfcc50f7b95bf6df035cf97c739b503493856797. Working tree was clean before preparation. No Solidity source or Foundry configuration changed. FORKRegistry is a direct, non-upgradeable contract with no constructor arguments or owner/admin role. The artifact recorder gained network, Foundry version and deployment timestamp fields; its real execution validated the source/receipt/runtime before writing the artifact exclusively.

## Official documentation checked on 2026-10-09

- [Current Testnet network and faucet](https://docs.monad.xyz/developer-essentials/testnet): use https://faucet.monad.xyz; the older testnet.monad.xyz link redirects to a developers page.
- [Foundry deployment](https://docs.monad.xyz/guides/deploy-smart-contract/foundry): chain 10143, https://testnet-rpc.monad.xyz, Foundry 1.8+ and Monad network mode.
- [Current compatibility](https://docs.monad.xyz/developer-essentials/summary): current opcode support permits the reviewed Prague build; retain solc 0.8.37 and optimizer 200.
- [Official verification](https://docs.monad.xyz/guides/verify-smart-contract/foundry): Sourcify at https://sourcify-api-monad.blockvision.org/.

## Deployer and funding

Method B: dedicated local encrypted Foundry Testnet deployer, explicitly authorized by the user. Public address: 0x8EEACa7389758aa32fc672714565aA77503e2091. Privy private keys were not imported or exported. The encrypted keystore/password stay in ignored .tools/foundry/keystores, files mode 0600 and directory 0700. No signer credential belongs to the application/server.

At 2026-10-09T12:01:45.473Z the official RPC returned chain 10143, a plain EOA, pending nonce 0 and 0 MON. The gate stopped for the official faucet funding action, recommending 1 Testnet MON. After the user's done, live reads confirmed 5 MON. Funding source is the user-reported faucet action; actual received balance was independently checked. Immediately before deployment the balance was 5 MON; afterward it was 4.85 MON.

## Single broadcast and reproducibility

Pinned Foundry 1.8.4, solc 0.8.37+commit.f401782d, Prague, optimizer 200 and no constructor arguments. Deployment gas estimate was 573199; fixed limit 750000 and legacy gas price 200000000000 wei bounded the cost to 0.15 MON. Monad charged the full limit, as documented.

A guarded local runner validated reviewed source/config, source keccak, compiler/settings, ABI, empty constructor, chain 10143, plain EOA, pending nonce 0, sufficient balance and empty predicted CREATE address. A non-broadcast forge create preview matched the exact creation bytecode, chain, sender, nonce, gas and price. Before broadcasting, an exclusive local attempt journal was written; any subsequent invocation refuses to submit. Foundry was invoked with --broadcast exactly once. No uncertain submission or retry occurred.

The CLI invocation below documents the completed transaction; do not run it to deploy a second instance. The existing canonical artifact and journal require reconciliation rather than another broadcast. Keystore/password paths contain no credential values.

```sh
# Run from contracts; completed once, not a request to repeat.
../.tools/foundry/forge create src/FORKRegistry.sol:FORKRegistry \
  --rpc-url https://testnet-rpc.monad.xyz --chain 10143 \
  --use ../.tools/solc-0.8.37 \
  --keystore ../.tools/foundry/keystores/fork-monad-testnet \
  --password-file ../.tools/foundry/keystores/.fork-monad-testnet.password \
  --nonce 0 --gas-limit 750000 --gas-price 200000000000 --legacy \
  --rpc-timeout 10 --timeout 30 --json --broadcast
```

The read-only recorder validated chain ID, actual transaction/receipt, direct CREATE, successful status, canonical block, exact creation bytecode and exact deployed runtime. It recorded block 69535255 and timestamp 2026-10-09T12:06:41.000Z. The ABI hash uses SHA-256 of the shared ABI file bytes; creation/runtime hashes use SHA-256 of their 0x-prefixed hexadecimal text, preserving the recorder's existing encoding.

## Source verification

The first official Sourcify request failed because Foundry reported the native compiler version with a Darwin.appleclang suffix; the verifier could not fetch that platform-qualified identifier. A second source-verification request explicitly supplied the canonical 0.8.37+commit.f401782d compiler identifier through --compiler-version and succeeded with exact_match. Source, metadata settings and bytecode were unchanged; no second deployment transaction was sent. The CLI also emitted a missing local compiler-cache-file warning; verification still completed successfully.

[Successful official verification job](https://sourcify-api-monad.blockvision.org/verify-ui/jobs/2a55629e-c249-49ed-b562-a6c07e261713). The first failed job was f80e4b1b-ff01-48c3-8241-5dc83d9cfbb1.

## Live reads and configuration

Using the shared ABI and real viem HTTP client, read the deployed contract at block 69535408: runtime matches, nextThesisId = 1, theses(1) is empty, executionRefs(1) is zero. Receipt succeeds at the expected address. All calls were read-only; no createThesis or linkExecution transaction was submitted.

The actual address is configured once as server-side FORK_REGISTRY_ADDRESS in ignored mode-0600 apps/web/.env.local. Next's environment loader validated that setting and the official RPC; other variables were preserved. No NEXT_PUBLIC registry override or application hardcoded address was introduced. Envio remains unconfigured; a registry deployment alone does not make the indexed social journey ready.

## Quality and security

Predeployment fmt/build/test/fuzz/ABI checks passed. After deployment, pnpm format:check, lint, typecheck, test, abi:check and build all passed: 194 root tests, 12 indexer tests, 28 Foundry tests including three 256-run fuzz cases. Production Playwright smoke passed 3/3; it covers isolation/recovery, not a real indexed thesis.

Build retains the two documented upstream Privy/Farcaster and ox/Tempo warnings (D-034); none was suppressed. Earlier sandbox Foundry signature-cache warnings did not fail local checks; authorized final Foundry tests passed.

Redacted Gitleaks found no leaks in 13 reachable commits or current non-ignored source. Exact-value checks found no configured database URL/password, Privy server secret or local deployer password in source/evidence, the local runner/journal or 203 browser static files. Browser files also exclude server-secret environment names. Credential files are untracked, ignored and mode 0600. No raw private key, mnemonic or privileged signing payload was printed or recorded. Scans are bounded to these files/rules.

## Stop condition

No human action remains for this gate. Next recommended integration: Envio Cloud, using the canonical address and deployment start block after user review. Do not deploy it, publish a thesis, create a real fork, call authenticated Nansen or send a Perpl order yet.
