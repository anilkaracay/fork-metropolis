# Definition of Done

Do not submit until every P0 item below is checked.

## Product

- [ ] landing/public browse works
- [ ] Privy login works from fresh browser
- [ ] embedded EVM wallet works
- [ ] user profile creation works
- [ ] root thesis publishes on Monad Testnet
- [ ] fork publishes with correct parent
- [ ] challenge flow works as fork
- [ ] thesis detail is polished
- [ ] comments work
- [ ] Agree works
- [ ] Idea Tree works desktop
- [ ] Idea Tree usable mobile
- [ ] transparent graph profile reputation works with namespace/sample counts
- [ ] no realized-PnL reputation; open trades imply no profit
- [ ] P0 navigation Feed/Explore/Create/Profile; no Activity item

## Onchain/indexing

- [ ] FORKRegistry deployed
- [ ] deployment address documented
- [ ] source/ABI committed
- [ ] Foundry tests pass
- [ ] Envio indexes real deployment
- [ ] Feed reads Envio data
- [ ] Tree reads Envio data
- [ ] profile stats read Envio data
- [ ] content-hash integrity verified

## Perpl

- [ ] public context loads
- [ ] API key enrollment works or documented stable setup path exists
- [ ] client private Ed25519 key never reaches backend
- [ ] exchange account state detected
- [ ] forwarding state detected
- [ ] user can enable forwarding
- [ ] real Perpl Testnet order placed from FORK
- [ ] fill/failure state visible
- [ ] constrained read-only verification live-tested; authoritative responses retrieved by backend
- [ ] Attested distinct from Verified and excluded from execution credit
- [ ] immutable evidence uniqueness prevents repeated credit
- [ ] linkExecution works
- [ ] verified badge appears

## Sponsors

### Privy

- [ ] beyond-login usage proven
- [ ] contract signing shown
- [ ] Perpl enrollment signing shown

### Envio

- [ ] non-trivial schema public
- [ ] core feature visibly depends on it
- [ ] derived aggregate used

### Nansen

- [ ] server-only API key
- [ ] permitted Monad PnL context loads when available; no prohibited labels
- [ ] product behavior uses context
- [ ] graceful fallback works

### Perpl bounty

- [ ] either Branch Watch production-ready and bounty claimed
- [ ] or bounty explicitly NOT claimed

## Quality

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] critical Playwright tests pass
- [ ] `pnpm build` passes
- [ ] `forge fmt --check` passes
- [ ] `forge test` passes
- [ ] no P0 bugs
- [ ] no broken links in app
- [ ] mobile 375px usable
- [ ] keyboard navigation pass
- [ ] dark mode pass
- [ ] dark-only P0 passes; full light mode/theme switching deferred to P1
- [ ] no obvious console errors

## Security

- [ ] no secret in git history
- [ ] no private key in logs
- [ ] CSP configured
- [ ] user text rendered safely
- [ ] rate limits on mutations
- [ ] dependency audit reviewed
- [ ] production env vars verified

## Traction

- [ ] real tester group exists
- [ ] demo/seed users excluded from traction metric
- [ ] real metrics captured
- [ ] at least one non-trivial real tree exists if possible

## Submission

- [ ] Track 03 selected
- [ ] only eligible bounties selected
- [ ] public GitHub works
- [ ] live product works
- [ ] access instructions complete
- [ ] technical demo <= 3:00
- [ ] pitch <= 2:00
- [ ] logo/graphic uploaded
- [ ] project description final
- [ ] why Monad clearly stated
- [ ] Track 03 fit clearly stated
- [ ] sponsor evidence clearly stated
- [ ] final smoke test after last deployment

## Final judge test

A person who has never seen FORK can, without verbal help:

1. understand the product in under 20 seconds
2. open a thesis
3. fork it
4. understand what changed
5. see provenance in the tree
6. understand that a verified execution is real
7. understand why the author/contributor has reputation

If not, the product is not done even if the code is technically complete.
