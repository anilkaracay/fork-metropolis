# Product Brief

## Name

FORK

## One-liner

FORK is the social network where trading ideas evolve in public.

## Mental model

GitHub for trading ideas.

A trader publishes a thesis. Other traders can discuss it, fork it, alter target, invalidation, leverage or direction, then execute their own version. Every branch keeps attribution to the idea it came from.

## User problem

Trading communities live in X, Telegram, Discord, private chats, and exchange interfaces that are disconnected from one another.

This creates five problems:

1. Attribution disappears. It is hard to prove who had an idea first.
2. Improvement disappears. A useful modification is detached from the idea it improved.
3. Execution is unverifiable. A posted call does not prove that the author traded it.
4. Reputation collapses to followers, screenshots, or raw PnL.
5. Valuable social participation is not captured by the people who created it.

## Product insight

The shared social object should not be a trader account. It should be the trading idea itself.

The unit of the network is a Thesis. A Thesis can be forked. A fork creates a permanent parent-child relationship. Independently verified execution provides evidence of real activity. P0 reputation measures external participation in the graph, without realized-PnL scoring.

## Target user

Primary:

- crypto-native traders who already share theses in X, Telegram, Discord, or small trading groups
- traders who want public proof of idea quality without surrendering control to auto-copy systems
- curators who are good at finding or improving ideas even if they are not the original author

Secondary:

- trading creators and community leads
- small research groups
- protocol communities that want transparent idea attribution

## Core loop

1. See a thesis in Feed.
2. Read reasoning and current branch activity.
3. React, comment, challenge, or fork.
4. Change at least one parameter in the fork.
5. Optionally execute the fork on Perpl.
6. Verified execution updates branch status.
7. External forks build transparent graph reputation; verified downstream executions are counted separately.

## Why now

Monad makes high-frequency social state practical with fast finality and low-latency execution. Perpl provides a real onchain trading venue. Envio makes the branch graph queryable. Privy removes wallet friction. Nansen adds wallet context to discovery.

## Success for the hackathon

The product is successful if a judge can understand the concept within 20 seconds and complete a real root-thesis -> fork -> Perpl-execution -> Idea-Tree flow within three minutes.

## Product thesis for Track 03

FORK is a social product because its core value is collaborative idea creation, public attribution, and community reputation. Trading is the proof mechanism and economic activity attached to the social object.
