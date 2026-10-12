# Phase 1 foundation

Implemented 2026-10-04 under the user's foundation-only authorization. No deployed address, authenticated integration or live fill verification is claimed.

## Implemented boundaries

- pnpm workspace: Next web, pure shared primitives, noncustodial registry, indexer scaffold.
- Strict TypeScript including root scripts, shared tests and the indexer boundary.
- Dark semantic design tokens, responsive navigation Feed/Explore/Create/Profile, skip link/focus/reduced-motion treatment and recovery pages. All screens explicitly identify themselves as a foundation preview; no fake activity.
- Public/server configuration separated by an allowlist and `server-only`; no secrets required or requested.
- Shared Zod root/fork/parent-change/namespace schemas, exact fixed-point helpers, metadata v1 serialization and keccak256.
- Public Perpl Testnet context only, fixed official URL, runtime validation, 5-second timeout per attempt and at most 3 attempts with bounded exponential retry. Permanent/schema errors are not retried. No stale configuration fallback.
- Immutable FORKRegistry with canonical parent event, author-only one-time reference linking, no owner/custody/external calls. Timestamp conversion checks uint64 rather than truncating.
- Execution reference v1 pure identifier helper and fail-closed adapter for complete documented Perpl fill identity. It does not verify a trade.
- Frozen independent Foundry-cast vectors; Solidity-equivalent tests. Generated ABI copies and consistency gate.

## Exact metadata rules

Fixed JSON key order: version, reasoning, tags, entryNote. Missing/blank note becomes null. Reasoning is trimmed, 10–500 UTF-16 code units; note 0–160. Internal whitespace/Unicode bytes remain unchanged (no normalization); reject controls other than TAB/LF/CR. Tags trim/lowercase, allow ASCII `[a-z0-9][a-z0-9-]{0,23}`, deduplicate and sort; max 3 unique tags and max 32 raw inputs. Hash UTF-8 JSON bytes using keccak256, not SHA-256.

Vectors: `packages/shared/test/fixtures/metadata-v1.json`. These are synthetic canonicalization fixtures, not product activity.

## Execution identity

Exact two-stage Solidity ABI encoding is defined in `08_SMART_CONTRACT_SPEC.md`; implementation: `packages/shared/src/execution-ref.ts`. Synthetic vectors: `packages/shared/test/fixtures/execution-v1.json`.

Current official response types: https://github.com/PerplFoundation/api-docs/blob/main/types.md. There is no mandatory fill ID. Transaction hash/log index are documented but optional; missing identity, missing price, zero fill, closing order or unsafe JSON integer is rejected. No invented timestamp/position fallback. Database uniqueness on fillIdentity must be implemented later independently of thesis-bound executionRef. Attested claims must never reserve authoritative evidence identity.

Live authenticated retrieval remains mandatory before Verified status. Phase 1 only verifies encoding and public context; it cannot demonstrate the approved authenticated relay or validate actual fill semantics.

## Public context observation

The implemented client successfully fetched official context on 2026-10-04 at 14:46:58 UTC:

- chain 10143, instance 12
- exchange `0x1964c32f0be608e7d29302aff5e61268e72080cc`
- AUSD `0xa9012a055bd4e0edff8ce09f960291c09d5322dc`, 6 decimals
- account-opening amount `100000000` raw = 100 AUSD; minimum deposit `10000000` = 10 AUSD
- BTC 16 / ETH 32 / SOL 48 / MON 64, all open
- price/size decimals: BTC 1/5, ETH 2/3, SOL 2/3, MON 5/0

No change from the audit. The dated response fixture is a schema test; runtime always obtains and validates current context. Source: https://testnet.perpl.xyz/api/v1/pub/context.

## Pinned tooling

Node 24.21.0 / pnpm 12.6.0; Next 16.3.8 / React 19.3.0; TypeScript 6.0.3; ESLint 9.39.5 / eslint-config-next 16.3.8; Tailwind/PostCSS plugin 4.3.3; viem 2.57.2; Zod 4.6.5; Vitest 5.0.3; Prettier 3.9.9. Exact manifests and lock integrity are committed.

Stable release metadata was checked against the official npm registry. TypeScript 7 exceeds the current parser's `<6.1` range; ESLint 10 exceeds several current Next plugin peer ranges. ESLint 9 is upstream-deprecated but deliberately retained within those peer ranges, without peer overrides. Revisit when the official compatible stack changes.

Foundry 1.8.4 and Solidity 0.8.37 are downloaded from official releases/manifests with SHA-256 verification into `.tools/`, through `pnpm tools:install`. `network = "monad"` and `evm_version = "prague"` are explicit. Official references:

- https://docs.monad.xyz/tooling-and-infra/toolkits/foundry
- https://github.com/foundry-rs/foundry/releases/tag/v1.8.4
- https://binaries.soliditylang.org/macosx-amd64/list.json
- https://nextjs.org/docs/app/getting-started/installation
- https://tailwindcss.com/docs/installation/framework-guides/nextjs

## Quality and visual evidence

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm abi:check`. Unit tests never call an external API. `pnpm perpl:context` is the explicit opt-in unauthenticated live check.

Local quality result: 79 Vitest tests in 5 files and 28 Foundry tests in 2 suites passed; three fuzz properties ran 256 cases each. Formatting, lint (zero warnings), strict typecheck and ABI consistency passed. Production Next.js build and strict Solidity build passed; no deployment.

Chrome review: 1440×900, 1280×800, 390×844 and 375×667; no horizontal overflow at tested widths. Explore keyboard navigation, visible focus and not-found return-to-Feed recovery checked. Screenshots: `artifacts/phase1/desktop.jpg`, `artifacts/phase1/mobile.jpg`. This is a shell review, not P0 product-flow coverage; critical Playwright flows arrive with those features.

CI defines the same gates without external accounts/deployment. No remote CI run is claimed before a GitHub remote exists. Root formatting covers implementation/configuration files; Solidity uses `forge fmt --check`. Specs received targeted content changes, preserving unrelated formatting.

## Stopped work

No Privy authenticated flow, Neon schema/migrations, Envio handlers, thesis composer/publishing, API-key enrollment, authenticated trading, Nansen calls or deployment. Next phase requires review and stage-specific configuration; no secret is requested in Phase 1.
