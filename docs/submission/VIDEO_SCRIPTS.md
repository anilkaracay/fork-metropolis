# Video scripts

Three videos cut from one recording session:

| Video | Length | Status |
| --- | --- | --- |
| Technical demo | 2:50 at most | Required |
| Envio cut | 1:45 | Optional |
| Privy cut | 1:45 | Optional |

The founder pitch is written separately and is not in this file.

Voiceover lines are meant to be spoken the way you would explain the product to someone next to you. Read them once, then say them in your own rhythm. Where a line says _read the number_, say what is on the screen: no timing figure is scripted in advance.

## Before recording

### What must be live

- Production runs the build that includes backing, with `FORKBacking` deployed and its address configured.
- The indexer deployment that covers both contracts is the one production reads.
- The welcome faucet holds at least 1 MON.
- `docs/MONAD_PERFORMANCE.md` has its recorded run. The demo does not quote it, but the README the viewer opens afterwards does.

### Three team test accounts

Every account in the recording belongs to the team. All of it is team test activity on Monad Testnet, and the video says so on screen and in the last line.

| Account | Role | State before recording | Used in |
| --- | --- | --- | --- |
| **A** | Author of the original idea | **Never signed in to FORK.** An email address you are comfortable showing on screen | Shots 2, 3, 4, 8 |
| **B** | Forks A's idea | Signed in once beforehand, handle claimed, welcome drip received | Shot 5 |
| **C** | Backs B's fork | Signed in once beforehand, handle claimed, welcome drip received | Shot 6 |

- Use three separate browser profiles so each stays signed in. Name the profiles A, B and C.
- B and C each use one of the day's 15 welcome drips when you prepare them, and A uses a third on camera. Each account's 0.2 MON drip covers its part of the demo.
- A must be new, because shots 2 and 3 show the first sign-in. If a take fails after shot 2, the next take needs another fresh email.
- The email code for A arrives in a mailbox. Do not show the mailbox. Cut from "code sent" to "code entered".

### Text to paste

Keep these in a note so nothing is typed slowly on camera.

| | Original, account A | Fork, account B |
| --- | --- | --- |
| Market and direction | ETH, Long | unchanged |
| Target | 4500 | **4900** |
| Invalidation | 3800 | unchanged |
| Leverage | 2 | **3** |
| Reasoning | ETH is holding above its weekly range while spot demand stays steady. I expect a move to 4500. A daily close below 3800 means I am wrong. | Same structure, but I think the move runs further once 4500 clears. I would rather take it at 3x with the same invalidation. |

Backing in shot 6: the **0.1** preset. For a fork whose parent has a different author, the sheet shows 0.08 MON to the fork's author and 0.02 MON to the original author.

### Screen

- Record at 1920 by 1080. Browser window at 1440 by 900, zoom 100%, bookmarks bar hidden, system notifications off.
- One tab per shot where possible. No other tabs, no terminal history with secrets, no `.env` file, no mailbox.
- Never open the key export screen past its first step. Shot P1 of the Privy cut shows that the button exists, nothing more.
- Add one caption for the whole of shots 2 to 8, bottom left: **Team test accounts · Monad Testnet**.

### Editing rules

- Cut waiting: typing, the email code, page loads between accounts.
- **Do not cut or speed up the stretch from pressing the confirm button to the confirmation line appearing**, in shots 4 and 6. That moment is the evidence for the time shown on screen, so it plays in real time.
- No music under the voice in shots 4 and 6. Elsewhere keep it low or leave it out.
- No numbers on screen that the product did not render.

### Rehearsal

Rehearse in the isolated workspace, not on production, so the live graph holds only the final take. Run `pnpm test:dev`, open `http://localhost:3000` and switch identities in the top bar: "Dana · new account" plays account A. The screens are the same. Confirmations there are simulated and the top bar says so, which is why nothing from the rehearsal goes into the video.

## Technical demo, 2:50

Roughly 360 spoken words.

