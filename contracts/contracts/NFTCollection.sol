// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title NFTCollection
/// @notice ERC721 contract with role-based minting and ERC2981 royalties
contract NFTCollection is ERC721URIStorage, ERC2981, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // optional base URI
    string private _baseTokenURI;

    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator // e.g., 500 = 5% (where denominator is 10000)
    ) ERC721(name_, symbol_) {
        _baseTokenURI = baseURI_;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        if (royaltyReceiver != address(0)) {
            _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
        }
    }

    /// @notice mint a single token; only MINTER_ROLE
    function mint(address to, string calldata tokenURI_) external onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tid = _tokenIdCounter.current();
        _safeMint(to, tid);
        _setTokenURI(tid, tokenURI_);
        emit Minted(to, tid, tokenURI_);
        return tid;
    }

    /// @notice batch mint (gas conscious; avoid huge batches)
    function batchMint(address[] calldata tos, string[] calldata tokenURIs) external onlyRole(MINTER_ROLE) {
        require(tos.length == tokenURIs.length, "array length mismatch");
        for (uint i = 0; i < tos.length; ++i) {
            mint(tos[i], tokenURIs[i]);
        }
    }

    function setBaseURI(string calldata base) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = base;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // override supportsInterface for multiple inheritance
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ERC2981 helper
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _deleteDefaultRoyalty();
    }

    // withdraw helper
    function withdraw(address payable to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "zero address");
        uint256 bal = address(this).balance;
        (bool ok,) = to.call{value: bal}("");
        require(ok, "transfer failed");
    }

    // receive() to accept payments (for marketplace transfers)
    receive() external payable {}
}



