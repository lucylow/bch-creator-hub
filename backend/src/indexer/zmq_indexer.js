/**
 * zmq_indexer.js
 *
 * Real-time block indexing via ZMQ (no polling). Subscribes to hashblock
 * notifications from a BCH node and processes blocks as they arrive.
 *
 * Requirements:
 * - A BCH node (bitcoind/bchd) publishing ZMQ on e.g. tcp://127.0.0.1:28332
 * - @psf/bch-js configured with RPC/REST endpoints to fetch blocks/txs
 * - Postgres DB to persist payments and blocks
 *
 * Env:
 *  ZMQ_URL=tcp://127.0.0.1:28332
 *  BCHJS_REST=https://... (or leave default)
 *  PG_CONN=postgres://user:pass@host/db
 *
 * Features:
 *  - Reconnect with exponential backoff on disconnect/failure
 *  - Reorg handling via blocks (height, hash, prev_hash)
 *  - Emits 'block' and 'payment' for WebSocket/API consumers
 *  - Optional catch-up from local tip to chain tip on start/reconnect
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
const ZMQ_URL = bchjsConfig.zmqUrl || process.env.ZMQ_URL || 'tcp://127.0.0.1:28332';
const ZMQ_RECONNECT_IVL_MS = Number(process.env.ZMQ_RECONNECT_IVL_MS) || 1000;
const ZMQ_RECONNECT_MAX_MS = Number(process.env.ZMQ_RECONNECT_MAX_MS) || 60000;
const CATCH_UP_ON_START = process.env.ZMQ_CATCH_UP_ON_START !== 'false';

// Event emitter for internal events
const indexerEvents = new EventEmitter();

// State for health/status
let state = {
  connected: false,
  lastBlockHeight: null,
  lastBlockHash: null,
  lastEventAt: null,
  stopped: false
};

function createSubscriber() {
  const sub = new zmq.Subscriber({
    reconnectInterval: ZMQ_RECONNECT_IVL_MS,
    reconnectMaxInterval: ZMQ_RECONNECT_MAX_MS,
    receiveTimeout: -1
  });
  sub.connect(ZMQ_URL);
  sub.subscribe('hashblock');
  return sub;
}

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
 * Catch up from local tip+1 to chain tip (e.g. after restart or long disconnect).
 * Uses the same Blockbook APIs as BCHService where possible.
 */
async function catchUpToChainTip() {
  const tip = await getTip();
  if (!tip) return;
  let chainHeight;
  try {
    if (typeof bchjs.Blockbook.blockchainInfo === 'function') {
      const info = await bchjs.Blockbook.blockchainInfo();
      chainHeight = info?.blocks;
    }
    if (chainHeight == null && typeof bchjs.Blockbook.getBlock === 'function') {
      const tipBlock = await bchjs.Blockbook.getBlock(tip.block_hash);
      chainHeight = tipBlock?.height ?? tip.height;
    }
  } catch (e) {
    logger.warn('ZMQ indexer: could not get chain height for catch-up', e?.message);
    return;
  }
  if (chainHeight == null || chainHeight <= tip.height) return;
  const from = tip.height + 1;
  logger.info(`ZMQ indexer: catch-up from block ${from} to ${chainHeight}`);
  const getBlockByHeight = typeof bchjs.Blockbook.block === 'function'
    ? (hei) => bchjs.Blockbook.block(hei)
    : (hei) => bchjs.Blockbook.getBlock(hei);
  for (let h = from; h <= chainHeight && !state.stopped; h++) {
    try {
      const blk = await getBlockByHeight(h);
      const hash = blk?.hash || blk?.blockHash;
      if (hash) await fetchBlockAndProcess(hash);
    } catch (err) {
      logger.warn('ZMQ indexer: catch-up block failed', h, err?.message);
    }
  }
}

/**
 * fetchBlockAndProcess(hash)
 * - fetch block via REST/RPC
 * - process TXs, persist payments, emit events
 */
