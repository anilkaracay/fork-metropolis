// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {FORKBacking} from "../src/FORKBacking.sol";
import {FORKRegistry} from "../src/FORKRegistry.sol";

interface Vm {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }

    function prank(address sender) external;
    function deal(address account, uint256 balance) external;
    function expectRevert(bytes4 selector) external;
    function expectEmit(bool topic1, bool topic2, bool topic3, bool data, address emitter) external;
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
}

/// @dev An author whose receive hook calls back into the backing contract.
contract ReentrantAuthor {
    enum Mode {
        None,
        Withdraw,
        WithdrawCaught,
        Back
    }

    FORKBacking private immutable backing;
    Mode private mode;
    uint64 private backTarget;
    bool public reentryBlocked;

    constructor(FORKBacking backing_) {
        backing = backing_;
    }

    function publish(FORKRegistry registry, uint64 parentId) external returns (uint64) {
        return registry.createThesis(
            parentId, 32, FORKRegistry.Side.Long, 30_000, 4350e8, 4020e8, keccak256("reentrant")
        );
    }

    function withdrawWith(Mode mode_, uint64 backTarget_) external {
        mode = mode_;
        backTarget = backTarget_;
        backing.withdraw();
    }

    receive() external payable {
        Mode current = mode;
        mode = Mode.None;
        if (current == Mode.Withdraw) {
            backing.withdraw();
        } else if (current == Mode.WithdrawCaught) {
            try backing.withdraw() {}
            catch (bytes memory reason) {
                reentryBlocked = bytes4(reason) == FORKBacking.NothingToWithdraw.selector;
            }
        } else if (current == Mode.Back) {
            backing.back{value: msg.value / 2}(backTarget);
        }
    }
}

/// @dev An author that cannot receive MON.
contract RejectingAuthor {
    function publish(FORKRegistry registry) external returns (uint64) {
        return registry.createThesis(
            0, 32, FORKRegistry.Side.Long, 30_000, 4350e8, 4020e8, keccak256("rejecting")
        );
    }

    function claim(FORKBacking backing) external {
        backing.withdraw();
    }
}

