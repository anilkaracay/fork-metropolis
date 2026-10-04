// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {FORKRegistry} from "../src/FORKRegistry.sol";

interface Vm {
    function prank(address sender) external;
    function expectRevert(bytes4 selector) external;
    function expectRevert() external;
    function expectEmit(bool topic1, bool topic2, bool topic3, bool data, address emitter) external;
    function warp(uint256 timestamp) external;
}

interface RawRegistry {
    function createThesis(uint64, uint32, uint8, uint32, uint128, uint128, bytes32)
        external
        returns (uint64);
}

contract FORKRegistryTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    FORKRegistry private registry;
    address private constant ALICE = address(0xA11CE);
    address private constant BOB = address(0xB0B);
    bytes32 private constant CONTENT = keccak256("thesis metadata");

    event ThesisCreated(
        uint64 indexed thesisId,
        address indexed author,
        uint64 indexed parentId,
        uint32 marketId,
        FORKRegistry.Side side,
        uint32 leverageBps,
        uint128 targetPriceE8,
        uint128 invalidationPriceE8,
        bytes32 contentHash,
        uint64 createdAt
    );
    event ExecutionLinked(
        uint64 indexed thesisId, address indexed author, bytes32 indexed executionRef
    );

    function setUp() public {
        registry = new FORKRegistry();
        vm.warp(1_790_000_000);
    }

    function create(address author, uint64 parent) private returns (uint64) {
        vm.prank(author);
        return
            registry.createThesis(
                parent, 32, FORKRegistry.Side.Long, 30_000, 4350e8, 4020e8, CONTENT
            );
    }

    function testRootStartsAtOneAndIdsIncrease() public {
        require(create(ALICE, 0) == 1);
        require(create(BOB, 0) == 2);
        require(registry.nextThesisId() == 3);
    }

    function testForkStoresParentAndActualAuthor() public {
        uint64 root = create(ALICE, 0);
        uint64 child = create(BOB, root);
        (address author, uint64 parent,,,,,,,) = registry.theses(child);
        require(author == BOB && parent == root);
    }

    function testSelfForkIsPermissionless() public {
        uint64 root = create(ALICE, 0);
        require(create(ALICE, root) == 2);
    }

    function testNonexistentParentRevertsWithoutAllocatingId() public {
        vm.expectRevert(FORKRegistry.ThesisNotFound.selector);
        create(ALICE, 1);
        require(registry.nextThesisId() == 1);
    }

    function testZeroContentHashReverts() public {
        vm.expectRevert(FORKRegistry.EmptyContentHash.selector);
        registry.createThesis(0, 32, FORKRegistry.Side.Long, 10_000, 1, 1, bytes32(0));
    }

    function testZeroMarketReverts() public {
        vm.expectRevert(FORKRegistry.InvalidMarket.selector);
        registry.createThesis(0, 0, FORKRegistry.Side.Long, 10_000, 1, 1, CONTENT);
    }

    function testLowLeverageReverts() public {
        vm.expectRevert(FORKRegistry.InvalidLeverage.selector);
        registry.createThesis(0, 1, FORKRegistry.Side.Long, 9_999, 1, 1, CONTENT);
    }

    function testZeroTargetReverts() public {
        vm.expectRevert(FORKRegistry.InvalidPrice.selector);
        registry.createThesis(0, 1, FORKRegistry.Side.Long, 10_000, 0, 1, CONTENT);
    }

    function testZeroInvalidationReverts() public {
        vm.expectRevert(FORKRegistry.InvalidPrice.selector);
        registry.createThesis(0, 1, FORKRegistry.Side.Long, 10_000, 1, 0, CONTENT);
    }

    function testEnumOutsideRangeReverts() public {
        vm.expectRevert();
        RawRegistry(address(registry)).createThesis(0, 1, 2, 10_000, 1, 1, CONTENT);
    }

    function testCreationEventMatchesStorage() public {
        vm.expectEmit(true, true, true, true, address(registry));
        emit ThesisCreated(
            1, ALICE, 0, 32, FORKRegistry.Side.Long, 30_000, 4350e8, 4020e8, CONTENT, 1_790_000_000
        );
        create(ALICE, 0);
        (
            address author,
            uint64 parent,
            uint32 market,
            FORKRegistry.Side side,
            uint32 leverage,
            uint128 target,
            uint128 invalidation,
            uint64 time,
            bytes32 content
        ) = registry.theses(1);
        require(author == ALICE && parent == 0 && market == 32);
        require(side == FORKRegistry.Side.Long && leverage == 30_000);
        require(target == 4350e8 && invalidation == 4020e8);
        require(time == 1_790_000_000 && content == CONTENT);
    }

    function testOnlyAuthorCanLink() public {
        create(ALICE, 0);
        vm.prank(BOB);
        vm.expectRevert(FORKRegistry.NotThesisAuthor.selector);
        registry.linkExecution(1, CONTENT);
        require(registry.executionRefs(1) == bytes32(0));
    }

    function testLinkEventAndStoredReference() public {
        create(ALICE, 0);
        vm.expectEmit(true, true, true, true, address(registry));
        emit ExecutionLinked(1, ALICE, CONTENT);
        vm.prank(ALICE);
        registry.linkExecution(1, CONTENT);
        require(registry.executionRefs(1) == CONTENT);
    }

    function testLinkCannotBeRepeatedOrReplaced() public {
        create(ALICE, 0);
        vm.prank(ALICE);
        registry.linkExecution(1, CONTENT);
        vm.prank(ALICE);
        vm.expectRevert(FORKRegistry.ExecutionAlreadyLinked.selector);
        registry.linkExecution(1, CONTENT);
        vm.prank(ALICE);
        vm.expectRevert(FORKRegistry.ExecutionAlreadyLinked.selector);
        registry.linkExecution(1, keccak256("replacement"));
        require(registry.executionRefs(1) == CONTENT);
    }

    function testLinkRequiresExistingThesis() public {
        vm.expectRevert(FORKRegistry.ThesisNotFound.selector);
        registry.linkExecution(1, CONTENT);
    }

    function testLinkRequiresNonzeroReference() public {
        create(ALICE, 0);
        vm.prank(ALICE);
        vm.expectRevert(FORKRegistry.EmptyExecutionRef.selector);
        registry.linkExecution(1, bytes32(0));
    }

    function testMinimumAndMaximumNumericValues() public {
        registry.createThesis(0, 1, FORKRegistry.Side.Long, 10_000, 1, 1, CONTENT);
        uint64 id = registry.createThesis(
            1,
            type(uint32).max,
            FORKRegistry.Side.Short,
            type(uint32).max,
            type(uint128).max,
            type(uint128).max,
            CONTENT
        );
        (
            ,
            uint64 parent,
            uint32 market,
            FORKRegistry.Side side,
            uint32 leverage,
            uint128 target,
            uint128 invalidation,,
        ) = registry.theses(id);
        require(parent == 1 && market == type(uint32).max && side == FORKRegistry.Side.Short);
        require(
            leverage == type(uint32).max && target == type(uint128).max
                && invalidation == type(uint128).max
        );
    }

    function testTimestampUint64BoundaryIsChecked() public {
        vm.warp(type(uint64).max);
        create(ALICE, 0);
        (,,,,,,, uint64 createdAt,) = registry.theses(1);
        require(createdAt == type(uint64).max);
        vm.warp(uint256(type(uint64).max) + 1);
        vm.expectRevert();
        create(ALICE, 0);
        require(registry.nextThesisId() == 2);
    }

    function testFuzzParentChains(uint8 requestedDepth, uint160 authorSeed) public {
        uint256 depth = uint256(requestedDepth) % 32 + 1;
        uint64 parent;
        for (uint256 i; i < depth; i++) {
            address author =
                address(uint160(uint256(authorSeed) % (type(uint160).max - 33) + i + 1));
            uint64 child = create(author, parent);
            (address stored, uint64 storedParent,,,,,,,) = registry.theses(child);
            require(stored == author && storedParent == parent && child == i + 1);
            parent = child;
        }
    }

    function testFuzzPriceAndLeverageBounds(uint128 target, uint128 invalidation, uint32 leverage)
        public
    {
        target = target == 0 ? 1 : target;
        invalidation = invalidation == 0 ? 1 : invalidation;
        leverage = leverage < 10_000 ? 10_000 : leverage;
        uint64 id = registry.createThesis(
            0, 1, FORKRegistry.Side.Short, leverage, target, invalidation, CONTENT
        );
        (,,,, uint32 storedLeverage, uint128 storedTarget, uint128 storedInvalidation,,) =
            registry.theses(id);
        require(
            storedLeverage == leverage && storedTarget == target
                && storedInvalidation == invalidation
        );
    }

    function testFuzzUnauthorizedLink(address stranger, bytes32 claimedRef) public {
        if (stranger == ALICE || stranger == address(0)) return;
        create(ALICE, 0);
        vm.prank(stranger);
        vm.expectRevert(FORKRegistry.NotThesisAuthor.selector);
        registry.linkExecution(1, claimedRef);
    }

    function testGasRoot() public {
        create(ALICE, 0);
    }

    function testGasFork() public {
        uint64 root = create(ALICE, 0);
        create(BOB, root);
    }

    function testGasLinkExecution() public {
        create(ALICE, 0);
        vm.prank(ALICE);
        registry.linkExecution(1, CONTENT);
    }
}
