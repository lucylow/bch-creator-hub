const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawal.controller');
const { authenticateCreator, withdrawalLimiter } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(authenticateCreator);
// Stricter rate limit on withdrawal-related endpoints
router.use(withdrawalLimiter);

// Get withdrawal preview/calculation
router.get(
  '/preview',
  [query('amountSats').isInt({ min: 1 }).withMessage('Valid amount required')],
  handleValidationErrors,
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
  handleValidationErrors,
  withdrawalController.createWithdrawal
);

// Get withdrawal history
router.get('/', withdrawalController.getWithdrawals);

// Get withdrawal by ID
router.get('/:id', withdrawalController.getWithdrawal);

// Update fee opt-in preference
router.post(
  '/fee-opt-in',
  [body('optIn').isBoolean().withMessage('optIn must be boolean')],
  handleValidationErrors,
  withdrawalController.updateFeeOptIn
);

module.exports = router;


