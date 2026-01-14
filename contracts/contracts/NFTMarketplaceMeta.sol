// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTMarketplaceMeta - Gasless meta-transaction redeem with expiry and nonce protection
/// @notice EIP-712 typed vouchers with replay protection
contract NFTMarketplaceMeta is ERC721URIStorage, Ownable {
    using ECDSA for bytes32;

    address public signer;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public redeemed;

    bytes32 public constant VOUCHER_TYPEHASH =
        keccak256(
            "Voucher(uint256 tokenId,uint256 price,string uri,address buyer,uint256 nonce,uint256 expiry)"
        );

    struct Voucher {
        uint256 tokenId;
        uint256 price;
        string uri;
        address buyer;
        uint256 nonce;
        uint256 expiry;
    }

    event VoucherRedeemed(
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 price,
        uint256 nonce
    );

    constructor(address _signer) ERC721("DemoNFT", "DNFT") Ownable(msg.sender) {
        signer = _signer;
    }

    function redeemMeta(
        Voucher calldata v,
        bytes calldata sig
    ) external payable {
        require(block.timestamp <= v.expiry, "Voucher expired");
        require(v.nonce == nonces[v.buyer], "Invalid nonce");

        bytes32 digest = _hashTyped(v);
        require(!redeemed[digest], "Already redeemed");

        address recovered = ECDSA.recover(digest, sig);
        require(recovered == signer, "Invalid signature");

        nonces[v.buyer]++;
        redeemed[digest] = true;

        require(msg.value == v.price, "Wrong price");

        _mint(v.buyer, v.tokenId);
        _setTokenURI(v.tokenId, v.uri);

        emit VoucherRedeemed(v.buyer, v.tokenId, v.price, v.nonce);
    }

    function _hashTyped(Voucher calldata v) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                VOUCHER_TYPEHASH,
                v.tokenId,
                v.price,
                keccak256(bytes(v.uri)),
                v.buyer,
                v.nonce,
                v.expiry
            )
        );

        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("NFTMarketplaceMeta")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );

        return ECDSA.toTypedDataHash(domainSeparator, structHash);
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    receive() external payable {}
}


