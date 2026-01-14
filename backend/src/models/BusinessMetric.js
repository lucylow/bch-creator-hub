const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BusinessMetric {
  static async create({
    metricDate,
    metricType,
    creatorId = null,
    value,
    metadata = {}
  }) {
    // Use ON CONFLICT to update if exists
    const result = await query(
      `INSERT INTO business_metrics (
        id, metric_date, metric_type, creator_id, value, metadata, created_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      ON CONFLICT (metric_date, metric_type, creator_id) 
      DO UPDATE SET value = $4, metadata = $5, created_at = NOW()
      RETURNING *`,
      [
        metricDate,
        metricType,
        creatorId,
        value,
        JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  }

  static async findByType(metricType, startDate, endDate, creatorId = null) {
    let queryStr = `
      SELECT * FROM business_metrics 
      WHERE metric_type = $1
        AND metric_date >= $2
        AND metric_date <= $3
    `;
    const params = [metricType, startDate, endDate];

    if (creatorId) {
      queryStr += ' AND creator_id = $4';
      params.push(creatorId);
    }

    queryStr += ' ORDER BY metric_date ASC';

    const result = await query(queryStr, params);
    return result.rows;
  }

  static async getAggregate(metricType, startDate, endDate, creatorId = null) {
    let queryStr = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total,
        COALESCE(AVG(value), 0) as average,
        COALESCE(MIN(value), 0) as min,
        COALESCE(MAX(value), 0) as max
      FROM business_metrics 
      WHERE metric_type = $1
        AND metric_date >= $2
        AND metric_date <= $3
    `;
    const params = [metricType, startDate, endDate];

    if (creatorId) {
      queryStr += ' AND creator_id = $4';
      params.push(creatorId);
    }

    const result = await query(queryStr, params);
    return result.rows[0];
  }

  static async getLatest(metricType, creatorId = null) {
    let queryStr = `
      SELECT * FROM business_metrics 
      WHERE metric_type = $1
    `;
    const params = [metricType];

    if (creatorId) {
      queryStr += ' AND creator_id = $2';
      params.push(creatorId);
    }

    queryStr += ' ORDER BY metric_date DESC LIMIT 1';

    const result = await query(queryStr, params);
    return result.rows[0];
  }
}

module.exports = BusinessMetric;
