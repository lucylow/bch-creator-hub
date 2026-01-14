const express = require('express');
const router = express.Router();
const Creator = require('../models/Creator');
const PaymentIntent = require('../models/PaymentIntent');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

// API status
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// Public creator info
router.get('/creators/:creatorId', asyncHandler(async (req, res) => {
  const { creatorId } = req.params;
  
  const creator = await Creator.findByCreatorId(creatorId);
  
  if (!creator || !creator.is_active) {
    throw new NotFoundError('Creator');
  }

  // Return public info only
  const publicInfo = {
    creator_id: creator.creator_id,
    display_name: creator.display_name,
    avatar_url: creator.avatar_url,
    bio: creator.bio,
    website: creator.website,
    twitter_handle: creator.twitter_handle,
    created_at: creator.created_at,
    contract_address: creator.contract_address
  };

  res.json({
    success: true,
    data: publicInfo
  });
}));

// Payment intent details (public)
router.get('/payment-intents/:intentId', asyncHandler(async (req, res) => {
  const { intentId } = req.params;
  
  const paymentIntent = await PaymentIntent.findById(intentId);
  
  if (!paymentIntent || !paymentIntent.is_active) {
    throw new NotFoundError('Payment intent');
  }

  res.json({
    success: true,
    data: paymentIntent
  });
}));

module.exports = router;
