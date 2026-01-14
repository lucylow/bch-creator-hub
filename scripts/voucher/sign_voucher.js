/**
 * Sign EIP-712 NFT voucher for lazy minting
 * 
 * Usage:
 *   node sign_voucher.js
 * 
 * Environment variables:
 *   SELLER_PRIVATE_KEY - Private key of the seller/creator
 *   RPC_URL - RPC endpoint (default: http://127.0.0.1:8545)
 *   MARKETPLACE_ADDRESS - Deployed marketplace contract address
 */

const { ethers } = require("ethers");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const SELLER_PRIVATE_KEY = process.env.SELLER_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;

if (!SELLER_PRIVATE_KEY) {
  console.error("Error: SELLER_PRIVATE_KEY not set in environment");
  process.exit(1);
}

if (!MARKETPLACE_ADDRESS) {
  console.error("Error: MARKETPLACE_ADDRESS not set in environment");
  process.exit(1);
}

async function signVoucher() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(SELLER_PRIVATE_KEY, provider);
  const sellerAddress = wallet.address;

  // Get current nonce from marketplace (if deployed)
  let nonce = 0;
  try {
    const marketplaceAbi = [
      "function nonces(address) view returns (uint256)"
    ];
    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi, provider);
    nonce = await marketplace.nonces(sellerAddress);
  } catch (error) {
    console.warn("Could not fetch nonce from marketplace, using 0");
  }

  // Voucher parameters
  const price = process.env.PRICE ? ethers.parseEther(process.env.PRICE) : ethers.parseEther("0.1");
  const tokenURI = process.env.TOKEN_URI || "ipfs://bafybeiexample/metadata.json";

  const voucher = {
    price: price.toString(),
    seller: sellerAddress,
    uri: tokenURI,
    nonce: nonce,
  };

  // Get chain ID
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  // EIP-712 domain
  const domain = {
    name: "LazyNFTMarketplace",
    version: "1",
    chainId: chainId,
    verifyingContract: MARKETPLACE_ADDRESS,
  };

  // EIP-712 types
  const types = {
    NFTVoucher: [
      { name: "price", type: "uint256" },
      { name: "seller", type: "address" },
      { name: "uri", type: "string" },
      { name: "nonce", type: "uint256" },
    ],
  };

  // Sign
  const signature = await wallet.signTypedData(domain, types, voucher);

  // Output
  console.log("\n=== SIGNED VOUCHER ===\n");
  console.log("Marketplace Address:");
  console.log(MARKETPLACE_ADDRESS, "\n");

  console.log("Voucher JSON:");
  console.log(JSON.stringify(voucher, null, 2), "\n");

  console.log("Signature:");
  console.log(signature, "\n");

  console.log("Domain:");
  console.log(JSON.stringify(domain, null, 2), "\n");

  console.log("Types:");
  console.log(JSON.stringify(types, null, 2), "\n");

  console.log("Frontend usage:");
  console.log("- Seller:", voucher.seller);
  console.log("- Token URI:", voucher.uri);
  console.log("- Price (ETH):", ethers.formatEther(voucher.price));
  console.log("- Nonce:", voucher.nonce);
  console.log("- Signature:", signature);
  console.log("\n");
}

signVoucher().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});


