/**
 * zmq_indexer.js
 *
 * Requirements:
 * - A BCH node (bitcoind/bchd) publishing ZMQ on e.g. tcp://127.0.0.1:28332
 * - @psf/bch-js configured with RPC/REST endpoints to fetch blocks/txs
 * - Postgres DB to persist payments and blocks
 *
 * Env:
 *  ZMQ_URL=zmtp://127.0.0.1:28332
 *  BCHJS_REST=https://... (or leave default)
 *  PG_CONN=postgres://user:pass@host/db
 *
 * This script demonstrates robust reorg handling:
 *  - keep blocks table: (height, hash, prev_hash)
 *  - when new block arrives, compare its prev_hash with stored tip.
 *    - if mismatch -> reorg detected -> find fork height -> rollback DB rows tied to orphaned heights -> process new chain.
 */

const zmq = require('zeromq');
const BCHJS = require('@psf/bch-js');
const { Pool } = require('pg');
const EventEmitter = require('events');
const bchjsConfig = require('../config/bch');
const logger = require('../utils/logger');
const { decodePayload } = require('../lib/payload');

// Initialize BCH client
const bchjs = new BCHJS({ restURL: bchjsConfig.restUrl, apiToken: bchjsConfig.apiToken });

// Database connection
const PG_CONN = process.env.PG_CONN || process.env.DATABASE_URL || 'postgres://localhost/bch_paywall_router';
const pool = new Pool({ connectionString: PG_CONN });

// ZMQ configuration
const ZMQ_URL = process.env.ZMQ_URL || 'tcp://127.0.0.1:28332';
const zmqSub = new zmq.Subscriber();

