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
  async getBalance(address) {
    try {
      const balance = await this.bchjs.Electrumx.balance(address);
      
      return {
        confirmed: balance.balance.confirmed,
        unconfirmed: balance.balance.unconfirmed,
        total: balance.balance.confirmed + balance.balance.unconfirmed
      };
    } catch (error) {
      logger.error('Balance check error:', error);
      throw new ExternalServiceError('BCH Service', `Failed to get balance for ${address}: ${error.message}`);
    }
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
  async getTransaction(txid) {
    try {
      const tx = await this.bchjs.Blockbook.tx(txid);
      return tx;
    } catch (error) {
      logger.error(`Error fetching transaction ${txid}:`, error);
      throw error;
    }
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
  estimateFee(numInputs = 1, numOutputs = 2) {
    // Simple fee estimation for hackathon
    const typicalTxSize = 226; // bytes for typical transaction
    const estimatedSize = (numInputs * 148) + (numOutputs * 34) + 10;
    const fee = Math.ceil(estimatedSize * this.feePerByte);
    
    return {
      sats: fee,
      usd: fee / 100000000 * 250, // Assuming $250/BCH
      size: estimatedSize
    };
  }

  // Broadcast raw transaction
  async broadcastTransaction(rawTx) {
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
      logger.error('Broadcast error:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
  async getUtxos(address) {
    try {
      const utxos = await this.bchjs.Blockbook.utxo(address);
      return utxos;
    } catch (error) {
      logger.error(`Error getting UTXOs for ${address}:`, error);
      throw new ExternalServiceError('BCH Service', `Failed to get UTXOs for ${address}: ${error.message}`);
    }
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
