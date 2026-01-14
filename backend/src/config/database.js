const { Pool } = require('pg');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bch_paywall_router',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Enhanced connection options
  statement_timeout: 30000, // 30 seconds
  query_timeout: 30000,
  application_name: 'bch-paywall-router'
});

// Test connection
pool.on('connect', (client) => {
  logger.info('Database connected successfully', {
    processId: client.processID,
    database: client.database
  });
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', {
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    }
  });
  
  // Only exit on critical errors, not on connection errors
  const criticalErrors = ['42P01', '3D000', '08006'];
  if (err.code && criticalErrors.includes(err.code)) {
    logger.error('Critical database error, exiting process');
    process.exit(-1);
  }
});

// Enhanced query wrapper with error handling
const queryWithErrorHandling = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        duration: `${duration}ms`,
        query: text.substring(0, 100) // First 100 chars
      });
    }
    
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    
    // Convert PostgreSQL errors to DatabaseError
    if (err.code && err.code.match(/^[0-9A-Z]{5}$/)) {
      const dbError = DatabaseError.fromPostgresError(err, {
        query: text.substring(0, 200), // First 200 chars for context
        duration: `${duration}ms`
      });
      
      logger.error('Database query error:', {
        error: dbError.toJSON(),
        query: text.substring(0, 100)
      });
      
      throw dbError;
    }
    
    // Log unexpected errors
    logger.error('Unexpected database error:', {
      error: {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
      },
      query: text.substring(0, 100),
      duration: `${duration}ms`
    });
    
    throw err;
  }
};

// Create tables if they don't exist
const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS creators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id CHAR(16) UNIQUE NOT NULL,
        wallet_address VARCHAR(64) NOT NULL UNIQUE,
        contract_address VARCHAR(64),
        pub_key_hex VARCHAR(130) NOT NULL,
        display_name VARCHAR(100),
        email VARCHAR(255),
        avatar_url TEXT,
        bio TEXT,
        website TEXT,
        twitter_handle VARCHAR(50),
        fee_basis_points INTEGER DEFAULT 100,
        subscription_tier VARCHAR(20) DEFAULT 'free',
        subscription_status VARCHAR(20) DEFAULT 'active',
        subscription_expires_at TIMESTAMP,
        service_pubkey VARCHAR(200),
        payout_pubkey VARCHAR(200),
        fee_opt_in BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_creators_creator_id ON creators(creator_id);
      CREATE INDEX IF NOT EXISTS idx_creators_wallet_address ON creators(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_creators_contract_address ON creators(contract_address);

      CREATE TABLE IF NOT EXISTS payment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
        intent_id CHAR(16) UNIQUE NOT NULL,
        intent_type INTEGER NOT NULL DEFAULT 1,
        amount_sats BIGINT,
        amount_usd DECIMAL(10,2),
        title VARCHAR(200),
        description TEXT,
        content_url TEXT,
        content_id VARCHAR(32),
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_interval VARCHAR(20),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_payment_intents_creator_id ON payment_intents(creator_id);
      CREATE INDEX IF NOT EXISTS idx_payment_intents_intent_id ON payment_intents(intent_id);

      CREATE TABLE IF NOT EXISTS transactions (
        id BIGSERIAL PRIMARY KEY,
        txid VARCHAR(64) UNIQUE NOT NULL,
        creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
        payment_intent_id UUID REFERENCES payment_intents(id),
        intent_id CHAR(16),
        amount_sats BIGINT NOT NULL,
        fee_sats BIGINT DEFAULT 0,
        sender_address VARCHAR(64) NOT NULL,
        receiver_address VARCHAR(64) NOT NULL,
        payment_type INTEGER NOT NULL DEFAULT 1,
        content_id VARCHAR(32),
        payload_hex TEXT,
        payload_json JSONB DEFAULT '{}',
        block_height INTEGER,
        confirmations INTEGER DEFAULT 0,
        is_confirmed BOOLEAN DEFAULT FALSE,
        confirmed_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        indexed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_creator_id ON transactions(creator_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
      CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_address);
      CREATE INDEX IF NOT EXISTS idx_transactions_confirmed_at ON transactions(confirmed_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(indexed_at);

      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
        txid VARCHAR(64) UNIQUE,
        amount_sats BIGINT NOT NULL,
        fee_sats BIGINT NOT NULL,
        to_address VARCHAR(64) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        failure_reason TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_withdrawals_creator_id ON withdrawals(creator_id);
      CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        secret VARCHAR(64),
        events TEXT[] DEFAULT '{"payment.received", "payment.confirmed", "withdrawal.completed"}',
        is_active BOOLEAN DEFAULT TRUE,
        last_triggered_at TIMESTAMP,
        failure_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
        key_hash VARCHAR(128) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        last_four VARCHAR(4),
        permissions TEXT[] DEFAULT '["read"]',
        is_active BOOLEAN DEFAULT TRUE,
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        points INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

      CREATE TABLE IF NOT EXISTS cache (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id CHAR(16) NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
        tier VARCHAR(20) NOT NULL DEFAULT 'free',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        payment_txid VARCHAR(64),
        payment_amount_sats BIGINT,
        billing_period_start TIMESTAMP NOT NULL,
        billing_period_end TIMESTAMP NOT NULL,
        canceled_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON subscriptions(creator_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(billing_period_end);

      CREATE TABLE IF NOT EXISTS business_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_date DATE NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        creator_id CHAR(16) REFERENCES creators(creator_id) ON DELETE SET NULL,
        value DECIMAL(20, 8) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(metric_date, metric_type, creator_id)
      );

      CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON business_metrics(metric_date);
      CREATE INDEX IF NOT EXISTS idx_business_metrics_type ON business_metrics(metric_type);

      -- Contract UTXOs table (populated by indexer)
      CREATE TABLE IF NOT EXISTS contract_utxos (
        id BIGSERIAL PRIMARY KEY,
        contract_address TEXT NOT NULL,
        txid VARCHAR(100) NOT NULL,
        vout INT NOT NULL,
        satoshis BIGINT NOT NULL,
        script_pubkey TEXT,
        spent BOOLEAN DEFAULT FALSE,
        first_seen_at TIMESTAMP DEFAULT NOW(),
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
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_withdraw_requests_creator ON withdraw_requests(creator_id, status);
      CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status, expires_at);

      -- Add payout_address column to creators if it doesn't exist
      ALTER TABLE creators ADD COLUMN IF NOT EXISTS payout_address VARCHAR(64);
    `);

    logger.info('Database tables created/verified');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query: queryWithErrorHandling,
  getClient: () => pool.connect(),
  initDatabase,
  pool,
  // Helper to get client with error handling
  getClientWithErrorHandling: async () => {
    try {
      const client = await pool.connect();
      
      // Wrap client.query with error handling
      const originalQuery = client.query.bind(client);
      client.query = async (text, params) => {
        try {
          return await originalQuery(text, params);
        } catch (err) {
          if (err.code && err.code.match(/^[0-9A-Z]{5}$/)) {
            throw DatabaseError.fromPostgresError(err, {
              query: text?.substring(0, 200)
            });
          }
          throw err;
        }
      };
      
      return client;
    } catch (err) {
      if (err.code && err.code.match(/^[0-9A-Z]{5}$/)) {
        throw DatabaseError.fromPostgresError(err);
      }
      throw err;
    }
  }
};
