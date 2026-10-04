// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

/// @dev Cross-language fixtures in packages/shared/test/fixtures/execution-v1.json.
/// Pure identity hashing is NOT execution verification; no production registry dependency.
contract ExecutionReferenceTest {
    bytes32 private constant FILL_DOMAIN = keccak256("FORK_PERPL_FILL_V1");
    bytes32 private constant EXECUTION_DOMAIN = keccak256("FORK_PERPL_EXECUTION_V1");

    function fillHash(uint64 account, uint64 order, uint32 logIndex)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                FILL_DOMAIN,
                uint64(10143),
                address(0x1964C32f0bE608E7D29302AFF5E61268E72080cc),
                uint32(12),
                account,
                uint32(32),
                order,
                bytes32(0x4444444444444444444444444444444444444444444444444444444444444444),
                logIndex
            )
        );
    }

    function executionHash(uint64 thesisId, bytes32 identity) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                EXECUTION_DOMAIN,
                uint64(10143),
                address(0x1111111111111111111111111111111111111111),
                thesisId,
                address(0x2222222222222222222222222222222222222222),
                identity
            )
        );
    }

    function testReferenceVectorOne() public pure {
        bytes32 identity = fillHash(7, 123, 5);
        require(identity == 0x7198f59f35fa7ffca27df6670b6cddee479c44c0facee35d4fb2c7bb633d46e3);
        require(
            executionHash(42, identity)
                == 0x16dbcfdb3781bce23685f4fa63a3094bdc754c4788f2a9e292f0ab529aaf65f6
        );
    }

    function testReferenceVectorUint64Boundary() public pure {
        bytes32 identity = fillHash(type(uint64).max, type(uint64).max, 0);
        require(identity == 0x2f802d114c4943b85ddbd2fe4fdf362b4d8f8de034efec4caf913dfe16b9ea5d);
        require(
            executionHash(type(uint64).max, identity)
                == 0xb600209b46c520c75c06d85aa0445454688a50e6f11d07c59d869e55299cbe78
        );
    }

    function testMetadataVectorUtf8Keccak() public pure {
        bytes memory canonical = bytes(
            '{"version":1,"reasoning":"ETH breaks above resistance.","tags":["breakout","momentum"],"entryNote":null}'
        );
        require(
            keccak256(canonical)
                == 0x8456f42c3ae0ad636ef78ba7194dddf572eba1d1fc8dd0f8f57d8488cb22e818
        );
    }

    function testThesisBindingDoesNotReplaceEvidenceUniqueness() public pure {
        bytes32 identity = fillHash(7, 123, 5);
        require(executionHash(42, identity) != executionHash(43, identity));
        // A database unique constraint must reserve identity once, across both references.
    }
}
