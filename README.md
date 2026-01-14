# BCH Creator Hub

<div align="center">

**A Non-Custodial Payment Router for Bitcoin Cash Creators**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue.svg)](https://www.typescriptlang.org/)

*One QR code. One dashboard. Unlimited payments on Bitcoin Cash.*

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Components](#system-components)
- [Smart Contracts](#smart-contracts)
- [Payment Flow](#payment-flow)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [Security](#security)
- [Performance](#performance)
- [Development](#development)
- [Contributing](#contributing)

---

## Overview

BCH Creator Hub is a decentralized payment platform built on Bitcoin Cash (BCH) that enables creators to receive payments through a unified interface. The platform leverages CashScript smart contracts, OP_RETURN metadata, and real-time blockchain indexing to provide a non-custodial, low-fee payment solution.

### Key Features

- **Non-Custodial Design**: Creators maintain full control over their funds via smart contracts
- **Unified Payment Interface**: Single QR code and address for all payment types
- **Real-Time Updates**: WebSocket-based live transaction notifications
- **CashToken Subscriptions**: NFT-based subscription passes for premium content
- **Low Fees**: Maximum 1% service fee (configurable to 0%)
- **Developer API**: RESTful API for custom integrations
- **OP_RETURN Routing**: Metadata-encoded payments for flexible payment types

### Technology Stack

**Frontend**
- React 18.3+ with TypeScript
- Vite 5.4+ for build tooling
- Tailwind CSS + shadcn/ui components
- React Query for state management
- WebSocket client for real-time updates

**Backend**
- Node.js 18+ with Express 4.18+
- PostgreSQL 14+ for persistent storage
- Redis 4.6+ for caching and sessions
- CashScript 0.8+ for smart contracts
- Zeromq for blockchain event streaming
- Bull for job queue management

**Blockchain**
- Bitcoin Cash (BCH) Mainnet/Testnet
- CashScript smart contracts
- BCH-2023-02 CashTokens
- BIP-322 message signing

---

## Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend] 
        B[Browser Extension]
        C[Mobile Wallet]
    end
    
    subgraph "API Gateway"
        D[Express Server<br/>Port 3001]
        E[WebSocket Server<br/>Socket.io]
    end
    
    subgraph "Business Logic"
        F[Payment Service]
        G[Contract Service]
        H[Auth Service]
        I[Analytics Service]
        J[Webhook Service]
    end
    
    subgraph "Data Layer"
        K[(PostgreSQL<br/>Database)]
        L[(Redis<br/>Cache)]
        M[Job Queue<br/>Bull]
    end
    
    subgraph "Blockchain Layer"
        N[ZMQ Indexer<br/>Zeromq]
        O[BCH Node<br/>BCHN/Flowee]
        P[ElectrumX<br/>Indexer]
        Q[Smart Contracts<br/>CashScript]
    end
    
    subgraph "External Services"
        R[Blockchain<br/>Explorer]
        S[Notification<br/>Service]
    end
    
    A --> D
    B --> D
    C --> D
    A --> E
    D --> F
    D --> G
    D --> H
    D --> I
    D --> J
    F --> K
    G --> K
    H --> L
    I --> K
    J --> M
    N --> O
    N --> P
    N --> K
    G --> Q
    Q --> O
    M --> S
    N --> E
    F --> R
    
    style A fill:#61dafb
    style D fill:#339933
    style K fill:#336791
    style L fill:#dc382d
    style Q fill:#0ac18e
    style O fill:#f7931a
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant User as Creator/Supporter
    participant Frontend as React App
    participant API as Express API
    participant DB as PostgreSQL
    participant Indexer as ZMQ Indexer
    participant BCH as BCH Network
    participant WS as WebSocket
    
    User->>Frontend: Authenticate (BIP-322)
    Frontend->>API: POST /api/auth/login
    API->>DB: Verify signature & create session
    API-->>Frontend: JWT token
    
    User->>Frontend: Create payment link
    Frontend->>API: POST /api/payments/intent
    API->>DB: Store payment intent
    API-->>Frontend: Payment URL & QR code
    
    User->>Frontend: Send payment (via wallet)
    Frontend->>BCH: Broadcast transaction with OP_RETURN
    BCH-->>User: Transaction ID
    
    BCH->>Indexer: Block notification (ZMQ)
    Indexer->>BCH: Fetch block & transactions
    Indexer->>Indexer: Parse OP_RETURN payloads
    Indexer->>DB: Store payment records
    Indexer->>WS: Emit payment event
    WS-->>Frontend: Real-time update
    Frontend-->>User: Show payment confirmation
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Payment Creation"
        A[Creator creates<br/>payment intent] --> B[Generate QR code<br/>with metadata]
        B --> C[Share link/QR]
    end
    
    subgraph "Payment Execution"
        C --> D[Supporter scans QR]
        D --> E[Wallet constructs<br/>transaction]
        E --> F[OP_RETURN payload:<br/>creatorId, type, amount]
        F --> G[Broadcast to BCH]
    end
    
    subgraph "Payment Processing"
        G --> H[ZMQ Indexer detects<br/>new block]
        H --> I[Parse OP_RETURN data]
        I --> J[Match creator contract]
        J --> K[Store in database]
        K --> L[Emit WebSocket event]
        L --> M[Update dashboard<br/>in real-time]
    end
    
    subgraph "Withdrawal"
        M --> N[Creator initiates<br/>withdrawal]
        N --> O[Sign with private key]
        O --> P[Smart contract validates]
        P --> Q[Execute withdrawal]
        Q --> R[Funds sent to creator]
    end
```

---

## System Components

### 1. Frontend (React + TypeScript)

**Location**: `src/`

**Key Features**:
- **Authentication**: BIP-322 message signing for wallet-based auth
- **Dashboard**: Real-time balance, transaction history, analytics
- **Payment Links**: QR code generation and payment intent management
- **WebSocket Client**: Real-time transaction notifications
- **Wallet Integration**: Bitcoin Cash wallet connection via Wallet Protocol

**Core Components**:
```
src/
├── pages/
│   ├── DashboardPage.tsx      # Main creator dashboard
│   ├── PaymentLinksPage.tsx   # Payment link management
│   ├── AnalyticsPage.tsx      # Analytics and reports
│   └── SettingsPage.tsx       # Account settings
├── components/
│   ├── Dashboard/             # Dashboard widgets
│   ├── Payment/               # Payment components
│   ├── Wallet/                # Wallet integration
│   └── web3/                  # Web3 utilities
├── services/
│   ├── api.ts                 # API client
│   └── walletService.ts       # Wallet operations
└── contexts/
    ├── CreatorContext.tsx     # Creator state management
    └── WalletContext.tsx      # Wallet state management
```

### 2. Backend API (Express + Node.js)

**Location**: `backend/src/`

**API Structure**:
```
/api
├── /auth              # Authentication endpoints
├── /creators          # Creator management
├── /payments          # Payment intents & processing
├── /transactions      # Transaction queries
├── /webhooks          # Webhook management
└── /public            # Public endpoints
```

**Key Services**:
- **BCH Service** (`services/bch.service.js`): Blockchain interactions
- **Contract Service** (`services/contract.service.js`): Smart contract deployment & management
- **Wallet Service** (`services/wallet.service.js`): Wallet operations
- **Webhook Service** (`services/webhook.service.js`): Webhook delivery
- **Notification Service** (`services/notification.service.js`): Push notifications

### 3. Smart Contracts (CashScript)

**Location**: `backend/contracts/src/`

**Contracts**:

#### CreatorRouter.cash
Main payment aggregation contract with withdrawal functionality.

**Key Functions**:
- `withdraw(sig creatorSig)`: Standard withdrawal with optional service fee
- `withdrawAmount(sig creatorSig, int amount)`: Partial withdrawal
- `emergencyWithdraw(sig creatorSig)`: Emergency withdrawal after 30 days
- `pay(bytes data)`: Accept payments (fallback function)

**Contract Parameters**:
- `creatorPubKey`: Creator's public key (withdrawal authorization)
- `servicePubKey`: Optional service public key (for fees)
- `feeBasisPoints`: Fee percentage (0-200 = 0-2%)
- `minWithdrawalTime`: Minimum seconds between withdrawals

#### SubscriptionPass.cash
CashToken-based subscription system for premium content access.

**Key Functions**:
- `purchaseSubscription(pubkey buyerPubKey, int numPeriods)`: Mint subscription NFT
- `renewSubscription(int nftInputIndex, int numPeriods)`: Extend subscription
- `transferSubscription(sig sellerSig, pubkey newOwnerPubKey)`: Transfer NFT

### 4. Blockchain Indexer (ZMQ)

**Location**: `backend/src/indexer/zmq_indexer.js`

**Functionality**:
- **ZMQ Subscription**: Subscribes to block notifications from BCH node
- **Transaction Parsing**: Extracts OP_RETURN data from transactions
- **Reorg Handling**: Detects and handles blockchain reorganizations
- **Database Storage**: Persists payments and blocks
- **Event Emission**: Emits events for WebSocket distribution

**OP_RETURN Payload Format**:
```
[1 byte: version][16 bytes: creatorId][1 byte: paymentType][4 bytes: contentId][variable: metadata]

Example:
0x01 7a3b8c9f12a45d6e 02 0000001f 436f66666565546970
  │  └─ Creator ID      │  └─ Content ID    └─ "CoffeeTip"
  │                     └─ Payment Type: 2 (Tip)
  └─ Version: 1
```

**Payment Types**:
- `0x01`: Subscription payment
- `0x02`: Tip payment
- `0x03`: Unlock/paywall payment
- `0x04`: Recurring payment

### 5. Database Schema

**Primary Tables**:

```sql
-- Creators table
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id CHAR(16) UNIQUE NOT NULL,
    bch_address VARCHAR(64) NOT NULL,
    contract_address VARCHAR(64),
    pub_key_hex VARCHAR(130) NOT NULL,
    service_pubkey VARCHAR(200),
    payout_pubkey VARCHAR(200),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Payment intents
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id CHAR(16) REFERENCES creators(creator_id),
    intent_type SMALLINT NOT NULL,  -- 1:tip, 2:unlock, 3:subscription
    content_id VARCHAR(32),
    amount_sats BIGINT NOT NULL,
    amount_usd DECIMAL(10,2),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Transactions
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    txid VARCHAR(64) NOT NULL UNIQUE,
    creator_id CHAR(16) REFERENCES creators(creator_id),
    intent_id UUID REFERENCES payment_intents(id),
    amount_sats BIGINT NOT NULL,
    payment_type SMALLINT NOT NULL,
    content_id VARCHAR(32),
    payload_hex TEXT,
    block_height INTEGER,
    confirmed_at TIMESTAMP,
    sender_address VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    indexed_at TIMESTAMP DEFAULT NOW()
);

-- Blocks (for reorg handling)
CREATE TABLE blocks (
    height INT PRIMARY KEY,
    block_hash VARCHAR(100) NOT NULL,
    prev_hash VARCHAR(100) NOT NULL,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Job Queue (Bull)

**Background Jobs**:
- **Transaction Scanner** (`jobs/transactionScanner.job.js`): Periodic blockchain scanning
- **Contract Deployer** (`jobs/contractDeployer.job.js`): Async contract deployment
- **Cleanup** (`jobs/cleanup.job.js`): Database maintenance and cleanup

---

## Payment Flow

### Standard Payment Flow

```mermaid
sequenceDiagram
    participant S as Supporter
    participant W as Wallet
    participant BCH as BCH Network
    participant I as ZMQ Indexer
    participant API as Backend API
    participant DB as Database
    participant WS as WebSocket
    participant C as Creator Dashboard
    
    S->>W: Scan QR code / Click link
    W->>W: Parse payment metadata
    W->>S: Show payment confirmation
    S->>W: Approve payment
    W->>W: Construct transaction:<br/>- Output to creator contract<br/>- OP_RETURN with payload
    W->>BCH: Broadcast transaction
    BCH-->>W: Return TXID
    W-->>S: Show success with TXID
    
    BCH->>I: New block notification (ZMQ)
    I->>BCH: Fetch block data
    I->>I: Parse transactions & OP_RETURN
    I->>I: Decode payload (creatorId, type, amount)
    I->>DB: Store payment record
    I->>WS: Emit 'payment:received' event
    WS->>C: Push notification
    C->>API: Fetch updated balance
    API->>DB: Query transactions
    API-->>C: Return balance & transactions
    C-->>C: Update UI in real-time
```

### Withdrawal Flow

```mermaid
sequenceDiagram
    participant C as Creator
    participant D as Dashboard
    participant API as Backend API
    participant SC as Smart Contract
    participant BCH as BCH Network
    
    C->>D: Click "Withdraw"
    D->>API: POST /api/creators/withdraw
    API->>API: Get contract details
    API->>D: Return withdrawal parameters
    D->>C: Request wallet signature
    C->>D: Approve & sign transaction
    D->>SC: Construct & sign withdrawal tx
    D->>BCH: Broadcast transaction
    BCH->>SC: Execute contract function
    SC->>SC: Verify creator signature
    SC->>SC: Calculate fee (if applicable)
    SC->>BCH: Send BCH to creator address
    SC->>BCH: Send fee to service (if applicable)
    BCH-->>D: Transaction confirmed
    D-->>C: Show withdrawal success
```

### Subscription Pass Flow

```mermaid
sequenceDiagram
    participant S as Supporter
    participant D as Dashboard
    participant SC as SubscriptionPass Contract
    participant BCH as BCH Network
    participant NFT as CashToken NFT
    
    S->>D: Select subscription plan
    D->>SC: Generate purchase transaction
    SC->>S: Show payment confirmation
    S->>SC: Approve payment
    SC->>BCH: Broadcast transaction:<br/>- Payment to creator<br/>- Mint NFT to supporter
    BCH->>NFT: Create subscription NFT
    NFT-->>S: NFT in wallet
    BCH-->>SC: Transaction confirmed
    SC->>SC: Store expiration time in NFT commitment
    S->>D: Access premium content
    D->>SC: Verify NFT ownership
    SC->>SC: Check expiration time
    SC-->>D: Grant/deny access
```

---

## API Documentation

### Authentication

#### POST `/api/auth/login`
Authenticate using BIP-322 message signature.

**Request Body**:
```json
{
  "address": "bitcoincash:qzw...",
  "message": "BCH Creator Hub Login\nNonce: abc123\nTimestamp: 1234567890",
  "signature": "base64_signature"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "creator": {
    "creatorId": "7a3b8c9f12a45d6e",
    "displayName": "Creator Name",
    "contractAddress": "bitcoincash:..."
  }
}
```

### Payment Intents

#### POST `/api/payments/intent`
Create a new payment intent.

**Request Body**:
```json
{
  "intentType": 2,
  "amountSats": 10000,
  "description": "Tip for great content",
  "contentId": "article-123",
  "metadata": {
    "custom": "data"
  }
}
```

**Response**:
```json
{
  "success": true,
  "intent": {
    "id": "uuid",
    "paymentUrl": "https://.../pay/uuid",
    "qrCode": "data:image/svg+xml;base64,..."
  }
}
```

### Transactions

#### GET `/api/transactions`
Get transaction history for authenticated creator.

**Query Parameters**:
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `paymentType`: Filter by payment type
- `startDate`: Start date filter
- `endDate`: End date filter

**Response**:
```json
{
  "success": true,
  "transactions": [
    {
      "txid": "abc123...",
      "amountSats": 10000,
      "paymentType": 2,
      "confirmedAt": "2024-01-01T00:00:00Z",
      "senderAddress": "bitcoincash:..."
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Creator Management

#### GET `/api/creators/me`
Get current creator profile.

#### PUT `/api/creators/me`
Update creator profile.

#### POST `/api/creators/withdraw`
Initiate withdrawal (returns transaction parameters).

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    CREATORS ||--o{ PAYMENT_INTENTS : creates
    CREATORS ||--o{ TRANSACTIONS : receives
    PAYMENT_INTENTS ||--o| TRANSACTIONS : fulfills
    CREATORS ||--o{ WITHDRAWALS : initiates
    CREATORS ||--o{ WEBHOOKS : configures
    
    CREATORS {
        uuid id PK
        char creator_id UK
        varchar contract_address
        varchar pub_key_hex
        timestamp created_at
    }
    
    PAYMENT_INTENTS {
        uuid id PK
        char creator_id FK
        smallint intent_type
        bigint amount_sats
        jsonb metadata
        timestamp expires_at
    }
    
    TRANSACTIONS {
        bigserial id PK
        varchar txid UK
        char creator_id FK
        uuid intent_id FK
        bigint amount_sats
        integer block_height
        timestamp confirmed_at
    }
    
    WITHDRAWALS {
        uuid id PK
        char creator_id FK
        varchar txid
        bigint amount_sats
        timestamp created_at
    }
    
    WEBHOOKS {
        uuid id PK
        char creator_id FK
        varchar url
        jsonb events
        boolean active
    }
```

---

## Installation & Setup

### Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 14.0 or higher
- Redis 6.0 or higher
- Bitcoin Cash node (BCHN or Flowee) with ZMQ enabled
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/bch-creator-hub.git
cd bch-creator-hub/backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bch_creator_hub
DB_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
BCH_NETWORK=testnet
ZMQ_URL=tcp://127.0.0.1:28332
BCHJS_REST_URL=https://rest.kingbch.com/v5/
BCHJS_API_TOKEN=your_token_here

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000

# Service
SERVICE_FEE_BASIS_POINTS=100
SERVICE_PUBKEY=your_service_pubkey_here
```

4. **Initialize database**:
```bash
npm run db:migrate
npm run db:seed
```

5. **Deploy smart contracts** (testnet):
```bash
npm run deploy:contracts
```

6. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

### Frontend Setup

1. **Navigate to project root**:
```bash
cd ..
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
Create `.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_BCH_NETWORK=testnet
```

4. **Start development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Bitcoin Cash Node Configuration

Configure your BCH node to enable ZMQ notifications:

**bitcoin.conf** (BCHN):
```conf
zmqpubhashblock=tcp://127.0.0.1:28332
zmqpubhashtx=tcp://127.0.0.1:28333
zmqpubrawblock=tcp://127.0.0.1:28334
zmqpubrawtx=tcp://127.0.0.1:28335
```

**bchd.conf** (BCHD):
```conf
zmqpubhashblock=tcp://127.0.0.1:28332
zmqpubhashtx=tcp://127.0.0.1:28333
```

---

## Deployment

### Docker Deployment

**Backend Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/bch_creator_hub
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=bch_creator_hub
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Deploy**:
```bash
docker-compose up -d
```

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure database connection pooling
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Set up backup strategy for PostgreSQL
- [ ] Configure Redis persistence
- [ ] Set up rate limiting
- [ ] Deploy smart contracts to mainnet
- [ ] Configure service public key for fees
- [ ] Set up CDN for static assets

---

## Security

### Authentication & Authorization

- **BIP-322 Message Signing**: Wallet-based authentication without private key exposure
- **JWT Tokens**: Stateless session management with configurable expiration
- **Rate Limiting**: Per-IP and per-endpoint rate limiting
- **CORS**: Configurable cross-origin resource sharing
- **Helmet.js**: Security headers for Express

### Smart Contract Security

- **Minimal Logic**: Contracts contain only essential withdrawal logic
- **Signature Verification**: All withdrawals require creator signature
- **Fee Caps**: Maximum 2% fee enforced in contract
- **Time Locks**: Emergency withdrawal available after 30 days
- **No Admin Keys**: No upgradeable or admin-controlled functions

### Data Security

- **Encryption**: Sensitive data encrypted at rest
- **SQL Injection Prevention**: Parameterized queries via PostgreSQL driver
- **Input Validation**: Express-validator for request validation
- **HTTPS**: TLS/SSL encryption for all communications
- **Private Key Security**: Private keys never stored server-side

### Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Regular updates**: Keep dependencies updated
3. **Audit logging**: Log all financial transactions
4. **Backup strategy**: Regular database backups
5. **Monitoring**: Alert on suspicious activity
6. **Access control**: Principle of least privilege

---

## Performance

### Optimization Strategies

**Database**:
- Indexed queries on `creator_id`, `txid`, and `block_height`
- Connection pooling (20 connections default)
- Query optimization for analytics endpoints
- Partitioning for transactions table (by date)

**Caching**:
- Redis cache for creator balances
- Cache payment intent metadata
- Session storage in Redis
- Rate limiting counters in Redis

**Blockchain**:
- ZMQ for real-time block notifications (no polling)
- Batch transaction processing
- Efficient OP_RETURN parsing
- Reorg handling without full rescan

**Frontend**:
- Code splitting and lazy loading
- React Query for efficient data fetching
- WebSocket for real-time updates (no polling)
- Optimized bundle size with Vite

### Performance Metrics

**Target Performance**:
- API response time: < 200ms (p95)
- WebSocket latency: < 100ms
- Database query time: < 50ms (p95)
- Indexer block processing: < 5s per block
- Frontend initial load: < 2s

---

## Development

### Project Structure

```
bch-creator-hub/
├── backend/
│   ├── contracts/          # CashScript smart contracts
│   │   ├── src/
│   │   └── artifacts/
│   ├── db/                 # Database schema
│   ├── scripts/            # Deployment & utility scripts
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── indexer/        # ZMQ indexer
│   │   ├── jobs/           # Background jobs
│   │   ├── lib/            # Library code
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── websocket/      # WebSocket handlers
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   └── tests/              # Backend tests
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities
├── docs/                   # Documentation
└── README.md              # This file
```

### Running Tests

**Backend**:
```bash
cd backend
npm test
npm run test:watch
```

**Frontend**:
```bash
npm test
npm run test:watch
```

### Code Style

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking for frontend
- **Husky**: Git hooks for pre-commit checks

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Bitcoin Cash community for protocol development
- CashScript team for smart contract framework
- All contributors and supporters

---

## Support

For questions, issues, or contributions, please open an issue on GitHub or contact the development team.

**Documentation**: [https://docs.bchcreatorhub.com](https://docs.bchcreatorhub.com)  
**GitHub**: [https://github.com/yourusername/bch-creator-hub](https://github.com/yourusername/bch-creator-hub)  
**Discord**: [Join our community](https://discord.gg/bchcreatorhub)

---

<div align="center">

**Built with ❤️ for the Bitcoin Cash ecosystem**

</div>
