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

// Wallet auth (BIP-322 login) validation
const validateWalletAuth = [
  body('address').notEmpty().withMessage('Address is required').custom((v) => {
    if (!validateBchAddress(v)) throw new Error('Invalid BCH address');
    return true;
  }),
  body('message').notEmpty().isString().isLength({ min: 10, max: 2048 }).withMessage('Message must be 10–2048 chars'),
  body('signature').notEmpty().isString().isLength({ min: 64, max: 1024 }).withMessage('Signature required'),
  handleValidationErrors
];

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

// Payload link generation validation
const validatePayloadLink = [
  param('creatorId').isLength({ min: 16, max: 16 }).withMessage('Creator ID must be 16 characters'),
  body('paymentType').optional().isInt({ min: 1, max: 4 }).withMessage('Payment type must be between 1 and 4'),
  body('amountSats').optional().custom((value) => {
    if (value && !validateAmount(value)) {
      throw new Error('Invalid amount');
    }
    return true;
  }),
  body('contentId').optional().isInt({ min: 0 }).withMessage('Content ID must be a non-negative integer'),
  body('metadata').optional().custom((value) => {
    if (typeof value === 'object' || typeof value === 'string') {
      return true;
    }
    throw new Error('Metadata must be an object or string');
  }),
  handleValidationErrors
];

// Transaction broadcast validation
const validateTransactionBroadcast = [
  body('signedTxHex').notEmpty().withMessage('Signed transaction hex is required').custom((value) => {
    // Validate hex string format
    if (typeof value !== 'string') {
      throw new Error('Transaction hex must be a string');
    }
    // Check if it's a valid hex string
    if (!/^[0-9a-fA-F]+$/.test(value)) {
      throw new Error('Transaction hex must be a valid hexadecimal string');
    }
    // Minimum reasonable transaction size (at least 100 bytes = 200 hex chars)
    if (value.length < 200) {
      throw new Error('Transaction hex appears to be too short');
    }
    // Maximum reasonable transaction size (1MB = 2M hex chars, but we'll use 500KB)
    if (value.length > 1000000) {
      throw new Error('Transaction hex appears to be too large');
    }
    return true;
  }),
  handleValidationErrors
];

// Alias for routes that use "validate"
const validate = handleValidationErrors;

module.exports = {
  handleValidationErrors,
  validate,
  validateWalletAuth,
  validateCreatorUpdate,
  validatePaymentIntent,
  validateTransaction,
  validateWithdrawal,
  validateWebhook,
  validateCreatorId,
  validateIntentId,
  validateTxid,
  validatePayloadLink,
  validateTransactionBroadcast
};
