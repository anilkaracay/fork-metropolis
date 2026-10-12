// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

interface IFORKRegistry {
    function theses(uint64 thesisId)
        external
        view
        returns (
            address author,
            uint64 parentId,
            uint32 marketId,
            uint8 side,
            uint32 leverageBps,
            uint128 targetPriceE8,
            uint128 invalidationPriceE8,
            uint64 createdAt,
            bytes32 contentHash
        );
}

/// @notice Native MON backing for a thesis, split along its lineage. No owner, fee or upgrade path.
contract FORKBacking {
    struct Credit {
        address recipient;
        uint64 creditedThesisId;
        uint8 role;
        uint256 amount;
    }

    error InvalidRegistry();
    error BackingTooSmall();
    error ThesisNotFound();
    error SelfBacking();
    error NothingToWithdraw();
    error WithdrawFailed();

    uint256 public constant MIN_BACKING = 0.01 ether;
    uint32 public constant EARLY_BACKER_LIMIT = 10;
    uint256 public constant AUTHOR_SHARE_BPS = 7_000;
    uint256 public constant PARENT_SHARE_BPS = 2_000;
    uint256 public constant GRANDPARENT_SHARE_BPS = 1_000;
    uint8 public constant ROLE_AUTHOR = 0;
    uint8 public constant ROLE_PARENT = 1;
    uint8 public constant ROLE_GRANDPARENT = 2;
    uint256 private constant BPS = 10_000;

    IFORKRegistry public immutable registry;
    mapping(address => uint256) public claimable;
    mapping(uint64 => uint32) public backerCount;
    /// @dev One-based position among a thesis's distinct backers; zero means never backed.
    mapping(uint64 => mapping(address => uint32)) public backerIndex;

    event Backed(
        uint64 indexed thesisId,
        address indexed backer,
        uint256 amount,
        uint32 backerIndex,
        bool early
    );
    event Credited(
        address indexed recipient,
        uint64 indexed sourceThesisId,
        uint64 indexed creditedThesisId,
        uint8 role,
        uint256 amount
    );
    event Withdrawn(address indexed account, uint256 amount);

    constructor(address registryAddress) {
        if (registryAddress.code.length == 0) revert InvalidRegistry();
        registry = IFORKRegistry(registryAddress);
    }

    function back(uint64 thesisId) external payable {
        (Credit[3] memory credits, uint256 count) = _split(thesisId, msg.value);
        if (msg.sender == credits[0].recipient) revert SelfBacking();

        uint32 index = backerIndex[thesisId][msg.sender];
        if (index == 0) {
            index = ++backerCount[thesisId];
            backerIndex[thesisId][msg.sender] = index;
        }
        emit Backed(thesisId, msg.sender, msg.value, index, index <= EARLY_BACKER_LIMIT);

        for (uint256 i; i < count; i++) {
            Credit memory credit = credits[i];
            claimable[credit.recipient] += credit.amount;
            emit Credited(
                credit.recipient, thesisId, credit.creditedThesisId, credit.role, credit.amount
            );
        }
    }

    function withdraw() external {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        claimable[msg.sender] = 0;
        emit Withdrawn(msg.sender, amount);
        (bool sent,) = msg.sender.call{value: amount}("");
        if (!sent) revert WithdrawFailed();
    }

    /// @notice Exactly the credits back() would record for this thesis and amount.
    function previewSplit(uint64 thesisId, uint256 amount)
        external
        view
        returns (Credit[] memory credits)
    {
        (Credit[3] memory split, uint256 count) = _split(thesisId, amount);
        credits = new Credit[](count);
        for (uint256 i; i < count; i++) {
            credits[i] = split[i];
        }
    }

    function isEarlyBacker(uint64 thesisId, address account) external view returns (bool) {
        uint32 index = backerIndex[thesisId][account];
        return index != 0 && index <= EARLY_BACKER_LIMIT;
    }

    /// @dev Reads at most three registry entries. The author keeps whatever is not owed to a
    /// different ancestor, which covers missing ancestors, shared authorship and rounding, so
    /// the credits always sum to the amount. One address is credited once, in its nearest role.
    function _split(uint64 thesisId, uint256 amount)
        private
        view
        returns (Credit[3] memory credits, uint256 count)
    {
        if (amount < MIN_BACKING) revert BackingTooSmall();
        (address author, uint64 parentId) = _thesis(thesisId);
        if (author == address(0)) revert ThesisNotFound();
        credits[0] = Credit(author, thesisId, ROLE_AUTHOR, amount);
        count = 1;
        if (parentId == 0) return (credits, count);

        (address parentAuthor, uint64 grandparentId) = _thesis(parentId);
        if (parentAuthor != author) {
            uint256 parentShare = amount * PARENT_SHARE_BPS / BPS;
            credits[0].amount -= parentShare;
            credits[count++] = Credit(parentAuthor, parentId, ROLE_PARENT, parentShare);
        }
        if (grandparentId == 0) return (credits, count);

        (address grandparentAuthor,) = _thesis(grandparentId);
        if (grandparentAuthor == author) return (credits, count);
        uint256 grandparentShare = amount * GRANDPARENT_SHARE_BPS / BPS;
        credits[0].amount -= grandparentShare;
        if (grandparentAuthor == parentAuthor) {
            credits[1].amount += grandparentShare;
        } else {
            credits[count++] =
                Credit(grandparentAuthor, grandparentId, ROLE_GRANDPARENT, grandparentShare);
        }
    }

    function _thesis(uint64 thesisId) private view returns (address author, uint64 parentId) {
        // forge-lint: disable-next-line(unused-return)
        (author, parentId,,,,,,,) = registry.theses(thesisId);
    }
}
