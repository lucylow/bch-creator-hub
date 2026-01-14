export const DEMO_MARKETPLACE_ADDRESS =
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ||
  "0x1111111111111111111111111111111111111111";

export const DEMO_SIGNER_ADDRESS =
  process.env.NEXT_PUBLIC_SIGNER_ADDRESS ||
  "0x2222222222222222222222222222222222222222";

export interface DemoVoucher {
  tokenId: string;
  price: string;
  uri: string;
  buyer: string;
  signature?: string;
  nonce?: string;
  expiry?: string;
}

// Demo voucher - replace with actual signed voucher from Hardhat task
export const demoVoucher: DemoVoucher = {
  tokenId: "1",
  price: "0", // free demo mint
  uri: "ipfs://QmDemoCID/metadata.json",
  buyer: "0x0000000000000000000000000000000000000000", // anyone can redeem
  signature:
    "0x8f1a3c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12", // placeholder - replace with real signature
};

// Demo meta-tx voucher (with expiry and nonce)
export const demoMetaVoucher: DemoVoucher = {
  tokenId: "1",
  price: "0",
  uri: "ipfs://QmDemoCID/metadata.json",
  buyer: "0x0000000000000000000000000000000000000000",
  nonce: "0",
  expiry: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
  signature:
    "0x8f1a3c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12", // placeholder
};

