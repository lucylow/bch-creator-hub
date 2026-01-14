// contract-withdraw.routes.js
// Routes for RevenueSplitter contract withdrawals
require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bitcore = require('bitcore-lib-cash');
const BCHJS = require('@psf/bch-js');
const { query } = require('../config/database');
const { buildWithdrawSkeleton } = require('../lib/withdraw_builder');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(express.json());

// All routes require authentication
router.use(verifyToken);

const bchjs = new BCHJS({ restURL: process.env.BCH_REST || undefined });

/**
 * Helper: fetch contract address for creator
 */
async function getContractAddressForCreator(creatorId) {
  const res = await query('SELECT contract_address FROM creators WHERE creator_id = $1', [creatorId]);
  if (res.rowCount === 0) return null;
  return res.rows[0].contract_address;
}

/**
 * Helper: get creator payout address from DB
 */
async function getCreatorPayoutAddress(creatorId) {
  const r = await query('SELECT payout_address, wallet_address FROM creators WHERE creator_id = $1', [creatorId]);
  if (r.rowCount === 0) return null;
  // Use payout_address if set, otherwise fall back to wallet_address
  return r.rows[0].payout_address || r.rows[0].wallet_address;
}

/**
 * POST /api/contract/withdraw/:creatorId/skeleton
 * Body: { serviceAddress? }
 * 
 * Returns: { withdrawRequestId, rawUnsignedHex, totals, expiresAt }
 */
