# CashToken Integration Improvements

This document describes the improvements made to CashToken integration in the BCH Creator Hub.

## Overview

CashTokens (BCH-2023-02) are Bitcoin Cash's native token standard, supporting both fungible and non-fungible tokens. This implementation provides comprehensive CashToken support for subscription passes, NFTs, and token-based access control.

## Improvements Made

### 1. CashToken Utilities (`backend/src/utils/cashtoken.js`)

New utility functions for parsing, encoding, and working with CashTokens:

- **parseTokenOutput()**: Parses CashToken data from transaction outputs
- **parseTokenBearingOutput()**: Extracts NFT or fungible token data
- **parseGenesisOutput()**: Handles token genesis transactions (OP_GROUP)
- **extractTokensFromTransaction()**: Finds all tokens in a transaction
- **outputHasToken()**: Checks if an output contains a specific token
- **generateCategoryId()**: Creates category IDs from commitments
- **generateNFTTokenId()**: Generates unique NFT token IDs
- **encodeExpirationCommitment()**: Encodes subscription expiration timestamps
- **decodeExpirationCommitment()**: Decodes expiration from commitments
- **validateTokenData()**: Validates token structure
- **formatTokenId()** & **formatTokenAmount()**: Display formatting helpers

### 2. CashToken Service (`backend/src/services/cashtoken.service.js`)

Service layer for CashToken operations:

- **mintNFT()**: Queue NFT minting with metadata
- **verifyOwnership()**: Verify on-chain token ownership
- **getTokensByOwner()**: Get all tokens owned by an address
- **getTokenDetails()**: Retrieve token information
- **checkSubscriptionValidity()**: Verify subscription NFT is valid and not expired
- **processTokenTransfers()**: Update database when tokens are transferred
- **getCreatorSubscriptionTokens()**: Get subscription tokens for a creator

### 3. CashToken Model (`backend/src/models/CashToken.js`)

Database model for tracking CashTokens:

- Stores token metadata, ownership, and status
- Tracks creator associations
- Supports both NFT and fungible tokens
- Indexes for efficient queries
- Handles token transfers and spending

### 4. Database Schema (`backend/db/schema.sql`)

Added `cash_tokens` table:

```sql
CREATE TABLE cash_tokens (
  id BIGSERIAL PRIMARY KEY,
  creator_id CHAR(16) REFERENCES creators(creator_id),
  category_id VARCHAR(80) NOT NULL,
  token_id VARCHAR(80),
  type VARCHAR(20) NOT NULL DEFAULT 'NFT',
  owner_address VARCHAR(100) NOT NULL,
  commitment TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  txid VARCHAR(80),
  output_index INT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, token_id)
);
```

Also added `token_category_id` column to `creators` table for subscription token tracking.

### 5. BCH Service Extensions (`backend/src/services/bch.service.js`)

Extended BCHService with CashToken methods:

- **getTokens()**: Get all CashTokens for an address
- **extractTokensFromTransaction()**: Extract tokens from transaction
- **hasTokens()**: Check if transaction contains CashTokens

### 6. API Endpoints (`backend/src/routes/cashtoken.routes.js`)

New REST API endpoints:

- `GET /api/cashtokens/owner/:address` - Get tokens by owner
- `GET /api/cashtokens/verify/:address/:categoryId` - Verify ownership
- `GET /api/cashtokens/subscription/:address/:categoryId/:tokenId` - Check subscription validity
- `GET /api/cashtokens/:categoryId` - Get token details
- `POST /api/cashtokens/mint` - Mint NFT (authenticated)
- `GET /api/cashtokens/creator/subscriptions` - Get creator's subscription tokens
- `POST /api/cashtokens/parse` - Parse tokens from transaction

### 7. Transaction Scanner Updates (`backend/src/jobs/transactionScanner.job.js`)

Enhanced to detect CashToken transfers:

- Automatically processes CashToken transfers in scanned transactions
- Updates token ownership in database
- Marks tokens as spent when transferred

### 8. SubscriptionPass Contract Improvements (`backend/contracts/src/SubscriptionPass.cash`)

Improved CashToken helper functions:

- Better structure for token verification (within CashScript limitations)
- Enhanced token ID and commitment extraction
- Category ID validation
- Note: CashScript has limitations for native CashToken parsing; actual verification is done off-chain

## Usage Examples

### Verify Token Ownership

```javascript
const owns = await CashTokenService.verifyOwnership(
  'bitcoincash:qr...',
  'categoryId...',
  'tokenId...' // optional for NFTs
);
```

### Check Subscription Validity

```javascript
const validity = await CashTokenService.checkSubscriptionValidity(
  address,
  categoryId,
  tokenId
);
// Returns: { valid: boolean, expiration: number, expiresIn: number }
```

### Get User's Tokens

```javascript
const tokens = await CashTokenService.getTokensByOwner(
  address,
  categoryId // optional filter
);
```

### Process Transaction for Tokens

```javascript
const transfers = await CashTokenService.processTokenTransfers(transaction);
// Returns array of token transfers with from/to addresses
```

## CashToken Format

CashTokens use the following encoding in transaction outputs:

- **NFT Format**: `OP_1` (0x51) + length + category (20 bytes) + tokenId (32 bytes) + commitment
- **Fungible Format**: `OP_1` (0x51) + length + category (20 bytes) + amount (8 bytes) + commitment
- **Genesis Format**: `OP_GROUP` (0x59) + length + category (20 bytes)

For subscription passes, the commitment contains an 8-byte big-endian expiration timestamp.

## Integration Points

1. **Subscription System**: Uses CashToken NFTs for subscription passes with expiration stored in commitment
2. **Access Control**: Verify token ownership before granting access to premium content
3. **DAO Governance**: Can use fungible CashTokens for voting
4. **NFT Marketplace**: Track NFT ownership and transfers

## Future Enhancements

- Real-time token balance updates via WebSocket
- Token metadata storage (IPFS integration)
- Bulk token operations
- Token sale/marketplace integration
- Enhanced error handling and retry logic
- Token analytics and statistics

## Testing

Test the integration:

1. Deploy subscription contract with token category
2. Mint subscription NFT to user
3. Verify ownership via API
4. Check subscription validity
5. Process token transfer transaction
6. Verify ownership updated

## Notes

- CashScript contracts have limitations for direct CashToken parsing
- Most verification happens off-chain using the utility functions
- The contract helper functions provide structure but actual verification is done by backend services
- Token transfers are tracked via transaction scanning

