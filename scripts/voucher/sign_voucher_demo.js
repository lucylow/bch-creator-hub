/**
 * DEMO-ONLY voucher signer
 *
 * This script signs an EIP-712 Lazy NFT voucher using:
 * - a bundled demo private key
 * - chainId = 31337 (Hardhat default)
 * - a fixed demo marketplace address
 *
 * ⚠️ FOR DEMOS ONLY — do not use on mainnet.
 */

const { ethers } = require("ethers");

// -------------------------------------------------------------------
// DEMO CONSTANTS — DO NOT CHANGE (for demo consistency)
// -------------------------------------------------------------------

const DEMO_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044976fbd0d6f7a2d3e4e5f8f2b8f9b1c3a6c9d2b5e4a1"; 
// ↑ demo key (safe for local testing only)

const DEMO_MARKETPLACE_ADDRESS =
  "0x1111111111111111111111111111111111111111";

const CHAIN_ID = 31337;

// -------------------------------------------------------------------
// DEMO VOUCHER DATA
// -------------------------------------------------------------------

const voucher = {
  price: ethers.parseEther("0.1").toString(), // 0.1 ETH
  seller: ethers.computeAddress(DEMO_PRIVATE_KEY),
  uri: "ipfs://bafybeigdyrztx4demoexamplemetadata/metadata.json",
  nonce: 0
};

// -------------------------------------------------------------------
// EIP-712 DOMAIN + TYPES
// -------------------------------------------------------------------

const domain = {
  name: "LazyNFTMarketplace",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: DEMO_MARKETPLACE_ADDRESS
};

const types = {
  NFTVoucher: [
    { name: "price", type: "uint256" },
    { name: "seller", type: "address" },
    { name: "uri", type: "string" },
    { name: "nonce", type: "uint256" }
  ]
};

// -------------------------------------------------------------------
// SIGN
// -------------------------------------------------------------------

async function main() {
  const wallet = new ethers.Wallet(DEMO_PRIVATE_KEY);

  const signature = await wallet.signTypedData(domain, types, voucher);

  console.log("\n=== DEMO SIGNED VOUCHER ===\n");

  console.log("Marketplace Address:");
  console.log(DEMO_MARKETPLACE_ADDRESS, "\n");

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
  console.log("- Price (ETH): 0.1");
  console.log("- Nonce:", voucher.nonce);
  console.log("- Signature:", signature);
  console.log("\n");

  // Also output as a single JSON object for easy copy-paste
  console.log("=== COPY-PASTE READY ===\n");
  console.log(JSON.stringify({
    voucher,
    domain,
    types,
    signature
  }, null, 2));
}

main().catch(console.error);


