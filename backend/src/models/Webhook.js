const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateRandomHex } = require('../utils/generators');

class Webhook {
  static async create({
    creatorId,
    url,
    events = ['payment.received', 'payment.confirmed', 'withdrawal.completed'],
    isActive = true
  }) {
    const id = uuidv4();
    const secret = generateRandomHex(32);
    
    const result = await query(
      `INSERT INTO webhooks (
        id, creator_id, url, secret, events, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *`,
      [
        id,
        creatorId,
        url,
        secret,
        events,
        isActive
      ]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM webhooks WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByCreator(creatorId, activeOnly = true) {
    let queryStr = 'SELECT * FROM webhooks WHERE creator_id = $1';
    const params = [creatorId];
    
    if (activeOnly) {
      queryStr += ' AND is_active = true';
    }
    
    queryStr += ' ORDER BY created_at DESC';
    
    const result = await query(queryStr, params);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'events' && Array.isArray(value)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
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
      `UPDATE webhooks SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async incrementFailureCount(id) {
    const result = await query(
      `UPDATE webhooks SET 
        failure_count = failure_count + 1,
        updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async updateLastTriggered(id) {
    await query(
      'UPDATE webhooks SET last_triggered_at = NOW(), failure_count = 0 WHERE id = $1',
      [id]
    );
  }

  static async deactivate(id) {
    return this.update(id, { is_active: false });
  }
}

module.exports = Webhook;

