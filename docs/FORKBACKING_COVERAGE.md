# FORKBacking: tests, coverage and gas

Recorded on 2026-10-12 with pinned Foundry 1.8.4 and solc 0.8.37 (Prague, optimizer 200, Monad network mode), from the working tree that introduces `contracts/src/FORKBacking.sol`. Everything below is reproducible with the commands shown. The contract is not deployed at the time of this record.

## Reproduce

```sh
pnpm tools:install
pnpm test:contracts            # all Foundry tests
pnpm test:contracts:coverage   # source coverage summary
pnpm contracts:snapshot        # refresh contracts/.gas-snapshot
```

## Result

68 Foundry tests pass across four suites: 24 registry, 4 execution reference, 39 backing and 1 backing invariant.

| File | Lines | Statements | Branches | Functions |
| --- | --- | --- | --- | --- |
| `src/FORKBacking.sol` | 100% (52/52) | 100% (71/71) | 100% (13/13) | 100% (7/7) |
| `src/FORKRegistry.sol` | 100% (18/18) | 100% (30/30) | 100% (9/9) | 100% (2/2) |

Coverage is measured by `forge coverage`, which compiles without the optimizer. Test helper contracts are excluded from the table.

## What the backing tests cover

`contracts/test/FORKBacking.t.sol`, 39 tests:

- Constructor: an address without code is rejected.
- Every revert: below the minimum, unknown thesis, self backing, nothing to withdraw, failed send.
- Split by lineage depth: root 100%, fork 80/20, fork of a fork 70/20/10, and no credit beyond the grandparent.
- Merging: author who also wrote the parent, author who also wrote the grandparent, parent who also wrote the grandparent, and a single author across all three levels. Each case checks the exact events and that no address is credited twice.
- Rounding: dust goes to the thesis author and the credits sum to the amount.
- Early supporters: the first ten distinct backers are early, the eleventh is not, repeat backings keep their position, counters are independent per thesis.
- Withdrawals: full balance once, credits accumulating across backings and roles, a recipient contract that rejects MON.
- Reentrancy on `withdraw`: an uncaught nested withdraw reverts the whole call while other authors' credits are in the contract; a caught nested withdraw receives only its own credit; backing from inside the receive hook keeps the accounting exact.
- Plain transfers are rejected and MON forced into the contract does not change any claim.
- `previewSplit` returns exactly the credits that `back` records.
- Four fuzz tests, 256 runs each: split conservation over random lineages and amounts, merged credits equal to the unmerged shares per address, early flag by arrival order, and withdrawals emptying the contract.
- Four gas tests feeding `contracts/.gas-snapshot`.

`contracts/test/FORKBacking.invariant.t.sol`, 1 stateful invariant:

- A handler with six actors publishes, forks, backs and withdraws in random order. After every call the contract balance must equal the sum of unwithdrawn credits and also equal total backed minus total withdrawn.
- 128 runs at depth 96: 12,288 handler calls, 0 reverts, with `fail-on-revert` enabled.

## Mutation check

To confirm the suite fails when the contract is wrong, 14 single-line faults were applied one at a time to a scratch copy of the contract and the full suite was run against each. Every fault made at least one test fail.

| Fault | Failing tests |
| --- | --- |
| Balance not cleared before the send | 4 |
| Parent share not deducted from the author | 14 |
| Grandparent share not deducted from the author | 9 |
| Self-fork parent credited separately | 5 |
| Author as grandparent credited separately | 4 |
| Parent as grandparent credited separately | 3 |
| Parent share set to 20.01% | 13 |
| Early limit off by one | 2 |
| Repeat backer counted again | 1 |
| Self backing allowed | 1 |
| Minimum not enforced | 2 |
| Credit not stored | 24 |
| Unknown thesis accepted | 2 |
| Registry code check removed | 1 |

This was a manual pass, not an automated mutation testing tool, and it does not claim to be exhaustive.

## Gas

From `forge test --gas-report` over the backing suite, in Foundry's Monad network mode. These are execution gas figures from tests, not fees observed on chain.

| Call | Min | Median | Max |
| --- | --- | --- | --- |
| `back` | 22,102 | 99,127 | 217,319 |
| `withdraw` | 29,457 | 40,747 | 40,747 |
| `previewSplit` | 924 | 21,536 | 45,947 |

The minimum of `back` and `withdraw` is a revert path. The maximum of `back` is a first backing of a three-level lineage with three distinct authors. The read-only deployment preflight against Monad Testnet estimated 846,280 gas for creating the contract.

Whole-test gas, including the thesis setup inside each test, is tracked in `contracts/.gas-snapshot`.

## Not covered

- No external audit.
- No formal verification.
- Behaviour on Monad Testnet itself is proven only after deployment, by the proof recorded in `contracts/deployments/10143.backing.json`.