router.post('/withdraw/:creatorId/skeleton', async (req, res) => {
  const { creatorId } = req.params;
  const { serviceAddress } = req.body || {};
  const feeBps = Number(process.env.FEE_BPS || 100); // fallback 1%
  const minerAllowance = Number(process.env.MINER_ALLOWANCE || 1000);

  try {
    // Verify the creator ID matches the authenticated user
    if (!req.creator) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.creator.creator_id !== creatorId) {
      return res.status(403).json({ error: 'Unauthorized: creator ID mismatch' });
    }

    // 1) Resolve contract address for creator
    const contractAddress = await getContractAddressForCreator(creatorId);
    if (!contractAddress) {
      return res.status(404).json({ error: 'Creator not found or contract not deployed' });
    }

    // 2) Query available UTXOs for that contract address (unspent)
    const utxoRows = await query(
      'SELECT txid, vout, satoshis, script_pubkey FROM contract_utxos WHERE contract_address = $1 AND spent = false ORDER BY satoshis DESC',
      [contractAddress]
    );
    const utxos = utxoRows.rows.map(r => ({
      txid: r.txid,
      vout: r.vout,
      satoshis: Number(r.satoshis),
      script_pubkey: r.script_pubkey
    }));

    if (utxos.length === 0) {
      return res.status(400).json({ error: 'No available contract UTXOs to withdraw' });
    }

    // 3) Build withdraw skeleton using all available UTXOs
    const creatorPayoutAddress = await getCreatorPayoutAddress(creatorId);
    if (!creatorPayoutAddress) {
      return res.status(500).json({ error: 'Creator payout address not configured' });
    }

    const skeleton = buildWithdrawSkeleton({
      utxos,
      creatorAddress: creatorPayoutAddress,
      serviceAddress,
      feeBps,
      minerAllowance
    });

    // 4) Persist withdraw_request so broadcast can validate later
    const withdrawRequestId = uuidv4();
    const expiresAt = new Date(Date.now() + (1000 * 60 * 5)); // expires in 5 minutes
    await query(
      `INSERT INTO withdraw_requests (id, creator_id, contract_address, utxos, raw_unsigned_hex, totals, status, created_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8)`,
      [
        withdrawRequestId,
        creatorId,
        contractAddress,
        JSON.stringify(utxos),
        skeleton.rawUnsignedHex,
        JSON.stringify(skeleton.totals),
        'pending',
        expiresAt.toISOString()
      ]
    );

    return res.json({
      withdrawRequestId,
      rawUnsignedHex: skeleton.rawUnsignedHex,
      totals: skeleton.totals,
      expiresAt: expiresAt.toISOString()
    });
  } catch (err) {
    console.error('withdraw-skeleton error', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

/**
 * POST /api/contract/tx/broadcast
 * Body: { withdrawRequestId, signedTxHex }
 * 
 * Verifies inputs match stored UTXOs for the withdrawRequest, then broadcasts via bchjs
 */
router.post('/tx/broadcast', async (req, res) => {
  const { withdrawRequestId, signedTxHex } = req.body || {};
  if (!withdrawRequestId || !signedTxHex) {
    return res.status(400).json({ error: 'withdrawRequestId and signedTxHex required' });
  }

  try {
    // Fetch withdraw request
    const r = await query('SELECT * FROM withdraw_requests WHERE id = $1', [withdrawRequestId]);
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'Withdraw request not found' });
    }
    const wr = r.rows[0];

    if (wr.status !== 'pending') {
      return res.status(400).json({ error: 'Withdraw request not pending' });
    }
    if (new Date(wr.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Withdraw request expired' });
    }

    // Verify the creator ID matches the authenticated user
    if (req.creator && req.creator.creator_id !== wr.creator_id) {
      return res.status(403).json({ error: 'Unauthorized: creator ID mismatch' });
    }

    const expectedUtxos = JSON.parse(wr.utxos); // array of utxos

    // Parse signed tx and extract inputs
    let parsedTx;
    try {
      parsedTx = new bitcore.Transaction(signedTxHex);
    } catch (err) {
      return res.status(400).json({ error: 'invalid signedTxHex' });
    }

    const signedInputs = parsedTx.inputs.map(inp => ({
      txid: inp.prevTxId.toString('hex'),
      vout: inp.outputIndex
    }));

    // Verify that signedInputs set equals expectedUtxos set
    const expectedSet = new Set(expectedUtxos.map(u => `${u.txid}:${u.vout}`));
    const signedSet = new Set(signedInputs.map(i => `${i.txid}:${i.vout}`));

    // All expected utxos must be present in signed tx inputs (we require exact match)
    let allPresent = true;
    if (expectedSet.size !== signedSet.size) {
      allPresent = false;
    } else {
      for (const s of expectedSet) {
        if (!signedSet.has(s)) {
          allPresent = false;
          break;
        }
      }
    }

    if (!allPresent) {
      return res.status(400).json({ error: 'Signed tx inputs do not match expected contract UTXOs for this withdraw request' });
    }

    // Optional: additional checks — output order & amounts
    const totals = wr.totals ? JSON.parse(wr.totals) : null;
    if (totals) {
      const outs = parsedTx.toObject().outputs;
      if (!outs || outs.length === 0) {
        return res.status(400).json({ error: 'Signed tx has no outputs' });
      }
      // Check first output sats
      const out0Sats = outs[0].satoshis;
      if (out0Sats < totals.payoutSats) {
        return res.status(400).json({ error: 'Signed tx creator output less than expected payout' });
      }
      if (totals.serviceSats > 0) {
        if (outs.length < 2) {
          return res.status(400).json({ error: 'Expected service output missing' });
        }
        if (outs[1].satoshis < totals.serviceSats) {
          return res.status(400).json({ error: 'Signed tx service output less than expected service sats' });
        }
      }
    }

    // Broadcast via bchjs
    const broadcastResp = await bchjs.RawTransactions.sendRawTransaction([signedTxHex]);
    const txid = broadcastResp && broadcastResp[0] ? broadcastResp[0] : null;
    if (!txid) {
      return res.status(500).json({ error: 'Broadcast returned no txid', raw: broadcastResp });
    }

    // Update DB: mark UTXOs as spent
    for (const u of expectedUtxos) {
      await query('UPDATE contract_utxos SET spent = true WHERE txid = $1 AND vout = $2', [u.txid, u.vout]);
    }

    // Update withdraw_request
    await query('UPDATE withdraw_requests SET status = $1 WHERE id = $2', ['broadcasted', withdrawRequestId]);

    return res.json({ txid });
  } catch (err) {
    console.error('tx.broadcast error', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

module.exports = router;

