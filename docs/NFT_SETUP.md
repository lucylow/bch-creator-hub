# NFT Setup Guide

This guide will help you set up and use the NFT marketplace functionality in BCH Creator Hub.

## Overview

The NFT system includes:
- **ERC-721 NFT Collection** with ERC-2981 royalties
- **Lazy Mint Marketplace** using EIP-712 vouchers
- **IPFS Metadata Upload** scripts
- **React Frontend** components for minting, buying, and viewing NFTs

## Prerequisites

1. Node.js 18+ and npm
2. Hardhat for contract deployment
3. An IPFS storage service (nft.storage recommended)
4. A WalletConnect Project ID (for RainbowKit)

## Setup Steps

### 1. Install Contract Dependencies

```bash
cd contracts
npm install
```

### 2. Deploy Contracts

#### Local Development

1. Start Hardhat node:
```bash
cd contracts
npm run node
```

2. In another terminal, deploy contracts:
```bash
cd contracts
npm run deploy:local
```

This will:
- Deploy the NFT Collection contract
- Deploy the Marketplace contract
- Grant MINTER_ROLE to the marketplace
- Save addresses to `deployed-addresses.json`

#### Testnet Deployment

1. Create `.env` file in `contracts/`:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key
```

2. Deploy:
```bash
npm run deploy:sepolia
```

### 3. Configure Frontend

1. Copy contract addresses from `contracts/deployed-addresses.json` to `.env`:
```
VITE_NFT_ADDRESS=0x...
VITE_MARKETPLACE_ADDRESS=0x...
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

2. Install frontend dependencies:
```bash
npm install
```

### 4. Setup IPFS Upload

1. Get an API key from [nft.storage](https://nft.storage/)

2. Add to `.env`:
```
NFT_STORAGE_KEY=your_api_key
```

3. Install IPFS script dependencies:
```bash
cd scripts/ipfs
npm install
```

## Usage

### Minting NFTs

#### Direct Mint (requires MINTER_ROLE)

1. Go to `/nfts` page
2. Click "Mint" tab
3. Connect your wallet (must have MINTER_ROLE)
4. Enter IPFS metadata URI
5. Click "Mint NFT"

#### Lazy Mint (Voucher-based)

1. **Create voucher** (as seller/creator):
```bash
cd scripts/voucher
npm install
# Set environment variables
export SELLER_PRIVATE_KEY=0x...
export MARKETPLACE_ADDRESS=0x...
export PRICE=0.1
export TOKEN_URI=ipfs://...
node sign_voucher.js
```

2. **Buyer redeems voucher**:
   - Go to `/nfts` page
   - Click "Buy" tab
   - Fill in voucher details (seller, URI, price, nonce, signature)
   - Click "Purchase NFT"

### Uploading Metadata to IPFS

```bash
cd scripts/ipfs
node uploadToIPFS.js ./art.png "My NFT" "Description" '[{"trait_type":"Rarity","value":"Legendary"}]'
```

This will output an IPFS URL like `ipfs://bafybeiexample/metadata.json` that you can use as the token URI.

### Viewing NFTs

1. Go to `/nfts` page
2. Click "Gallery" tab
3. Your NFTs will be displayed (if you own any)

## Contract Architecture

### NFTCollection.sol

- ERC-721 with URI storage
- ERC-2981 royalty support
- Role-based access control (MINTER_ROLE)
- Batch minting support

### LazyNFTMarketplace.sol

- EIP-712 voucher verification
- Automatic royalty distribution
- Platform fee collection
- Replay attack prevention (nonces)

## Security Notes

1. **Private Keys**: Never commit private keys to version control
2. **Nonces**: Each seller has a nonce counter to prevent replay attacks
3. **Royalties**: Set at contract deployment, can be updated by admin
4. **Platform Fees**: Configurable, set at deployment

## Testing

Run contract tests:
```bash
cd contracts
npm run test
```

## Troubleshooting

### "Contract address not configured"
- Make sure `VITE_NFT_ADDRESS` and `VITE_MARKETPLACE_ADDRESS` are set in `.env`

### "Invalid voucher signer"
- Verify the signature was created with the seller's private key
- Check that the marketplace address matches the deployment

### "Invalid nonce"
- The nonce must match the current nonce for the seller
- Check nonce with: `marketplace.nonces(sellerAddress)`

### IPFS upload fails
- Verify `NFT_STORAGE_KEY` is set correctly
- Check that the image file exists and is readable

## Next Steps

- Set up an indexer to track NFT events
- Add metadata fetching from IPFS
- Implement collection browsing
- Add filtering and search
- Create a royalty dashboard

