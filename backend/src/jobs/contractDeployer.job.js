const { Queue } = require('bull');
const ContractService = require('../services/contract.service');
const Creator = require('../models/Creator');
const logger = require('../utils/logger');

class ContractDeployerJob {
  constructor() {
    this.deployQueue = new Queue('contract-deploy', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });
  }

  init() {
    logger.info('Contract deployer queue initialized');
  }

  async deployContract(creatorId, creatorPubKey) {
    try {
      await this.deployQueue.add('deploy', {
        creatorId,
        creatorPubKey
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      
      logger.info(`Contract deployment queued for creator ${creatorId}`);
    } catch (error) {
      logger.error(`Error queueing contract deployment:`, error);
      throw error;
    }
  }

  async processDeployment(job) {
    try {
      const { creatorId, creatorPubKey } = job.data;
      
      logger.info(`Deploying contract for creator ${creatorId}`);
      
      // Deploy contract
      const result = await ContractService.deployContract(creatorPubKey);
      
      if (result.success) {
        // Update creator with contract address
        await Creator.updateContractAddress(creatorId, result.address);
        
        logger.info(`Contract deployed for creator ${creatorId}: ${result.address}`);
        return result;
      } else {
        throw new Error('Contract deployment failed');
      }
    } catch (error) {
      logger.error(`Error deploying contract:`, error);
      throw error;
    }
  }
}

module.exports = new ContractDeployerJob();


