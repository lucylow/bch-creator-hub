require('dotenv').config();
const ContractService = require('../src/services/contract.service');
const Creator = require('../src/models/Creator');
const { initDatabase } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function deployContracts() {
  try {
    // Initialize database
    await initDatabase();
    
    // Get all creators without contracts
    const { query } = require('../src/config/database');
    const result = await query(
      `SELECT creator_id, wallet_address, pub_key_hex 
       FROM creators 
       WHERE contract_address IS NULL`
    );
    
    logger.info(`Found ${result.rows.length} creators without contracts`);
    
    // Deploy contracts for each creator
    for (const creator of result.rows) {
      try {
        logger.info(`Deploying contract for creator ${creator.creator_id}`);
        
        const contractResult = await ContractService.deployContract(
          creator.pub_key_hex
        );
        
        if (contractResult.success) {
          await Creator.updateContractAddress(
            creator.creator_id,
            contractResult.address
          );
          
          logger.info(`Contract deployed for ${creator.creator_id}: ${contractResult.address}`);
        }
      } catch (error) {
        logger.error(`Error deploying contract for ${creator.creator_id}:`, error);
      }
    }
    
    logger.info('Contract deployment completed');
    process.exit(0);
  } catch (error) {
    logger.error('Contract deployment script error:', error);
    process.exit(1);
  }
}

deployContracts();

