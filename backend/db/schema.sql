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

