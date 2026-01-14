# OP_RETURN Payment System Integration Guide

This document describes the integration of the OP_RETURN payment system with the BCH Creator Hub.

## Overview

The system includes:
- **CashScript Contract**: On-chain withdrawal logic with optional fee routing
- **Indexer**: ZMQ-based blockchain indexer that watches for OP_RETURN payments
- **API Routes**: Payment link generation, transaction broadcasting
- **React Components**: TipButton, LiveFeed dashboard component
- **Payload Utilities**: Encode/decode OP_RETURN payloads

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install

# Optional: For ZMQ indexer
npm install zeromq@^6.0.0-beta.20

# Optional: For contract deployment
npm install bitcore-lib-cash@^8.25.0

# Note: CashScript version
# The contract uses CashScript ^0.10.0 syntax
# Current package.json has 0.8.0 - upgrade if needed:
# npm install cashscript@^0.10.0
```

### 2. Database Setup

Run the schema migration to add the required tables:

```bash
# The schema is in backend/db/schema.sql
# Run it against your Postgres database:
psql -U postgres -d bch_paywall_router -f backend/db/schema.sql
```

Or it will be created automatically when the indexer starts (see `ensureSchema()` in `zmq_indexer.js`).

### 3. Environment Variables

Add to your `.env`:

```env
# ZMQ Indexer (optional - for real-time block notifications)
ZMQ_URL=tcp://127.0.0.1:28332

# BCH Node/API
BCH_REST_URL=https://api.fullstack.cash/v5/
BCH_API_TOKEN=your_token_here
BCH_NETWORK=testnet  # or mainnet

# Database
PG_CONN=postgres://user:pass@localhost/bch_paywall_router
DATABASE_URL=postgres://user:pass@localhost/bch_paywall_router

# Frontend URL for payment links
DASHBOARD_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```

### 4. Compile CashScript Contract

```bash
# Install cashc CLI (if not installed)
npm install -g cashc

# Compile the contract
cashc backend/contracts/CreatorRouter.cash --output backend/artifacts/CreatorRouter.json
```

### 5. Deploy Contract (per creator)

```bash
# Set environment variables
export PAYOUT_PKH=0123456789abcdef0123456789abcdef01234567  # 20-byte hex (40 chars)
export CREATOR_PUBKEY=02abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab  # 33-byte compressed pubkey
export FEE_BPS=100  # 100 = 1.00%
export DEPLOYER_WIF=your_deployer_private_key_wif  # For funding
export FUND_SATS=50000  # Amount to fund contract
export CONTRACT_ARTIFACT=backend/artifacts/CreatorRouter.json

# Run deployment script
node backend/scripts/deploy_and_fund.js
```

### 6. Start the Indexer (optional)

The ZMQ indexer watches for new blocks and processes OP_RETURN payments:

```bash
# Start indexer (requires BCH node with ZMQ enabled)
node backend/src/indexer/zmq_indexer.js

# Or integrate into your server startup
```

**Note**: The indexer requires a BCH node (bitcoind/bchd) with ZMQ enabled. If you don't have ZMQ access, you can use the existing `TransactionScanner` job instead.

### 7. Integrate Indexer Events with WebSocket

In your server initialization, connect the indexer events to WebSocket:

```javascript
// In backend/src/server.js or similar
const { indexerEvents } = require('./indexer/zmq_indexer');
const wsServer = require('./websocket/server');

indexerEvents.on('payment', (event) => {
  const { creatorId } = event;
  wsServer.broadcastToCreator(creatorId, 'payment', event);
});
```

## API Endpoints

### Generate OP_RETURN Payment Link

```http
POST /api/creator/:creatorId/payment-link
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentType": 1,  // 1=tip, 2=unlock, 3=subscription
  "contentId": 42,
  "amountSats": 10000,
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "https://your-domain.com/pay/creator123?payload=...&amt=10000",
    "payloadHex": "010123456789abcdef010000002a...",
    "contractAddress": "bitcoincash:...",
    "amountSats": 10000
  }
}
```

### Get Creator Metadata

```http
GET /api/creator/:creatorId/meta
```

### Broadcast Transaction

```http
POST /api/tx/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "signedTxHex": "0100000001..."
}
```

## React Components

### TipButton

Embeddable button component:

```tsx
import TipButton from '@/components/Payment/TipButton';

<TipButton 
  creatorId="0123456789abcdef"
  amountSats={10000}
  contentId="42"
/>
```

### LiveFeed

Real-time payment feed for dashboard:

```tsx
import LiveFeed from '@/components/Dashboard/LiveFeed';

<LiveFeed 
  creatorId="0123456789abcdef"
  apiUrl="https://api.your-domain.com"
/>
```

## Payload Format

The OP_RETURN payload format:
- `[1 byte version][8 bytes creatorId][1 byte paymentType][4 bytes contentId][variable metadata]`
- `creatorId`: 8-byte hex (16 hex chars)
- `paymentType`: 0x01=tip, 0x02=unlock, 0x03=subscription
- `contentId`: 32-bit unsigned integer

## Testing

Run unit tests:

```bash
npm test
```

The payload encoder/decoder tests are in `backend/tests/unit/payload.test.js`.

## Demo Flow

1. **Creator Registration**: Creator registers and deploys contract
2. **Generate Payment Link**: Creator generates payment link with OP_RETURN payload
3. **Payment**: Supporter clicks link → wallet opens with prefilled address + OP_RETURN
4. **Indexer Detection**: Indexer detects transaction and attributes to creator
5. **Dashboard Update**: Dashboard receives real-time WebSocket event
6. **Withdrawal**: Creator signs withdrawal transaction locally and broadcasts

## Security Notes

- **Non-custodial**: Private keys never leave the client
- **Contract Logic**: Minimal on-chain logic to reduce attack surface
- **Payload Validation**: Always validate payloads strictly
- **Reorg Handling**: Indexer handles chain reorganizations safely

## Troubleshooting

### Indexer not starting
- Ensure ZMQ is enabled on your BCH node
- Check `ZMQ_URL` environment variable
- Verify BCH node is running and accessible

### Contract deployment fails
- Ensure `cashc` CLI is installed
- Check CashScript version compatibility (0.10.0+)
- Verify constructor arguments are correct format

### Payload decode fails
- Ensure payload format matches specification
- Check creatorId is 16 hex characters (8 bytes)
- Verify payload is in OP_RETURN output

## Next Steps

- Integrate with browser wallet extensions
- Add Wallet Protocol / BIP-322 signing flows
- Implement production-ready UTXO selection
- Add comprehensive error handling and monitoring
- Set up alerts for reorgs and indexer issues



