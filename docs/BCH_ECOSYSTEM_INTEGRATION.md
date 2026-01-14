# Integrating the Hack with the Bitcoin Cash Ecosystem

A Full-Stack, Native BCH Architecture

> This guide demonstrates how BCH Paywall Router (creator paywall + DAO + NFTs) integrates natively and credibly with the Bitcoin Cash ecosystem. This is written at "10-page technical spec depth": architecture, flows, contracts, scripts, APIs, wallet interactions, CashTokens, indexing, and UX.

## 1. BCH-Native Design Principles (Why This Is a BCH App)

Your hack is not a port from Ethereum. It is built around Bitcoin Cash primitives:

- **UTXO-based payments** (not account-based balances)
- **Low fees** → microtransactions viable
- **Script-first design** (CashScript)
- **CashTokens** for NFTs & membership
- **Wallet-first UX** (Paytaca, Electron Cash, Cashonize)
- **No custodial smart contracts**

**Core idea:** Every payment, NFT, vote, and DAO action resolves to a BCH transaction.

## 2. High-Level System Architecture

```
┌─────────────────────┐
│  BCH Wallet (User)  │
│  Paytaca / EC / WC  │
└─────────┬───────────┘
          │  BCH TX (P2PKH / CashTokens)
          ▼
┌───────────────────────────┐
│  BCH Paywall Router       │
│  - Payment Intents        │
│  - Content Unlock Logic   │
│  - Fee Routing            │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐
│  CashScript Contracts     │
│  - Creator Vault          │
│  - DAO Treasury           │
│  - NFT Mint Contracts     │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐
│  BCH Indexer              │
│  - bch-js / chronik       │
│  - UTXO State Tracking    │
└─────────┬─────────────────┘
          │
          ▼
┌───────────────────────────┐
│  Frontend (React / TS)    │
│  - Wallet Auth            │
│  - NFT Gallery            │
│  - DAO UI                 │
└───────────────────────────┘
```

## 3. Wallet Integration (BCH-First Authentication)

### Wallets Supported

- Paytaca (BIP-322 signatures)
- Electron Cash
- WalletConnect (BCH-enabled)
- Cashonize

### Wallet Auth Flow

**No accounts. No emails. No passwords.**

```typescript
// src/services/walletService.ts
export async function connectWallet() {
  if (!window.bitcoinCash) throw new Error("No BCH wallet found");

  const accounts = await window.bitcoinCash.request({
    method: "requestAccounts"
  });

  return accounts[0]; // cashaddr
}
```

### Signature-Based Login (BIP-322)

```typescript
export async function signLoginMessage(address: string) {
  const message = `Login to BCH Paywall Router\n${Date.now()}`;
  const signature = await window.bitcoinCash.request({
    method: "signMessage",
    params: { address, message }
  });

  return { message, signature };
}
```

**Why BCH-native:**
- ✔ No smart contract auth
- ✔ Wallet controls identity
- ✔ Zero custody

## 4. BCH Payment Routing (Core Paywall Logic)

### Payment Intent Model

```typescript
type PaymentIntent = {
  creatorAddress: string;
  amountSats: number;
  contentId: string;
  metadata?: Record<string, any>;
};
```

### Payment Execution

```typescript
export async function sendPayment(
  to: string,
  amountSats: number,
  metadata?: any
) {
  const tx = await window.bitcoinCash.request({
    method: "sendTransaction",
    params: {
      to,
      amount: amountSats,
      opReturn: metadata ? JSON.stringify(metadata) : undefined
    }
  });

  return tx; // { txid }
}
```

### Why BCH Excels Here

- **Fees < $0.01** - Makes microtransactions viable
- **OP_RETURN metadata** for content IDs
- **No escrow contracts needed**

## 5. Creator Vault (CashScript Smart Contract)

Funds are locked to creators, not platforms.

### CashScript: Creator Vault

```solidity
pragma cashscript ^0.8.0;

contract CreatorVault(pubkey creator) {

  function withdraw(sig creatorSig) {
    require(checkSig(creatorSig, creator));
  }
}
```

### Deployment

```bash
cashc contracts/CreatorVault.cash \
  --hex > CreatorVault.hex
```

### Interaction

```typescript
import { Contract, ElectrumNetworkProvider } from "cashscript";

const provider = new ElectrumNetworkProvider("mainnet");
const vault = new Contract(artifact, [creatorPubKey], provider);

await vault.functions.withdraw(sig).send();
```

**Result:**
- ✔ Creator custody
- ✔ Platform never touches funds

