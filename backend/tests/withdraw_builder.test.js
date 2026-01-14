// tests/withdraw_builder.test.js
const { buildWithdrawSkeleton } = require('../src/lib/withdraw_builder');
const bitcore = require('bitcore-lib-cash');

describe('Revenue Splitter withdraw builder', () => {
  test('builds tx with creator output first and service output second', () => {
    // Synthetic UTXO
    const utxos = [{ txid: 'aa'.repeat(32), vout: 0, satoshis: 100000 }];
    const creatorAddr = 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'; // placeholder
    const serviceAddr = 'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy'; // placeholder
    const feeBps = 100; // 1%
    const minerAllowance = 1000;

    const result = buildWithdrawSkeleton({
      utxos,
      creatorAddress: creatorAddr,
      serviceAddress: serviceAddr,
      feeBps,
      minerAllowance
    });

    // Total should be equal to utxo amount
    expect(result.totals.total).toBe(100000);
    // Service sats computed
    expect(result.totals.serviceSats).toBe(Math.floor(100000 * feeBps / 10000));
    // Payout sats computed
    expect(result.totals.payoutSats).toBe(100000 - result.totals.serviceSats - minerAllowance);

    // Check outputs order using bitcore TX
    const outs = result.tx.toObject().outputs;
    // We expect there are at least 2 outputs
    expect(outs.length).toBeGreaterThanOrEqual(2);
    expect(outs[0].satoshis).toBe(result.totals.payoutSats);
    expect(outs[1].satoshis).toBe(result.totals.serviceSats);
  });

  test('throws if payout would be negative', () => {
    const utxos = [{ txid: 'bb'.repeat(32), vout: 0, satoshis: 500 }];
    const creatorAddr = 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a';
    const serviceAddr = 'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy';
    const feeBps = 5000; // 50% to make payout small
    expect(() => {
      buildWithdrawSkeleton({
        utxos,
        creatorAddress: creatorAddr,
        serviceAddress: serviceAddr,
        feeBps,
        minerAllowance: 1000
      });
    }).toThrow();
  });

  test('handles zero fee correctly', () => {
    const utxos = [{ txid: 'cc'.repeat(32), vout: 0, satoshis: 100000 }];
    const creatorAddr = 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a';
    const feeBps = 0; // No fee
    const minerAllowance = 1000;

    const result = buildWithdrawSkeleton({
      utxos,
      creatorAddress: creatorAddr,
      serviceAddress: null,
      feeBps,
      minerAllowance
    });

    expect(result.totals.serviceSats).toBe(0);
    expect(result.totals.payoutSats).toBe(100000 - minerAllowance);
    
    const outs = result.tx.toObject().outputs;
    // Should have at least 1 output (creator)
    expect(outs.length).toBeGreaterThanOrEqual(1);
    expect(outs[0].satoshis).toBe(result.totals.payoutSats);
  });

  test('throws if no UTXOs provided', () => {
    expect(() => {
      buildWithdrawSkeleton({
        utxos: [],
        creatorAddress: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
        serviceAddress: null,
        feeBps: 100,
        minerAllowance: 1000
      });
    }).toThrow('No UTXOs provided');
  });
});


