const cron = require('node-cron');
const { Queue, Worker } = require('bull');
const BCHService = require('../services/bch.service');
const Creator = require('../models/Creator');
const Transaction = require('../models/Transaction');
const NotificationService = require('../services/notification.service');
const CashTokenService = require('../services/cashtoken.service');
const logger = require('../utils/logger');
const { ExternalServiceError, DatabaseError, AppError, ValidationError } = require('../utils/errors');

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
      logger.debug('Block scan already in progress, skipping...');
      return;
    }

    this.isScanning = true;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    try {
      const currentHeight = await BCHService.getBlockHeight();
      
      if (!currentHeight || currentHeight <= 0) {
        throw new ExternalServiceError('BCH Service', 'Invalid block height returned', {
          context: { currentHeight }
        });
      }
      
      // Initialize last scanned block if not set
      if (this.lastScannedBlock === 0) {
        try {
          const lastTx = await Transaction.getLastIndexedBlock();
          this.lastScannedBlock = lastTx ? lastTx.block_height : currentHeight - 10;
        } catch (error) {
          logger.warn('Error getting last indexed block, using fallback:', error);
          this.lastScannedBlock = currentHeight - 10;
        }
      }

      // Scan blocks from last scanned + 1 to current
      for (let height = this.lastScannedBlock + 1; height <= currentHeight; height++) {
        try {
          await this.scanBlock(height);
          this.lastScannedBlock = height;
          consecutiveErrors = 0; // Reset error counter on success
        } catch (error) {
          consecutiveErrors++;
          logger.error(`Error scanning block ${height} (consecutive errors: ${consecutiveErrors}):`, {
            error: {
              name: error.name,
              message: error.message,
              code: error.code
            },
            blockHeight: height
          });
          
          // If too many consecutive errors, stop scanning to prevent cascading failures
          if (consecutiveErrors >= maxConsecutiveErrors) {
            logger.error(`Too many consecutive errors (${consecutiveErrors}), stopping block scan`);
            throw new AppError('Block scanning stopped due to consecutive errors', 500, {
              context: { consecutiveErrors, lastScannedBlock: this.lastScannedBlock },
              retryable: true
            });
          }
          
          // Continue to next block on error
          continue;
        }
      }

      // Also check mempool for unconfirmed transactions
      try {
        await this.scanMempool();
      } catch (error) {
        logger.error('Mempool scanning error (non-fatal):', {
          error: {
            name: error.name,
            message: error.message
          }
        });
        // Don't throw - mempool scanning is optional
      }

    } catch (error) {
      logger.error('Critical block scanning error:', {
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        lastScannedBlock: this.lastScannedBlock
      });
      
      // Re-throw critical errors
      if (error instanceof AppError || error instanceof ExternalServiceError) {
        throw error;
      }
    } finally {
      this.isScanning = false;
    }
  }

  async scanBlock(blockHeight) {
    if (!blockHeight || blockHeight <= 0) {
      throw new ValidationError('Invalid block height', {
        context: { blockHeight }
      });
    }

    try {
      logger.info(`Scanning block ${blockHeight}`);
      
      const transactions = await BCHService.scanBlock(blockHeight);
      
      if (!Array.isArray(transactions)) {
        logger.warn(`Invalid transactions array for block ${blockHeight}, skipping`);
        return;
      }
      
      let processedCount = 0;
      let errorCount = 0;
      
      for (const tx of transactions) {
        try {
          await this.processTransaction(tx, true);
          processedCount++;
        } catch (error) {
          errorCount++;
          logger.error(`Error processing transaction in block ${blockHeight}:`, {
            txid: tx?.txid,
            error: {
              name: error.name,
              message: error.message
            }
          });
          // Continue processing other transactions
        }
      }

      logger.info(`Scanned block ${blockHeight}: ${processedCount} processed, ${errorCount} errors`);
    } catch (error) {
      logger.error(`Error scanning block ${blockHeight}:`, {
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        blockHeight
      });
      
      // Re-throw to allow caller to handle
      throw error;
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
    if (!txData || !txData.txid) {
      logger.warn('Invalid transaction data provided to processTransaction');
      return;
    }

    const { txid, payloads, vout, timestamp, blockHeight } = txData;
    
    try {
      // Check for CashToken transfers
      if (BCHService.hasTokens({ vout: vout, txid: txid })) {
        try {
          await CashTokenService.processTokenTransfers({
            txid: txid,
            vout: vout,
            vin: txData.vin,
            blockHeight: blockHeight,
            blockTime: timestamp
          });
        } catch (error) {
          logger.error(`Error processing CashToken transfers in ${txid}:`, {
            error: {
              name: error.name,
              message: error.message
            },
            txid
          });
          // Continue processing even if token processing fails
        }
      }
      
      // Validate vout array
      if (!Array.isArray(vout) || vout.length === 0) {
        logger.debug(`Transaction ${txid} has no outputs, skipping`);
        return;
      }
      
      // Find outputs to contract addresses
      for (const output of vout) {
        try {
          if (!output || !output.scriptPubKey || !output.scriptPubKey.addresses) {
            continue;
          }
          
          const address = output.scriptPubKey.addresses[0];
          
          if (!address) {
            continue;
          }
          
          // Check if this is a creator's contract address
          let creator;
          try {
            creator = await Creator.findByContractAddress(address);
          } catch (error) {
            logger.error(`Error looking up creator for address ${address}:`, {
              error: {
                name: error.name,
                message: error.message
              },
              address,
              txid
            });
            continue; // Skip this output if lookup fails
          }
          
          if (creator && output.value > 0) {
            const amountSats = Math.round(output.value * 100000000);
            
            if (amountSats <= 0) {
              logger.warn(`Invalid amount for transaction ${txid}, output ${output.n}`);
              continue;
            }
            
            // Find corresponding payload for this output
            const payload = this.findPayloadForOutput(payloads, output.n);
            
            try {
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
            } catch (error) {
              logger.error(`Error saving transaction ${txid} for creator ${creator.creator_id}:`, {
                error: {
                  name: error.name,
                  message: error.message,
                  code: error.code
                },
                txid,
                creatorId: creator.creator_id
              });
              // Continue processing other outputs
            }
          }
        } catch (error) {
          logger.error(`Error processing output in transaction ${txid}:`, {
            error: {
              name: error.name,
              message: error.message
            },
            txid,
            outputIndex: output?.n
          });
          // Continue processing other outputs
        }
      }
    } catch (error) {
      logger.error(`Critical error processing transaction ${txid}:`, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        txid
      });
      // Don't re-throw - allow processing to continue with other transactions
    }
  }

  async saveTransaction(txData) {
    if (!txData || !txData.txid || !txData.creatorId) {
      throw new ValidationError('Invalid transaction data', {
        context: { txData: txData ? Object.keys(txData) : null }
      });
    }

    try {
      // Check if transaction already exists
      const existing = await Transaction.findByTxid(txData.txid);
      if (existing) {
        logger.debug(`Transaction ${txData.txid} already exists, skipping`);
        return existing;
      }
      
      // Save to database
      const transaction = await Transaction.create(txData);
      
      if (!transaction) {
        throw new DatabaseError('Failed to create transaction record', {
          context: { txid: txData.txid, creatorId: txData.creatorId }
        });
      }
      
      // Update creator's balance cache (non-blocking)
      this.updateCreatorBalance(txData.creatorId).catch(error => {
        logger.error(`Error updating creator balance for ${txData.creatorId}:`, {
          error: {
            name: error.name,
            message: error.message
          }
        });
      });
      
      // Send real-time notification (non-blocking)
      NotificationService.notifyPaymentReceived(
        txData.creatorId,
        transaction
      ).catch(error => {
        logger.error(`Error sending notification for transaction ${txData.txid}:`, {
          error: {
            name: error.name,
            message: error.message
          }
        });
      });
      
      // Trigger webhooks (non-blocking)
      this.triggerWebhooks(txData.creatorId, transaction).catch(error => {
        logger.error(`Error triggering webhooks for transaction ${txData.txid}:`, {
          error: {
            name: error.name,
            message: error.message
          }
        });
      });
      
      logger.info(`Saved transaction ${txData.txid} for creator ${txData.creatorId}`);
      
      return transaction;
    } catch (error) {
      logger.error('Error saving transaction:', {
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        txid: txData.txid,
        creatorId: txData.creatorId
      });
      
      // Re-throw to allow caller to handle
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