async function fetchBlockAndProcess(blockHashOrHeight) {
  try {
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
        for (const vout of tx.vout || []) {
          if (!vout.scriptPubKey || !vout.scriptPubKey.hex) continue;
          const hex = vout.scriptPubKey.hex;
          if (hex.startsWith('6a')) {
            const dataHex = hex.slice(2);
            const buf = Buffer.from(dataHex, 'hex');
            const parsed = decodePayload(buf);
            if (!parsed) continue;

            const creatorRes = await pool.query(
              `SELECT creator_id, contract_address FROM creators WHERE creator_id = $1`,
              [parsed.creatorId]
            );
            if (creatorRes.rowCount === 0) continue;

            let amountSats = 0;
            let senderAddr = null;
            for (const out of tx.vout || []) {
              if (out.scriptPubKey && out.scriptPubKey.addresses) {
                if (out.scriptPubKey.addresses.includes(creatorRes.rows[0].contract_address)) {
                  amountSats += Math.round(Number(out.value) * 1e8);
                }
              }
            }
            if (tx.vin && tx.vin.length > 0 && tx.vin[0].addresses) {
              senderAddr = tx.vin[0].addresses[0];
            }

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

    state.lastBlockHeight = height;
    state.lastBlockHash = hash;
    state.lastEventAt = new Date();
    indexerEvents.emit('block', { height, hash, prevHash: prevHash });

    logger.info(`Processed block ${height} (${hash})`);
  } catch (err) {
    logger.error('Error processing block:', err);
    throw err;
  }
}

async function rollbackToHeight(targetHeight) {
  logger.info('Rolling back to height', targetHeight);
  await pool.query('DELETE FROM payments WHERE block_height > $1', [targetHeight]);
  await pool.query('DELETE FROM blocks WHERE height > $1', [targetHeight]);
}

async function findForkHeight(newPrevHash) {
  const res = await pool.query('SELECT height, block_hash, prev_hash FROM blocks ORDER BY height DESC');
  const rows = res.rows;
  const hashIndex = {};
  for (const r of rows) hashIndex[r.block_hash] = r.height;

  if (hashIndex[newPrevHash]) return hashIndex[newPrevHash];
  if (rows.length === 0) return 0;
  return Math.min(...rows.map(r => r.height));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single hashblock ZMQ message: reorg detection and block processing.
 */
async function handleHashblock(blockHashRaw) {
  const blockInfo = await bchjs.Blockbook.getBlock(blockHashRaw);
  const prevHash = blockInfo.previousblockhash;
  const tip = await getTip();

  if (!tip) {
    await fetchBlockAndProcess(blockHashRaw);
    return;
  }

  if (tip.block_hash === prevHash) {
    await fetchBlockAndProcess(blockHashRaw);
    return;
  }

  // Reorg
  logger.warn('Reorg detected. Finding fork height...');
  const forkHeight = await findForkHeight(prevHash);
  await rollbackToHeight(forkHeight);
  const newChain = [];
  let cur = blockHashRaw;
  let maxDepth = 200;
  while (maxDepth-- > 0) {
    const b = await bchjs.Blockbook.getBlock(cur);
    newChain.push(b);
    const forkBlock = await pool.query('SELECT block_hash FROM blocks WHERE height = $1', [forkHeight]);
    if (b.previousblockhash === forkBlock.rows[0]?.block_hash) break;
    cur = b.previousblockhash;
    if (!cur) break;
  }
  newChain.reverse();
  for (const b of newChain) {
    await fetchBlockAndProcess(b.hash);
  }
}

/**
 * Main ZMQ loop with reconnect and backoff. Runs until stop() is called.
 */
async function runLoop() {
  let zmqSub = null;
  let backoffMs = ZMQ_RECONNECT_IVL_MS;

  while (!state.stopped) {
    try {
      if (zmqSub && !zmqSub.closed) {
        try { zmqSub.close(); } catch (_) {}
      }
      zmqSub = createSubscriber();
      state.connected = true;
      backoffMs = ZMQ_RECONNECT_IVL_MS;
      indexerEvents.emit('connected', { url: ZMQ_URL });

      if (CATCH_UP_ON_START) {
        await catchUpToChainTip();
      }

      logger.info('ZMQ indexer subscribed to hashblock at', ZMQ_URL);

      for await (const [topicBuf, msg] of zmqSub) {
        if (state.stopped) break;
        const topic = Buffer.isBuffer(topicBuf) ? topicBuf.toString() : String(topicBuf);
        if (topic !== 'hashblock') continue;

        const blockHashRaw = Buffer.isBuffer(msg) ? msg.toString('hex') : String(msg);
        logger.info('New block via ZMQ:', blockHashRaw);

        try {
          await handleHashblock(blockHashRaw);
        } catch (err) {
          logger.error('Error handling block', blockHashRaw, err);
          // don't exit loop on single-block failure
        }
      }
    } catch (err) {
      state.connected = false;
      indexerEvents.emit('disconnected', { error: err?.message });
      logger.warn('ZMQ indexer disconnected, reconnecting:', err?.message);

      if (zmqSub && !zmqSub.closed) {
        try { zmqSub.close(); } catch (_) {}
        zmqSub = null;
      }

      if (state.stopped) break;
      await sleep(backoffMs);
      backoffMs = Math.min(backoffMs * 2, ZMQ_RECONNECT_MAX_MS);
    }
  }

  state.connected = false;
  if (zmqSub && !zmqSub.closed) {
    try { zmqSub.close(); } catch (_) {}
  }
  logger.info('ZMQ indexer loop stopped');
}

/**
 * Start the ZMQ indexer (non-blocking). Use when running inside the app.
 */
function start() {
  if (state.stopped) {
    state.stopped = false;
  }
  ensureSchema()
    .then(() => runLoop())
    .catch((err) => {
      logger.error('ZMQ indexer fatal:', err);
      state.connected = false;
      indexerEvents.emit('error', err);
    });
}

/**
 * Stop the indexer gracefully.
 */
function stop() {
  state.stopped = true;
}

/**
 * Status for health checks and monitoring.
 */
function getStatus() {
  return {
    connected: state.connected,
    lastBlockHeight: state.lastBlockHeight,
    lastBlockHash: state.lastBlockHash,
    lastEventAt: state.lastEventAt ? state.lastEventAt.toISOString() : null,
    stopped: state.stopped
  };
}

async function main() {
  await ensureSchema();
  logger.info('ZMQ Indexer starting (standalone)...');
  state.stopped = false;
  await runLoop();
}

// Export for use in other modules
module.exports = {
  indexerEvents,
  start,
  stop,
  getStatus,
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
