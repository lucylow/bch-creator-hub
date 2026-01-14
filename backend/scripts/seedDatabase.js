require('dotenv').config();
const { initDatabase } = require('../src/config/database');
const Creator = require('../src/models/Creator');
const logger = require('../src/utils/logger');

async function seedDatabase() {
  try {
    // Initialize database
    await initDatabase();
    
    logger.info('Database seeded successfully');
    
    // Add seed data here if needed
    // Example:
    // const creator = await Creator.create({
    //   walletAddress: 'bitcoincash:qr...',
    //   pubKeyHex: '02...',
    //   displayName: 'Test Creator'
    // });
    
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
