/**
 * CashToken Routes
 */

const express = require('express');
const router = express.Router();
const cashtokenController = require('../controllers/cashtoken.controller');
const { verifyToken } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validation');

/**
 * Get tokens by owner address
 * GET /api/cashtokens/owner/:address
 */
router.get(
  '/owner/:address',
  [
    param('address').notEmpty().withMessage('Address is required'),
    query('categoryId').optional().isString()
  ],
  validate,
  cashtokenController.getTokensByOwner
);

/**
 * Verify token ownership
 * GET /api/cashtokens/verify/:address/:categoryId
 */
router.get(
  '/verify/:address/:categoryId',
  [
    param('address').notEmpty().withMessage('Address is required'),
    param('categoryId').notEmpty().withMessage('Category ID is required'),
    query('tokenId').optional().isString()
  ],
  validate,
  cashtokenController.verifyOwnership
);

/**
 * Check subscription validity
 * GET /api/cashtokens/subscription/:address/:categoryId/:tokenId
 */
router.get(
  '/subscription/:address/:categoryId/:tokenId',
  [
    param('address').notEmpty().withMessage('Address is required'),
    param('categoryId').notEmpty().withMessage('Category ID is required'),
    param('tokenId').notEmpty().withMessage('Token ID is required')
  ],
  validate,
  cashtokenController.checkSubscription
);

/**
 * Get token details
 * GET /api/cashtokens/:categoryId
 */
router.get(
  '/:categoryId',
  [
    param('categoryId').notEmpty().withMessage('Category ID is required'),
    query('tokenId').optional().isString()
  ],
  validate,
  cashtokenController.getTokenDetails
);

/**
 * Mint NFT (authenticated)
 * POST /api/cashtokens/mint
 */
router.post(
  '/mint',
  verifyToken,
  [
    body('categoryId').notEmpty().withMessage('Category ID is required'),
    body('recipientAddress').notEmpty().withMessage('Recipient address is required'),
    body('commitment').optional().isString(),
    body('metadata').optional().isObject()
  ],
  validate,
  cashtokenController.mintNFT
);

/**
 * Get creator subscription tokens (authenticated)
 * GET /api/cashtokens/creator/subscriptions
 */
router.get(
  '/creator/subscriptions',
  verifyToken,
  cashtokenController.getCreatorSubscriptionTokens
);

/**
 * Parse tokens from transaction
 * POST /api/cashtokens/parse
 */
router.post(
  '/parse',
  [
    body('transaction').notEmpty().withMessage('Transaction data is required')
  ],
  validate,
  cashtokenController.parseTransactionTokens
);

module.exports = router;

