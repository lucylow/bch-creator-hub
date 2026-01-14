const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creator.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateCreatorUpdate } = require('../middleware/validation.middleware');

// Search creators (public - no auth required)
router.get('/search', creatorController.searchCreators);

// All other routes require authentication
router.use(verifyToken);

// Get creator profile
router.get('/profile', creatorController.getProfile);

// Update creator profile
router.put('/profile', validateCreatorUpdate, creatorController.updateProfile);

// Deploy contract
router.post('/contract/deploy', creatorController.deployContract);

// Get dashboard stats
router.get('/dashboard', creatorController.getDashboardStats);

module.exports = router;
