const BCHJS = require('@psf/bch-js');
const axios = require('axios');
const logger = require('../utils/logger');
const { ExternalServiceError, AppError } = require('../utils/errors');

class BCHService {
  constructor() {
    this.bchjs = new BCHJS({
      restURL: process.env.BCH_REST_URL || 'https://api.fullstack.cash/v5/',
      apiToken: process.env.BCH_API_TOKEN
    });
    
    this.network = process.env.BCH_NETWORK || 'mainnet';
    this.feePerByte = 1.0; // satoshis per byte
  }

  // Validate BCH address
  validateAddress(address) {
    try {
      return this.bchjs.Address.isCashAddress(address);
    } catch (error) {
      logger.error('Address validation error:', error);
      return false;
    }
  }

  // Get address balance
  async getBalance(address, retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const balance = await this.bchjs.Electrumx.balance(address);
        
        return {
          confirmed: balance.balance.confirmed,
          unconfirmed: balance.balance.unconfirmed,
          total: balance.balance.confirmed + balance.balance.unconfirmed
        };
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const isRetryable = error.code === 'ECONNREFUSED' || 
                           error.code === 'ETIMEDOUT' || 
                           error.code === 'ENOTFOUND' ||
                           error.response?.status >= 500;
        
        if (!isRetryable || attempt === retries) {
          logger.error('Balance check error:', {
            address,
            attempt,
            error: {
              message: error.message,
              code: error.code,
              status: error.response?.status
            }
          });
          throw new ExternalServiceError('BCH Service', `Failed to get balance for ${address}: ${error.message}`, {
            context: { address, attempts: attempt },
            retryable: isRetryable
          });
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        logger.warn(`Balance check retry ${attempt}/${retries} for ${address}`);
      }
    }
    
