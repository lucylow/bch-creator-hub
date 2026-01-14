# BCH Paywall Router Smart Contracts

Complete implementation of smart contracts for the BCH Paywall Router system using CashScript.

## Project Structure

```
contracts/
├── src/
│   ├── CreatorRouter.cash          # Main payment router contract
│   ├── SubscriptionPass.cash        # CashToken-based subscription
│   ├── MultiSigVault.cash          # Multi-signature vault (for teams)
│   └── PaymentSplitter.cash         # Split payments among multiple creators
├── scripts/
│   ├── deploy.js                   # Deployment script
│   ├── test.js                     # Contract testing
│   └── utils.js                    # Utility functions
├── artifacts/
│   ├── CreatorRouter.json
│   └── SubscriptionPass.json
└── tests/
    └── contractTests.js
```

## Contracts Overview

### 1. CreatorRouter

Main contract for BCH Paywall Router. Handles payment aggregation and withdrawals with optional service fee.

**Features:**
- Non-custodial: Funds always controlled by creator
- Minimal fees: 1% maximum service fee
- Multi-output withdrawals
- Time-locked subscriptions
- Emergency withdrawal after timeout

**Constructor Parameters:**
- `creatorPubKey`: Creator's public key
- `servicePubKey`: Optional service public key (for fees)
- `feeBasisPoints`: Fee percentage in basis points (100 = 1%)
- `minWithdrawalTime`: Minimum seconds between withdrawals

**Functions:**
- `withdraw(sig creatorSig)`: Standard withdrawal
- `withdrawAmount(sig creatorSig, int amount)`: Partial withdrawal
- `emergencyWithdraw(sig creatorSig)`: Emergency withdrawal after 30 days
- `pay(bytes data)`: Accept payments
- `payWithMinAmount(int minAmount, bytes data)`: Accept payments with minimum

### 2. SubscriptionPass

CashToken-based subscription system using BCH-2023-02 CashTokens.

**Features:**
- NFT-based subscription passes
- Time-locked access
- Renewable subscriptions
- Transferable passes

**Constructor Parameters:**
- `creatorPubKey`: Creator's public key
- `tokenCategory`: Token category ID (0x00 for new tokens)
- `subscriptionPrice`: Price in satoshis per period
- `subscriptionPeriod`: Period length in seconds

**Functions:**
- `purchaseSubscription(pubkey buyerPubKey, int numPeriods)`: Purchase new subscription
- `renewSubscription(int nftInputIndex, int numPeriods)`: Renew existing subscription
- `transferSubscription(sig sellerSig, pubkey newOwnerPubKey)`: Transfer NFT
- `checkSubscription(bytes nftScript)`: Check subscription status

### 3. MultiSigVault

Multi-signature vault for creator teams. Requires M-of-N signatures for withdrawals.

**Features:**
- M-of-N multisig
- Time-delayed emergency withdrawal
- Flexible threshold configuration

**Constructor Parameters:**
- `signers`: Array of signer public keys (2-10)
- `threshold`: Required signatures (M)
- `emergencyDelay`: Emergency withdrawal delay in seconds

**Functions:**
- `withdraw(sig[] sigs, pubkey[] pubkeys, bytes20 to, int amount)`: Standard withdrawal
- `emergencyWithdraw(sig sig, pubkey signerPubKey)`: Emergency withdrawal
- `addSigner(...)`: Add new signer (requires all current signers)
- `removeSigner(...)`: Remove signer (requires all other signers)
- `updateThreshold(...)`: Update threshold (requires all signers)

### 4. PaymentSplitter

Split payments among multiple recipients automatically.

**Features:**
- Multiple recipient support (2-10)
- Proportional splitting
- Minimum payment thresholds
- Emergency redistribution

**Constructor Parameters:**
- `recipients`: Array of recipient data (pubKeyHash, share, minPayment)
- `managerPubKey`: Manager's public key

**Functions:**
- `distribute(bytes data)`: Distribute funds according to shares
- `updateRecipient(...)`: Update recipient shares
- `addRecipient(...)`: Add new recipient
- `removeRecipient(...)`: Remove recipient
- `emergencyRedistribute(...)`: Manual redistribution

## Installation

Make sure you have the required dependencies installed:

```bash
npm install cashscript cashc ecpair bitcoinjs-lib
```

## Usage

### Deployment

Deploy contracts using the deployment script:

```bash
# Deploy CreatorRouter
node contracts/scripts/deploy.js deploy-creator <creatorPubKeyHex> [servicePubKeyHex] [feeBasisPoints]

# Deploy SubscriptionPass
node contracts/scripts/deploy.js deploy-subscription <creatorPubKeyHex> <priceSatoshis> [periodSeconds]

# Deploy MultiSigVault
node contracts/scripts/deploy.js deploy-multisig <signer1> <signer2> [signer3...] --threshold <N>

# Generate test keys
node contracts/scripts/deploy.js generate-keys

# Check contract balance
node contracts/scripts/deploy.js balance <contractAddress>

# Test withdrawal
node contracts/scripts/deploy.js test-withdraw <contractAddress> <privateKeyHex> <amountSatoshis>
```

### Testing

Run contract tests:

```bash
node contracts/scripts/test.js
```

### Utilities

Use utility functions for common operations:

```javascript
const ContractUtils = require('./scripts/utils');

// Calculate fees
const fee = ContractUtils.calculateFee(1000000, 100); // 1% of 0.01 BCH

// Generate keypairs
const keyPairs = ContractUtils.generateKeyPairs(3);

// Validate contract parameters
const validation = ContractUtils.validateContractParams('CreatorRouter', {
  feeBasisPoints: 100,
  minWithdrawalTime: 0
});

// Encode/decode expiration
const encoded = ContractUtils.encodeExpiration(1234567890);
const decoded = ContractUtils.decodeExpiration(encoded);
```

## Security Considerations

### Contract Security
1. **Input Validation**: All parameters validated before processing
2. **Dust Limits**: Minimum amounts enforced to prevent spam
3. **Signature Verification**: Proper ECDSA signature checks
4. **Output Validation**: Ensures correct recipients and amounts
5. **Time Locks**: Prevents rapid withdrawal attacks

### Economic Security
1. **Fee Caps**: Maximum 2% service fee
2. **Emergency Access**: Funds never permanently locked
3. **Change Protection**: Unspent funds returned to contract
4. **Spam Prevention**: Minimum time between withdrawals

### Operational Security
1. **Upgrade Path**: Contract parameters can be updated
2. **Migration Support**: Funds can be moved to new contracts
3. **Backward Compatibility**: Supports existing payment patterns
4. **Error Recovery**: Multiple withdrawal paths available

## Features Summary

### CreatorRouter Features
- Non-custodial design
- Configurable fees (0-2%)
- Withdrawal controls
- Emergency withdrawal
- Payment metadata support
- Dust protection

### SubscriptionPass Features
- CashToken integration
- Time-based access
- Renewable subscriptions
- Transferable NFTs
- Flexible pricing

### MultiSigVault Features
- M-of-N signatures
- Emergency access
- Dynamic management
- Team fund security

### PaymentSplitter Features
- Proportional splitting
- Minimum payments
- Manager control
- Emergency override

## Environment Variables

Set the following in your `.env` file:

```env
BCH_NETWORK=testnet  # or mainnet
```

## Notes

- Contracts use CashScript version ^0.9.0
- All amounts are in satoshis
- Time values are Unix timestamps in seconds
- Fees are specified in basis points (100 = 1%)
- Shares in PaymentSplitter must sum to 10000 (100%)

## License

Part of the BCH Creator Hub project.


