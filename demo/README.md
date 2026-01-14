# Demo Mock Data System

This directory contains a comprehensive mock data system for Bitcoin Cash Creator Hub, designed specifically for **DEMO / JUDGE / OFFLINE** purposes.

## Overview

This is not toy JSON — it is production-shaped mock state that mirrors:
- Bitcoin Cash UTXOs
- CashTokens (NFTs)
- Paywall payments
- DAO votes and proposals
- Indexer output
- UI consumption patterns

## Features

✅ **Fully interactive demo** - No blockchain dependency  
✅ **Deterministic state** - Same results every time  
✅ **Judge-safe** - Works offline, no network required  
✅ **Production-shaped** - Mirrors real BCH flows exactly  

## Quick Start

### Enable Demo Mode

Set `DEMO_MODE = true` in `src/config/demo.ts` or set environment variable:

```bash
VITE_DEMO_MODE=true
```

### Using Mock Data

```typescript
import { 
  ADDRESSES, 
  MOCK_PAYMENTS, 
  MOCK_NFTS, 
  demoWallet,
  mockIndexerApi 
} from '@/demo';

// Use mock addresses
const creatorAddress = ADDRESSES.creatorAlice;

// Check payments
const payments = await mockIndexerApi.getPayments(creatorAddress);

// Use demo wallet
const result = await demoWallet.connect();
```

## File Structure

- `mockAddresses.ts` - Realistic CashAddr format addresses
- `mockUtxos.ts` - Mock UTXO set (BCH state)
- `mockPayments.ts` - Paywall payment transactions
- `mockNFTs.ts` - CashToken NFT metadata
- `mockDAO.ts` - DAO governance proposals
- `mockVotes.ts` - Signature-based votes
- `mockAnalytics.ts` - Analytics and chart data
- `mockWallet.ts` - Demo wallet adapter
- `mockIndexerApi.ts` - Drop-in indexer replacement
- `demoScenario.ts` - Scripted demo flow

## Integration Points

### Wallet Service

The wallet service automatically uses demo mode when enabled:

```typescript
// src/services/walletService.ts
if (isDemoMode()) {
  return demoWallet.getBalance(address);
}
```

### Paywall Service

Content access checks work in demo mode:

```typescript
// src/services/paywall.ts
if (isDemoMode()) {
  return mockIndexerApi.hasPaidForContent(address, contentId);
}
```

### Wallet Context

Authentication is handled automatically in demo mode:

```typescript
// src/contexts/WalletContext.tsx
if (isDemoMode()) {
  // Skip backend auth, use mock token
  localStorage.setItem('auth_token', 'demo_token_' + btoa(address));
}
```

## Demo Addresses

| Role | Address |
|------|---------|
| Platform | `bitcoincash:qzplatform0000000000000000000000` |
| Creator Alice | `bitcoincash:qpalice000000000000000000000000` |
| Creator Bob | `bitcoincash:qpbbob0000000000000000000000000` |
| User Lucy | `bitcoincash:qplucy0000000000000000000000000` |
| User Judge | `bitcoincash:qpjjudge00000000000000000000000` |
| DAO Treasury | `bitcoincash:qpdao000000000000000000000000` |

## Running Demo Scenario

```typescript
import { runDemoScenario } from '@/demo/demoScenario';

// Run full demo flow
await runDemoScenario();
```

This will:
1. Connect wallet
2. View balance
3. Pay for content
4. Verify access
5. View NFTs
6. Vote on DAO proposal
7. View creator dashboard

## Judge Talking Points

> "This demo mode is a state-accurate simulation of Bitcoin Cash UTXOs, CashTokens, and scripts. When demo mode is disabled, the exact same UI and logic operate against real BCH."

## Switching Between Demo and Real Mode

Simply toggle `DEMO_MODE` in `src/config/demo.ts`:

```typescript
export const DEMO_MODE = false; // Switch to real mode
```

The same code paths work in both modes - no code changes needed!

## Extending Mock Data

To add more mock data:

1. Add entries to the appropriate mock data array
2. Update helper functions if needed
3. Ensure addresses use the `ADDRESSES` constant

Example:

```typescript
// demo/mockPayments.ts
export const MOCK_PAYMENTS: MockPayment[] = [
  // ... existing payments
  {
    txid: "pay_new_001",
    from: ADDRESSES.userLucy,
    to: ADDRESSES.creatorAlice,
    amount: 20000,
    contentId: "new_content",
    timestamp: new Date().toISOString(),
    feeSplit: {
      creator: 19800,
      platform: 200,
    },
  },
];
```

## Notes

- All addresses follow correct CashAddr format
- All timestamps are ISO 8601 format
- Transaction IDs are deterministic for demo purposes
- Mock data is read-only (doesn't mutate state)



