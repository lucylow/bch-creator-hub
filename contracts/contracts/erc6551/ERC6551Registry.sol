// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ERC6551Registry - Registry for token-bound accounts
/// @notice Creates deterministic accounts for NFTs via CREATE2
interface IERC6551Account {
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable returns (bytes memory);
}

contract ERC6551Registry {
    event AccountCreated(
        address indexed account,
        address indexed implementation,
        uint256 chainId,
        address indexed tokenContract,
        uint256 tokenId,
        uint256 salt
    );

    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt,
        bytes calldata initData
    ) external returns (address) {
        bytes memory code = _getCreationCode(implementation, chainId, tokenContract, tokenId, salt);

        bytes32 createSalt = keccak256(
            abi.encode(chainId, tokenContract, tokenId, salt)
        );

        address account;
        assembly {
            account := create2(0, add(code, 0x20), mload(code), createSalt)
            if iszero(account) {
                revert(0, 0)
            }
        }

        if (initData.length > 0) {
            (bool ok, ) = account.call(initData);
            require(ok, "init failed");
        }

        emit AccountCreated(
            account,
            implementation,
            chainId,
            tokenContract,
            tokenId,
            salt
        );

        return account;
    }

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external view returns (address) {
        bytes memory code = _getCreationCode(implementation, chainId, tokenContract, tokenId, salt);
        bytes32 createSalt = keccak256(
            abi.encode(chainId, tokenContract, tokenId, salt)
        );

        return _computeAddress(createSalt, keccak256(code));
    }

    function _getCreationCode(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                hex"3d60ad80600a3d3981f3363d3d373d3d3d363d73",
                implementation,
                hex"5af43d82803e903d91602b57fd5bf3",
                abi.encode(chainId, tokenContract, tokenId, salt)
            );
    }

    function _computeAddress(
        bytes32 salt,
        bytes32 bytecodeHash
    ) internal view returns (address) {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                address(this),
                                salt,
                                bytecodeHash
                            )
                        )
                    )
                )
            );
    }
}

