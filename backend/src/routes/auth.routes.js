const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateWallet, verifyToken, authLimiter } = require('../middleware/auth.middleware');

// Auth endpoints use stricter rate limiting
router.post('/wallet', authLimiter, authenticateWallet, authController.authenticate);
router.get('/challenge', authLimiter, authController.getChallenge);

// Verify token
router.get('/verify', verifyToken, authController.verify);

module.exports = router;


