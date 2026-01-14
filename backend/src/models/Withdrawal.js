const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Withdrawal {
  static async create({
    creatorId,
    amountSats,
    feeSats,
    toAddress,
    metadata = {}
  }) {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO withdrawals (
        id, creator_id, amount_sats, fee_sats, to_address, status, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())
      RETURNING *`,
      [
        id,
        creatorId,
        amountSats,
        feeSats,
        toAddress,
        JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM withdrawals WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByCreator(creatorId, options = {}) {
    const { limit = 50, offset = 0, status } = options;
    let queryStr = `
      SELECT * FROM withdrawals 
      WHERE creator_id = $1
    `;
    
    const params = [creatorId];
    let paramCount = 2;

    if (status) {
      queryStr += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);
    return result.rows;
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

    values.push(id);

    const result = await query(
      `UPDATE withdrawals SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async updateStatus(id, status, txid = null, failureReason = null) {
    const updates = { status };
    if (txid) updates.txid = txid;
    if (failureReason) updates.failure_reason = failureReason;
    
    if (status === 'processing') {
      updates.processed_at = new Date();
    } else if (status === 'completed') {
      updates.completed_at = new Date();
    }

    return this.update(id, updates);
  }
}

module.exports = Withdrawal;

