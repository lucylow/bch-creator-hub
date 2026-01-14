const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTCollection and LazyNFTMarketplace", function () {
  let nft, marketplace;
  let owner, seller, buyer;
  let ownerAddr, sellerAddr, buyerAddr;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    sellerAddr = await seller.getAddress();
    buyerAddr = await buyer.getAddress();

    // Deploy NFT Collection
    const NFT = await ethers.getContractFactory("NFTCollection");
    nft = await NFT.deploy(
      "Test NFT",
      "TNFT",
      "ipfs://",
      ownerAddr,
      500 // 5% royalty
    );
    await nft.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("LazyNFTMarketplace");
    marketplace = await Marketplace.deploy(nft, ownerAddr, 200); // 2% platform fee
    await marketplace.waitForDeployment();

    // Grant MINTER_ROLE to marketplace
    const MINTER_ROLE = await nft.MINTER_ROLE();
    await nft.grantRole(MINTER_ROLE, await marketplace.getAddress());
  });

  describe("NFTCollection", function () {
    it("Should mint NFT directly", async function () {
      const tokenURI = "ipfs://test123";
      const tx = await nft.mint(buyerAddr, tokenURI);
      const receipt = await tx.wait();
      
      expect(await nft.ownerOf(1)).to.equal(buyerAddr);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should enforce MINTER_ROLE", async function () {
      await expect(
        nft.connect(seller).mint(buyerAddr, "ipfs://test")
      ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
    });
  });

  describe("LazyNFTMarketplace", function () {
    it("Should redeem voucher and mint NFT", async function () {
      const price = ethers.parseEther("0.1");
      const tokenURI = "ipfs://test456";
      const nonce = 0;

      // Create voucher
      const voucher = {
        price: price,
        seller: sellerAddr,
        uri: tokenURI,
        nonce: nonce,
      };

      // Sign voucher
      const domain = {
        name: "LazyNFTMarketplace",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await marketplace.getAddress(),
      };

      const types = {
        NFTVoucher: [
          { name: "price", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "uri", type: "string" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const signature = await seller.signTypedData(domain, types, voucher);

      // Get initial balances
      const sellerBalanceBefore = await ethers.provider.getBalance(sellerAddr);
      const ownerBalanceBefore = await ethers.provider.getBalance(ownerAddr);

      // Redeem voucher
      const tx = await marketplace.connect(buyer).redeem(voucher, signature, {
        value: price,
      });
      const receipt = await tx.wait();

      // Check NFT was minted
      expect(await nft.ownerOf(1)).to.equal(buyerAddr);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);

      // Check balances (approximate due to gas)
      const sellerBalanceAfter = await ethers.provider.getBalance(sellerAddr);
      const ownerBalanceAfter = await ethers.provider.getBalance(ownerAddr);

      // Seller should receive: price - royalty (5%) - platform fee (2%) = 93% of price
      const expectedSellerAmount = (price * BigInt(93)) / BigInt(100);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.be.closeTo(
        expectedSellerAmount,
        ethers.parseEther("0.001")
      );

      // Platform should receive 2% of price
      const expectedPlatformAmount = (price * BigInt(2)) / BigInt(100);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        expectedPlatformAmount,
        ethers.parseEther("0.001")
      );
    });

    it("Should prevent replay attacks", async function () {
      const price = ethers.parseEther("0.1");
      const tokenURI = "ipfs://test789";
      const nonce = 0;

      const voucher = {
        price: price,
        seller: sellerAddr,
        uri: tokenURI,
        nonce: nonce,
      };

      const domain = {
        name: "LazyNFTMarketplace",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await marketplace.getAddress(),
      };

      const types = {
        NFTVoucher: [
          { name: "price", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "uri", type: "string" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const signature = await seller.signTypedData(domain, types, voucher);

      // First redeem should succeed
      await marketplace.connect(buyer).redeem(voucher, signature, {
        value: price,
      });

      // Second redeem with same nonce should fail
      await expect(
        marketplace.connect(buyer).redeem(voucher, signature, {
          value: price,
        })
      ).to.be.revertedWith("invalid nonce");
    });
  });
});


