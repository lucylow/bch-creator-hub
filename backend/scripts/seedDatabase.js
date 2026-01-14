require('dotenv').config();
const { initDatabase } = require('../src/config/database');
const Creator = require('../src/models/Creator');
const PaymentIntent = require('../src/models/PaymentIntent');
const Transaction = require('../src/models/Transaction');
const logger = require('../src/utils/logger');

// Mock addresses from frontend demo data
const ADDRESSES = {
  creatorAlice: "bitcoincash:qpalice000000000000000000000000",
  creatorBob: "bitcoincash:qpbbob0000000000000000000000000",
  creatorCharlie: "bitcoincash:qpcharlie000000000000000000000",
  creatorDiana: "bitcoincash:qpdiana00000000000000000000000",
  userLucy: "bitcoincash:qplucy0000000000000000000000000",
  userJudge: "bitcoincash:qpjjudge00000000000000000000000",
  userMark: "bitcoincash:qpmark0000000000000000000000000",
  userNina: "bitcoincash:qpnina0000000000000000000000000",
};

// Generate a mock public key hex (64 chars)
function generateMockPubKey() {
  return '02' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

async function seedDatabase() {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized, starting seed...');
    
    // Seed Creators
    const creators = [
      {
        walletAddress: ADDRESSES.creatorAlice,
        pubKeyHex: generateMockPubKey(),
        displayName: 'Alice Creator',
        email: 'alice@example.com',
        bio: 'Bitcoin Cash educator and developer. Creating content about BCH, CashScript, and decentralized payments.',
        website: 'https://alicecreator.com',
        twitterHandle: '@alicecreator',
        feeBasisPoints: 100,
      },
      {
        walletAddress: ADDRESSES.creatorBob,
        pubKeyHex: generateMockPubKey(),
        displayName: 'Bob Builder',
        email: 'bob@example.com',
        bio: 'Building the future of content monetization on Bitcoin Cash. CashToken NFT enthusiast.',
        website: 'https://bobbuilder.io',
        twitterHandle: '@bobbuilder',
        feeBasisPoints: 100,
      },
      {
        walletAddress: ADDRESSES.creatorCharlie,
        pubKeyHex: generateMockPubKey(),
        displayName: 'Charlie Cash',
        email: 'charlie@example.com',
        bio: 'Technical writer and developer focusing on BCH ecosystem tutorials and guides.',
        website: 'https://charliecash.dev',
        twitterHandle: '@charliecash',
        feeBasisPoints: 90,
      },
      {
        walletAddress: ADDRESSES.creatorDiana,
        pubKeyHex: generateMockPubKey(),
        displayName: 'Diana Developer',
        email: 'diana@example.com',
        bio: 'Full-stack developer creating tools and integrations for the Bitcoin Cash ecosystem.',
        website: 'https://dianadev.com',
        twitterHandle: '@dianadev',
        feeBasisPoints: 100,
      },
    ];

    const createdCreators = [];
    for (const creatorData of creators) {
      try {
        const existing = await Creator.findByWalletAddress(creatorData.walletAddress);
        if (existing) {
          logger.info(`Creator ${creatorData.displayName} already exists, skipping...`);
          createdCreators.push(existing);
        } else {
          const creator = await Creator.create(creatorData);
          logger.info(`Created creator: ${creator.display_name}`);
          createdCreators.push(creator);
        }
      } catch (error) {
        logger.warn(`Error creating creator ${creatorData.displayName}:`, error.message);
      }
    }

    // Seed Payment Intents
    // intentType: 1 = tip, 2 = unlock, 3 = subscription
    const paymentIntents = [
      {
        creatorId: createdCreators[0]?.creator_id,
        intentType: 1, // tip
        amountSats: 0,
        title: 'Twitter Tips',
        description: 'Support my content on Twitter',
        metadata: { platform: 'twitter' },
      },
      {
        creatorId: createdCreators[0]?.creator_id,
        intentType: 2, // unlock
        amountSats: 50000,
        title: 'Premium Article',
        description: 'Unlock exclusive content',
        metadata: { contentType: 'article' },
      },
      {
        creatorId: createdCreators[0]?.creator_id,
        intentType: 3, // subscription
        amountSats: 500000,
        title: 'Monthly Membership',
        description: 'Get monthly access to all content',
        metadata: { period: 'monthly' },
        isRecurring: true,
        recurrenceInterval: 'monthly',
      },
      {
        creatorId: createdCreators[1]?.creator_id,
        intentType: 2, // unlock
        amountSats: 100000,
        title: 'Video Tutorial',
        description: 'Learn advanced BCH development',
        metadata: { contentType: 'video' },
      },
      {
        creatorId: createdCreators[1]?.creator_id,
        intentType: 1, // tip
        amountSats: 0,
        title: 'YouTube Superchat',
        description: 'Support during livestreams',
        metadata: { platform: 'youtube' },
      },
      {
        creatorId: createdCreators[2]?.creator_id,
        intentType: 2, // unlock
        amountSats: 75000,
        title: 'Research Paper',
        description: 'Unlock detailed analysis documents',
        metadata: { contentType: 'research' },
      },
      {
        creatorId: createdCreators[2]?.creator_id,
        intentType: 3, // subscription
        amountSats: 25000,
        title: 'Weekly Newsletter',
        description: 'Get weekly updates and insights',
        metadata: { period: 'weekly' },
        isRecurring: true,
        recurrenceInterval: 'weekly',
      },
      {
        creatorId: createdCreators[3]?.creator_id,
        intentType: 1, // tip
        amountSats: 0,
        title: 'Direct Donation',
        description: 'Support my work directly',
        metadata: {},
      },
      {
        creatorId: createdCreators[3]?.creator_id,
        intentType: 2, // unlock
        amountSats: 200000,
        title: 'Code Repository Access',
        description: 'Get access to private code repos',
        metadata: { contentType: 'code' },
      },
    ];

    for (const intentData of paymentIntents) {
      if (!intentData.creatorId) continue;
      try {
        await PaymentIntent.create(intentData);
        logger.info(`Created payment intent: ${intentData.title}`);
      } catch (error) {
        logger.warn(`Error creating payment intent ${intentData.title}:`, error.message);
      }
    }

    // Seed Sample Transactions (only if creators were created)
    if (createdCreators.length > 0) {
      const transactions = [
        {
          creatorId: createdCreators[0]?.creator_id,
          txid: 'mock_tx_001',
          senderAddress: ADDRESSES.userLucy,
          receiverAddress: ADDRESSES.creatorAlice,
          amountSats: 10000,
          paymentType: 1, // tip
          isConfirmed: true,
          confirmations: 6,
          blockHeight: 850000,
          contentId: 'post_ethereum_vs_bch',
          confirmedAt: new Date(Date.now() - 86400000),
        },
        {
          creatorId: createdCreators[0]?.creator_id,
          txid: 'mock_tx_002',
          senderAddress: ADDRESSES.userJudge,
          receiverAddress: ADDRESSES.creatorAlice,
          amountSats: 20000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 12,
          blockHeight: 850001,
          contentId: 'tutorial_cashtokens',
          confirmedAt: new Date(Date.now() - 86400000),
        },
        {
          creatorId: createdCreators[0]?.creator_id,
          txid: 'mock_tx_003',
          senderAddress: ADDRESSES.userLucy,
          receiverAddress: ADDRESSES.creatorAlice,
          amountSats: 15000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 8,
          blockHeight: 850002,
          contentId: 'article_bch_scaling',
          confirmedAt: new Date(Date.now() - 43200000),
        },
        {
          creatorId: createdCreators[1]?.creator_id,
          txid: 'mock_tx_004',
          senderAddress: ADDRESSES.userLucy,
          receiverAddress: ADDRESSES.creatorBob,
          amountSats: 5000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 8,
          blockHeight: 850003,
          contentId: 'video_cashscript_intro',
          confirmedAt: new Date(Date.now() - 43200000),
        },
        {
          creatorId: createdCreators[1]?.creator_id,
          txid: 'mock_tx_005',
          senderAddress: ADDRESSES.userMark,
          receiverAddress: ADDRESSES.creatorBob,
          amountSats: 30000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 15,
          blockHeight: 850004,
          contentId: 'guide_slp_tokens',
          confirmedAt: new Date(Date.now() - 172800000),
        },
        {
          creatorId: createdCreators[1]?.creator_id,
          txid: 'mock_tx_006',
          senderAddress: ADDRESSES.userJudge,
          receiverAddress: ADDRESSES.creatorBob,
          amountSats: 12000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 10,
          blockHeight: 850005,
          contentId: 'video_wallet_integration',
          confirmedAt: new Date(Date.now() - 7200000),
        },
        {
          creatorId: createdCreators[2]?.creator_id,
          txid: 'mock_tx_007',
          senderAddress: ADDRESSES.userNina,
          receiverAddress: ADDRESSES.creatorCharlie,
          amountSats: 35000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 6,
          blockHeight: 850006,
          contentId: 'research_paper_defi',
          confirmedAt: new Date(Date.now() - 3600000),
        },
        {
          creatorId: createdCreators[3]?.creator_id,
          txid: 'mock_tx_008',
          senderAddress: ADDRESSES.userMark,
          receiverAddress: ADDRESSES.creatorDiana,
          amountSats: 40000,
          paymentType: 2, // unlock
          isConfirmed: true,
          confirmations: 20,
          blockHeight: 850007,
          contentId: 'tutorial_cashscript_advanced',
          confirmedAt: new Date(Date.now() - 259200000),
        },
        {
          creatorId: createdCreators[0]?.creator_id,
          txid: 'mock_tx_009',
          senderAddress: ADDRESSES.userNina,
          receiverAddress: ADDRESSES.creatorAlice,
          amountSats: 50000,
          paymentType: 3, // subscription
          isConfirmed: true,
          confirmations: 18,
          blockHeight: 850008,
          contentId: 'premium_newsletter_jan',
          confirmedAt: new Date(Date.now() - 216000000),
        },
        {
          creatorId: createdCreators[1]?.creator_id,
          txid: 'mock_tx_010',
          senderAddress: ADDRESSES.userJudge,
          receiverAddress: ADDRESSES.creatorBob,
          amountSats: 100000,
          paymentType: 3, // subscription
          isConfirmed: true,
          confirmations: 5,
          blockHeight: 850009,
          contentId: 'annual_membership_2026',
          confirmedAt: new Date(Date.now() - 1800000),
        },
      ];

      for (const txData of transactions) {
        if (!txData.creatorId) continue;
        try {
          await Transaction.create(txData);
          logger.info(`Created transaction: ${txData.txid}`);
        } catch (error) {
          logger.warn(`Error creating transaction ${txData.txid}:`, error.message);
        }
      }
    }
    
    logger.info('Database seeded successfully!');
    logger.info(`Created ${createdCreators.length} creators`);
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
