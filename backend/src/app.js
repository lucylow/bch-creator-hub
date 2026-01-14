const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createBullBoard } = require('bull-board');

const authRoutes = require('./routes/auth.routes');
const creatorRoutes = require('./routes/creator.routes');
const paymentRoutes = require('./routes/payment.routes');
const transactionRoutes = require('./routes/transaction.routes');
const webhookRoutes = require('./routes/webhook.routes');
const publicRoutes = require('./routes/public.routes');
const payloadRoutes = require('./routes/payload.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const withdrawalRoutes = require('./routes/withdrawal.routes');
const contractWithdrawRoutes = require('./routes/contract-withdraw.routes');
const cashtokenRoutes = require('./routes/cashtoken.routes');

const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/auth.middleware');
const requestIdMiddleware = require('./middleware/requestId.middleware');

const { initDatabase } = require('./config/database');
const TransactionScanner = require('./jobs/transactionScanner.job');
const logger = require('./utils/logger');

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.httpServer = null;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initialize() {
    // Initialize database
    await initDatabase();
    logger.info('Application initialized');
  }

  initializeMiddlewares() {
    // Request ID - should be first to track all requests
    this.app.use(requestIdMiddleware);
    
    // Security headers
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    this.app.use(morgan('combined', { stream: logger.stream }));
    
    // Rate limiting
    this.app.use('/api/', apiLimiter);
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'BCH Paywall Router API'
      });
    });
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/creators', creatorRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/transactions', transactionRoutes);
    this.app.use('/api/webhooks', webhookRoutes);
    this.app.use('/api/public', publicRoutes);
    this.app.use('/api/subscriptions', subscriptionRoutes);
    this.app.use('/api/withdrawals', withdrawalRoutes);
    this.app.use('/api/contract', contractWithdrawRoutes);
    this.app.use('/api/cashtokens', cashtokenRoutes);
    this.app.use('/api', payloadRoutes);
    
    // Bull Board for queue monitoring
    if (process.env.NODE_ENV !== 'production') {
      const { router } = createBullBoard([]);
      this.app.use('/admin/queues', router);
    }
    
    // 404 handler
    this.app.use('*', errorHandler.notFoundHandler);
  }

  initializeErrorHandling() {
    // Use enhanced error handler
    this.app.use(errorHandler.errorHandler);
  }

  initializeJobs() {
    // Start transaction scanner
    TransactionScanner.init();
    
    // Start payment confirmation monitoring
    const PaymentService = require('./services/payment.service');
    PaymentService.startConfirmationMonitoring();
    
    // Other jobs can be initialized here
    require('./jobs/cleanup.job').init();
  }

  getApp() {
    return this.app;
  }

  setHttpServer(httpServer) {
    this.httpServer = httpServer;
  }

  getHttpServer() {
    return this.httpServer;
  }
}

module.exports = App;
