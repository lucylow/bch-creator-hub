const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware
 * Generates and attaches a unique request ID to each request
 * This ID is used for tracking and logging throughout the request lifecycle
 */
const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from header if present, otherwise generate new one
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // Set response header so clients can track their requests
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

module.exports = requestIdMiddleware;