| # | Time | Account | On screen | Voiceover |
| --- | --- | --- | --- | --- |
| 1 | 0:00 to 0:12 | none | `forktrades.xyz`. Let the hero draw the real lineage, then scroll slowly to "An idea becomes an object with a history." | This is FORK. You post a trading idea, someone forks it into a better one, and when people back it, everyone who shaped it gets a share. |
| 2 | 0:12 to 0:28 | **A** | Choose **Open FORK**, then **Sign in**. In the Privy window choose email, enter the address, cut, enter the code. The sidebar shows the new wallet. Hold on the wallet panel until the balance changes to 0.2 MON. | I'll start from zero. I sign in with an email code, and Privy gives me a wallet. No extension, no seed phrase. FORK sends that wallet a little testnet MON, so I can act right away. |
| 3 | 0:28 to 0:36 | **A** | The "Choose your handle" dialog. Type the handle, choose **Claim handle**. The sidebar shows the new handle. | I pick a handle, and that becomes my profile link. |
| 4 | 0:36 to 0:58 | **A** | **Create**. Paste the original idea. Choose **Publish on Monad**, approve in the Privy prompt. Real time until "Confirmed on Monad in …" appears. End on the new thesis page. Note its number. | Now the idea. ETH long, a target, the price that would prove me wrong, two times leverage, and my reasoning. My wallet signs it, and Monad records me as the author. That line is the confirmation time measured for this exact transaction. |
| 5 | 0:58 to 1:18 | **B** | Switch profile. Open A's thesis, choose **Fork this idea**. Change target to 4900 and leverage to 3, paste the reasoning. Hold on the panel that lists what changes. Choose **Publish fork**, approve. | Here's a second account. They think I'm too cautious. In a thread they'd reply and it would get buried. Here they fork it: a higher target, three times leverage, their own argument. FORK shows exactly what changed, and the fork stays linked to my original. |
| 6 | 1:18 to 1:46 | **C** | Switch profile. Open B's fork, choose **Back**. Choose **0.1**. Hold two seconds on "Where it goes". Choose **Back with 0.1 MON**, approve. Real time until "Backed with 0.1 MON" and the confirmation line. Hold on "You are supporter 1 of the first 10." | A third account likes the fork better, and backs it with a tenth of a MON. Before signing, the sheet shows where it goes: eighty percent to the fork's author, twenty percent to me, because the fork grew out of my idea. One signature. Confirmed in _read the number_. And they're the first of the idea's ten early supporters. |
| 7 | 1:46 to 2:00 | **C** | Choose **See the lineage**. The tree shows A's original, B's fork with 0.1 MON, and "+0.02 MON from forks" on the original. Select the fork so the panel shows "Value along the lineage". | This is the Idea Tree. My original, the fork under it, what changed between them, and the value that just travelled from the fork back to the idea it came from. |
| 8 | 2:00 to 2:16 | **A** | Switch profile. **Profile**. Hold on "Earned from forks 0.02 MON" and "Claimable". Choose **Withdraw 0.02 MON**, approve. The claimable amount returns to zero. | On my profile that shows up as earned from forks. I didn't write the fork. I got paid because someone improved my idea. I withdraw it, and it's in my wallet. |
| 9 | 2:16 to 2:28 | none | The backing transaction on the Monad explorer, opened from **View transaction** in shot 6. Scroll to the logs: one `Backed`, two `Credited`. | Here's that backing on the Monad explorer. One Backed event and two Credited events, from a contract with no owner and no upgrade path. |
| 10 | 2:28 to 2:44 | none | Terminal, large font. Run the query below. Highlight `backing`, then the `LineageFlow` row. | And here's the same story from Envio, which indexes both contracts into one graph. The fork, its backing, its early backers, and the flow to its parent. Every screen you just saw reads from this. |
| 11 | 2:44 to 2:50 | none | Back to the Idea Tree from shot 7. Caption: **Team test activity on Monad Testnet · forktrades.xyz** | That's FORK. Everything you saw is team test activity on Monad Testnet. |

### The query for shot 10

Set `ENVIO` to the public GraphQL endpoint from the README and `ID` to the number of B's fork.

```sh
curl -s "$ENVIO" -H 'content-type: application/json' -d "{\"query\":\"{ Thesis(where: {thesisId: {_eq: $ID}}) { thesisId parentId author backing { totalBacked backerCount earlyBackers } } LineageFlow(where: {sourceThesisId: {_eq: $ID}}) { creditedThesisId recipient role amount } }\"}" | jq
```

Amounts are in wei: 0.1 MON is `100000000000000000` and 0.02 MON is `20000000000000000`. Run it once before recording. If the row is not there yet, the indexer has not caught up: wait and run it again, and do not record until it returns the backing.

### What each shot proves

| Shot | What a viewer can verify afterwards |
| --- | --- |
| 2 | Sign-in with an embedded wallet and the welcome drip |
| 4 | A thesis published by the user's own wallet, with its measured confirmation time |
| 5 | A fork that changes target and leverage and keeps its parent |
| 6 | The split shown before signing, and the same split after |
| 7, 8 | Value recorded for both authors, read from the indexed graph |
| 9 | The same backing on a public explorer |
| 10 | The same backing from the public Envio endpoint |

## Envio cut, 1:45

