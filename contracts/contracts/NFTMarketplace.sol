// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTMarketplace - CREATE2-safe marketplace with voucher redemption
/// @notice Vouchers are bound to this contract's address via CREATE2 determinism
contract NFTMarketplace is ERC721URIStorage, Ownable {
    using ECDSA for bytes32;

    address public signer;
    uint256 public nextTokenId;

    struct Voucher {
        uint256 tokenId;
        uint256 price;
        string uri;
        address buyer;
    }

    event VoucherRedeemed(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price
    );

    constructor(address _signer) ERC721("DemoNFT", "DNFT") Ownable(msg.sender) {
        signer = _signer;
        nextTokenId = 1;
    }

    function redeem(Voucher calldata v, bytes calldata sig) external payable {
        bytes32 digest = _hash(v);
        address recovered = digest.recover(sig);
        require(recovered == signer, "Invalid signature");

        require(
            v.buyer == address(0) || v.buyer == msg.sender,
            "Wrong buyer"
        );
        require(msg.value == v.price, "Wrong price");

        _mint(msg.sender, v.tokenId);
        _setTokenURI(v.tokenId, v.uri);

        emit VoucherRedeemed(msg.sender, v.tokenId, v.price);
    }

    function _hash(Voucher calldata v) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    address(this),
                    v.tokenId,
                    v.price,
                    keccak256(bytes(v.uri)),
                    v.buyer
                )
            ).toEthSignedMessageHash();
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    receive() external payable {}
}



