# NFT Contracts

ERC-721 NFT collection with lazy-mint marketplace functionality.

## Setup

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Test

```bash
npm run test
```

## Deploy

### Local Network

1. Start Hardhat node:
```bash
npm run node
```

2. In another terminal, deploy:
```bash
npm run deploy:local
```

### Sepolia Testnet

1. Create `.env` file:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key
```

2. Deploy:
```bash
npm run deploy:sepolia
```

## Contracts

- **NFTCollection.sol**: ERC-721 with ERC-2981 royalties and role-based minting
- **LazyNFTMarketplace.sol**: EIP-712 voucher-based lazy minting marketplace

## Usage

After deployment, addresses are saved to `deployed-addresses.json`. Use these in your frontend.



