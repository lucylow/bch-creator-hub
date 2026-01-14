// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title TokenBoundAccount - ERC-6551 token-bound account implementation
/// @notice NFT becomes the wallet, identity, and execution context
contract TokenBoundAccount {
    using ECDSA for bytes32;

    address public immutable registry;
    uint256 public immutable chainId;
    address public immutable tokenContract;
    uint256 public immutable tokenId;

    event Executed(
        address indexed target,
        uint256 value,
        bytes data,
        bytes result
    );

    constructor(
        address _registry,
        uint256 _chainId,
        address _tokenContract,
        uint256 _tokenId
    ) {
        registry = _registry;
        chainId = _chainId;
        tokenContract = _tokenContract;
        tokenId = _tokenId;
    }

    function owner() public view returns (address) {
        return IERC721(tokenContract).ownerOf(tokenId);
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable returns (bytes memory) {
        require(msg.sender == owner(), "Not token owner");

        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Execution failed");

        emit Executed(to, value, data, result);
        return result;
    }

    receive() external payable {}
}



