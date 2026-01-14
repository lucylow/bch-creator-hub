// contract-utxo-indexer.js
// Helper functions to index contract UTXOs
// Can be integrated with the existing ZMQ indexer or used standalone
const { query } = require('../config/database');
const bitcore = require('bitcore-lib-cash');
const logger = require('../utils/logger');

/**
 * Insert UTXO if it doesn't exist
 */
async function insertContractUtxo({ contractAddress, txid, vout, satoshis, scriptPubKey }) {
  try {
    await query(
      `INSERT INTO contract_utxos
        (contract_address, txid, vout, satoshis, script_pubkey, spent)
      VALUES
        ($1,$2,$3,$4,$5,false)
      ON CONFLICT (contract_address, txid, vout) DO NOTHING`,
      [contractAddress, txid, vout, satoshis, scriptPubKey || null]
    );
  } catch (err) {
    logger.error('Error inserting contract UTXO:', err);
    throw err;
  }
}

/**
 * Mark UTXOs from a tx as spent
 */
async function markContractUtxosSpent(txid) {
  try {
    await query(
      `UPDATE contract_utxos
      SET spent = true
      WHERE txid = $1`,
      [txid]
    );
  } catch (err) {
    logger.error('Error marking contract UTXOs as spent:', err);
    throw err;
  }
}

/**
 * Process transaction outputs and index contract UTXOs
 * @param {Object} tx - Transaction object (from bchjs or bitcore)
 * @param {number} blockHeight - Block height
 */
async function processTransactionForContractUtxos(tx, _blockHeight) {
  try {
    // Get all active contract addresses
    const contractsRes = await query(
      'SELECT DISTINCT contract_address FROM creators WHERE contract_address IS NOT NULL'
    );

    if (contractsRes.rowCount === 0) {
      return; // No contracts to track
    }

    const contractAddresses = contractsRes.rows.map(r => r.contract_address);

    // Parse transaction
    let parsedTx;
    if (typeof tx === 'string') {
      // Raw hex
      parsedTx = new bitcore.Transaction(tx);
    } else if (tx.hex) {
      // Object with hex property
      parsedTx = new bitcore.Transaction(tx.hex);
    } else if (tx.vout) {
      // BCHJS format
      // Process each output
      for (const [index, vout] of (tx.vout || []).entries()) {
        if (vout.scriptPubKey && vout.scriptPubKey.addresses) {
          const addresses = vout.scriptPubKey.addresses;
          for (const addr of addresses) {
            if (contractAddresses.includes(addr)) {
              const satoshis = Math.round(Number(vout.value) * 1e8);
              await insertContractUtxo({
                contractAddress: addr,
                txid: tx.txid || tx.hash,
                vout: index,
                satoshis,
                scriptPubKey: vout.scriptPubKey.hex
              });
            }
          }
        }
      }
      return;
    } else {
      // Assume bitcore Transaction
      parsedTx = tx;
    }

    const txid = parsedTx.id || parsedTx.hash;

    // Check outputs
    const outputs = parsedTx.outputs || [];
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      try {
        const script = output.script || output.scriptPubKey;
        if (!script) continue;

        const scriptHex = typeof script === 'string' ? script : script.toHex();
        const address = output.address || (script ? bitcore.Script.fromHex(scriptHex).toAddress() : null);
        if (!address) continue;

        const addressStr = typeof address === 'string' ? address : address.toString();

        if (contractAddresses.includes(addressStr)) {
          const satoshis = output.satoshis || output.value;
          await insertContractUtxo({
            contractAddress: addressStr,
            txid,
            vout: i,
            satoshis,
            scriptPubKey: scriptHex
          });
        }
      } catch (err) {
        logger.warn(`Error processing output ${i} for contract UTXO:`, err.message);
      }
    }
  } catch (err) {
    logger.error('Error processing transaction for contract UTXOs:', err);
    throw err;
  }
}

/**
 * Mark contract UTXOs as spent when they appear as inputs
 * @param {Object} tx - Transaction object
 */
async function markSpentUtxos(tx) {
  try {
    let parsedTx;
    if (typeof tx === 'string') {
      parsedTx = new bitcore.Transaction(tx);
    } else if (tx.hex) {
      parsedTx = new bitcore.Transaction(tx.hex);
    } else if (tx.vin) {
      // BCHJS format
      for (const vin of tx.vin || []) {
        if (vin.txid) {
          await markContractUtxosSpent(vin.txid);
        }
      }
      return;
    } else {
      parsedTx = tx;
    }

    const inputs = parsedTx.inputs || [];
    for (const input of inputs) {
      if (input.prevTxId) {
        const txid = typeof input.prevTxId === 'string' 
          ? input.prevTxId 
          : input.prevTxId.toString('hex');
        await markContractUtxosSpent(txid);
      }
    }
  } catch (err) {
    logger.error('Error marking spent UTXOs:', err);
    throw err;
  }
}

module.exports = {
  insertContractUtxo,
  markContractUtxosSpent,
  processTransactionForContractUtxos,
  markSpentUtxos
};

