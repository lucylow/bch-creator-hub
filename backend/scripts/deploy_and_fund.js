/**
 * deploy_and_fund.js
 *
 * Usage:
 *  NODE_ENV=test node scripts/deploy_and_fund.js
 *
 * Make sure:
 *  - CONTRACT_ARTIFACT points to compiled JSON (use `cashc` to compile CreatorRouter.cash)
 *  - .env contains BCH_RPC_URL, BCH_RPC_USER, BCH_RPC_PASS and DEPLOYER_WIF (funding wallet)
 *  - Set FUND_SATS to amount to send to the contract (e.g. 50000)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bchjsConfig = require('../src/config/bch');
const BCHJS = require('@psf/bch-js');
const logger = require('../src/utils/logger');

// Try to use cashscript if available, otherwise provide instructions
let Contract, ElectrumNetworkProvider, Network;
try {
  const cashscript = require('cashscript');
  Contract = cashscript.Contract;
  ElectrumNetworkProvider = cashscript.ElectrumNetworkProvider;
  Network = cashscript.Network;
} catch (err) {
  logger.warn('CashScript SDK not available. Install with: npm install cashscript@^0.10.0');
  logger.warn('Falling back to address computation only (no contract instantiation)');
}

// Try to use bitcore if available
let bitcore;
try {
  bitcore = require('bitcore-lib-cash');
} catch (err) {
  logger.warn('bitcore-lib-cash not available. Install with: npm install bitcore-lib-cash');
}

const ARTIFACT_PATH = process.env.CONTRACT_ARTIFACT || path.join(__dirname, '..', 'artifacts', 'CreatorRouter.json');
const NETWORK = process.env.CASHSCRIPT_NETWORK || bchjsConfig.network || 'testnet';
const FUND_SATS = BigInt(process.env.FUND_SATS || '50000');
const DEPLOYER_WIF = process.env.DEPLOYER_WIF;
const PG_CONN = process.env.PG_CONN || process.env.DATABASE_URL;

if (!DEPLOYER_WIF && !process.env.SKIP_FUNDING) {
  logger.error('DEPLOYER_WIF is required in .env (deployer private key WIF)');
  logger.error('Set SKIP_FUNDING=true to skip funding step');
  process.exit(1);
}

async function main() {
  try {
    // 1) Load artifact
    if (!fs.existsSync(ARTIFACT_PATH)) {
      logger.error(`Contract artifact not found at: ${ARTIFACT_PATH}`);
      logger.error('Compile the contract first with: cashc contracts/CreatorRouter.cash --output artifacts/CreatorRouter.json');
      process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));
    logger.info('Loaded contract artifact');

    // 2) Get constructor args from environment
    const payoutPkhHex = process.env.PAYOUT_PKH;   // 20-byte hex (40 chars)
    const servicePkhHex = process.env.SERVICE_PKH || '0'.repeat(40);
    const creatorPubKeyHex = process.env.CREATOR_PUBKEY; // compressed pubkey hex (33 bytes = 66 chars)
    const feeBasisPoints = Number(process.env.FEE_BPS || 100); // 100 == 1.00%
    const hasService = process.env.HAS_SERVICE === 'true';
    const creatorId = process.env.CREATOR_ID || require('crypto').randomBytes(8).toString('hex');

    if (!payoutPkhHex || !creatorPubKeyHex) {
      logger.error('PAYOUT_PKH and CREATOR_PUBKEY must be provided in .env');
      logger.error('Example:');
      logger.error('  PAYOUT_PKH=0123456789abcdef0123456789abcdef01234567');
      logger.error('  CREATOR_PUBKEY=02abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab');
      process.exit(1);
    }

    // 3) Instantiate contract object (SDK computes address)
    let contractAddress = null;
    let contract = null;

    if (Contract && ElectrumNetworkProvider) {
      try {
        const provider = new ElectrumNetworkProvider(NETWORK);
        const constructorArgs = [
          Buffer.from(payoutPkhHex, 'hex'),
          Buffer.from(servicePkhHex, 'hex'),
          Buffer.from(creatorPubKeyHex, 'hex'),
          BigInt(feeBasisPoints),
          hasService
        ];

        contract = new Contract(artifact, constructorArgs, { provider });
        contractAddress = contract.address;
        logger.info('Contract computed address:', contractAddress);
      } catch (err) {
        logger.warn('Could not instantiate contract (CashScript version mismatch?):', err.message);
        logger.warn('Contract address will need to be computed manually or via cashscript CLI');
      }
    }

    if (!contractAddress) {
      logger.error('Could not compute contract address. Please use cashscript CLI:');
      logger.error('  cashc contracts/CreatorRouter.cash --output artifacts/CreatorRouter.json');
      logger.error('  Then use cashscript SDK or CLI to get the address');
      process.exit(1);
    }

    // 4) Fund contract address (if deployer WIF provided)
    if (DEPLOYER_WIF && bitcore && !process.env.SKIP_FUNDING) {
      logger.info('Funding contract address...');
      const bchjs = new BCHJS({ restURL: bchjsConfig.restUrl, apiToken: bchjsConfig.apiToken });
      
      const deployerPriv = bitcore.PrivateKey.fromWIF(DEPLOYER_WIF);
      const deployerAddress = deployerPriv.toAddress().toString();
      logger.info('Deployer address:', deployerAddress);

      // Fetch UTXOs (simplified - in production use proper UTXO selection)
      try {
        const utxosResp = await bchjs.Electrumx.utxo(deployerAddress);
        
        if (!utxosResp || !utxosResp.utxos || utxosResp.utxos.length === 0) {
          logger.warn('No UTXOs found for deployer address. Fund it first on', NETWORK);
          logger.info('Contract address to fund manually:', contractAddress);
        } else {
          // Pick first UTXO (demo only - use proper selection in production)
          const utxo = utxosResp.utxos[0];
          const inputSats = Number(utxo.satoshis);
          const fundSats = Number(FUND_SATS);
          const minerFeeSats = 250;

          if (inputSats < fundSats + minerFeeSats) {
            logger.warn('Deployer UTXO too small. Need at least', fundSats + minerFeeSats, 'sats');
            logger.info('Contract address to fund manually:', contractAddress);
          } else {
            const tx = new bitcore.Transaction();
            tx.from({
              txId: utxo.tx_hash,
              outputIndex: utxo.tx_pos,
              satoshis: utxo.satoshis,
              script: bitcore.Script.buildPublicKeyHashOut(deployerAddress)
            });

            tx.to(contractAddress, fundSats);
            tx.change(deployerAddress);
            tx.fee(minerFeeSats);
            tx.sign(deployerPriv);

            const rawHex = tx.serialize();
            logger.info('Broadcasting funding tx...');
            const broadcastResp = await bchjs.RawTransactions.sendRawTransaction(rawHex);
            logger.info('Broadcast result:', broadcastResp);
            logger.info('Funding transaction broadcasted. TXID:', broadcastResp);
          }
        }
      } catch (err) {
        logger.error('Error funding contract:', err.message);
        logger.info('Contract address to fund manually:', contractAddress);
      }
    } else {
      logger.info('Skipping funding (set DEPLOYER_WIF to enable auto-funding)');
      logger.info('Contract address to fund:', contractAddress);
    }

    // 5) Persist to Postgres (optional)
    if (PG_CONN) {
      const pool = new Pool({ connectionString: PG_CONN });
      try {
        await pool.query(
          `INSERT INTO creators (creator_id, contract_address, payout_pubkey, service_pubkey, fee_basis_points, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (creator_id) DO UPDATE 
           SET contract_address = EXCLUDED.contract_address,
               payout_pubkey = EXCLUDED.payout_pubkey,
               service_pubkey = EXCLUDED.service_pubkey,
               fee_basis_points = EXCLUDED.fee_basis_points`,
          [
            creatorId,
            contractAddress,
            creatorPubKeyHex,
            hasService ? servicePkhHex : null,
            feeBasisPoints
          ]
        );
        logger.info('Wrote creator record to DB');
      } catch (err) {
        logger.error('Error writing to DB:', err.message);
      } finally {
        await pool.end();
      }
    }

    logger.info('Deployment complete!');
    logger.info('Contract address:', contractAddress);
    logger.info('Creator ID:', creatorId);

  } catch (err) {
    logger.error('Deploy error:', err);
    process.exit(1);
  }
}

main();



