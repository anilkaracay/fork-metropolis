# Smart Contract Specification

## Contract

`FORKRegistry.sol`

Purpose: canonical public provenance for trading theses and their forks.

The contract is not an exchange, vault, custody layer, oracle, or PnL calculator.

## Network

Primary deployment: Monad Testnet, chain ID 10143.

Mainnet is optional after the submitted testnet build is stable.

## Data types

```solidity
enum Side {
    Long,
    Short
}

struct ThesisCore {
    address author;
    uint64 parentId;
    uint32 marketId;
    Side side;
    uint32 leverageBps;
    uint128 targetPriceE8;
    uint128 invalidationPriceE8;
    uint64 createdAt;
    bytes32 contentHash;
}
```

Notes:

- `leverageBps`: 10000 = 1x, 30000 = 3x.
- prices use 8-decimal fixed-point integers.
- `parentId = 0` means root thesis.
- Thesis IDs start at 1.

## Storage

```solidity
uint64 public nextThesisId = 1;
mapping(uint64 => ThesisCore) public theses;
mapping(uint64 => bytes32) public executionRefs;
```

Do not store child arrays onchain. Envio reconstructs edges from events and parent IDs. This keeps writes predictable and cheap.

## Events

```solidity
event ThesisCreated(
    uint64 indexed thesisId,
    address indexed author,
    uint64 indexed parentId,
    uint32 marketId,
    Side side,
    uint32 leverageBps,
    uint128 targetPriceE8,
    uint128 invalidationPriceE8,
    bytes32 contentHash,
    uint64 createdAt
);

event ExecutionLinked(
    uint64 indexed thesisId,
    address indexed author,
    bytes32 indexed executionRef
);
```

Optional if moderation or deletion semantics are needed onchain: do not add in MVP. Content can be hidden offchain while immutable provenance remains.

## External functions

### `createThesis`

```solidity
function createThesis(
    uint64 parentId,
    uint32 marketId,
    Side side,
    uint32 leverageBps,
    uint128 targetPriceE8,
    uint128 invalidationPriceE8,
    bytes32 contentHash
) external returns (uint64 thesisId);
```

Validation:

- `contentHash != bytes32(0)`
- `marketId != 0`
- `leverageBps >= 10000`
- target and invalidation nonzero
- if parentId != 0, parent must exist
- if parentId != 0, caller may be parent author or any other wallet; public forking is the product
- no side/price business logic onchain because current reference price is not trusted by this contract

Writes ThesisCore and emits ThesisCreated.

### `linkExecution`

```solidity
function linkExecution(uint64 thesisId, bytes32 executionRef) external;
```

Validation:

- thesis exists
- caller is thesis author
- executionRef nonzero
- thesis has no existing executionRef

Writes mapping and emits ExecutionLinked.

The contract does not claim the execution is valid. The FORK application only displays `Verified on Perpl` if the server has independently verified the reference. The chain proves that the thesis author linked the reference.

## Execution reference v1

Authoritative source: [Perpl Fill and BlockTxLogTimestamp](https://github.com/PerplFoundation/api-docs/blob/main/types.md). Fill has `acc`, `mkt`, `oid`, `t`, `l`, `s`, optional `p`; `at` may contain `txid` and log index `l`. It exposes no required globally unique fill ID. `positionId` is not a reference requirement.

Use ordinary Solidity `abi.encode`, never packed concatenation:

```text
fillIdentity = keccak256(abi.encode(
  bytes32 keccak256(UTF8("FORK_PERPL_FILL_V1")),
  uint64 chainId,
  address exchangeAddress,
  uint32 instanceId,
  uint64 accountId,              // Fill.acc
  uint32 marketId,               // Fill.mkt
  uint64 orderId,                // Fill.oid
  bytes32 transactionHash,       // Fill.at.txid
  uint32 logIndex                // Fill.at.l
))

executionRef = keccak256(abi.encode(
  bytes32 keccak256(UTF8("FORK_PERPL_EXECUTION_V1")),
  uint64 chainId,
  address registryAddress,
  uint64 thesisId,
  address walletAddress,
  bytes32 fillIdentity
))
```

Chain/registry/thesis is the graph namespace; chain/exchange/instance/account/transaction/log/order/market identifies the authoritative venue evidence. Normalize addresses through the shared schema. Require nonzero valid addresses/hash and positive IDs; log index zero is valid. Reject unsafe JSON integers, missing txid/log index, missing/nonpositive price/size, and non-opening order types in the P0 fill adapter. No timestamp, position ID or invented ID fallback.

Changing thesis changes executionRef, therefore reference uniqueness alone does NOT prevent evidence reuse. Database uniqueness on fillIdentity across registries/theses prevents duplicate credit. Partial fills have separate identities; P0 binds one independently verified nonzero fill to one thesis, clearly showing its actual size and partial status. Hash collision resistance and stable Perpl transaction/log semantics are assumptions; live verification remains a separate gate. Never infer verification from this helper or from the registry event.

Cross-language test vectors are committed under packages/shared/test/fixtures and exercised by TypeScript and Solidity-equivalent tests.

## Content hash format

Canonical JSON fields in fixed key order:

```json
{
  "version": 1,
  "reasoning": "...",
  "tags": ["breakout"],
  "entryNote": null
}
```

Normalize:

- UTF-8
- trim outer whitespace
- preserve internal whitespace
- tags trim outer whitespace, lowercase, remove duplicates, sort by code-point order, maximum 3 unique; ASCII `[a-z0-9][a-z0-9-]{0,23}`
- omitted or blank entryNote becomes null; never undefined
- reject control characters except TAB/LF/CR; no Unicode normalization; preserve internal text bytes
- cap raw tag input at 32 entries before normalization; max 3 unique tags after normalization
- exact fixed key order: version, reasoning, tags, entryNote

Hash with keccak256 over UTF-8 canonical JSON bytes.

Do not include market parameters in content hash because they already exist onchain.

## Access control

No admin owner is required for core registry writes. This is intentionally permissionless.

No owner/admin, pause mechanism or upgradeability in P0; registry has no asset custody.

## Reentrancy and external calls

The contract performs no external calls. Reentrancy guard is unnecessary.

## Foundry tests

Required:

1. root thesis creates ID 1
2. ID increments
3. fork references valid parent
4. invalid parent reverts
5. zero content hash reverts
6. zero market reverts
7. invalid leverage lower bound reverts
8. event fields match stored fields
9. only author can link execution
10. execution can only be linked once
11. nonexistent thesis link reverts
12. fuzz test parent chains across many users
13. fuzz prices/leverage inside uint bounds
14. gas snapshot for root, fork, linkExecution

## Deployment artifact

Commit:

- deployed address
- chain ID
- deployment tx hash
- compiler version
- git commit SHA
- verified source status
- ABI JSON

These values must also appear in `23_DEPLOYMENT_ENV.md` after deployment.
