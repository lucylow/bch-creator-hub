const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawal.controller');
const { authenticateCreator } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');

// All routes require authentication
router.use(authenticateCreator);

// Get withdrawal preview/calculation
router.get(
  '/preview',
  [
    query('amountSats').isInt({ min: 1 }).withMessage('Valid amount required')
  ],
  withdrawalController.getWithdrawalPreview
);

// Create withdrawal
router.post(
  '/',
  [
    body('amountSats').isInt({ min: 1 }).withMessage('Valid amount required'),
    body('toAddress').isString().notEmpty().withMessage('Valid address required'),
    body('includeServiceFee').optional().isBoolean()
  ],
  withdrawalController.createWithdrawal
);

// Get withdrawal history
router.get('/', withdrawalController.getWithdrawals);

// Get withdrawal by ID
router.get('/:id', withdrawalController.getWithdrawal);

// Update fee opt-in preference
router.post(
  '/fee-opt-in',
  [
    body('optIn').isBoolean().withMessage('optIn must be boolean')
  ],
  withdrawalController.updateFeeOptIn
);

module.exports = router;


