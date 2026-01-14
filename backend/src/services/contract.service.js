const { Contract, Network } = require('cashscript');
const { compileFile } = require('cashc');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { AppError, ExternalServiceError, ValidationError, NotFoundError } = require('../utils/errors');
const bchConfig = require('../config/bch');

class ContractService {
  constructor() {
    this.network = bchConfig.network;
    this.contractCache = new Map();
  }

  async compileContract() {
    const contractPath = path.join(__dirname, '../../contracts/CreatorRouter.cash');
    
    try {
      await fs.access(contractPath);
    } catch {
      // Contract file doesn't exist, return null for mock mode
      logger.warn('Contract file not found, using mock mode');
      return null;
    }
    
    const artifact = compileFile(contractPath);
    return artifact;
  }

  async deployContract(creatorPubKey, feeBasisPoints = 100, servicePubKey = null) {
    try {
      const artifact = await this.compileContract();
      
      if (!artifact) {
        // Use mock deployment if contract file doesn't exist
        return this.deployMockContract(creatorPubKey);
      }
      
      const constructorParameters = {
        creatorPubKey: this.parsePubKey(creatorPubKey),
        servicePubKey: servicePubKey ? this.parsePubKey(servicePubKey) : null,
        feeBasisPoints
      };

      // Remove null parameters
      Object.keys(constructorParameters).forEach(key => {
        if (constructorParameters[key] === null) {
          delete constructorParameters[key];
        }
      });

      const contract = new Contract(
        artifact,
        constructorParameters,
        this.getNetwork()
      );

      // Get contract address
      const address = contract.address;
      
      // Store in cache
      this.contractCache.set(address, contract);

      return {
        success: true,
        address,
        artifact
      };
    } catch (error) {
      logger.error('Contract deployment error:', error);
      // Fall back to mock deployment
      return this.deployMockContract(creatorPubKey);
    }
  }

  async getContract(address) {
    if (this.contractCache.has(address)) {
      return this.contractCache.get(address);
    }

    try {
      const artifact = await this.compileContract();
      if (!artifact) {
        return null;
      }
      
      const contract = Contract.fromAddress(address, artifact, this.getNetwork());
      
      this.contractCache.set(address, contract);
      return contract;
    } catch (error) {
      logger.error('Error loading contract:', error);
      return null;
    }
  }

  async withdrawFromContract(
    contractAddress,
    creatorPrivateKey,
    amountSats,
    feeBasisPoints = 100
  ) {
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      throw new ValidationError('Contract address is required', {
        context: { contractAddress }
      });
    }

    if (!creatorPrivateKey) {
      throw new ValidationError('Creator private key is required');
    }

    if (!amountSats || amountSats <= 0 || !Number.isInteger(amountSats)) {
      throw new ValidationError('Amount must be a positive integer in satoshis', {
        context: { amountSats }
      });
    }

    if (feeBasisPoints < 0 || feeBasisPoints > 10000) {
      throw new ValidationError('Fee basis points must be between 0 and 10000', {
        context: { feeBasisPoints }
      });
    }

