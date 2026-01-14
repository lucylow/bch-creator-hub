const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUS } = require('../config/constants');

class Subscription {
  static async create({
    creatorId,
    tier,
    paymentTxid = null,
    paymentAmountSats = null,
    billingPeriodStart,
    billingPeriodEnd,
    status = SUBSCRIPTION_STATUS.ACTIVE,
    metadata = {}
  }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO subscriptions (
        id, creator_id, tier, status, payment_txid, payment_amount_sats,
        billing_period_start, billing_period_end, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        id,
        creatorId,
        tier,
        status,
        paymentTxid,
        paymentAmountSats,
        billingPeriodStart,
        billingPeriodEnd,
        JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  }

  static async findByCreatorId(creatorId) {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE creator_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [creatorId]
    );
    return result.rows[0];
  }

  static async findActiveByCreatorId(creatorId) {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE creator_id = $1 
         AND status IN ('${SUBSCRIPTION_STATUS.ACTIVE}', '${SUBSCRIPTION_STATUS.TRIAL}')
         AND billing_period_end > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [creatorId]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM subscriptions WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
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
      return this.findById(id);
    }

    fields.push('updated_at = $' + paramCount);
    values.push(new Date());
    values.push(id);

    const result = await query(
      `UPDATE subscriptions SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async cancel(id) {
    return this.update(id, {
      status: SUBSCRIPTION_STATUS.CANCELED,
      canceled_at: new Date()
    });
  }

  static async renew(id, billingPeriodEnd) {
    return this.update(id, {
      billing_period_end: billingPeriodEnd,
      status: SUBSCRIPTION_STATUS.ACTIVE
    });
  }

  static async findByStatus(status, limit = 100) {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [status, limit]
    );
    return result.rows;
  }

  static async findExpiring(withinDays = 7) {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE status IN ('${SUBSCRIPTION_STATUS.ACTIVE}', '${SUBSCRIPTION_STATUS.TRIAL}')
         AND billing_period_end BETWEEN NOW() AND NOW() + INTERVAL '${withinDays} days'
       ORDER BY billing_period_end ASC`
    );
    return result.rows;
  }

  static async getStats(creatorId) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = '${SUBSCRIPTION_STATUS.ACTIVE}' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = '${SUBSCRIPTION_STATUS.CANCELED}' THEN 1 END) as canceled_count,
        COALESCE(SUM(payment_amount_sats), 0) as total_revenue_sats
       FROM subscriptions 
       WHERE creator_id = $1`,
      [creatorId]
    );
    return result.rows[0];
  }
}

module.exports = Subscription;
