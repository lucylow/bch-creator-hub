const { query } = require('../config/database');
const logger = require('../utils/logger');

class CashToken {
  /**
   * Create a new CashToken record
   */
  static async create({
    creatorId = null,
    categoryId,
    tokenId = null,
    type = 'NFT', // 'NFT' or 'FUNGIBLE'
    ownerAddress,
    commitment = null,
    metadata = {},
    status = 'active', // 'active', 'pending_mint', 'spent'
    txid = null,
    outputIndex = null
  }) {
    try {
      const result = await query(
        `INSERT INTO cash_tokens (
          creator_id, category_id, token_id, type, owner_address,
          commitment, metadata, status, txid, output_index, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (category_id, token_id) 
        DO UPDATE SET 
          owner_address = EXCLUDED.owner_address,
          status = EXCLUDED.status,
          txid = EXCLUDED.txid,
          output_index = EXCLUDED.output_index,
          updated_at = NOW()
        RETURNING *`,
        [
          creatorId,
          categoryId,
          tokenId,
          type,
          ownerAddress,
          commitment,
          JSON.stringify(metadata),
          status,
          txid,
          outputIndex
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating CashToken:', error);
      throw error;
    }
  }

  /**
   * Find token by category and token ID
   */
  static async findByCategoryAndToken(categoryId, tokenId = null) {
    try {
      let sql = 'SELECT * FROM cash_tokens WHERE category_id = $1';
      const params = [categoryId];

      if (tokenId) {
        sql += ' AND token_id = $2';
        params.push(tokenId);
      } else {
        sql += ' AND token_id IS NULL';
      }

      sql += ' ORDER BY created_at DESC LIMIT 1';

      const result = await query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding CashToken:', error);
      throw error;
    }
  }

  /**
   * Find tokens by owner address
   */
  static async findByOwner(address, categoryId = null) {
    try {
      let sql = 'SELECT * FROM cash_tokens WHERE owner_address = $1 AND status = $2';
      const params = [address, 'active'];

      if (categoryId) {
        sql += ' AND category_id = $3';
        params.push(categoryId);
      }

      sql += ' ORDER BY created_at DESC';

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding tokens by owner:', error);
      throw error;
    }
  }

  /**
   * Find token by owner, category, and optional token ID
   */
  static async findByOwnerAndCategory(address, categoryId, tokenId = null) {
    try {
      let sql = `SELECT * FROM cash_tokens 
                 WHERE owner_address = $1 
                 AND category_id = $2 
                 AND status = $3`;
      const params = [address, categoryId, 'active'];

      if (tokenId) {
        sql += ' AND token_id = $4';
        params.push(tokenId);
      } else {
        sql += ' AND token_id IS NULL';
      }

      sql += ' ORDER BY created_at DESC LIMIT 1';

      const result = await query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding token by owner and category:', error);
      throw error;
    }
  }

  /**
   * Find tokens by creator
   */
  static async findByCreator(creatorId, type = null) {
    try {
      let sql = 'SELECT * FROM cash_tokens WHERE creator_id = $1';
      const params = [creatorId];

      if (type) {
        sql += ' AND type = $2';
        params.push(type);
      }

      sql += ' ORDER BY created_at DESC';

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Error finding tokens by creator:', error);
      throw error;
    }
  }

  /**
   * Find token by transaction and output index
   */
  static async findByTxidAndOutput(txid, outputIndex) {
    try {
      const result = await query(
        `SELECT * FROM cash_tokens 
         WHERE txid = $1 AND output_index = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [txid, outputIndex]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding token by txid and output:', error);
      throw error;
    }
  }

  /**
   * Update token record
   */
  static async update(id, updates) {
    try {
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

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      values.push(id);

      const result = await query(
        `UPDATE cash_tokens SET ${fields.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating CashToken:', error);
      throw error;
    }
  }

  /**
   * Mark token as spent
   */
  static async markAsSpent(txid, outputIndex) {
    try {
      const result = await query(
        `UPDATE cash_tokens 
         SET status = $1, updated_at = NOW()
         WHERE txid = $2 AND output_index = $3 
         RETURNING *`,
        ['spent', txid, outputIndex]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error marking token as spent:', error);
      throw error;
    }
  }

  /**
   * Find token by ID
   */
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM cash_tokens WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding CashToken by ID:', error);
      throw error;
    }
  }

  /**
   * Get token statistics for a creator
   */
  static async getStats(creatorId) {
    try {
      const result = await query(
        `SELECT 
          COUNT(*) as total_tokens,
          COUNT(CASE WHEN type = 'NFT' THEN 1 END) as nft_count,
          COUNT(CASE WHEN type = 'FUNGIBLE' THEN 1 END) as fungible_count,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
         FROM cash_tokens 
         WHERE creator_id = $1`,
        [creatorId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting token stats:', error);
      throw error;
    }
  }

  /**
   * Get all tokens in a category
   */
  static async findByCategory(categoryId, limit = 100) {
    try {
      const result = await query(
        `SELECT * FROM cash_tokens 
         WHERE category_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [categoryId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error finding tokens by category:', error);
      throw error;
    }
  }
}

module.exports = CashToken;



