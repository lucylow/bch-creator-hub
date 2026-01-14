const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateWebhook } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(verifyToken);

// Webhook routes
router.post('/webhooks', validateWebhook, webhookController.create);
router.get('/webhooks', webhookController.getWebhooks);
router.put('/webhooks/:id', validateWebhook, webhookController.update);
router.delete('/webhooks/:id', webhookController.delete);

// Analytics routes
router.get('/analytics', analyticsController.getAnalytics);
router.get('/analytics/earnings', analyticsController.getEarningsChart);
router.get('/analytics/supporters', analyticsController.getTopSupporters);

module.exports = router;
