const express = require('express');
const router = express.Router();
const BCHService = require('../services/bch.service');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');

/**
 * GET /api/wallet/balance/:address
 * Public endpoint: return BCH balance for a given address (confirmed, unconfirmed, total in satoshis).
 * Used by the frontend when BCHProvider direct API fetch fails or as primary source.
 */
router.get(
  '/balance/:address',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    if (!address || typeof address !== 'string') {
      throw new ValidationError('Address is required', { context: { address } });
    }
    const valid = BCHService.validateAddress(address);
    if (!valid) {
      throw new ValidationError('Invalid Bitcoin Cash address', { context: { address } });
    }
    const balance = await BCHService.getBalance(address);
    res.json({
      success: true,
      data: {
        confirmed: balance.confirmed,
        unconfirmed: balance.unconfirmed,
        total: balance.total ?? balance.confirmed + balance.unconfirmed
      }
    });
  })
);

module.exports = router;
