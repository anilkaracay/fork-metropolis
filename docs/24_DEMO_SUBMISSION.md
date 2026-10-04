# Demo and Submission Plan

## Submission story

Problem:

Trading ideas spread through X, Telegram, and Discord, but attribution, improvements, and real execution become disconnected.

Product:

FORK makes each trading thesis a public, forkable social object. Anyone can improve a thesis, execute their version, and keep the entire idea lineage attributable.

Why Monad:

Fast, low-latency onchain writes make a public social provenance graph practical while Perpl provides execution on the same ecosystem.

Why Track 03:

The core value is collaborative social creation and reputation. Trading is the proof/economic activity attached to the social object.

## Technical demo - maximum 3 minutes

Target 2:30-2:45 to leave buffer.

### 0:00-0:15 - concept

Show Feed and say:

`FORK is the social network where trading ideas evolve in public. Think GitHub for trading ideas.`

### 0:15-0:45 - publish root

- open composer
- show ETH long thesis with reasoning
- publish through Privy
- show Monad transaction confirmation
- thesis appears

Narration:

`The idea itself is anchored on Monad, including the author, risk parameters, parent relationship, and content hash.`

### 0:45-1:15 - fork from second user

- switch prepared second account/session
- open root
- click Fork
- change target and leverage
- publish
- show diff from parent

### 1:15-1:35 - Idea Tree

- open tree
- show root -> fork
- open node diff

Narration:

`Envio indexes the lineage and powers the tree, fork counts, and contributor stats.`

### 1:35-2:10 - real execution

Use already-prepared Perpl-enabled fork account to avoid spending demo time on first-time account setup.

- click Execute
- show order summary
- submit real Perpl Testnet order
- show fill
- show verified execution badge

Narration:

`The social idea becomes real activity, but the user trades their own version rather than blindly copying a person.`

### 2:10-2:30 - reputation and Nansen

- open profile
- show transparent graph Originality/Contribution percentages, raw Influence/Executions Inspired
- show permitted external Nansen PnL context or its discovery effect; no labels or profit-based FORK score

### 2:30-2:45 - close

`FORK turns trading from follow-and-copy into create, improve, and prove.`

## Pitch video - maximum 2 minutes

Structure:

### 0:00-0:25 problem

Use one concrete story: a good thesis is posted in a group, copied, modified, and later nobody knows who originated or improved it.

### 0:25-0:55 product

Explain Thesis, Fork, Idea Tree.

### 0:55-1:20 why Monad

Explain public high-frequency social provenance plus Perpl execution.

### 1:20-1:40 market/community

Target crypto trading communities already coordinating in X/Telegram/Discord.

### 1:40-2:00 proof/path forward

Show real tester metrics and next step: creator attribution/reward and community-specific feeds.

## Sponsor evidence in demo/submission

### Privy

State clearly:

- auth
- embedded wallet
- contract tx signing
- Perpl enrollment signing

### Envio

Show tree and profile stats while mentioning they are derived from indexed onchain events.

### Nansen

Show context integrated into Smart Signal/profile, not a raw API screen.

### Perpl

Show real execution. Only submit to Perpl sponsor bounty if separate automation requirement is truly met.

## Project page checklist

- logo/graphic under platform size limit
- concise one-liner
- problem
- solution
- why Monad
- live link
- public GitHub
- access instructions
- technical demo link
- pitch video link
- team details
- primary track = 03
- only eligible/actually-satisfied bounties selected

## README proof section

Final public README should include:

- architecture diagram
- deployed contract address
- Envio indexer link/query description
- Perpl integration details
- Privy integration details
- Nansen integration details
- local setup
- test commands
- known limitations
- hackathon-period work provenance if any prior code existed

## Recording rules

- never use mocked core state in the demo
- keep backup thesis IDs and accounts ready
- do not expose secrets in browser devtools
- close unrelated tabs/notifications
- use real app URL
- show explorer only briefly if useful
