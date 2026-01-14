const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy NFT Collection
  const NFT = await hre.ethers.getContractFactory("NFTCollection");
  const nft = await NFT.deploy(
    "BCH Creator Hub NFT",
    "BCHNFT",
    "ipfs://",
    deployer.address, // royalty receiver
    500 // 5% royalties (500 / 10000)
  );
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("NFT Collection deployed to:", nftAddress);

  // Deploy Marketplace
  const Marketplace = await hre.ethers.getContractFactory("LazyNFTMarketplace");
  const marketplace = await Marketplace.deploy(
    nft,
    deployer.address, // platform fee receiver
    200 // 2% platform fee (200 / 10000)
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // Grant MINTER_ROLE to marketplace
  const MINTER_ROLE = await nft.MINTER_ROLE();
  const tx = await nft.grantRole(MINTER_ROLE, marketplaceAddress);
  await tx.wait();
  console.log("Granted MINTER_ROLE to marketplace");

  console.log("\n=== Deployment Summary ===");
  console.log("NFT Collection:", nftAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("Royalty Receiver:", deployer.address);
  console.log("Platform Fee Receiver:", deployer.address);
  console.log("Royalty Fee: 5%");
  console.log("Platform Fee: 2%");

  // Save addresses to a file for frontend use
  const fs = require("fs");
  const addresses = {
    nft: nftAddress,
    marketplace: marketplaceAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
  };
  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



