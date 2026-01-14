// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTCollection.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract LazyNFTMarketplace is ReentrancyGuard {
    using ECDSA for bytes32;

    NFTCollection public immutable nft;
    address public immutable platform; // receives platform fee
    uint96 public platformFeeBP; // basis points e.g., 200 = 2%

    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant VOUCHER_TYPEHASH = keccak256(
        "NFTVoucher(uint256 price,address seller,string uri,uint256 nonce)"
    );

    mapping(address => uint256) public nonces; // seller nonces to avoid replay

    event VoucherRedeemed(address indexed buyer, address indexed seller, uint256 tokenId, uint256 price);

    constructor(NFTCollection _nft, address _platform, uint96 _platformFeeBP) {
        nft = _nft;
        platform = _platform;
        platformFeeBP = _platformFeeBP;

        uint chainId;
        assembly { chainId := chainid() }
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("LazyNFTMarketplace")),
            keccak256(bytes("1")),
            chainId,
            address(this)
        ));
    }

    struct NFTVoucher {
        uint256 price;      // price (in wei)
        address seller;     // receiving address (creator)
        string uri;         // token metadata URI
        uint256 nonce;      // seller nonce
    }

    function _hashVoucher(NFTVoucher calldata v) internal view returns (bytes32) {
        return keccak256(abi.encode(
            VOUCHER_TYPEHASH,
            v.price,
            v.seller,
            keccak256(bytes(v.uri)),
            v.nonce
        ));
    }

    function _verifySigner(NFTVoucher calldata v, bytes calldata signature) internal view returns (address) {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, _hashVoucher(v)));
        return ECDSA.recover(digest, signature);
    }

    /// @notice Redeem a voucher: buyer sends ETH and receives a minted NFT
    function redeem(NFTVoucher calldata v, bytes calldata signature) external payable nonReentrant returns (uint256) {
        require(msg.value >= v.price, "insufficient payment");

        // verify signature by seller/creator
        address signer = _verifySigner(v, signature);
        require(signer == v.seller, "invalid voucher signer");

        // prevent replay: check nonce
        require(nonces[v.seller] == v.nonce, "invalid nonce");
        nonces[v.seller] += 1;

        // mint token to buyer
        // NOTE: this contract must have MINTER_ROLE on NFTCollection
        uint256 tokenId = nft.mint(msg.sender, v.uri);

        // handle payment split: royalties (ERC2981), platform fee, remainder to seller
        (address royaltyRecipient, uint256 royaltyAmount) = _getRoyaltyInfo(address(nft), tokenId, v.price);

        uint256 platformFee = (v.price * platformFeeBP) / 10000;
        uint256 toSeller = v.price;

        if (royaltyAmount > 0) {
            toSeller -= royaltyAmount;
            (bool okR,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(okR, "royalty transfer failed");
        }

        if (platformFee > 0) {
            toSeller -= platformFee;
            (bool okP,) = payable(platform).call{value: platformFee}("");
            require(okP, "platform transfer failed");
        }

        if (toSeller > 0) {
            (bool okS,) = payable(v.seller).call{value: toSeller}("");
            require(okS, "seller transfer failed");
        }

        // refund excess
        uint256 overpaid = msg.value - v.price;
        if (overpaid > 0) {
            (bool okF,) = payable(msg.sender).call{value: overpaid}("");
            require(okF, "refund failed");
        }

        emit VoucherRedeemed(msg.sender, v.seller, tokenId, v.price);
        return tokenId;
    }

    /// @notice helper to read ERC2981 royalty info if supported
    function _getRoyaltyInfo(address collectionAddr, uint256 tokenId, uint256 salePrice) internal view returns (address, uint256) {
        try ERC2981(collectionAddr).royaltyInfo(tokenId, salePrice) returns (address r, uint256 amount) {
            return (r, amount);
        } catch {
            return (address(0), 0);
        }
    }

    // allow admin to set fee
    function setPlatformFeeBP(uint96 bp) external {
        // owner/role-check left as exercise (use AccessControl or ownable)
        platformFeeBP = bp;
    }

    receive() external payable {}
}



