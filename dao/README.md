# DAO Governance System

A complete, production-ready token-weighted DAO implementation using Solidity + OpenZeppelin contracts. This module provides:

- **GovernanceToken** (ERC20Votes) - Token representing voting power
- **TimelockController** - Enforces delay between proposal queueing and execution
- **Governor Contract** - Handles proposal creation, voting, and lifecycle
- **Treasury Contract** - Holds funds and exposes privileged functions
- **React Frontend** - UI for proposing, voting, queueing, and executing
- **Event Indexer** - Indexes ProposalCreated events for the frontend

## Architecture

This DAO follows the standard OpenZeppelin Governor + Timelock + ERC20Votes pattern:

1. Token holders vote on proposals
2. Proposals are queued through the Timelock
3. After the delay period, proposals can be executed
4. The Treasury is controlled by the Timelock (via governance)

## Setup

### Prerequisites

- Node.js 16+
- Hardhat
- An Ethereum node (local or remote)

### Install Dependencies

```bash
cd dao
npm install
```

### Deploy Contracts

**Note**: The deployment script uses OpenZeppelin's `TimelockController` contract. Hardhat will automatically compile it from `@openzeppelin/contracts`. If you encounter issues, ensure OpenZeppelin contracts are installed (`npm install @openzeppelin/contracts`).

1. Start a local Hardhat node (in a separate terminal):
```bash
npm run node
```

2. Deploy contracts:
```bash
npm run deploy:local
```

3. Save the deployed addresses to environment variables (see `.env.example`)

### Run Tests

```bash
npm test
```

## Frontend

The React frontend is in the `frontend/` directory.

### Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your contract addresses and RPC URL
npm start
```

### Environment Variables

Create `frontend/.env`:

```
REACT_APP_RPC_URL=http://127.0.0.1:8545
REACT_APP_GOVERNOR_ADDRESS=0x...
REACT_APP_TOKEN_ADDRESS=0x...
REACT_APP_TIMELOCK_ADDRESS=0x...
REACT_APP_TREASURY_ADDRESS=0x...
REACT_APP_INDEXER_URL=http://localhost:3002
```

## Indexer

The indexer listens for `ProposalCreated` events and stores them in a JSON database.

### Setup Indexer

```bash
cd indexer
npm install
```

### Run Indexer

```bash
RPC_URL=http://127.0.0.1:8545 GOVERNOR_ADDRESS=0x... node indexer.js
```

Or create an `.env` file:

```
RPC_URL=http://127.0.0.1:8545
GOVERNOR_ADDRESS=0x...
PORT=3002
```

The indexer serves an HTTP API at `http://localhost:3002`:
- `GET /proposals` - List all proposals
- `GET /proposals/:id` - Get specific proposal

## Security Notes

- **Timelock Delay**: Use meaningful delays in production (24-72 hours)
- **Proposal Threshold**: Consider setting a minimum token requirement to propose
- **Quorum**: Consider adding quorum requirements using `GovernorVotesQuorumFraction`
- **Role Management**: After deployment, ensure timelock is the admin for DAO-controlled contracts
- **Audits**: Run internal audits and consider third-party auditing before mainnet deployment

## Integration with BCH Project

**Note**: This DAO implementation is for Ethereum/EVM chains. Your main project uses Bitcoin Cash (BCH).

For BCH-based governance, you would need:
- Off-chain governance (Snapshot-style)
- Multisig treasury
- CashToken-based membership tokens
- Signature-based voting

This Ethereum DAO can coexist as a separate module if you want to operate on both chains, or it can serve as a reference implementation.

## License

MIT

