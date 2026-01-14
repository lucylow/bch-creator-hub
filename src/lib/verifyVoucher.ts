import { ethers } from "ethers";
import type { DemoVoucher } from "../demo/demoVoucher";

/**
 * Verify a simple voucher signature (for NFTMarketplace)
 */
export function verifyVoucher(
  voucher: DemoVoucher,
  contractAddress: string
): boolean {
  try {
    if (!voucher.signature) return false;

    const hash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "bytes32", "address"],
      [
        contractAddress,
        voucher.tokenId,
        voucher.price,
        ethers.keccak256(ethers.toUtf8Bytes(voucher.uri)),
        voucher.buyer,
      ]
    );

    const messageHash = ethers.hashMessage(ethers.getBytes(hash));
    const recovered = ethers.recoverAddress(messageHash, voucher.signature);

    return (
      recovered.toLowerCase() ===
      (process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "").toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Verify an EIP-712 typed voucher signature (for NFTMarketplaceMeta)
 */
export async function verifyMetaVoucher(
  voucher: DemoVoucher,
  contractAddress: string,
  chainId: number
): Promise<boolean> {
  try {
    if (!voucher.signature || !voucher.nonce || !voucher.expiry) return false;

    const domain = {
      name: "NFTMarketplaceMeta",
      version: "1",
      chainId: chainId,
      verifyingContract: contractAddress,
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
      tokenId: voucher.tokenId,
      price: voucher.price,
      uri: voucher.uri,
      buyer: voucher.buyer,
      nonce: voucher.nonce,
      expiry: voucher.expiry,
    };

    // Use ethers to verify
    const recovered = ethers.verifyTypedData(
      domain,
      types,
      value,
      voucher.signature
    );

    return (
      recovered.toLowerCase() ===
      (process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "").toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Check if voucher is expired
 */
export function isVoucherExpired(voucher: DemoVoucher): boolean {
  if (!voucher.expiry) return false; // No expiry for simple vouchers
  const expiry = parseInt(voucher.expiry);
  return Date.now() / 1000 > expiry;
}

