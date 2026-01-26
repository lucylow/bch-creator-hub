# Environment Variables

This document lists environment variables used across BCH Creator Hub. Not every app or script uses every variable — only set what your setup needs.

---

## Frontend (Vite / `src/`)

Create a `.env` file in the **project root** (next to `package.json`). Vite exposes only variables prefixed with `VITE_`.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001` or `http://localhost:3001/api` |
| `VITE_WS_URL` | WebSocket URL for real-time updates | `ws://localhost:3001` |
| `VITE_BCH_NETWORK` | BCH network | `testnet` or `mainnet` |
| `VITE_DEMO_MODE` | Use demo/mock data when `true` | `true` / `false` |
| `VITE_NFT_ADDRESS` | EVM NFT collection address (optional) | `0x...` |
| `VITE_MARKETPLACE_ADDRESS` | EVM marketplace contract address (optional) | `0x...` |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID (optional) | From [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| `VITE_SUPABASE_URL` | Supabase project URL (optional) | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key (optional) | From [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `PORT` | Dev server port (optional; Vite uses this when set) | `8080` or `3000` |

See also: [Quick Start](../README.md#quick-start), [WEB3_INTEGRATION.md](../WEB3_INTEGRATION.md#environment-variables), [NFT_SETUP.md](./NFT_SETUP.md).

### Lovable publish

When publishing with [Lovable](https://lovable.dev), the frontend is built with Vite. Only `VITE_*` (and `PORT` for the dev server) are available; use the table above. The app uses `import.meta.env.VITE_*` everywhere (no `process.env.NEXT_PUBLIC_*`). Build command: `npm run build` (output: `dist/`).

---

## Backend (`backend/`)

Create a `.env` file in the **`backend/`** directory. Copy from `backend/.env.example` if it exists.

### Server

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3001` |
| `NODE_ENV` | Environment | `development` or `production` |

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:password@localhost:5432/bch_creator_hub` |
| `DB_POOL_MAX` | Max connections in pool (optional) | `20` |

### Redis

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

### Blockchain / BCH

| Variable | Description | Example |
|----------|-------------|---------|
| `BCH_NETWORK` | BCH network | `testnet` or `mainnet` |
| `ZMQ_URL` | ZMQ hashblock endpoint (for indexer) | `tcp://127.0.0.1:28332` |
| `BCHJS_REST_URL` / `BCH_REST_URL` | BCH REST/indexer API base | `https://rest.kingbch.com/v5/` or `https://api.fullstack.cash/v5/` |
| `BCHJS_API_TOKEN` / `BCH_API_TOKEN` | API token for BCH REST (if required) | (your token) |

### Supabase (optional)

When using Supabase from the backend (e.g. Auth, Realtime, or service-role access):

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only; never expose to frontend) | From [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |

### Stripe (optional)

When set, the payment page offers a "Pay with card" option and redirects to Stripe Checkout. Webhook events record payments in the same transactions table with `metadata.source = 'stripe'`.

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only; never expose to frontend) | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for Stripe webhooks (from Stripe Dashboard → Developers → Webhooks) | `whsec_...` |

Configure the webhook in Stripe to send `checkout.session.completed` to `https://your-api-host/api/stripe/webhook`. Use **Listen to events on your account** or **Listen to events on a Connect account** and add the endpoint; Stripe will show the signing secret.

### Auth / Security

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing JWTs. **Use a long random value in production.** | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` or `24h` |

### CORS / HTTP

| Variable | Description | Example |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated origins for CORS | `http://localhost:8080,http://localhost:3000` |

### Service / Fees

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVICE_FEE_BASIS_POINTS` | Platform fee in basis points (e.g. 100 = 1%) | `100` |
| `SERVICE_PUBKEY` | Service public key for fee output (optional) | (hex or CashAddr) |

See also: [README – Backend Setup](../README.md#backend-setup), [backend/README.md](../backend/README.md), [backend/docs/SECURITY.md](../backend/docs/SECURITY.md).

---

## Contracts (EVM / `contracts/`)

Used by Hardhat for deployment and scripts. Create `.env` in the **`contracts/`** directory.

| Variable | Description | Example |
|----------|-------------|---------|
| `SEPOLIA_RPC_URL` | Sepolia RPC URL (or other network) | `https://sepolia.infura.io/v3/YOUR_KEY` |
| `PRIVATE_KEY` | Deployer private key (no `0x` prefix ok) | (your key) |

See: [NFT_SETUP.md](./NFT_SETUP.md), [contracts/README.md](../contracts/README.md).

---

## Scripts and extras

| Variable | Where | Description |
|----------|--------|-------------|
| `NFT_STORAGE_KEY` | Root or `scripts/ipfs` | [nft.storage](https://nft.storage/) API key for IPFS uploads |
| `SELLER_PRIVATE_KEY` | Voucher scripts | Seller key for signing lazy-mint vouchers |
| `MARKETPLACE_ADDRESS` | Voucher scripts | Marketplace contract address for voucher verification |

---

## Docker

When using `docker-compose`, set variables in the compose file or via env files. Typical overrides:

- `DATABASE_URL` → Postgres service hostname (e.g. `db`) and credentials
- `REDIS_URL` → Redis service (e.g. `redis://redis:6379`)
- `ALLOWED_ORIGINS` → Include frontend URL used in browser

See: [README – Deployment](../README.md#deployment).

---

## Security notes

- **Never commit** `.env` or files containing secrets. They are in `.gitignore`.
- Use **strong, unique `JWT_SECRET`** in production (e.g. `openssl rand -hex 32`).
- Keep **contract deployer and seller keys** only in local env or a secure secret manager.
