const jwt = require('jsonwebtoken');
const Creator = require('../models/Creator');
const bip322 = require('../utils/bip322');

const authenticateWallet = async (req, res, next) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing authentication parameters'
      });
    }

    // Verify signature
    const isValid = await bip322.verifySignature(address, message, signature);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Find or create creator
    let creator = await Creator.findByWalletAddress(address);
    
    if (!creator) {
      // Extract display name from address for demo
      const displayName = `Creator_${address.slice(-6)}`;
      
      creator = await Creator.create({
        walletAddress: address,
        pubKeyHex: signature.slice(0, 130), // Simplified for demo
        displayName,
        feeBasisPoints: 100 // 1% default fee
      });
    }

    // Update last login
    await Creator.updateLastLogin(creator.creator_id);

    // Generate JWT token
    const token = jwt.sign(
      {
        creatorId: creator.creator_id,
        address: creator.wallet_address,
        isVerified: creator.is_verified
      },
      process.env.JWT_SECRET || 'hackathon-secret-key',
      { expiresIn: '7d' }
    );

    req.creator = creator;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'hackathon-secret-key'
    );

    const creator = await Creator.findByCreatorId(decoded.creatorId);
    
    if (!creator || !creator.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Creator not found or inactive'
      });
    }

    req.creator = creator;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Rate limiting middleware
const rateLimiter = require('express-rate-limit');

const apiLimiter = rateLimiter({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific rate limit for payment endpoints
const paymentLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: 'Too many payment attempts, please slow down.'
  }
});

module.exports = {
  authenticateWallet,
  verifyToken,
  apiLimiter,
  paymentLimiter
};