Reuses shots 6, 7, 8 and 10. Record these extras in the same session.

| Extra | What to capture |
| --- | --- |
| E1 | The "What the graph holds right now." section of the landing page |
| E2 | `indexer/config.yaml` on GitHub: two contracts, five events |
| E3 | `indexer/schema.graphql` on GitHub: scroll through `ThesisBacking`, `Supporter`, `AuthorEarnings`, `LineageFlow`, then the `backing` field on `Thesis` |
| E4 | `indexer/src/handlers/backing.ts` on GitHub: the `Credited` handler |
| E5 | Terminal: the second query below |
| E6 | Terminal: `pnpm test:indexer` finishing with 26 tests passed |

| # | Time | On screen | Voiceover |
| --- | --- | --- | --- |
| 1 | 0:00 to 0:10 | E1 | Everything FORK shows about ideas comes from one place: an Envio graph built from two contracts on Monad Testnet. |
| 2 | 0:10 to 0:26 | E2 | The registry emits an event every time someone publishes or forks. The backing contract emits Backed, Credited and Withdrawn. Envio indexes all of them, each contract from its own start block. |
| 3 | 0:26 to 0:48 | E3 | The raw events are only the start. From them the handlers build what the product needs: each idea's total and its first ten backers, what every wallet has backed early, what every author has earned and in which role, and the value a fork has sent to each idea before it. |
| 4 | 0:48 to 1:02 | E4 | The two contracts meet here. A backing is filed under the registry its contract reads from, so a single query returns an idea together with what it has received. |
| 5 | 1:02 to 1:22 | End of shot 6, then shots 7 and 8 | Watch it in the product. A backing confirms. The tree shows value arriving at the parent idea, and the original author's profile shows earnings from forks. Different entities, all updated from one transaction. |
| 6 | 1:22 to 1:37 | Shot 10, then E5 | The endpoint is public. This is the fork with its backing and early backers, the flow to its parent, and the totals the landing page shows. |
| 7 | 1:37 to 1:45 | E6 | The handlers have twenty-six tests on Envio's own test indexer. Config, schema and handlers are all in the repository. |

Query for E5:

```sh
curl -s "$ENVIO" -H 'content-type: application/json' -d '{"query":"{ BackingTotals { totalBacked backingCount supporterCount thesesBacked sentToAncestors } AuthorEarnings(order_by: {lastCreditedAt: desc}, limit: 3) { wallet earnedAsAuthor earnedFromForks withdrawn claimable } }"}' | jq
```

## Privy cut, 1:45

Reuses shots 2, 3, 4, 6 and 8. Record these extras in the same session.

| Extra | What to capture |
| --- | --- |
| P1 | Account A's wallet panel, close: address, **Copy**, balance, **Export key**, **Add Google**. Do not go past the first step of the export |
| P2 | Account A chooses **Add Google** and the Privy window opens. Stop there or complete it, either is fine |
| P3 | `apps/web/src/server/auth.ts` on GitHub: the identity and wallet checks |

| # | Time | On screen | Voiceover |
| --- | --- | --- | --- |
| 1 | 0:00 to 0:12 | Start of shot 2: the Privy window with email and Google | FORK has no connect wallet button. You sign in with Google or an email code, and that's the whole onboarding. |
| 2 | 0:12 to 0:32 | End of shot 2, then P1 | Privy creates an embedded wallet for every new user, on Monad Testnet. It's the user's own: here's the address, the balance, and the option to export the key. FORK sends it a one-time welcome drip of testnet MON, so the first action needs no faucet visit. |
| 3 | 0:32 to 0:42 | Shot 3 | Then a handle, tied to that Privy identity on our server. That's the public profile. |
| 4 | 0:42 to 1:06 | The approval moments of shots 4 and 6 | Everything a user authors is a transaction from that wallet. Publishing an idea: Privy asks, the user approves, and the wallet's address becomes the onchain author. Backing an idea: same wallet, same prompt, and value moves to the authors. |
| 5 | 1:06 to 1:18 | Shot 8 | Earnings come back to the same wallet. The author withdraws with one more approval. |
| 6 | 1:18 to 1:32 | P2 | Someone who came in with email can add Google later, or the other way round, and it stays one account. |
| 7 | 1:32 to 1:45 | P3 | On the server, every write is checked against the Privy token and the wallets Privy lists for that user. FORK never holds a user's key. |

## After recording

- Upload to YouTube, Loom or Vimeo. Unlisted is fine if the link opens without an account.
- Put the links in the README, in `portal-copy.json` and in the portal.
- Open thesis pages and profiles from the recording stay on the live graph as team test activity. The landing page already says the graph includes it.
