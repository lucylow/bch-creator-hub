import { task } from "hardhat/config";
import { ethers } from "hardhat";

task("voucher", "Generate signed NFT voucher")
  .addParam("buyer", "Buyer address (0x0 for anyone)")
  .addParam("uri", "IPFS URI for metadata")
  .addOptionalParam("tokenId", "Token ID", "1")
  .addOptionalParam("price", "Price in wei", "0")
  .addOptionalParam("expiry", "Expiry timestamp (seconds)", "0")
  .addOptionalParam("nonce", "Nonce for replay protection", "0")
  .addOptionalParam("contract", "Marketplace contract address")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const chainId = await signer.getChainId();

    const marketplaceAddress =
      taskArgs.contract || process.env.MARKETPLACE_ADDRESS;
    if (!marketplaceAddress) {
      throw new Error(
        "Marketplace address required. Set MARKETPLACE_ADDRESS env var or use --contract"
      );
    }

    const tokenId = BigInt(taskArgs.tokenId);
    const price = BigInt(taskArgs.price);
    const nonce = BigInt(taskArgs.nonce);
    const expiry =
      taskArgs.expiry === "0"
        ? BigInt(Math.floor(Date.now() / 1000) + 3600)
        : BigInt(taskArgs.expiry);

    const buyer = taskArgs.buyer === "0x0" ? ethers.ZeroAddress : taskArgs.buyer;

    // Check if using meta-tx version (has expiry/nonce)
    const useMeta = expiry > 0n || nonce > 0n;

    if (useMeta) {
      // EIP-712 typed data signing
      const domain = {
        name: "NFTMarketplaceMeta",
        version: "1",
        chainId: chainId,
        verifyingContract: marketplaceAddress,
      };

      const types = {
        Voucher: [
          { name: "tokenId", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "uri", type: "string" },
          { name: "buyer", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
        ],
      };

      const value = {
        tokenId: tokenId.toString(),
        price: price.toString(),
        uri: taskArgs.uri,
        buyer: buyer,
        nonce: nonce.toString(),
        expiry: expiry.toString(),
      };

      const sig = await signer.signTypedData(domain, types, value);

      console.log(JSON.stringify({ ...value, signature: sig }, null, 2));
    } else {
      // Simple hash-based signing (for NFTMarketplace)
      const hash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint256", "bytes32", "address"],
        [
          marketplaceAddress,
          tokenId,
          price,
          ethers.keccak256(ethers.toUtf8Bytes(taskArgs.uri)),
          buyer,
        ]
      );

      const messageHash = ethers.hashMessage(ethers.getBytes(hash));
      const sig = await signer.signMessage(ethers.getBytes(hash));

      const voucher = {
        tokenId: tokenId.toString(),
        price: price.toString(),
        uri: taskArgs.uri,
        buyer: buyer,
        signature: sig,
      };

      console.log(JSON.stringify(voucher, null, 2));
    }

    console.error("\n✅ Voucher generated!");
    console.error(`Signer: ${signer.address}`);
    console.error(`Marketplace: ${marketplaceAddress}`);
  });

