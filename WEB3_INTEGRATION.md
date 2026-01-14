# BCH Paywall Router - Web3 Integration Layer

## Overview

This document describes the Web3 integration layer that has been integrated into the BCH Creator Hub project. The integration provides a comprehensive Web3 interface for Bitcoin Cash wallet connections, smart contract interactions, and payment processing.

## Project Structure

```
src/
├── lib/
│   └── web3/
│       ├── api/
│       │   ├── client.ts          # API client for backend communication
│       │   └── websocket.ts       # WebSocket client for real-time updates
│       ├── providers/
│       │   └── BCHProvider.ts     # Core BCH provider for wallet management
│       ├── hooks/
│       │   ├── usePayments.ts     # Hook for payment operations
│       │   └── useContracts.ts    # Hook for contract operations
│       ├── utils/
│       │   └── bch.ts             # BCH utility functions (formatting, validation)
│       └── index.ts               # Main export file
└── components/
    └── web3/
        ├── WalletConnect.tsx      # Enhanced wallet connection component
        └── PaymentFlow.tsx        # Payment flow component with QR codes
```

## Key Features

### 1. Wallet Management (BCHProvider)

The `BCHProvider` class provides:
- Multi-wallet support (Paytaca, Electron Cash, generic BCH wallets, WalletConnect)
- Wallet detection and injection
- BIP-322 message signing for authentication
- Real-time balance updates
- UTXO management
- Transaction sending
- Event-based architecture for state management

**Location:** `src/lib/web3/providers/BCHProvider.ts`

### 2. API Client

The API client provides:
- Centralized API communication
- Automatic token management
- Error handling
- Request/response interceptors

**Location:** `src/lib/web3/api/client.ts`

### 3. WebSocket Client

The WebSocket client provides:
- Real-time updates
- Automatic reconnection
- Event-based messaging
- Token-based authentication

**Location:** `src/lib/web3/api/websocket.ts`

### 4. Custom Hooks

#### usePayments
- `sendTip()` - Send tips to creators
- `unlockContent()` - Unlock content with payment
- `purchaseSubscription()` - Purchase subscriptions
- `estimateFee()` - Estimate transaction fees

**Location:** `src/lib/web3/hooks/usePayments.ts`

#### useContracts
- `deployContract()` - Deploy smart contracts
- `callContract()` - Call contract functions
- `getContractInfo()` - Get contract information
- `verifyContract()` - Verify contract integrity

**Location:** `src/lib/web3/hooks/useContracts.ts`

### 5. UI Components

#### WalletConnect
Enhanced wallet connection component with:
- Multi-wallet selection
- Balance display
- Address management
- Explorer links
- Copy to clipboard

**Location:** `src/components/web3/WalletConnect.tsx`

#### PaymentFlow
Payment flow component with:
- Multi-step payment process
- QR code generation
- Fee estimation
- Transaction confirmation
- Payment types (tips, unlocks, subscriptions)

**Location:** `src/components/web3/PaymentFlow.tsx`

### 6. Utility Functions

BCH utilities include:
- `formatBCH()` - Format satoshis to BCH
- `formatUSD()` - Format to USD
- `truncateAddress()` - Truncate addresses for display
- `isValidBCHAddress()` - Validate BCH addresses
- `generatePaymentURI()` - Generate payment URIs
- `parseTransaction()` - Parse transaction data

**Location:** `src/lib/web3/utils/bch.ts`

## Integration Notes

### Existing Codebase Compatibility

The Web3 integration has been designed to work alongside the existing codebase:

1. **WalletContext Integration**: The new Web3 components use the existing `WalletContext` from `src/contexts/WalletContext.tsx`. The `BCHProvider` can be used to enhance wallet functionality.

2. **API Service Compatibility**: The new API client (`src/lib/web3/api/client.ts`) can work alongside the existing `apiService` (`src/services/apiService.ts`). Both use similar patterns.

3. **Toast Notifications**: Uses `sonner` (already installed) instead of `react-hot-toast` as per the existing codebase.

4. **UI Components**: Uses existing shadcn/ui components for consistency.

### TypeScript

All code is written in TypeScript with proper type definitions for better type safety and IDE support.

### Dependencies

The integration uses existing dependencies:
- `react-qr-code` - Already installed
- `framer-motion` - Already installed
- `sonner` - Already installed
- `lucide-react` - Already installed

No additional dependencies are required for the core functionality. The backend uses `bch-js` and `cashscript`, which are handled server-side.

## Usage Examples

### Connecting a Wallet

```typescript
import { bchProvider } from '@/lib/web3/providers/BCHProvider';

// Check available wallets
const wallets = await bchProvider.checkWalletInjection();

// Connect a wallet
const walletData = await bchProvider.connectWallet('paytaca');
```

### Using Payment Hooks

```typescript
import { usePayments } from '@/lib/web3/hooks/usePayments';

const { sendTip, isProcessing } = usePayments();

// Send a tip
await sendTip(recipientAddress, amountSatoshis, { memo: 'Great content!' });
```

### Using Contract Hooks

```typescript
import { useContracts } from '@/lib/web3/hooks/useContracts';

const { deployContract, callContract } = useContracts();

// Deploy a contract
await deployContract('CreatorRouter', { feeBasisPoints: 100 });
```

### Using Components

```tsx
import WalletConnect from '@/components/web3/WalletConnect';
import PaymentFlow from '@/components/web3/PaymentFlow';

// Wallet connection
<WalletConnect />

// Payment flow
<PaymentFlow
  recipientAddress="bitcoincash:qpz..."
  amount="0.001"
  paymentType="tip"
  onComplete={(result) => console.log('Payment complete:', result)}
/>
```

## Environment Variables

Add these to your `.env` file:

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_BCH_NETWORK=testnet
```

## Next Steps

1. **Enhanced WalletContext**: Consider integrating `BCHProvider` directly into the existing `WalletContext` for more comprehensive wallet management.

2. **CreatorContext Integration**: Enhance the `CreatorContext` with Web3 features like contract management and payment intent handling.

3. **Contract Components**: Add a `ContractInteraction` component for managing smart contracts.

4. **Dashboard Integration**: Create a Web3 dashboard page that showcases all Web3 features.

5. **Backend Integration**: Ensure the backend API endpoints match the expected structure (see API client code).

## Notes

- The code uses mock signatures for demo purposes. In production, ensure proper BIP-322 signing is implemented.
- Wallet detection relies on global window objects (`window.paytaca`, `window.bitcoinCash`, etc.).
- The integration is designed to be progressive - you can use parts of it without requiring the entire stack.
- Error handling is comprehensive but can be enhanced based on your specific needs.

## License

This integration follows the same license as the main project.
