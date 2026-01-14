// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTMarketplaceMerkle - Merkle-root vouchers for scaling to 100K+ claims
/// @notice One root, infinite vouchers, no signatures needed
contract NFTMarketplaceMerkle is ERC721URIStorage, Ownable {
    bytes32 public merkleRoot;
    mapping(bytes32 => bool) public claimed;

    event VoucherRedeemed(
        address indexed buyer,
        uint256 indexed tokenId,
        bytes32 leaf
    );

    constructor(bytes32 _root) ERC721("MerkleNFT", "MNFT") Ownable(msg.sender) {
        merkleRoot = _root;
    }

    function redeem(
        uint256 tokenId,
        string calldata uri,
        bytes32[] calldata proof
    ) external {
        bytes32 leaf = keccak256(
            abi.encode(tokenId, keccak256(bytes(uri)), msg.sender)
        );

        require(!claimed[leaf], "already claimed");
        require(
            MerkleProof.verify(proof, merkleRoot, leaf),
            "bad proof"
        );

        claimed[leaf] = true;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit VoucherRedeemed(msg.sender, tokenId, leaf);
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
    }

    receive() external payable {}
}


