# Monad performance: what FORK measures and how

FORK shows two kinds of timing. One is measured for each user in their own browser. The other is a recorded run by the team, and it is the only source for timing figures quoted in the README, the product copy and the submission.

## Results

No run has been recorded yet. The benchmark sends real `FORKBacking.back` transactions, so it waits for that contract's deployment on Monad Testnet. When the run is recorded, this section holds its median and 95th percentile and links the raw file under `docs/monad-performance/`.

Until then, no confirmation or indexing time is claimed anywhere in this repository.

## The recorded run

`scripts/measure-backing.mjs` sends backings one by one from a dedicated team test wallet, `0x73b4b1b1b00EAC024e12D36B52A3102A4E9f475B`. Its key is generated locally into an ignored file and is never printed.

```sh
node scripts/measure-backing.mjs plan --thesis <id>
node scripts/measure-backing.mjs run --thesis <id> --count 20 --amount 0.01 --graphql <Envio GraphQL endpoint>
```

`plan` is read-only: it reports whether the wallet holds enough testnet MON for the run and sends nothing. `run` sends each transaction only after the previous one has a receipt.

For every transaction the script records:

| Field | From | To |
| --- | --- | --- |
| `acceptMs` | Just before the signed transaction is sent | The RPC returning its hash |
| `confirmMs` | The hash being returned | The first receipt the script sees, polling every 50 ms |
| `indexMs` | That first receipt | The `Backing` row being readable from the Envio GraphQL endpoint, polling every 200 ms |
| `gasUsed`, `gasLimit`, `effectiveGasPriceWei` | The receipt | |

The summary gives the minimum, median, 95th percentile (nearest rank) and maximum of each. The raw file keeps every sample with its transaction hash and block number, so each figure can be checked against the chain.

## What a user sees

When someone publishes, forks or backs, the product shows how long their own transaction took: the time from the wallet returning the transaction hash to the first receipt the browser sees, polling every 100 ms. The code is in [`apps/web/src/lib/confirmation.ts`](../apps/web/src/lib/confirmation.ts). That value belongs to one transaction in one browser and is never aggregated or reused as a claim.

## Reading the numbers

- These are wall-clock observations from one machine and one RPC endpoint. They include network time and polling intervals.
- They do not measure consensus, finality or throughput.
- Every transaction in a recorded run is team test activity on Monad Testnet. It is not user activity.
- Testnet MON has no price. This document reports time and gas units, never a cost in money.

The decision behind this is D-058 in [`29_DECISIONS.md`](29_DECISIONS.md).
