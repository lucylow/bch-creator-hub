const { Contract, Network } = require('cashscript');
const { compileFile } = require('cashc');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const { AppError, ExternalServiceError } = require('../utils/errors');

class ContractService {
  constructor() {
    this.network = process.env.BCH_NETWORK || 'mainnet';
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
    try {
      const contract = await this.getContract(contractAddress);
      
      if (!contract) {
        throw new AppError('Contract not found or not deployed', 404);
      }
      
      // Calculate service fee
      const serviceFee = Math.floor(amountSats * feeBasisPoints / 10000);
      const creatorAmount = amountSats - serviceFee;

      // Get contract UTXOs
      const utxos = await this.getContractUtxos(contractAddress);
      
      if (utxos.length === 0) {
        throw new Error('No funds in contract');
      }

      // Create transaction
      const tx = contract.functions
        .withdraw(creatorPrivateKey)
        .from(utxos)
        .to(creatorPrivateKey.toAddress(), creatorAmount);

      // Add service fee output if applicable
      if (serviceFee > 0 && process.env.SERVICE_PUB_KEY) {
        const serviceAddress = this.getServiceAddress();
        tx.to(serviceAddress, serviceFee);
      }

      // Set change address
      tx.withChange(creatorPrivateKey.toAddress());

      // Send transaction
      const result = await tx.send();
      
      return {
        success: true,
        txid: result.txid,
        amount: creatorAmount,
        fee: serviceFee,
        change: result.change
      };
    } catch (error) {
      logger.error('Withdrawal error:', error);
      throw error;
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
