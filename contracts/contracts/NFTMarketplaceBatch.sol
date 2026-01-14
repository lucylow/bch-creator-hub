// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTMarketplaceBatch - Batch redeem multiple vouchers in one transaction
/// @notice Perfect for airdrops and bulk minting
contract NFTMarketplaceBatch is ERC721URIStorage, Ownable {
    address public signer;

    struct Voucher {
        uint256 tokenId;
        string uri;
        address buyer;
    }

    event BatchRedeemed(
        address indexed buyer,
        uint256[] tokenIds,
        uint256 count
    );

    constructor(address _signer) ERC721("BatchNFT", "BNFT") Ownable(msg.sender) {
        signer = _signer;
    }

    function batchRedeem(Voucher[] calldata vouchers) external {
        uint256[] memory tokenIds = new uint256[](vouchers.length);

        for (uint256 i = 0; i < vouchers.length; i++) {
            Voucher calldata v = vouchers[i];
            require(v.buyer == msg.sender, "wrong buyer");

            _mint(msg.sender, v.tokenId);
            _setTokenURI(v.tokenId, v.uri);

            tokenIds[i] = v.tokenId;
        }

        emit BatchRedeemed(msg.sender, tokenIds, vouchers.length);
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    receive() external payable {}
}

