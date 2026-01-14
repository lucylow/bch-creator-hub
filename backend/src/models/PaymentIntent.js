const { query } = require('../config/database');
const { generateRandomId } = require('../utils/generators');

class PaymentIntent {
  static async create({
    creatorId,
    intentType = 1,
    amountSats,
    amountUsd,
    title,
    description,
    contentUrl,
    contentId,
    metadata = {},
    isRecurring = false,
    recurrenceInterval,
    expiresAt
  }) {
    const intentId = generateRandomId(16);
    const createdAt = new Date();

    const result = await query(
      `INSERT INTO payment_intents (
        creator_id, intent_id, intent_type, amount_sats, amount_usd,
        title, description, content_url, content_id, metadata,
        is_recurring, recurrence_interval, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        creatorId,
        intentId,
        intentType,
        amountSats,
        amountUsd,
        title,
        description,
        contentUrl,
        contentId,
        JSON.stringify(metadata),
        isRecurring,
        recurrenceInterval,
        expiresAt,
        createdAt,
        createdAt
      ]
    );

    return result.rows[0];
  }

  static async findById(intentId) {
    const result = await query(
      `SELECT pi.*, c.display_name, c.avatar_url, c.contract_address
       FROM payment_intents pi
       JOIN creators c ON pi.creator_id = c.creator_id
       WHERE pi.intent_id = $1 AND pi.is_active = true`,
      [intentId]
    );
    return result.rows[0];
  }

  static async findByCreator(creatorId, options = {}) {
    const { limit = 50, offset = 0, activeOnly = true } = options;
    let queryStr = `
      SELECT * FROM payment_intents 
      WHERE creator_id = $1
    `;
    
    const params = [creatorId];
    let paramCount = 2;

    if (activeOnly) {
      queryStr += ` AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())`;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);
    return result.rows;
  }

  static async update(intentId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'metadata' && typeof value === 'object') {
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
      return this.findById(intentId);
    }

    fields.push('updated_at = $' + paramCount);
    values.push(new Date());
    values.push(intentId);

    const result = await query(
      `UPDATE payment_intents SET ${fields.join(', ')} 
       WHERE intent_id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async deactivate(intentId) {
    const result = await query(
      `UPDATE payment_intents SET is_active = false, updated_at = $1 
       WHERE intent_id = $2 
       RETURNING *`,
      [new Date(), intentId]
    );
    return result.rows[0];
  }

  static async getStats(creatorId) {
    const result = await query(
      `SELECT 
        intent_type,
        COUNT(*) as count,
        COALESCE(SUM(amount_sats), 0) as total_amount,
        AVG(amount_sats) as avg_amount
       FROM payment_intents 
       WHERE creator_id = $1 AND is_active = true
       GROUP BY intent_type`,
      [creatorId]
    );
    
    return result.rows;
  }
}

module.exports = PaymentIntent;
