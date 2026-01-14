-- Additional schema for OP_RETURN payment system
-- This extends the existing schema in database.js

-- Meta table for indexer state
CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT
);

-- Blocks table for reorg handling
CREATE TABLE IF NOT EXISTS blocks (
  height INT PRIMARY KEY,
  block_hash VARCHAR(100) NOT NULL,
  prev_hash VARCHAR(100) NOT NULL,
  inserted_at timestamptz DEFAULT now()
);

-- Ensure creators table has required columns for contract system
-- (These may already exist, but ensuring compatibility)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS service_pubkey VARCHAR(200);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_pubkey VARCHAR(200);

-- Payments table for OP_RETURN indexed payments
-- Note: This extends the existing transactions table, but provides a simpler structure
-- for the OP_RETURN payment flow
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  txid VARCHAR(80) NOT NULL UNIQUE,
  creator_id CHAR(16) REFERENCES creators(creator_id),
  intent_type SMALLINT,
  content_id VARCHAR(128),
  sender_address VARCHAR(100),
  amount_sats BIGINT,
  payload_hex TEXT,
  block_height INT,
  block_hash VARCHAR(100),
  confirmed_at timestamptz,
  inserted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_creator ON payments(creator_id, confirmed_at);
CREATE INDEX IF NOT EXISTS idx_payments_block ON payments(block_height);
CREATE INDEX IF NOT EXISTS idx_payments_txid ON payments(txid);

-- Contract UTXOs table (populated by indexer)
CREATE TABLE IF NOT EXISTS contract_utxos (
  id BIGSERIAL PRIMARY KEY,
  contract_address TEXT NOT NULL,
  txid VARCHAR(100) NOT NULL,
  vout INT NOT NULL,
  satoshis BIGINT NOT NULL,
  script_pubkey TEXT,
  spent BOOLEAN DEFAULT FALSE,
  first_seen_at timestamptz DEFAULT now(),
  UNIQUE(contract_address, txid, vout)
);

CREATE INDEX IF NOT EXISTS idx_contract_utxos_address ON contract_utxos(contract_address, spent);
CREATE INDEX IF NOT EXISTS idx_contract_utxos_txid ON contract_utxos(txid, vout);

-- Withdraw requests: store skeletons to validate later
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  utxos JSONB NOT NULL,
  raw_unsigned_hex TEXT NOT NULL,
  totals JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_creator ON withdraw_requests(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status, expires_at);

-- Add payout_address column to creators if it doesn't exist
ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_address VARCHAR(64);

-- CashTokens table for tracking CashToken NFTs and fungible tokens
CREATE TABLE IF NOT EXISTS cash_tokens (
  id BIGSERIAL PRIMARY KEY,
  creator_id CHAR(16) REFERENCES creators(creator_id) ON DELETE SET NULL,
  category_id VARCHAR(80) NOT NULL,
  token_id VARCHAR(80),
  type VARCHAR(20) NOT NULL DEFAULT 'NFT', -- 'NFT' or 'FUNGIBLE'
  owner_address VARCHAR(100) NOT NULL,
  commitment TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending_mint', 'spent'
  txid VARCHAR(80),
  output_index INT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, token_id)
);

CREATE INDEX IF NOT EXISTS idx_cash_tokens_owner ON cash_tokens(owner_address, status);
CREATE INDEX IF NOT EXISTS idx_cash_tokens_category ON cash_tokens(category_id);
CREATE INDEX IF NOT EXISTS idx_cash_tokens_creator ON cash_tokens(creator_id);
CREATE INDEX IF NOT EXISTS idx_cash_tokens_txid ON cash_tokens(txid, output_index);
CREATE INDEX IF NOT EXISTS idx_cash_tokens_status ON cash_tokens(status);

-- Add token_category_id column to creators for subscription tokens
ALTER TABLE creators ADD COLUMN IF NOT EXISTS token_category_id VARCHAR(80);