    throw lastError;
  }

  // Decode OP_RETURN data
  decodeOpReturn(script) {
    try {
      if (!script.startsWith('6a')) {
        return null;
      }

      // Remove OP_RETURN opcode and length byte
      const dataHex = script.slice(4);
      
      // Convert hex to text
      const text = Buffer.from(dataHex, 'hex').toString('utf8');
      
      try {
        return JSON.parse(text);
      } catch {
        // If not JSON, return as text
        return { raw: text };
      }
    } catch (error) {
      logger.error('OP_RETURN decode error:', error);
      return null;
    }
  }

  // Scan block for relevant transactions
  async scanBlock(blockHeight) {
    try {
      const block = await this.bchjs.Blockbook.block(blockHeight);
      const relevantTxs = [];

      for (const tx of block.txs) {
        // Check if transaction has OP_RETURN outputs
        const opReturnOutputs = tx.vout.filter(output => 
          output.scriptPubKey && output.scriptPubKey.hex.startsWith('6a')
        );

        if (opReturnOutputs.length > 0) {
          // Decode payloads
          const payloads = opReturnOutputs.map(output => 
            this.decodeOpReturn(output.scriptPubKey.hex)
          ).filter(p => p !== null);

          if (payloads.length > 0) {
            relevantTxs.push({
              txid: tx.txid,
              blockHeight,
              timestamp: tx.blockTime,
              vin: tx.vin,
              vout: tx.vout,
              payloads
            });
          }
        }
      }

      return relevantTxs;
    } catch (error) {
      logger.error(`Error scanning block ${blockHeight}:`, error);
      throw error;
    }
  }

  // Get transaction details
  async getTransaction(txid, retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const tx = await this.bchjs.Blockbook.tx(txid);
        return tx;
      } catch (error) {
        lastError = error;
        
        const isRetryable = error.code === 'ECONNREFUSED' || 
                           error.code === 'ETIMEDOUT' || 
                           error.response?.status >= 500;
        
        if (!isRetryable || attempt === retries) {
          logger.error(`Error fetching transaction ${txid}:`, {
            txid,
            attempt,
            error: {
              message: error.message,
              code: error.code,
              status: error.response?.status
            }
          });
          throw new ExternalServiceError('BCH Service', `Failed to get transaction ${txid}: ${error.message}`, {
            context: { txid, attempts: attempt },
            retryable: isRetryable
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        logger.warn(`Transaction fetch retry ${attempt}/${retries} for ${txid}`);
      }
    }
    
    throw lastError;
  }

  // Get current block height
  async getBlockHeight() {
    try {
      const info = await this.bchjs.Blockbook.blockchainInfo();
      return info.blocks;
    } catch (error) {
      logger.error('Error getting block height:', error);
      throw error;
    }
  }

  // Estimate transaction fee
  estimateFee(numInputs = 1, numOutputs = 2, priority = 'normal') {
    const { MICROPAYMENT } = require('../config/constants');
    
    // Use optimized fee calculation for micro-payments
    const estimatedSize = (numInputs * 148) + (numOutputs * 34) + 10;
    
    let feePerByte = this.feePerByte;
    if (priority === 'fast') {
      feePerByte = MICROPAYMENT.FAST_FEE_PER_BYTE;
    } else if (priority === 'low') {
      feePerByte = MICROPAYMENT.MIN_FEE_PER_BYTE;
    }
    
    const fee = Math.ceil(estimatedSize * feePerByte);
    
    return {
      sats: fee,
      usd: fee / 100000000 * 250, // Assuming $250/BCH
      size: estimatedSize,
      feePerByte,
      priority
    };
  }

  // Broadcast raw transaction
  async broadcastTransaction(rawTx, retries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.bchjs.RawTransactions.sendRawTransaction(rawTx);
        
        if (result && result.length === 64) { // Valid txid
          return {
            success: true,
            txid: result
          };
        } else {
          throw new Error('Invalid transaction ID returned');
        }
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation errors
        const isRetryable = (error.code === 'ECONNREFUSED' || 
                            error.code === 'ETIMEDOUT' ||
                            error.message?.includes('already have transaction') === false) &&
                           error.message?.includes('rejected') === false;
        
        if (!isRetryable || attempt === retries) {
          logger.error('Broadcast error:', {
            attempt,
            error: {
              message: error.message,
              code: error.code
            },
            txLength: rawTx?.length
          });
          
          throw new ExternalServiceError('BCH Service', `Failed to broadcast transaction: ${error.message}`, {
            context: { attempts: attempt },
            retryable: isRetryable
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        logger.warn(`Broadcast retry ${attempt}/${retries}`);
      }
    }
    
    throw lastError;
  }

  // Check if transaction is confirmed
  async isTransactionConfirmed(txid, minConfirmations = 3) {
    try {
      const tx = await this.getTransaction(txid);
      return tx.confirmations >= minConfirmations;
    } catch (error) {
      return false;
    }
  }

  // Get address UTXOs
  async getUtxos(address, retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const utxos = await this.bchjs.Blockbook.utxo(address);
        return utxos;
      } catch (error) {
        lastError = error;
        
        const isRetryable = error.code === 'ECONNREFUSED' || 
                           error.code === 'ETIMEDOUT' || 
                           error.response?.status >= 500;
        
        if (!isRetryable || attempt === retries) {
          logger.error(`Error getting UTXOs for ${address}:`, {
            address,
            attempt,
            error: {
              message: error.message,
              code: error.code,
              status: error.response?.status
            }
          });
          throw new ExternalServiceError('BCH Service', `Failed to get UTXOs for ${address}: ${error.message}`, {
            context: { address, attempts: attempt },
            retryable: isRetryable
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        logger.warn(`UTXO fetch retry ${attempt}/${retries} for ${address}`);
      }
    }
    
    throw lastError;
  }

  // Convert satoshis to BCH
  toBCH(sats) {
    return sats / 100000000;
  }

  // Convert BCH to satoshis
  toSats(bch) {
    return Math.round(bch * 100000000);
  }
}

module.exports = new BCHService();
