const { query } = require('../config/database');

class Transaction {
  static async create({
    txid,
    creatorId,
    paymentIntentId,
    intentId,
    amountSats,
    feeSats = 0,
    senderAddress,
    receiverAddress,
    paymentType = 1,
    contentId,
    payloadHex,
    payloadJson = {},
    blockHeight,
    confirmations = 0,
    isConfirmed = false,
    confirmedAt,
    metadata = {}
  }) {
    const result = await query(
      `INSERT INTO transactions (
        txid, creator_id, payment_intent_id, intent_id, amount_sats, fee_sats,
        sender_address, receiver_address, payment_type, content_id,
        payload_hex, payload_json, block_height, confirmations,
        is_confirmed, confirmed_at, metadata, indexed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      RETURNING *`,
      [
        txid,
        creatorId,
        paymentIntentId,
        intentId,
        amountSats,
        feeSats,
        senderAddress,
        receiverAddress,
        paymentType,
        contentId,
        payloadHex,
        JSON.stringify(payloadJson),
        blockHeight,
        confirmations,
        isConfirmed,
        confirmedAt,
        JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  }

  static async findByTxid(txid) {
    const result = await query(
      'SELECT * FROM transactions WHERE txid = $1',
      [txid]
    );
    return result.rows[0];
  }

  static async findByCreator(creatorId, options = {}) {
    const { limit = 50, offset = 0, confirmedOnly = false } = options;
    let queryStr = `
      SELECT * FROM transactions 
      WHERE creator_id = $1
    `;
    
    const params = [creatorId];
    let paramCount = 2;

    if (confirmedOnly) {
      queryStr += ` AND is_confirmed = true`;
    }

    queryStr += ` ORDER BY indexed_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);
    return result.rows;
  }

  static async getRecentByCreator(creatorId, limit = 10) {
    const result = await query(
      `SELECT * FROM transactions 
       WHERE creator_id = $1 
       ORDER BY indexed_at DESC 
       LIMIT $2`,
      [creatorId, limit]
    );
    return result.rows;
  }

  static async update(txid, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if ((key === 'payload_json' || key === 'metadata') && typeof value === 'object') {
          fields.push(`${key} = $${paramCount}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findByTxid(txid);
    }

    values.push(txid);

    const result = await query(
      `UPDATE transactions SET ${fields.join(', ')} 
       WHERE txid = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async getLastIndexedBlock() {
    const result = await query(
      `SELECT block_height FROM transactions 
       WHERE block_height IS NOT NULL 
       ORDER BY block_height DESC 
       LIMIT 1`
    );
    return result.rows[0];
  }

  static async getStats(creatorId, startDate, endDate) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN is_confirmed = true THEN 1 END) as confirmed_transactions,
        COALESCE(SUM(CASE WHEN is_confirmed = true THEN amount_sats ELSE 0 END), 0) as total_amount,
        COALESCE(AVG(CASE WHEN is_confirmed = true THEN amount_sats END), 0) as avg_amount,
        COUNT(DISTINCT sender_address) as unique_senders
       FROM transactions 
       WHERE creator_id = $1 
         AND ($2::timestamp IS NULL OR indexed_at >= $2)
         AND ($3::timestamp IS NULL OR indexed_at <= $3)`,
      [creatorId, startDate, endDate]
    );
    
    return result.rows[0];
  }
}

module.exports = Transaction;
