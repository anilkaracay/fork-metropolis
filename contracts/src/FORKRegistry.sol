// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

/// @notice Immutable social provenance. An execution link is an author claim, not trade proof.
contract FORKRegistry {
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

    error EmptyContentHash();
    error InvalidMarket();
    error InvalidLeverage();
    error InvalidPrice();
    error ThesisNotFound();
    error NotThesisAuthor();
    error EmptyExecutionRef();
    error ExecutionAlreadyLinked();

    uint64 public nextThesisId = 1;
    mapping(uint64 => ThesisCore) public theses;
    mapping(uint64 => bytes32) public executionRefs;

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
        uint64 indexed thesisId, address indexed author, bytes32 indexed executionRef
    );

    function createThesis(
        uint64 parentId,
        uint32 marketId,
        Side side,
        uint32 leverageBps,
        uint128 targetPriceE8,
        uint128 invalidationPriceE8,
        bytes32 contentHash
    ) external returns (uint64 thesisId) {
        if (contentHash == bytes32(0)) revert EmptyContentHash();
        if (marketId == 0) revert InvalidMarket();
        if (leverageBps < 10_000) revert InvalidLeverage();
        if (targetPriceE8 == 0 || invalidationPriceE8 == 0) revert InvalidPrice();
        if (parentId != 0 && theses[parentId].author == address(0)) revert ThesisNotFound();

        thesisId = nextThesisId++;
        // ABI decoding checks the uint64 bound instead of silently truncating a cast.
        uint64 createdAt = abi.decode(abi.encode(block.timestamp), (uint64));
        theses[thesisId] = ThesisCore({
            author: msg.sender,
            parentId: parentId,
            marketId: marketId,
            side: side,
            leverageBps: leverageBps,
            targetPriceE8: targetPriceE8,
            invalidationPriceE8: invalidationPriceE8,
            createdAt: createdAt,
            contentHash: contentHash
        });
        emit ThesisCreated(
            thesisId,
            msg.sender,
            parentId,
            marketId,
            side,
            leverageBps,
            targetPriceE8,
            invalidationPriceE8,
            contentHash,
            createdAt
        );
    }

    function linkExecution(uint64 thesisId, bytes32 executionRef) external {
        address author = theses[thesisId].author;
        if (author == address(0)) revert ThesisNotFound();
        if (msg.sender != author) revert NotThesisAuthor();
        if (executionRef == bytes32(0)) revert EmptyExecutionRef();
        if (executionRefs[thesisId] != bytes32(0)) revert ExecutionAlreadyLinked();
        executionRefs[thesisId] = executionRef;
        emit ExecutionLinked(thesisId, author, executionRef);
    }
}
