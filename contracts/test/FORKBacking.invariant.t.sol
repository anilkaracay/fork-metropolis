// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {FORKBacking} from "../src/FORKBacking.sol";
import {FORKRegistry} from "../src/FORKRegistry.sol";

interface Vm {
    function prank(address sender) external;
    function deal(address account, uint256 balance) external;
}

/// @dev The only fuzz target. A fixed actor set publishes, forks, backs and withdraws.
contract BackingHandler {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 private constant ACTORS = 6;

    FORKRegistry private immutable registry;
    FORKBacking private immutable backing;
    uint64 public thesisCount;
    uint256 public totalBacked;
    uint256 public totalWithdrawn;

    constructor(FORKRegistry registry_, FORKBacking backing_) {
        registry = registry_;
        backing = backing_;
    }

    function actor(uint256 seed) public pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode("handler actor", seed % ACTORS)))));
    }

    function publish(uint8 actorSeed, uint8 parentSeed) external {
        uint64 parentId = uint64(parentSeed) % (thesisCount + 1);
        vm.prank(actor(actorSeed));
        registry.createThesis(
            parentId, 32, FORKRegistry.Side.Long, 30_000, 4350e8, 4020e8, keccak256("handler")
        );
        thesisCount++;
    }

    function back(uint8 actorSeed, uint8 thesisSeed, uint96 amountSeed) external {
        if (thesisCount == 0) return;
        uint64 thesisId = uint64(thesisSeed) % thesisCount + 1;
        (address author,,,,,,,,) = registry.theses(thesisId);
        address backer = actor(actorSeed);
        if (backer == author) backer = actor(uint256(actorSeed) + 1);
        uint256 amount = backing.MIN_BACKING() + uint256(amountSeed) % 1_000 ether;
        vm.deal(backer, amount);
        vm.prank(backer);
        backing.back{value: amount}(thesisId);
        totalBacked += amount;
    }

    function withdraw(uint8 actorSeed) external {
        address account = actor(actorSeed);
        uint256 amount = backing.claimable(account);
        if (amount == 0) return;
        uint256 balance = account.balance;
        vm.prank(account);
        backing.withdraw();
        require(account.balance == balance + amount && backing.claimable(account) == 0);
        totalWithdrawn += amount;
    }

    function claimableTotal() external view returns (uint256 total) {
        for (uint256 i; i < ACTORS; i++) {
            total += backing.claimable(actor(i));
        }
    }
}

contract FORKBackingInvariantTest {
    FORKBacking private backing;
    BackingHandler private handler;

    function setUp() public {
        FORKRegistry registry = new FORKRegistry();
        backing = new FORKBacking(address(registry));
        handler = new BackingHandler(registry, backing);
    }

    function targetContracts() public view returns (address[] memory targets) {
        targets = new address[](1);
        targets[0] = address(handler);
    }

    /// forge-config: default.invariant.runs = 128
    /// forge-config: default.invariant.depth = 96
    /// forge-config: default.invariant.fail-on-revert = true
    function invariantBalanceEqualsUnwithdrawnCredits() public view {
        require(address(backing).balance == handler.claimableTotal());
        require(address(backing).balance == handler.totalBacked() - handler.totalWithdrawn());
    }
}
