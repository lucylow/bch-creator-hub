const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateWallet, verifyToken, authLimiter } = require('../middleware/auth.middleware');
const { validateWalletAuth } = require('../middleware/validation.middleware');

// Auth endpoints: strict rate limit, input validation, then wallet verify
router.post('/wallet', authLimiter, validateWalletAuth, authenticateWallet, authController.authenticate);
router.get('/challenge', authLimiter, authController.getChallenge);

// Verify token
router.get('/verify', verifyToken, authController.verify);

module.exports = router;


