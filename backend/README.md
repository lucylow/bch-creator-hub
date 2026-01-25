# BCH Paywall Router Backend

Backend API for the Bitcoin Cash Paywall Router hackathon project.

## Features

- **Wallet Authentication**: BIP-322 signature-based authentication
- **Payment Processing**: Create and manage payment intents
- **Transaction Scanning**: Real-time blockchain transaction monitoring
- **WebSocket Support**: Real-time notifications for creators
- **Contract Deployment**: CashScript smart contract deployment
- **Analytics**: Comprehensive analytics and reporting
- **Webhooks**: Event-driven webhook system

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Bitcoin Cash node or API access

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
npm run db:migrate
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Network Configuration

The backend supports both **testnet** and **mainnet** networks. By default, it uses **testnet** for safety.

### Quick Network Switching

```bash
# Switch to testnet (safe for development)
npm run network:testnet

# Switch to mainnet (⚠️ uses real BCH!)
npm run network:mainnet

# Check current network status
npm run network:status
```

### Manual Configuration

Set the `BCH_NETWORK` environment variable in your `.env` file:

```env
# For testnet (default, safe)
BCH_NETWORK=testnet

# For mainnet (⚠️ real BCH!)
BCH_NETWORK=mainnet
```

### Network-Specific Settings

**Testnet:**
- Safe for development and testing
- Uses **tapi.fullstack.cash** for BCH REST/WebSocket APIs
- Uses testnet BCH (no real value)
- Explorer: https://www.blockchain.com/bch-testnet
- Default network for all services

**Mainnet:**
- Uses **api.fullstack.cash** for BCH REST/WebSocket APIs
- Uses real BCH (real value!)
- Requires careful configuration
- Explorer: https://www.blockchain.com/bch
- ⚠️ Double-check all settings before using

### Network Configuration Details

The network configuration is centralized in `src/config/bch.js` and includes:
- REST API URLs
- WebSocket URLs
- Blockchain explorer URLs
- ZMQ connection settings
- Network-specific constants

All services (BCHService, ContractService, etc.) automatically use the configured network.

### Contract Deployment

Deploy contracts to specific networks:

```bash
# Deploy to testnet
npm run deploy:contracts:testnet

# Deploy to mainnet
npm run deploy:contracts:mainnet
```

## Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## API Documentation

The API documentation is available at `/api/public/docs` when running in development mode.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── services/        # Business logic services
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── jobs/            # Background jobs
│   ├── websocket/       # WebSocket server
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── contracts/           # CashScript contracts
├── scripts/             # Utility scripts
└── tests/               # Test files
```

## License

MIT
