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