contract FORKBackingTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes32 private constant CREDITED_TOPIC =
        keccak256("Credited(address,uint64,uint64,uint8,uint256)");
    bytes32 private constant CONTENT = keccak256("thesis metadata");
    address private constant ALICE = address(uint160(uint256(keccak256("alice"))));
    address private constant BOB = address(uint160(uint256(keccak256("bob"))));
    address private constant CAROL = address(uint160(uint256(keccak256("carol"))));
    address private constant DAVE = address(uint160(uint256(keccak256("dave"))));
    address private constant BACKER = address(uint160(uint256(keccak256("backer"))));
    uint256 private constant AMOUNT = 1 ether;

    FORKRegistry private registry;
    FORKBacking private backing;
    uint256 private min;

    function setUp() public {
        registry = new FORKRegistry();
        backing = new FORKBacking(address(registry));
        min = backing.MIN_BACKING();
    }

    function create(address author, uint64 parent) private returns (uint64) {
        vm.prank(author);
        return
            registry.createThesis(
                parent, 32, FORKRegistry.Side.Long, 30_000, 4350e8, 4020e8, CONTENT
            );
    }

    function backAs(address backer, uint64 thesisId, uint256 amount) private {
        vm.deal(backer, amount);
        vm.prank(backer);
        backing.back{value: amount}(thesisId);
    }

    function numbered(uint256 index) private pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode("numbered backer", index)))));
    }

    function expectBacked(uint64 thesisId, address backer, uint256 amount, uint32 index, bool early)
        private
    {
        vm.expectEmit(true, true, true, true, address(backing));
        emit FORKBacking.Backed(thesisId, backer, amount, index, early);
    }

    function expectCredited(
        address recipient,
        uint64 source,
        uint64 credited,
        uint8 role,
        uint256 amount
    ) private {
        vm.expectEmit(true, true, true, true, address(backing));
        emit FORKBacking.Credited(recipient, source, credited, role, amount);
    }

    /// @dev Decodes the Credited events of one recorded backing.
    function recordedCredits() private returns (FORKBacking.Credit[] memory credits) {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 count;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == CREDITED_TOPIC) count++;
        }
        credits = new FORKBacking.Credit[](count);
        uint256 next;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] != CREDITED_TOPIC) continue;
            require(logs[i].emitter == address(backing));
            (uint8 role, uint256 amount) = abi.decode(logs[i].data, (uint8, uint256));
            credits[next++] = FORKBacking.Credit(
                address(uint160(uint256(logs[i].topics[1]))),
                uint64(uint256(logs[i].topics[3])),
                role,
                amount
            );
        }
    }

    function testConstructorRejectsAddressWithoutCode() public {
        vm.expectRevert(FORKBacking.InvalidRegistry.selector);
        new FORKBacking(address(0));
        vm.expectRevert(FORKBacking.InvalidRegistry.selector);
        new FORKBacking(ALICE);
    }

    function testConstantsDescribeTheSplit() public view {
        require(address(backing.registry()) == address(registry));
        require(min == 0.001 ether && backing.EARLY_BACKER_LIMIT() == 10);
        require(
            backing.AUTHOR_SHARE_BPS() + backing.PARENT_SHARE_BPS()
                    + backing.GRANDPARENT_SHARE_BPS() == 10_000
        );
        require(backing.AUTHOR_SHARE_BPS() == 7_000 && backing.PARENT_SHARE_BPS() == 2_000);
        require(
            backing.ROLE_AUTHOR() == 0 && backing.ROLE_PARENT() == 1
                && backing.ROLE_GRANDPARENT() == 2
        );
    }

    function testBackBelowMinimumReverts() public {
        create(ALICE, 0);
        vm.prank(BACKER);
        vm.expectRevert(FORKBacking.BackingTooSmall.selector);
        backing.back(1);
        vm.deal(BACKER, min);
        vm.prank(BACKER);
        vm.expectRevert(FORKBacking.BackingTooSmall.selector);
        backing.back{value: min - 1}(1);
        require(address(backing).balance == 0 && backing.backerCount(1) == 0);
    }

    function testBackUnknownThesisReverts() public {
        create(ALICE, 0);
        vm.deal(BACKER, 2 * AMOUNT);
        vm.prank(BACKER);
        vm.expectRevert(FORKBacking.ThesisNotFound.selector);
        backing.back{value: AMOUNT}(0);
        vm.prank(BACKER);
        vm.expectRevert(FORKBacking.ThesisNotFound.selector);
        backing.back{value: AMOUNT}(2);
        require(address(backing).balance == 0);
    }

    function testAuthorCannotBackOwnThesis() public {
        create(ALICE, 0);
        vm.deal(ALICE, AMOUNT);
        vm.prank(ALICE);
        vm.expectRevert(FORKBacking.SelfBacking.selector);
        backing.back{value: AMOUNT}(1);
        require(backing.claimable(ALICE) == 0 && backing.backerCount(1) == 0);
    }

    function testMinimumBackingIsAccepted() public {
        create(ALICE, 0);
        backAs(BACKER, 1, min);
        require(backing.claimable(ALICE) == min);
    }

    function testRootBackingCreditsAuthorInFull() public {
        create(ALICE, 0);
        expectBacked(1, BACKER, AMOUNT, 1, true);
        expectCredited(ALICE, 1, 1, 0, AMOUNT);
        vm.recordLogs();
        backAs(BACKER, 1, AMOUNT);
        require(recordedCredits().length == 1);
        require(backing.claimable(ALICE) == AMOUNT && address(backing).balance == AMOUNT);
        require(backing.backerCount(1) == 1 && backing.backerIndex(1, BACKER) == 1);
        require(BACKER.balance == 0);
    }

    function testForkBackingSplitsAuthorAndParent() public {
        create(ALICE, 0);
        create(BOB, 1);
        expectBacked(2, BACKER, AMOUNT, 1, true);
        expectCredited(BOB, 2, 2, 0, 0.8 ether);
        expectCredited(ALICE, 2, 1, 1, 0.2 ether);
        vm.recordLogs();
        backAs(BACKER, 2, AMOUNT);
        require(recordedCredits().length == 2);
        require(backing.claimable(BOB) == 0.8 ether && backing.claimable(ALICE) == 0.2 ether);
    }

    function testThreeLevelBackingSplitsSeventyTwentyTen() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        expectBacked(3, BACKER, AMOUNT, 1, true);
        expectCredited(CAROL, 3, 3, 0, 0.7 ether);
        expectCredited(BOB, 3, 2, 1, 0.2 ether);
        expectCredited(ALICE, 3, 1, 2, 0.1 ether);
        vm.recordLogs();
        backAs(BACKER, 3, AMOUNT);
        require(recordedCredits().length == 3);
        require(backing.claimable(CAROL) == 0.7 ether && backing.claimable(BOB) == 0.2 ether);
        require(backing.claimable(ALICE) == 0.1 ether && address(backing).balance == AMOUNT);
    }

    function testLineageBeyondGrandparentIsNotCredited() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        create(DAVE, 3);
        backAs(BACKER, 4, AMOUNT);
        require(backing.claimable(DAVE) == 0.7 ether && backing.claimable(CAROL) == 0.2 ether);
        require(backing.claimable(BOB) == 0.1 ether && backing.claimable(ALICE) == 0);
    }

    function testAuthorWhoIsAlsoParentIsCreditedOnce() public {
        create(CAROL, 0);
        create(ALICE, 1);
        create(ALICE, 2);
        expectCredited(ALICE, 3, 3, 0, 0.9 ether);
        expectCredited(CAROL, 3, 1, 2, 0.1 ether);
        vm.recordLogs();
        backAs(BACKER, 3, AMOUNT);
        require(recordedCredits().length == 2);
        require(backing.claimable(ALICE) == 0.9 ether && backing.claimable(CAROL) == 0.1 ether);
    }

    function testSelfForkWithoutGrandparentCreditsAuthorInFull() public {
        create(ALICE, 0);
        create(ALICE, 1);
        expectCredited(ALICE, 2, 2, 0, AMOUNT);
        vm.recordLogs();
        backAs(BACKER, 2, AMOUNT);
        require(recordedCredits().length == 1 && backing.claimable(ALICE) == AMOUNT);
    }

    function testAuthorWhoIsAlsoGrandparentIsCreditedOnce() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(ALICE, 2);
        expectCredited(ALICE, 3, 3, 0, 0.8 ether);
        expectCredited(BOB, 3, 2, 1, 0.2 ether);
        vm.recordLogs();
        backAs(BACKER, 3, AMOUNT);
        require(recordedCredits().length == 2);
        require(backing.claimable(ALICE) == 0.8 ether && backing.claimable(BOB) == 0.2 ether);
    }

    function testParentWhoIsAlsoGrandparentIsCreditedOnceAsParent() public {
        create(BOB, 0);
        create(BOB, 1);
        create(ALICE, 2);
        expectCredited(ALICE, 3, 3, 0, 0.7 ether);
        expectCredited(BOB, 3, 2, 1, 0.3 ether);
        vm.recordLogs();
        backAs(BACKER, 3, AMOUNT);
        require(recordedCredits().length == 2);
        require(backing.claimable(ALICE) == 0.7 ether && backing.claimable(BOB) == 0.3 ether);
    }

    function testSingleAuthorLineageCreditsAuthorInFull() public {
        create(ALICE, 0);
        create(ALICE, 1);
        create(ALICE, 2);
        expectCredited(ALICE, 3, 3, 0, AMOUNT);
        vm.recordLogs();
        backAs(BACKER, 3, AMOUNT);
        require(recordedCredits().length == 1 && backing.claimable(ALICE) == AMOUNT);
    }

    function testRoundingDustGoesToAuthor() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        uint256 amount = min + 9;
        backAs(BACKER, 3, amount);
        // 20% and 10% of 1e15 + 9 wei round down by 1.8 and 0.9 wei.
        require(backing.claimable(BOB) == 0.0002 ether + 1);
        require(backing.claimable(ALICE) == 0.0001 ether);
        require(backing.claimable(CAROL) == 0.0007 ether + 8);
        require(address(backing).balance == amount);
    }

    function testFirstTenDistinctBackersAreEarly() public {
        create(ALICE, 0);
        for (uint32 i = 1; i <= 11; i++) {
            expectBacked(1, numbered(i), min, i, i <= 10);
            backAs(numbered(i), 1, min);
            require(backing.backerIndex(1, numbered(i)) == i);
            require(backing.isEarlyBacker(1, numbered(i)) == (i <= 10));
        }
        require(backing.backerCount(1) == 11);
        require(!backing.isEarlyBacker(1, BACKER) && backing.backerIndex(1, BACKER) == 0);
    }

    function testRepeatBackingKeepsIndexAndCounter() public {
        create(ALICE, 0);
        for (uint32 i = 1; i <= 11; i++) {
            backAs(numbered(i), 1, min);
        }
        expectBacked(1, numbered(3), AMOUNT, 3, true);
        backAs(numbered(3), 1, AMOUNT);
        expectBacked(1, numbered(11), AMOUNT, 11, false);
        backAs(numbered(11), 1, AMOUNT);
        require(backing.backerCount(1) == 11 && backing.backerIndex(1, numbered(3)) == 3);
        require(backing.claimable(ALICE) == 11 * min + 2 * AMOUNT);
    }

    function testBackerCountersAreIndependentPerThesis() public {
        create(ALICE, 0);
        create(BOB, 0);
        backAs(BACKER, 1, min);
        backAs(CAROL, 1, min);
        expectBacked(2, CAROL, min, 1, true);
        backAs(CAROL, 2, min);
        require(backing.backerCount(1) == 2 && backing.backerCount(2) == 1);
        require(backing.backerIndex(1, CAROL) == 2 && backing.backerIndex(2, CAROL) == 1);
    }

    function testAncestorMayBackDescendant() public {
        create(ALICE, 0);
        create(BOB, 1);
        backAs(ALICE, 2, AMOUNT);
        require(backing.claimable(BOB) == 0.8 ether && backing.claimable(ALICE) == 0.2 ether);
        require(backing.isEarlyBacker(2, ALICE));
    }

    function testWithdrawWithNothingReverts() public {
        vm.prank(ALICE);
        vm.expectRevert(FORKBacking.NothingToWithdraw.selector);
        backing.withdraw();
    }

    function testWithdrawPaysFullBalanceOnce() public {
        create(ALICE, 0);
        create(BOB, 1);
        backAs(BACKER, 2, AMOUNT);
        vm.expectEmit(true, true, true, true, address(backing));
        emit FORKBacking.Withdrawn(BOB, 0.8 ether);
        vm.prank(BOB);
        backing.withdraw();
        require(BOB.balance == 0.8 ether && backing.claimable(BOB) == 0);
        require(address(backing).balance == 0.2 ether && backing.claimable(ALICE) == 0.2 ether);
        vm.prank(BOB);
        vm.expectRevert(FORKBacking.NothingToWithdraw.selector);
        backing.withdraw();
    }

    function testCreditsAccumulateAcrossBackingsAndRoles() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        backAs(BACKER, 1, AMOUNT);
        backAs(BACKER, 2, AMOUNT);
        backAs(DAVE, 3, AMOUNT);
        require(backing.claimable(ALICE) == 1.3 ether);
        vm.prank(ALICE);
        backing.withdraw();
        require(ALICE.balance == 1.3 ether && address(backing).balance == 1.7 ether);
        require(backing.claimable(BOB) == 1 ether && backing.claimable(CAROL) == 0.7 ether);
    }

    function testWithdrawToRejectingContractRevertsAndKeepsCredit() public {
        RejectingAuthor rejecting = new RejectingAuthor();
        uint64 thesisId = rejecting.publish(registry);
        backAs(BACKER, thesisId, AMOUNT);
        vm.expectRevert(FORKBacking.WithdrawFailed.selector);
        rejecting.claim(backing);
        require(backing.claimable(address(rejecting)) == AMOUNT);
        require(address(backing).balance == AMOUNT);
    }

    function testReentrantWithdrawCannotDrain() public {
        ReentrantAuthor attacker = new ReentrantAuthor(backing);
        create(ALICE, 0);
        uint64 thesisId = attacker.publish(registry, 1);
        backAs(BACKER, thesisId, AMOUNT);
        // Other authors' credits are in the contract, so a second payout would be solvent.
        backAs(BACKER, 1, 2 * AMOUNT);
        // The nested withdraw finds a zero balance, so the transfer and the outer call both fail.
        vm.expectRevert(FORKBacking.WithdrawFailed.selector);
        attacker.withdrawWith(ReentrantAuthor.Mode.Withdraw, 0);
        require(address(attacker).balance == 0 && address(backing).balance == 3 * AMOUNT);
        require(backing.claimable(address(attacker)) == 0.8 ether);
        require(backing.claimable(ALICE) == 2.2 ether);
    }

    function testCaughtReentrantWithdrawReceivesOnlyOwnCredit() public {
        ReentrantAuthor attacker = new ReentrantAuthor(backing);
        create(ALICE, 0);
        uint64 thesisId = attacker.publish(registry, 1);
        backAs(BACKER, thesisId, AMOUNT);
        attacker.withdrawWith(ReentrantAuthor.Mode.WithdrawCaught, 0);
        require(attacker.reentryBlocked());
        require(address(attacker).balance == 0.8 ether && address(backing).balance == 0.2 ether);
        require(backing.claimable(address(attacker)) == 0 && backing.claimable(ALICE) == 0.2 ether);
        vm.prank(ALICE);
        backing.withdraw();
        require(ALICE.balance == 0.2 ether && address(backing).balance == 0);
    }

    function testBackingDuringWithdrawKeepsAccounting() public {
        ReentrantAuthor attacker = new ReentrantAuthor(backing);
        create(ALICE, 0);
        uint64 thesisId = attacker.publish(registry, 0);
        backAs(BACKER, thesisId, AMOUNT);
        attacker.withdrawWith(ReentrantAuthor.Mode.Back, 1);
        require(address(attacker).balance == 0.5 ether && address(backing).balance == 0.5 ether);
        require(backing.claimable(address(attacker)) == 0 && backing.claimable(ALICE) == 0.5 ether);
        require(backing.backerIndex(1, address(attacker)) == 1);
    }

    function testPlainTransferIsRejected() public {
        vm.deal(address(this), AMOUNT);
        (bool sent,) = address(backing).call{value: AMOUNT}("");
        require(!sent && address(backing).balance == 0);
    }

    function testForcedBalanceDoesNotChangeClaims() public {
        create(ALICE, 0);
        backAs(BACKER, 1, AMOUNT);
        vm.deal(address(backing), AMOUNT + 5 ether);
        require(backing.claimable(ALICE) == AMOUNT);
        vm.prank(ALICE);
        backing.withdraw();
        require(ALICE.balance == AMOUNT && address(backing).balance == 5 ether);
    }

    function testPreviewSplitMatchesRecordedCredits() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        FORKBacking.Credit[] memory preview = backing.previewSplit(3, AMOUNT + 7);
        vm.recordLogs();
        backAs(BACKER, 3, AMOUNT + 7);
        FORKBacking.Credit[] memory recorded = recordedCredits();
        require(preview.length == 3 && recorded.length == 3);
        for (uint256 i; i < 3; i++) {
            require(keccak256(abi.encode(preview[i])) == keccak256(abi.encode(recorded[i])));
        }
        require(preview[0].recipient == CAROL && preview[0].creditedThesisId == 3);
        require(preview[2].recipient == ALICE && preview[2].role == 2);
    }

    function testPreviewSplitRevertsLikeBack() public {
        create(ALICE, 0);
        vm.expectRevert(FORKBacking.BackingTooSmall.selector);
        backing.previewSplit(1, min - 1);
        vm.expectRevert(FORKBacking.ThesisNotFound.selector);
        backing.previewSplit(2, AMOUNT);
    }

    function testFuzzSplitConservation(uint96 amountSeed, uint8 depthSeed, uint16 authorSeed)
        public
    {
        uint256 amount = min + uint256(amountSeed) % 1_000_000 ether;
        uint256 depth = uint256(depthSeed) % 5 + 1;
        address[4] memory pool = [ALICE, BOB, CAROL, DAVE];
        uint64 thesisId;
        for (uint256 i; i < depth; i++) {
            thesisId = create(pool[(authorSeed >> (2 * i)) % 4], thesisId);
        }
        vm.recordLogs();
        backAs(BACKER, thesisId, amount);
        FORKBacking.Credit[] memory credits = recordedCredits();

        uint256 credited;
        for (uint256 i; i < credits.length; i++) {
            require(credits[i].amount != 0);
            for (uint256 j; j < i; j++) {
                require(credits[j].recipient != credits[i].recipient);
                require(credits[j].role < credits[i].role);
            }
            credited += credits[i].amount;
        }
        uint256 claimableTotal;
        for (uint256 i; i < 4; i++) {
            claimableTotal += backing.claimable(pool[i]);
        }
        require(credits.length >= 1 && credits.length <= 3 && credits[0].role == 0);
        require(credited == amount && claimableTotal == amount);
        require(address(backing).balance == amount);
    }

    function testFuzzMergedRolesMatchUnmergedShares(
        uint96 amountSeed,
        uint8 authorSeed,
        uint8 parentSeed,
        uint8 grandparentSeed
    ) public {
        uint256 amount = min + uint256(amountSeed) % 1_000_000 ether;
        address[3] memory pool = [ALICE, BOB, CAROL];
        address author = pool[authorSeed % 3];
        address parent = pool[parentSeed % 3];
        address grandparent = pool[grandparentSeed % 3];
        create(grandparent, 0);
        create(parent, 1);
        create(author, 2);

        uint256 parentShare = amount * 2 / 10;
        uint256 grandparentShare = amount / 10;
        uint256[3] memory expected;
        for (uint256 i; i < 3; i++) {
            if (pool[i] == author) expected[i] += amount - parentShare - grandparentShare;
            if (pool[i] == parent) expected[i] += parentShare;
            if (pool[i] == grandparent) expected[i] += grandparentShare;
        }

        vm.recordLogs();
        backAs(BACKER, 3, amount);
        FORKBacking.Credit[] memory credits = recordedCredits();
        uint256 distinct = 1;
        if (parent != author) distinct++;
        if (grandparent != author && grandparent != parent) distinct++;
        require(credits.length == distinct);
        for (uint256 i; i < 3; i++) {
            require(backing.claimable(pool[i]) == expected[i]);
        }
        // A merged credit keeps the role and thesis nearest to the backed thesis.
        for (uint256 i; i < credits.length; i++) {
            (address creditedAuthor,,,,,,,,) = registry.theses(credits[i].creditedThesisId);
            require(creditedAuthor == credits[i].recipient);
            require(credits[i].creditedThesisId == 3 - credits[i].role);
            if (credits[i].recipient == author) require(credits[i].role == 0);
            else if (credits[i].recipient == parent) require(credits[i].role == 1);
        }
    }

    function testFuzzEarlyFlagFollowsArrivalOrder(uint8 backersSeed) public {
        create(ALICE, 0);
        uint32 backers = uint32(backersSeed) % 40 + 1;
        for (uint32 i = 1; i <= backers; i++) {
            expectBacked(1, numbered(i), min, i, i <= 10);
            backAs(numbered(i), 1, min);
        }
        require(backing.backerCount(1) == backers);
        require(backing.isEarlyBacker(1, numbered(backers)) == (backers <= 10));
    }

    function testFuzzWithdrawalsEmptyTheContract(uint96 first, uint96 second) public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        uint256 total = 2 * min + uint256(first) % 1_000 ether + uint256(second) % 1_000 ether;
        backAs(BACKER, 3, min + uint256(first) % 1_000 ether);
        backAs(DAVE, 2, min + uint256(second) % 1_000 ether);
        address[3] memory authors = [ALICE, BOB, CAROL];
        uint256 paid;
        for (uint256 i; i < 3; i++) {
            vm.prank(authors[i]);
            backing.withdraw();
            paid += authors[i].balance;
        }
        require(paid == total && address(backing).balance == 0);
    }

    function testGasBackRoot() public {
        create(ALICE, 0);
        backAs(BACKER, 1, AMOUNT);
    }

    function testGasBackFork() public {
        create(ALICE, 0);
        create(BOB, 1);
        backAs(BACKER, 2, AMOUNT);
    }

    function testGasBackThreeLevels() public {
        create(ALICE, 0);
        create(BOB, 1);
        create(CAROL, 2);
        backAs(BACKER, 3, AMOUNT);
    }

    function testGasWithdraw() public {
        create(ALICE, 0);
        backAs(BACKER, 1, AMOUNT);
        vm.prank(ALICE);
        backing.withdraw();
    }
}
