const cron = require('node-cron');
const { Queue, Worker } = require('bull');
const BCHService = require('../services/bch.service');
const Creator = require('../models/Creator');
const Transaction = require('../models/Transaction');
const NotificationService = require('../services/notification.service');
const logger = require('../utils/logger');

class TransactionScanner {
  constructor() {
    this.scanQueue = new Queue('transaction-scan', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });
    
    this.isScanning = false;
    this.lastScannedBlock = 0;
  }

  init() {
    // Start scanning job every 30 seconds
    cron.schedule('*/30 * * * * *', () => {
      this.scanNewBlocks();
    });

    // Setup Bull worker for background processing
    this.setupWorker();
    
    logger.info('Transaction scanner initialized');
  }

  async scanNewBlocks() {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;

    try {
      const currentHeight = await BCHService.getBlockHeight();
      
      // Initialize last scanned block if not set
      if (this.lastScannedBlock === 0) {
        const lastTx = await Transaction.getLastIndexedBlock();
        this.lastScannedBlock = lastTx ? lastTx.block_height : currentHeight - 10;
      }

      // Scan blocks from last scanned + 1 to current
      for (let height = this.lastScannedBlock + 1; height <= currentHeight; height++) {
        await this.scanBlock(height);
        this.lastScannedBlock = height;
      }

      // Also check mempool for unconfirmed transactions
      await this.scanMempool();

    } catch (error) {
      logger.error('Block scanning error:', error);
    } finally {
      this.isScanning = false;
    }
  }

  async scanBlock(blockHeight) {
    try {
      logger.info(`Scanning block ${blockHeight}`);
      
      const transactions = await BCHService.scanBlock(blockHeight);
      
      for (const tx of transactions) {
        await this.processTransaction(tx, true);
      }

      logger.info(`Scanned ${transactions.length} transactions from block ${blockHeight}`);
    } catch (error) {
      logger.error(`Error scanning block ${blockHeight}:`, error);
    }
  }

  async scanMempool() {
    try {
      // For hackathon, we'll implement a simplified mempool scanner
      // In production, use WebSocket to get real-time mempool updates
      
      // Get recent transactions from block explorer API
      const recentTxs = await this.getRecentMempoolTransactions();
      
      for (const tx of recentTxs) {
        // Check if we've already processed this transaction
        const existing = await Transaction.findByTxid(tx.txid);
        if (!existing) {
          await this.processTransaction(tx, false);
        }
      }
    } catch (error) {
      logger.error('Mempool scanning error:', error);
    }
  }

  async processTransaction(txData, isConfirmed) {
    try {
      // Extract relevant information from transaction
      const { txid, payloads, vout, timestamp, blockHeight } = txData;
      
      // Find outputs to contract addresses
      for (const output of vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          const address = output.scriptPubKey.addresses[0];
          
          // Check if this is a creator's contract address
          const creator = await Creator.findByContractAddress(address);
          
          if (creator && output.value > 0) {
            const amountSats = Math.round(output.value * 100000000);
            
            // Find corresponding payload for this output
            const payload = this.findPayloadForOutput(payloads, output.n);
            
            await this.saveTransaction({
              txid,
              creatorId: creator.creator_id,
              amountSats,
              senderAddress: this.getSenderAddress(txData.vin),
              receiverAddress: address,
              paymentType: payload ? payload.t || 1 : 1,
              contentId: payload ? payload.i : null,
              payloadJson: payload,
              blockHeight,
              isConfirmed,
              confirmations: isConfirmed ? 1 : 0,
              confirmedAt: isConfirmed ? new Date(timestamp * 1000) : null,
              metadata: {
                outputIndex: output.n,
                script: output.scriptPubKey.hex
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing transaction ${txData.txid}:`, error);
    }
  }

  async saveTransaction(txData) {
    try {
      // Save to database
      const transaction = await Transaction.create(txData);
      
      // Update creator's balance cache
      await this.updateCreatorBalance(txData.creatorId);
      
      // Send real-time notification
      await NotificationService.notifyPaymentReceived(
        txData.creatorId,
        transaction
      );
      
      // Trigger webhooks
      await this.triggerWebhooks(txData.creatorId, transaction);
      
      logger.info(`Saved transaction ${txData.txid} for creator ${txData.creatorId}`);
      
      return transaction;
    } catch (error) {
      logger.error('Error saving transaction:', error);
      throw error;
    }
  }

  async updateCreatorBalance(creatorId) {
    try {
      const balance = await Creator.getBalance(creatorId);
      
      // Update Redis cache
      const redis = require('../config/redis');
      await redis.set(
        `creator:${creatorId}:balance`,
        JSON.stringify(balance),
        'EX',
        300 // 5 minutes cache
      );
      
      // Send WebSocket update
      const wsServer = require('../websocket/server');
      wsServer.broadcastToCreator(creatorId, 'balance:update', balance);
    } catch (error) {
      logger.error('Error updating creator balance:', error);
    }
  }

  async triggerWebhooks(creatorId, transaction) {
    try {
      const webhookService = require('../services/webhook.service');
      await webhookService.triggerPaymentWebhooks(creatorId, transaction);
    } catch (error) {
      logger.error('Error triggering webhooks:', error);
    }
  }

  findPayloadForOutput(payloads, outputIndex) {
    // Simple matching logic for hackathon
    // In production, use OP_RETURN output index
    return payloads[0]; // Assume first payload for demo
  }

  getSenderAddress(inputs) {
    // Extract sender from first input for demo
    if (inputs && inputs.length > 0 && inputs[0].addresses) {
      return inputs[0].addresses[0];
    }
    return 'unknown';
  }

  async getRecentMempoolTransactions() {
    // For hackathon demo, return mock data
    // In production, connect to BCH node mempool
    return [];
  }

  setupWorker() {
    const worker = new Worker('transaction-scan', async (job) => {
      const { blockHeight } = job.data;
      await this.scanBlock(blockHeight);
    }, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      concurrency: 1
    });

    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });
  }

  async scanHistoricalBlocks(startHeight, endHeight) {
    for (let height = startHeight; height <= endHeight; height++) {
      await this.scanQueue.add('scan-block', { blockHeight: height });
    }
  }
}

module.exports = new TransactionScanner();
