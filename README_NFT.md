# NFT Marketplace Implementation

Complete NFT marketplace implementation for BCH Creator Hub with ERC-721 contracts, lazy minting, and React frontend.

## 🎯 Features

- ✅ ERC-721 NFT Collection with ERC-2981 royalties
- ✅ Lazy mint marketplace using EIP-712 vouchers
- ✅ IPFS metadata upload scripts
- ✅ React frontend with wagmi + RainbowKit
- ✅ Mint, buy, and gallery components
- ✅ Hardhat deployment and testing

## 📁 Project Structure

```
bch-creator-hub/
├── contracts/              # Hardhat project
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.js
├── scripts/
│   ├── voucher/           # Voucher signing scripts
│   │   ├── sign_voucher.js
│   │   └── sign_voucher_demo.js
│   └── ipfs/              # IPFS upload scripts
│       └── uploadToIPFS.js
└── src/
    ├── components/NFT/    # React NFT components
    │   ├── MintForm.tsx
    │   ├── BuyNFT.tsx
    │   └── NFTGallery.tsx
    └── pages/
        └── NFTsPage.tsx
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Contract dependencies
cd contracts
npm install
```

### 2. Deploy Contracts (Local)

```bash
# Terminal 1: Start Hardhat node
cd contracts
npm run node

# Terminal 2: Deploy contracts
cd contracts
npm run deploy:local
```

This will create `deployed-addresses.json` with contract addresses.

### 3. Configure Frontend

Create `.env` file in project root:

```env
VITE_NFT_ADDRESS=0x...          # From deployed-addresses.json
VITE_MARKETPLACE_ADDRESS=0x...  # From deployed-addresses.json
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 4. Start Frontend

```bash
npm run dev
```

Visit `http://localhost:5173/nfts` to see the NFT marketplace.

## 📝 Usage Guide

### Minting NFTs

#### Direct Mint (requires MINTER_ROLE)

1. Go to `/nfts` → "Mint" tab
2. Connect wallet (must have MINTER_ROLE)
3. Enter IPFS metadata URI
4. Click "Mint NFT"

#### Lazy Mint (Voucher-based)

**Step 1: Create Voucher (Seller)**

```bash
cd scripts/voucher
npm install

# Set environment variables
export SELLER_PRIVATE_KEY=0x...
export MARKETPLACE_ADDRESS=0x...
export PRICE=0.1
export TOKEN_URI=ipfs://bafybeiexample/metadata.json

node sign_voucher.js
```

**Step 2: Buyer Redeems**

1. Go to `/nfts` → "Buy" tab
2. Fill in voucher details (seller, URI, price, nonce, signature)
3. Click "Purchase NFT"

### Upload Metadata to IPFS

```bash
cd scripts/ipfs
npm install

# Set NFT_STORAGE_KEY in .env
export NFT_STORAGE_KEY=your_api_key

node uploadToIPFS.js ./art.png "My NFT" "Description" '[{"trait_type":"Rarity","value":"Legendary"}]'
```

## 🧪 Testing

```bash
cd contracts
npm run test
```

## 📚 Documentation

- [NFT Setup Guide](./docs/NFT_SETUP.md) - Detailed setup instructions
- [Contract README](./contracts/README.md) - Contract documentation

## 🔒 Security Notes

1. **Private Keys**: Never commit private keys to version control
2. **Nonces**: Each seller has a nonce counter to prevent replay attacks
3. **Royalties**: Set at contract deployment (5% default)
4. **Platform Fees**: Configurable (2% default)

## 🛠️ Development

### Copy ABIs to Frontend

After compiling contracts:

```bash
node scripts/copy-abis.js
```

This copies compiled ABIs to `src/lib/web3/abis/` for use in React components.

### Demo Voucher

For testing/demos, use the demo voucher script:

```bash
cd scripts/voucher
node sign_voucher_demo.js
```

This generates a voucher signed with a demo key for the demo marketplace address.

## 📦 Contracts

### NFTCollection.sol

- ERC-721 with URI storage
- ERC-2981 royalty support
- Role-based access control
- Batch minting

### LazyNFTMarketplace.sol

- EIP-712 voucher verification
- Automatic royalty distribution
- Platform fee collection
- Replay attack prevention

## 🎨 Frontend Components

- **MintForm**: Direct minting for authorized minters
- **BuyNFT**: Voucher redemption for lazy minting
- **NFTGallery**: Display user's NFT collection

## 🔗 Links

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [wagmi Documentation](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [NFT.Storage](https://nft.storage/)

## 📄 License

MIT



