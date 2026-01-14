const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateTxid } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(verifyToken);

// Get transactions
router.get('/', transactionController.getTransactions);

// Get transaction by ID
router.get('/:txid', validateTxid, transactionController.getTransaction);

// Get transaction stats
router.get('/stats/summary', transactionController.getStats);

// Get micro-payment stats
router.get('/stats/micropayments', transactionController.getMicropaymentStats);

// Get batchable payments
router.get('/batchable', transactionController.getBatchablePayments);

// Analyze payment efficiency
router.post('/analyze-efficiency', transactionController.analyzePaymentEfficiency);

module.exports = router;
