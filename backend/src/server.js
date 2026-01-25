require('dotenv').config();
const http = require('http');
const { assertProductionSecrets } = require('./config/security');
const App = require('./app');
const logger = require('./utils/logger');
const WebSocketServer = require('./websocket/server');

assertProductionSecrets();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  try {
    // Close database connections
    const { pool } = require('./config/database');
    await pool.end();
    
    // Close Redis connections
    const redis = require('./config/redis');
    await redis.quit();
    
    logger.info('All connections closed. Shutting down.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the application
const startServer = async () => {
  try {
    const app = new App();
    await app.initialize();
    
    // Create HTTP server
    const httpServer = http.createServer(app.getApp());
    
    // Initialize WebSocket server
    WebSocketServer.initialize(httpServer);
    
    // Set HTTP server on app for later use
    app.setHttpServer(httpServer);
    
    // Initialize background jobs
    app.initializeJobs();
    
    // Start listening
    const port = process.env.PORT || 3001;
    httpServer.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