// Event emitter for internal events
const indexerEvents = new EventEmitter();

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      height INT PRIMARY KEY,
      block_hash VARCHAR(100) NOT NULL,
      prev_hash VARCHAR(100) NOT NULL,
      inserted_at timestamptz DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS meta (
      k TEXT PRIMARY KEY,
      v TEXT
    );
  `);
}

async function getTip() {
  const res = await pool.query("SELECT height, block_hash FROM blocks ORDER BY height DESC LIMIT 1");
  if (res.rowCount === 0) return null;
  return res.rows[0];
}

/**
 * fetchBlockAndProcess(hash)
 * - fetch block via REST/RPC
 * - process TXs
 */
async function fetchBlockAndProcess(blockHashOrHeight) {
  try {
    // bchjs.Blockbook.getBlock is often available on public providers; adapt as needed.
    const block = await bchjs.Blockbook.getBlock(blockHashOrHeight);
    const height = block.height;
    const hash = block.hash;
    const prevHash = block.previousblockhash;

    // 1) insert block into blocks table (if not exists)
    await pool.query(
      `INSERT INTO blocks (height, block_hash, prev_hash) VALUES ($1,$2,$3)
       ON CONFLICT (height) DO UPDATE SET block_hash = EXCLUDED.block_hash, prev_hash = EXCLUDED.prev_hash`,
      [height, hash, prevHash]
    );

    // 2) for each tx, fetch raw TX and inspect outputs
    for (const txid of block.tx || []) {
      try {
        const tx = await bchjs.Blockbook.getTransaction(txid);
        // determine outputs with OP_RETURN and decode
        for (const vout of tx.vout || []) {
          if (!vout.scriptPubKey || !vout.scriptPubKey.hex) continue;
          const hex = vout.scriptPubKey.hex;
          if (hex.startsWith('6a')) {
            // OP_RETURN present
            const dataHex = hex.slice(2);
            const buf = Buffer.from(dataHex, 'hex');
            const parsed = decodePayload(buf);
            if (!parsed) continue;
            
            // find creator by parsed.creatorId
            const creatorRes = await pool.query(
              `SELECT creator_id, contract_address FROM creators WHERE creator_id = $1`,
              [parsed.creatorId]
            );
            if (creatorRes.rowCount === 0) continue;

            // find amount to contract address in tx outputs (naive)
            let amountSats = 0;
            let senderAddr = null;
            // simple method: find outputs whose addresses equal stored contract_address
            for (const out of tx.vout || []) {
              if (out.scriptPubKey && out.scriptPubKey.addresses) {
                const addresses = out.scriptPubKey.addresses;
                if (addresses.includes(creatorRes.rows[0].contract_address)) {
                  amountSats += Math.round(Number(out.value) * 1e8);
                }
              }
            }
            
            // Get sender address from vin if available
            if (tx.vin && tx.vin.length > 0 && tx.vin[0].addresses) {
              senderAddr = tx.vin[0].addresses[0];
            }

            // insert payment - use ON CONFLICT ignore duplicates
            await pool.query(
              `INSERT INTO payments (txid, creator_id, intent_type, content_id, sender_address, amount_sats, payload_hex, block_height, block_hash, confirmed_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
               ON CONFLICT (txid) DO NOTHING`,
              [
                txid,
                parsed.creatorId,
                parsed.paymentType,
                parsed.contentId ? String(parsed.contentId) : null,
                senderAddr,
                amountSats,
                dataHex,
                height,
                hash,
                new Date()
              ]
            );

            // emit event for websocket forwarding
            indexerEvents.emit('payment', {
              txid,
              creatorId: parsed.creatorId,
              paymentType: parsed.paymentType,
              contentId: parsed.contentId,
              amountSats,
              blockHeight: height,
              blockHash: hash
            });
          }
        }
      } catch (err) {
        logger.warn('failed processing tx', txid, err.message || err);
      }
    }
    
    logger.info(`Processed block ${height} (${hash})`);
  } catch (err) {
    logger.error('Error processing block:', err);
    throw err;
  }
}

/**
 * rollbackToHeight(targetHeight)
 * - remove blocks and payments for heights > targetHeight
 */
async function rollbackToHeight(targetHeight) {
  logger.info('Rolling back to height', targetHeight);
  await pool.query('DELETE FROM payments WHERE block_height > $1', [targetHeight]);
  await pool.query('DELETE FROM blocks WHERE height > $1', [targetHeight]);
}

/**
 * findForkHeight(newPrevHash)
 * - Starting from stored tip, walk backward until you find a block hash that matches newPrevHash (or its ancestor)
 * - returns fork height (the height common ancestor), or -1 if none (rare)
 */
async function findForkHeight(newPrevHash) {
  // walk back stored blocks until prev_hash chain matches
  const res = await pool.query('SELECT height, block_hash, prev_hash FROM blocks ORDER BY height DESC');
  const rows = res.rows;
  const hashIndex = {};
  for (const r of rows) hashIndex[r.block_hash] = r.height;

  if (hashIndex[newPrevHash]) return hashIndex[newPrevHash]; // direct match

  // fallback: traverse new chain via RPC to find earliest common ancestor (expensive)
  // For simplicity, if no direct match, return the lowest height in our DB (complete re-sync)
  if (rows.length === 0) return 0;
  return Math.min(...rows.map(r => r.height));
}

/**
 * main ZMQ loop:
 * - subscribe to hashblock,
 * - on new hashblock message, fetch block header via RPC, detect reorg and process
 */
async function main() {
  try {
    await ensureSchema();
    logger.info('ZMQ Indexer starting...');

    zmqSub.connect(ZMQ_URL);
    zmqSub.subscribe('hashblock'); // topic bytes 'hashblock'
    logger.info('Subscribed to ZMQ at', ZMQ_URL);

    for await (const [topicBuf, msg] of zmqSub) {
      const topic = topicBuf.toString();
      if (topic !== 'hashblock') continue;

      const blockHashRaw = msg.toString('hex');
      logger.info('New block announced via ZMQ:', blockHashRaw);

      // fetch block header / details
      const blockInfo = await bchjs.Blockbook.getBlock(blockHashRaw);
      const height = blockInfo.height;
      const prevHash = blockInfo.previousblockhash;

      const tip = await getTip(); // local tip
      if (!tip) {
        // fresh index, just process block
        logger.info('No local tip, processing block', blockHashRaw);
        await fetchBlockAndProcess(blockHashRaw);
        continue;
      }

      if (tip.block_hash === prevHash) {
        // normal extension - safe to append
        logger.info('chain extension detected, processing block', blockHashRaw);
        await fetchBlockAndProcess(blockHashRaw);
        continue;
      } else {
        // Reorg detected - new block's prevhash doesn't match our tip
        logger.warn('Reorg detected. New block prevhash != local tip.hash. Finding fork height...');
        const forkHeight = await findForkHeight(prevHash);
        logger.info('Fork height resolved to', forkHeight);
        // rollback DB entries above fork height
        await rollbackToHeight(forkHeight);
        // Now process all blocks from forkHeight+1 up to the new tip
        // We'll walk forward by following next hashes from the network
        const newChain = [];
        let cur = blockHashRaw;
        let maxDepth = 200; // safety limit
        while (maxDepth-- > 0) {
          const b = await bchjs.Blockbook.getBlock(cur);
          newChain.push(b);
          const forkBlock = await pool.query('SELECT block_hash FROM blocks WHERE height = $1', [forkHeight]);
          if (b.previousblockhash === forkBlock.rows[0]?.block_hash) {
            break;
          }
          cur = b.previousblockhash;
          if (!cur) break;
        }
        // process the chain from oldest -> newest
        newChain.reverse();
        for (const b of newChain) {
          await fetchBlockAndProcess(b.hash);
        }
      }
    }
  } catch (err) {
    logger.error('indexer crashed', err);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  indexerEvents,
  start: main,
  fetchBlockAndProcess,
  rollbackToHeight,
  findForkHeight
};

// If run directly, start the indexer
if (require.main === module) {
  main().catch((err) => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
}

