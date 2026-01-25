const BCHJS = require('@psf/bch-js');
const logger = require('../utils/logger');
const { ExternalServiceError } = require('../utils/errors');
const { retry } = require('../utils/retry');
const bchConfig = require('../config/bch');

const SATS_PER_BCH = 100_000_000;
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  timeout: 15000,
  context: 'BCH'
};

function isRetryableBchError(error) {
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNRESET' ||
    (error.response && error.response.status >= 500)
  );
}

function wrapBchError(operation, detail, error, context = {}) {
  const retryable = isRetryableBchError(error);
  logger.error(`${operation} error:`, {
    ...context,
    message: error.message,
    code: error.code,
    status: error.response?.status
  });
  return new ExternalServiceError('BCH Service', `${detail}: ${error.message}`, {
    context: { ...context },
    retryable
  });
}

class BCHService {
  constructor() {
    this.bchjs = new BCHJS({
      restURL: bchConfig.restUrl,
      apiToken: bchConfig.apiToken
    });
    this.network = bchConfig.network;
    this.feePerByte = 1.0;
  }

  /**
   * Health check: verify backend connectivity (block height fetch).
   * @returns {{ ok: boolean, blockHeight?: number, latencyMs?: number, error?: string }}
   */
  async checkHealth() {
    const start = Date.now();
    try {
      const blockHeight = await this.getBlockHeight();
      return { ok: true, blockHeight, latencyMs: Date.now() - start };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: error.message || 'BCH backend unavailable'
      };
    }
  }

  validateAddress(address) {
    if (!address || typeof address !== 'string') return false;
    try {
      return this.bchjs.Address.isCashAddress(address);
    } catch (error) {
      logger.error('Address validation error:', { address, error: error.message });
      return false;
    }
  }

  async getBalance(address, retries = 3) {
    if (!address || typeof address !== 'string') {
      throw new ExternalServiceError('BCH Service', 'Address is required', { context: { address }, retryable: false });
    }
    return retry(
      async () => {
        const balance = await this.bchjs.Electrumx.balance(address);
        return {
          confirmed: balance.balance.confirmed,
          unconfirmed: balance.balance.unconfirmed,
          total: balance.balance.confirmed + balance.balance.unconfirmed
        };
      },
      {
        ...DEFAULT_RETRY_OPTIONS,
        maxRetries: retries,
        shouldRetry: isRetryableBchError,
        context: `balance:${address.slice(0, 12)}`
      }
    ).catch((error) => {
      throw wrapBchError('Balance check', `Failed to get balance for ${address}`, error, { address });
    });
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

  async getTransaction(txid, retries = 3) {
    if (!txid || typeof txid !== 'string') {
      throw new ExternalServiceError('BCH Service', 'Transaction ID is required', { context: { txid }, retryable: false });
    }
    return retry(
      () => this.bchjs.Blockbook.tx(txid),
      {
        ...DEFAULT_RETRY_OPTIONS,
        maxRetries: retries,
        shouldRetry: isRetryableBchError,
        context: `tx:${txid.slice(0, 12)}`
      }
    ).catch((error) => {
      throw wrapBchError('Transaction fetch', `Failed to get transaction ${txid}`, error, { txid });
    });
  }

  async getBlockHeight() {
    return retry(
      async () => {
        const info = await this.bchjs.Blockbook.blockchainInfo();
        return info.blocks;
      },
      { ...DEFAULT_RETRY_OPTIONS, context: 'blockHeight' }
    ).catch((error) => {
      throw wrapBchError('Block height', 'Failed to get block height', error);
    });
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

  // Get tokens for an address (CashTokens)
  async getTokens(address, retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const utxos = await this.getUtxos(address);
        const CashTokenUtils = require('../utils/cashtoken');
        const tokens = [];

        for (const utxo of utxos) {
          const tokenData = CashTokenUtils.parseTokenOutput(utxo);
          if (tokenData) {
            tokenData.address = address;
            tokens.push(tokenData);
          }
        }

        return tokens;
      } catch (error) {
        lastError = error;
        
        const isRetryable = error.code === 'ECONNREFUSED' || 
                           error.code === 'ETIMEDOUT' || 
                           error.response?.status >= 500;
        
        if (!isRetryable || attempt === retries) {
          logger.error(`Error getting tokens for ${address}:`, {
            address,
            attempt,
            error: {
              message: error.message,
              code: error.code,
              status: error.response?.status
            }
          });
          throw new ExternalServiceError('BCH Service', `Failed to get tokens for ${address}: ${error.message}`, {
            context: { address, attempts: attempt },
            retryable: isRetryable
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        logger.warn(`Token fetch retry ${attempt}/${retries} for ${address}`);
      }
    }
    
    throw lastError;
  }

  // Extract CashTokens from transaction
  extractTokensFromTransaction(tx) {
    try {
      const CashTokenUtils = require('../utils/cashtoken');
      return CashTokenUtils.extractTokensFromTransaction(tx);
    } catch (error) {
      logger.error('Error extracting tokens from transaction:', error);
      return [];
    }
  }

  // Check if transaction contains CashTokens
  hasTokens(transaction) {
    try {
      if (!transaction || !transaction.vout) return false;
      
      const CashTokenUtils = require('../utils/cashtoken');
      for (const output of transaction.vout) {
        if (CashTokenUtils.parseTokenOutput(output)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error checking for tokens:', error);
      return false;
    }
  }
}

module.exports = new BCHService();