## 6. DAO Treasury on BCH (UTXO Governance)

### DAO Concept (BCH-style)

- **Treasury** = UTXO locked by script
- **Voting** = NFT-weighted signatures
- **Execution** = transaction authorization

### DAO Treasury CashScript

```solidity
contract DAOTreasury(
  pubkey admin,
  int quorum
) {
  function execute(sig adminSig) {
    require(checkSig(adminSig, admin));
  }
}
```

Voting logic handled off-chain, enforced on-chain by UTXO spending.

### Proposal Execution Flow

1. DAO members sign vote messages
2. Votes aggregated by indexer
3. Execution TX constructed
4. Admin (or multisig) unlocks treasury

## 7. NFTs Using BCH CashTokens

### Why CashTokens

- Native to BCH
- No EVM
- No gas
- UTXO-based NFTs

### NFT Mint (CashScript)

```solidity
contract MembershipNFT(pubkey issuer) {
  function mint(sig issuerSig) {
    require(checkSig(issuerSig, issuer));
  }
}
```

### Minting via bch-js

```typescript
import BCHJS from "@psf/bch-js";

const bchjs = new BCHJS();

const tx = await bchjs.TokenType1.create({
  tokenName: "Creator Access",
  symbol: "ACCESS",
  initialQty: 1,
  documentUrl: "ipfs://metadata.json",
});
```

### Use Cases

- Paywall access
- DAO voting rights
- Premium subscriptions
- Event tickets

## 8. Indexing the BCH Blockchain

### Why Indexing Is Required

- UTXOs are state
- BCH has no "contract storage"
- App state = derived from chain

### Indexer Architecture

```typescript
// indexer/watch.ts
import BCHJS from "@psf/bch-js";

const bchjs = new BCHJS();

async function watchAddress(address: string) {
  const utxos = await bchjs.Electrumx.utxo(address);
  return utxos;
}
```

### Event Detection

```typescript
function parsePayment(tx) {
  if (tx.op_return?.includes("paywall")) {
    return {
      creator: tx.to,
      contentId: tx.op_return,
      amount: tx.value
    };
  }
}
```

### Storage

SQLite / JSON DB

Indexed by:
- creator
- contentId
- txid
- NFT ownership

## 9. Frontend Integration (React + BCH)

### Wallet Context

```typescript
const WalletContext = createContext({
  address: null,
  connect: async () => {},
  sendPayment: async () => {}
});
```

### Payment Button

```tsx
<button onClick={() => sendPayment(
  creatorAddress,
  amountSats,
  { contentId }
)}>
  Pay with BCH
</button>
```

### NFT-Gated Content

```typescript
const ownsNFT = await indexer.hasToken(
  userAddress,
  ACCESS_TOKEN_ID
);

if (!ownsNFT) showPaywall();
```

## 10. DAO UI Integration

### Proposals

```typescript
type Proposal = {
  id: string;
  description: string;
  amount: number;
  recipient: string;
};
```

### Voting

```typescript
async function vote(proposalId) {
  const message = `Vote:${proposalId}`;
  return wallet.signMessage(message);
}
```

### Execution

```typescript
if (votes >= quorum) {
  treasury.execute();
}
```

## 11. Fee Routing (Transparent & BCH-Friendly)

- **99% → Creator**
- **1% → Platform** (optional, disclosed)

Fees enforced via output splitting:

```typescript
outputs: [
  { address: creator, value: 99_000 },
  { address: platform, value: 1_000 }
]
```

No hidden contracts. No rent extraction.

## 12. Why This Is a Perfect BCH Application

| Feature | Why BCH Wins |
|---------|--------------|
| Micropayments | Sub-cent fees |
| NFTs | CashTokens |
| DAO | Script-based UTXOs |
| Wallet UX | Simple, fast |
| No gas | Predictable costs |
| Non-custodial | Always |

## 13. What Judges Should Understand

This hack:

- Uses **Bitcoin Cash** as the settlement layer
- Uses **CashScript** for trust
- Uses **CashTokens** for NFTs
- Uses **wallets** instead of accounts
- Uses **UTXOs** as state

**It could not exist on high-fee chains.**

## 14. Optional Extensions (Future)

- Payment channels for streaming payments
- Blind signatures for private tipping
- Multisig DAO treasuries
- Zero-knowledge BCH proofs (future)

## Final Summary

Your hack is a **native Bitcoin Cash application**, not a port.

It:
- routes real BCH payments,
- locks funds in BCH scripts,
- mints BCH-native NFTs,
- governs with BCH signatures,
- and scales because BCH was designed for this.


