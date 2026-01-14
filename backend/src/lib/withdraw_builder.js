// withdraw_builder.js
// Builds unsigned withdrawal transaction skeletons that satisfy the RevenueSplitter contract
const bitcore = require('bitcore-lib-cash');

/**
 * Build withdraw tx skeleton that matches the RevenueSplitter contract requirements:
 *  - outputs[0] -> creatorAddress (>= payoutSats)
 *  - outputs[1] -> serviceAddress (>= serviceSats)  IF serviceAddress provided
 *
 * Returns { tx, rawUnsignedHex, totals }
 *
 * @param {Object} params
 * @param {Array} params.utxos - Array of { txid, vout, satoshis, script_pubkey }
 * @param {string} params.creatorAddress - Destination P2PKH (creator)
 * @param {string} params.serviceAddress - Optional service P2PKH
 * @param {number} params.feeBps - Basis points (100 = 1%)
 * @param {number} params.minerAllowance - Miner allowance to include as fee (default: 1000)
 */
function buildWithdrawSkeleton({ utxos, creatorAddress, serviceAddress, feeBps, minerAllowance = 1000 }) {
  if (!Array.isArray(utxos) || utxos.length === 0) {
    throw new Error('No UTXOs provided');
  }

  const total = utxos.reduce((s, u) => s + Number(u.satoshis), 0);
  if (total <= 0) {
    throw new Error('No funds in contract UTXOs');
  }

  const serviceSats = Math.floor((total * feeBps) / 10000);
  const payoutSats = total - serviceSats - minerAllowance;

  if (payoutSats <= 0) {
    throw new Error('Payout would be zero or negative; adjust fee/miner allowance or supply larger UTXOs');
  }

  const tx = new bitcore.Transaction();

  // Add inputs
  for (const u of utxos) {
    tx.from({
      txId: u.txid,
      outputIndex: u.vout,
      satoshis: Number(u.satoshis),
      script: u.script_pubkey || undefined
    });
  }

  // Required ordering: creator first
  tx.to(creatorAddress, payoutSats);

  if (serviceAddress && serviceSats > 0) {
    tx.to(serviceAddress, serviceSats);
  }

  // Set fee equal to minerAllowance (so tx will be valid regarding fee expectations)
  tx.fee(minerAllowance);

  // Do NOT sign here; return unsigned raw hex for client to sign
  const rawUnsignedHex = tx.serialize(false); // false -> do not sign

  return {
    tx,
    rawUnsignedHex,
    totals: { total, payoutSats, serviceSats, minerAllowance }
  };
}

module.exports = { buildWithdrawSkeleton };


