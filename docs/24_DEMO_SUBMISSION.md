# Demo and submission

What the Monad Metropolis submission consists of, where each piece lives and what is still open. Only the owner edits the portal and submits.

Deadline: **October 14, 2026, 06:59 Europe/Istanbul** (October 13, 23:59 ET).

## The pieces

| Piece | Where |
| --- | --- |
| Live product | https://forktrades.xyz |
| Source | https://github.com/anilkaracay/fork-metropolis, public, MIT |
| The story a reader follows top to bottom | [`README.md`](../README.md) |
| Portal text, ready to paste | [`submission/portal-copy.json`](submission/portal-copy.json): name, one line, description, go to market, access instructions, Envio and Privy responses |
| Video scripts and shot lists | [`submission/VIDEO_SCRIPTS.md`](submission/VIDEO_SCRIPTS.md): the technical demo and two optional sponsor cuts. The founder pitch is written separately |
| Measured Monad timing | [`MONAD_PERFORMANCE.md`](MONAD_PERFORMANCE.md) |
| Design checks | [`DESIGN_QUALITY.md`](DESIGN_QUALITY.md) |
| Logo | [`assets/submission/logo.png`](assets/submission/logo.png) |

The portal fields are: track, logo, name (120 characters), one line (200), description (8000), go to market (8000), repository, live product, technical demo of at most 3 minutes, pitch of at most 2 minutes, optional access instructions (8000), and a written response for each sponsor entered. Videos are hosted on YouTube, Loom or Vimeo.

Entered: Social, Attention & Culture as the track, with the Envio and Privy sponsor entries. Perpl and Nansen are not entered: neither integration is part of the product.

## Rules for everything in the submission

- No invented users, activity, metrics or partnerships. The live graph is early and small and includes the team's own test activity, and the copy says so.
- Every number comes from a recorded measurement or from a command the reader can run.
- Timing is reported as confirmation time and gas units, never as a cost in money.
- Markers of the form `[[PENDING: ...]]` in the portal copy, and `PENDING` comments in the README, mark values that exist only after the steps below. Nothing is submitted while one remains.

## Open steps

- [x] README rewritten around the current product
- [x] Portal copy drafted
- [x] Architecture diagram shows both contracts
- [x] Video scripts and shot lists written
- [x] `FORKBacking` deployed from main and verified, with its address, transaction and block recorded
- [x] Indexer redeployed over both contracts, with the new GraphQL endpoint recorded
- [x] Production deployed with the new migration, the backing address and the faucet key
- [x] Measurement run recorded in `MONAD_PERFORMANCE.md`
- [ ] Pending values filled in the README and the portal copy
- [ ] Live screenshots replace the test workspace ones in the README
- [ ] Technical demo and founder pitch recorded and uploaded
- [ ] Logo uploaded in the portal
- [ ] Portal updated and the entry submitted by the owner

## Earlier package

The first submission package, prepared on October 12, 2026 before backing existed, is kept as a record in [`build-log/submission/`](build-log/submission/): its portal notes, video scripts, captions, release audit and hosting files. It describes the product as it was then.
