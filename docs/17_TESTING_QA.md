# Testing and QA Plan

## Testing philosophy

The three-day build cannot have perfect coverage, but every path used in the judge demo must be automated or manually rehearsed from a fresh browser session.

## Test layers

### Smart contract - Foundry

Required tests listed in `08_SMART_CONTRACT_SPEC.md`.

Gate: 100% of contract tests pass before any deployment address is used by the frontend.

### Unit tests - web/shared

Use Vitest or the framework-compatible lightweight runner.

Required units:

- canonical thesis metadata hashing
- fork diff calculation
- reputation formula functions
- Smart Signal ranking fallback
- Perpl canonical request signing helper
- Perpl request ID generator
- execution reference hash test vectors
- API Zod schemas

### API integration tests

Use test DB/schema.

Required:

- draft create/finalize happy path with mocked RPC receipt decoder
- finalize author mismatch rejected
- finalize content hash mismatch rejected
- comments auth/rate behavior
- Nansen cache hit/miss/error fallback
- execution verification rejects mismatched market/author

### Envio tests

- handler fixtures for root/fork/execution link
- GraphQL smoke query after local indexing

### Browser E2E - Playwright

At minimum:

#### E2E-01 public browse

- open feed logged out
- open thesis
- open tree

#### E2E-02 auth/profile

- use test auth method if Privy supports automation environment
- verify protected action prompts authentication

If Privy login cannot be fully automated safely, keep a manual auth test plus automate post-auth app with a test fixture session only in non-production.

#### E2E-03 create thesis

- form validation
- transaction mocked in CI, live in manual test
- success route

#### E2E-04 fork diff

- open parent
- fork
- change target
- verify diff UI
- submit mocked tx

#### E2E-05 comments/reaction

- agree optimistic update
- comment submit

#### E2E-06 failure states

- Envio error
- Nansen error
- Perpl unavailable

### Live integration manual tests

Must run against real Monad Testnet/Perpl Testnet before submission:

1. fresh Privy user onboarding
2. real root thesis transaction
3. real second-wallet fork transaction
4. Envio tree update
5. Perpl API-key enrollment
6. Perpl account/forwarding setup
7. real testnet order/fill
8. execution verification
9. linkExecution transaction
10. profile/reputation refresh

## Browser matrix

Must test:

- Chrome desktop latest
- Safari desktop current if available
- mobile Chrome/Safari responsive viewport

At least one real phone test is strongly preferred.

## Accessibility QA

- keyboard-only feed->thesis->fork flow
- focus visible
- modal focus trap
- labels on all inputs
- error text associated with field
- no red/green-only meaning
- reduced-motion check

## Visual QA

Capture screenshots for:

- feed dark; light only if P1 implemented
- thesis detail
- fork diff
- idea tree 1, 5, and 20 nodes
- profile
- mobile feed
- mobile execution drawer
- all major error/empty states

Compare for clipping, alignment, inconsistent radius, bad wrapping, and low contrast.

## Performance QA

Run Lighthouse or equivalent on production deploy:

- landing
- feed
- thesis detail

Investigate any obvious LCP/JS regressions. Do not chase a perfect score at the expense of broken product.

## Release smoke test

After every production deployment:

1. `/api/health`
2. landing loads
3. feed loads
4. Privy opens
5. one public thesis loads
6. Envio query works
7. Perpl public context works
8. Nansen route returns data or graceful fallback

## Bug severity

P0 blocker:

- cannot login
- cannot create/fork thesis
- contract/indexer mismatch
- execution exposes secrets
- real order path broken
- app crashes in demo flow

P1:

- score wrong
- comments fail
- tree visual issue that preserves data
- mobile layout broken on key screen

P2:

- cosmetic or stretch feature

No P0 bugs may remain at submission.
