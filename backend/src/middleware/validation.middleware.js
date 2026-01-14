const { body, param, query, validationResult } = require('express-validator');
const { validateBchAddress, validateAmount, validateEmail, validateUrl } = require('../utils/validators');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Creator validation
const validateCreatorUpdate = [
  body('displayName').optional().isLength({ min: 1, max: 100 }),
  body('email').optional().custom((value) => {
    if (value && !validateEmail(value)) {
      throw new Error('Invalid email format');
    }
    return true;
  }),
  body('avatarUrl').optional().custom((value) => {
    if (value && !validateUrl(value)) {
      throw new Error('Invalid URL format');
    }
    return true;
  }),
  body('website').optional().custom((value) => {
    if (value && !validateUrl(value)) {
      throw new Error('Invalid URL format');
    }
    return true;
  }),
  body('twitterHandle').optional().isLength({ max: 50 }),
  handleValidationErrors
];

// Payment intent validation
const validatePaymentIntent = [
  body('type').optional().isInt({ min: 1, max: 4 }),
  body('amountSats').optional().custom((value) => {
    if (value && !validateAmount(value)) {
      throw new Error('Invalid amount');
    }
    return true;
  }),
  body('title').optional().isLength({ max: 200 }),
  body('description').optional().isString(),
  body('contentUrl').optional().custom((value) => {
    if (value && !validateUrl(value)) {
      throw new Error('Invalid URL format');
    }
    return true;
  }),
  handleValidationErrors
];

// Transaction validation
const validateTransaction = [
  body('txid').notEmpty().isLength({ min: 64, max: 64 }),
  body('paymentId').notEmpty().isLength({ min: 16, max: 16 }),
  body('amountSats').custom((value) => {
    if (!validateAmount(value)) {
      throw new Error('Invalid amount');
    }
    return true;
  }),
  body('senderAddress').custom((value) => {
    if (!validateBchAddress(value)) {
      throw new Error('Invalid sender address');
    }
    return true;
  }),
  handleValidationErrors
];

// Withdrawal validation
const validateWithdrawal = [
  body('amountSats').custom((value) => {
    if (!validateAmount(value)) {
      throw new Error('Invalid amount');
    }
    return true;
  }),
  body('toAddress').custom((value) => {
    if (!validateBchAddress(value)) {
      throw new Error('Invalid address');
    }
    return true;
  }),
  handleValidationErrors
];

// Webhook validation
const validateWebhook = [
  body('url').custom((value) => {
    if (!validateUrl(value)) {
      throw new Error('Invalid webhook URL');
    }
    return true;
  }),
  body('events').optional().isArray(),
  handleValidationErrors
];

// Params validation
const validateCreatorId = [
  param('creatorId').isLength({ min: 16, max: 16 }),
  handleValidationErrors
];

const validateIntentId = [
  param('intentId').isLength({ min: 16, max: 16 }),
  handleValidationErrors
];

const validateTxid = [
  param('txid').isLength({ min: 64, max: 64 }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateCreatorUpdate,
  validatePaymentIntent,
  validateTransaction,
  validateWithdrawal,
  validateWebhook,
  validateCreatorId,
  validateIntentId,
  validateTxid
};
