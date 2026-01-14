# Deployment Guide

This guide walks through deploying the DAO contracts to various networks.

## Local Development

1. **Start Hardhat node:**
```bash
npm run node
```

2. **In another terminal, deploy contracts:**
```bash
npm run deploy:local
```

3. **Copy the deployed addresses** to your `.env` files:
   - `dao/.env`
   - `dao/frontend/.env`
   - `dao/indexer/.env` (or use environment variables)

## Testnet Deployment (e.g., Sepolia)

1. **Update `hardhat.config.js`** with testnet configuration:
```javascript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL || "",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
  }
}
```

2. **Set environment variables:**
```bash
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
export PRIVATE_KEY=your_private_key
```

3. **Deploy:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Mainnet Deployment

⚠️ **WARNING**: Only deploy to mainnet after thorough testing and audits.

1. **Set production environment variables**
2. **Review all parameters** (timelock delay, voting periods, etc.)
3. **Deploy:**
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## Post-Deployment Checklist

- [ ] Verify all contracts deployed successfully
- [ ] Grant roles correctly (governor has proposer/executor on timelock)
- [ ] Fund treasury (if needed)
- [ ] Test proposal creation
- [ ] Test voting flow
- [ ] Test queue/execute flow
- [ ] Update frontend `.env` with deployed addresses
- [ ] Update indexer with deployed addresses
- [ ] (Optional) Revoke deployer admin role on TimelockController
- [ ] Verify timelock delay is appropriate for production

## Troubleshooting

### TimelockController deployment fails

If `getContractFactory("TimelockController")` fails, you may need to:

1. Ensure `@openzeppelin/contracts` is installed: `npm install @openzeppelin/contracts`
2. Hardhat should automatically compile OpenZeppelin contracts. If not, try:
   ```bash
   npx hardhat clean
   npx hardhat compile
   ```

### Gas estimation failures

- Increase gas limits in deployment script
- Check network RPC endpoint is working
- Verify account has sufficient balance

### Role grant failures

- Ensure you're using the correct signer (deployer)
- Check that timelock was deployed successfully
- Verify role constants are correct