    try {
      const contract = await this.getContract(contractAddress);
      
      if (!contract) {
        throw new NotFoundError('Contract', {
          context: { contractAddress }
        });
      }
      
      // Calculate service fee
      const serviceFee = Math.floor(amountSats * feeBasisPoints / 10000);
      const creatorAmount = amountSats - serviceFee;

      if (creatorAmount <= 0) {
        throw new ValidationError('Amount after fees must be greater than zero', {
          context: { amountSats, serviceFee, creatorAmount }
        });
      }

      // Get contract UTXOs
      let utxos;
      try {
        utxos = await this.getContractUtxos(contractAddress);
      } catch (error) {
        logger.error('Error fetching contract UTXOs:', {
          error: {
            name: error.name,
            message: error.message
          },
          contractAddress
        });
        throw new ExternalServiceError('BCH Service', 'Failed to fetch contract UTXOs', {
          context: { contractAddress },
          retryable: true
        });
      }
      
      if (!Array.isArray(utxos) || utxos.length === 0) {
        throw new AppError('No funds available in contract', 400, {
          context: { contractAddress },
          errorCode: 'INSUFFICIENT_FUNDS'
        });
      }

      // Calculate total available balance
      const totalBalance = utxos.reduce((sum, utxo) => sum + (utxo.satoshis || utxo.value || 0), 0);
      
      if (totalBalance < amountSats) {
        throw new AppError('Insufficient contract balance', 400, {
          context: { 
            contractAddress, 
            requested: amountSats, 
            available: totalBalance 
          },
          errorCode: 'INSUFFICIENT_BALANCE'
        });
      }

      // Create transaction
      let tx;
      try {
        tx = contract.functions
          .withdraw(creatorPrivateKey)
          .from(utxos)
          .to(creatorPrivateKey.toAddress(), creatorAmount);

        // Add service fee output if applicable
        if (serviceFee > 0 && process.env.SERVICE_PUB_KEY) {
          const serviceAddress = this.getServiceAddress();
          if (!serviceAddress) {
            logger.warn('Service public key set but service address unavailable');
          } else {
            tx.to(serviceAddress, serviceFee);
          }
        }

        // Set change address
        tx.withChange(creatorPrivateKey.toAddress());
      } catch (error) {
        logger.error('Error building withdrawal transaction:', {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          contractAddress
        });
        throw new AppError('Failed to build withdrawal transaction', 500, {
          context: { contractAddress, error: error.message },
          isOperational: false
        });
      }

      // Send transaction
      let result;
      try {
        result = await tx.send();
        
        if (!result || !result.txid) {
          throw new AppError('Transaction sent but no transaction ID returned', 500, {
            context: { contractAddress }
          });
        }
      } catch (error) {
        logger.error('Error sending withdrawal transaction:', {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          contractAddress
        });
        
        if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
          throw new AppError('Insufficient balance for withdrawal', 400, {
            context: { contractAddress, amountSats },
            errorCode: 'INSUFFICIENT_BALANCE'
          });
        }
        
        throw new ExternalServiceError('BCH Service', 'Failed to broadcast withdrawal transaction', {
          context: { contractAddress, error: error.message },
          retryable: true
        });
      }
      
      return {
        success: true,
        txid: result.txid,
        amount: creatorAmount,
        fee: serviceFee,
        change: result.change
      };
    } catch (error) {
      // Re-throw AppError and custom errors as-is
      if (error instanceof AppError || error instanceof ValidationError || 
          error instanceof NotFoundError || error instanceof ExternalServiceError) {
        throw error;
      }
      
      logger.error('Unexpected withdrawal error:', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        contractAddress
      });
      
      throw new AppError('Withdrawal failed', 500, {
        context: { contractAddress, error: error.message },
        isOperational: false
      });
    }
  }

  async getContractBalance(address) {
    try {
      const utxos = await this.getContractUtxos(address);
      
      const balance = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);
      return balance;
    } catch (error) {
      logger.error('Balance check error:', error);
      return 0;
    }
  }

  async getContractUtxos(address) {
    // This would need proper UTXO fetching implementation
    // For hackathon, we'll use a simplified approach
    const bchService = require('./bch.service');
    return bchService.getUtxos(address);
  }

  parsePubKey(pubKeyHex) {
    // Convert hex public key to CashScript format
    return Buffer.from(pubKeyHex, 'hex');
  }

  getNetwork() {
    return this.network === 'mainnet' ? Network.MAINNET : Network.TESTNET;
  }

  getServiceAddress() {
    // This would be the service's BCH address for fees
    return process.env.SERVICE_ADDRESS;
  }

  // For hackathon demo, we'll use a simpler approach
  async deployMockContract(creatorAddress) {
    // Generate a mock contract address
    const mockAddress = `bitcoincash:q${this.generateRandomHash(40)}`;
    
    logger.info(`Mock contract deployed for ${creatorAddress}: ${mockAddress}`);
    
    return {
      success: true,
      address: mockAddress,
      isMock: true
    };
  }

  generateRandomHash(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = new ContractService();
