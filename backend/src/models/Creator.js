const crypto = require('crypto');
const { query } = require('../config/database');
const { generateRandomId } = require('../utils/generators');
const { ValidationError, ConflictError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class Creator {
  static async create({
    walletAddress,
    pubKeyHex,
    displayName,
    email,
    avatarUrl,
    bio,
    website,
    twitterHandle,
    feeBasisPoints = 100
  }) {
    const creatorId = generateRandomId(16);
    const createdAt = new Date();
    
    const result = await query(
      `INSERT INTO creators (
        creator_id, wallet_address, pub_key_hex, display_name,
        email, avatar_url, bio, website, twitter_handle,
        fee_basis_points, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        creatorId,
        walletAddress,
        pubKeyHex,
        displayName,
        email,
        avatarUrl,
        bio,
        website,
        twitterHandle,
        feeBasisPoints,
        createdAt,
        createdAt
      ]
    );
    
    return result.rows[0];
  }

  static async findByWalletAddress(walletAddress) {
    const result = await query(
      'SELECT * FROM creators WHERE wallet_address = $1',
      [walletAddress]
    );
    return result.rows[0];
  }

  static async findByCreatorId(creatorId) {
    const result = await query(
      'SELECT * FROM creators WHERE creator_id = $1',
      [creatorId]
    );
    return result.rows[0];
  }

  static async findByContractAddress(contractAddress) {
    const result = await query(
      'SELECT * FROM creators WHERE contract_address = $1',
      [contractAddress]
    );
    return result.rows[0];
  }

  static async update(creatorId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findByCreatorId(creatorId);
    }

    fields.push('updated_at = $' + paramCount);
    values.push(new Date());
    values.push(creatorId);

    const result = await query(
      `UPDATE creators SET ${fields.join(', ')} 
       WHERE creator_id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async updateContractAddress(creatorId, contractAddress) {
    const result = await query(
      `UPDATE creators SET 
        contract_address = $1,
        updated_at = $2
       WHERE creator_id = $3 
       RETURNING *`,
      [contractAddress, new Date(), creatorId]
    );
    return result.rows[0];
  }

  static async updateLastLogin(creatorId) {
    await query(
      'UPDATE creators SET last_login_at = $1 WHERE creator_id = $2',
      [new Date(), creatorId]
    );
  }

  static async getStats(creatorId, startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount_sats), 0) as total_earnings,
        COALESCE(AVG(amount_sats), 0) as avg_transaction,
        COUNT(DISTINCT sender_address) as unique_supporters,
        COALESCE(SUM(CASE WHEN indexed_at >= NOW() - INTERVAL '1 day' THEN amount_sats ELSE 0 END), 0) as today_earnings,
        COALESCE(SUM(CASE WHEN indexed_at >= NOW() - INTERVAL '30 days' THEN amount_sats ELSE 0 END), 0) as monthly_earnings
       FROM transactions 
       WHERE creator_id = $1 
         AND is_confirmed = true
         AND ($2::timestamp IS NULL OR indexed_at >= $2)
         AND ($3::timestamp IS NULL OR indexed_at <= $3)`,
      [creatorId, startDate, endDate]
    );
    
    return result.rows[0];
  }

  static async getBalance(creatorId) {
    const result = await query(
      `SELECT 
        COALESCE(SUM(amount_sats), 0) as total_balance,
        COALESCE(SUM(CASE WHEN confirmations < 3 THEN amount_sats ELSE 0 END), 0) as unconfirmed_balance
       FROM transactions 
       WHERE creator_id = $1 
         AND is_confirmed = true
         AND txid NOT IN (SELECT txid FROM withdrawals WHERE status = 'completed')`,
      [creatorId]
    );
    
    return result.rows[0];
  }

  static async search(searchTerm, limit = 20) {
    const result = await query(
      `SELECT creator_id, display_name, avatar_url, bio, website, created_at
       FROM creators 
       WHERE is_active = true 
         AND (display_name ILIKE $1 OR creator_id ILIKE $1 OR wallet_address ILIKE $1)
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    
    return result.rows;
  }

  static async getSubscriptionTier(creatorId) {
    const creator = await this.findByCreatorId(creatorId);
    return creator ? (creator.subscription_tier || 'free') : 'free';
  }

  static async updateSubscriptionTier(creatorId, tier, expiresAt = null) {
    const updates = { subscription_tier: tier };
    if (expiresAt) {
      updates.subscription_expires_at = expiresAt;
    }
    return this.update(creatorId, updates);
  }

  static async getFeeOptIn(creatorId) {
    const creator = await this.findByCreatorId(creatorId);
    return creator ? (creator.fee_opt_in !== false) : true; // Default to true
  }
}

module.exports = Creator;
