const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateWallet, verifyToken } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/auth.middleware');

// Wallet authentication
router.post('/wallet', apiLimiter, authenticateWallet, authController.authenticate);

// Get challenge for signing
router.get('/challenge', apiLimiter, authController.getChallenge);

// Verify token
router.get('/verify', verifyToken, authController.verify);

module.exports = router;

