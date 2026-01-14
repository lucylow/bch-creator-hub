/**
 * Outline of withdrawal flow:
 * - Creator requests a withdraw from dashboard UI
 * - Backend responds with unspent UTXOs that belong to their contract address
 * - Frontend constructs a spend tx: outputs -> [creator payout address: amount - fee, service_pubkey if fee > 0]
 * - Creator signs the tx with their private key locally (never send keys to server)
 * - Frontend posts signed tx hex to /api/tx/broadcast
 *
 * This file contains pseudocode helpers to build raw tx using bch-js or bitcore-lib-cash
 */

const bitcore = require('bitcore-lib-cash');

/**
 * Build withdrawal transaction structure
 * Note: This is a helper function. Actual signing must be done client-side.
 */
function buildWithdrawalTx({
  utxos,
  payoutAddress,
  serviceAddress,
  feeBasisPoints,
}) {
  // calculate total sats
  const totalSats = utxos.reduce((s, u) => s + u.satoshis, 0);
  // compute service fee
  const serviceSats = Math.floor((totalSats * feeBasisPoints) / 10000);
  const payoutSats = totalSats - serviceSats - 250; // subtract network fee estimate (250 sat)
  
  const tx = new bitcore.Transaction();
  tx.from(utxos);
  tx.to(payoutAddress, payoutSats);
  if (serviceAddress && serviceSats > 0) {
    tx.to(serviceAddress, serviceSats);
  }
  tx.fee(250);
  
  // return raw tx skeleton for signing
  return tx;
}

/**
 * Calculate withdrawal amounts
 * @param {number} totalSats - Total amount to withdraw
 * @param {number} feeBasisPoints - Fee in basis points (100 = 1%)
 * @param {number} networkFeeSats - Network fee estimate in satoshis
 * @returns {Object} Breakdown of withdrawal amounts
 */
function calculateWithdrawalAmounts(totalSats, feeBasisPoints, networkFeeSats = 250) {
  const serviceSats = feeBasisPoints > 0 ? Math.floor((totalSats * feeBasisPoints) / 10000) : 0;
  const payoutSats = totalSats - serviceSats - networkFeeSats;
  
  // Ensure payout is positive
  if (payoutSats < 0) {
    throw new Error('Withdrawal amount too small to cover fees');
  }
  
  return {
    totalSats,
    serviceSats,
    payoutSats,
    networkFeeSats
  };
}

module.exports = {
  buildWithdrawalTx,
  calculateWithdrawalAmounts
};

