// BCH utility functions and constants

/** Satoshis per BCH */
export const SATS_PER_BCH = 100_000_000;

/** Default BCH/USD rate for display */
export const DEFAULT_BCH_USD_RATE = 250;

/** Block explorer base URLs by network */
export const BCH_EXPLORERS: Record<string, { tx: string; address: string }> = {
  mainnet: { tx: 'https://explorer.bitcoincash.org/tx', address: 'https://explorer.bitcoincash.org/address' },
  testnet: { tx: 'https://testnet.imaginary.cash/tx', address: 'https://testnet.imaginary.cash/address' },
  regtest: { tx: '#', address: '#' },
};

export const formatBCH = (sats: number, decimals = 8): string => {
  if (!sats && sats !== 0) return '0 BCH';

  const bch = sats / SATS_PER_BCH;
  const formatted = bch.toFixed(decimals).replace(/\.?0+$/, '');
  return `${formatted} BCH`;
};

/** Compact format for small amounts: uses "bits" (100 sats) or BCH as appropriate */
export const formatBCHCompact = (sats: number): string => {
  if (!sats && sats !== 0) return '0 BCH';
  if (sats >= SATS_PER_BCH) return formatBCH(sats, 4);
  const bits = sats / 100;
  if (bits >= 1) return `${bits % 1 === 0 ? bits : bits.toFixed(2)} bits`;
  return formatBCH(sats, 8);
};

export const formatUSD = (sats: number, rate = DEFAULT_BCH_USD_RATE): string => {
  if (!sats && sats !== 0) return '$0.00';
  const bch = sats / SATS_PER_BCH;
  const usd = bch * rate;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
};

export const truncateAddress = (address: string, start = 6, end = 4): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};

/**
 * Validate BCH address: CashAddr (bitcoincash:/bchtest:/bchreg:) and legacy (1.../3...) formats.
 * CashAddr payload is 42 chars [qp][a-z0-9]{41} (P2PKH or P2SH).
 */
export const isValidBCHAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  const stripped = address.trim();
  const cashAddrRegex = /^(bitcoincash:|bchtest:|bchreg:)?[qp][a-z0-9]{41}$/i;
  const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  return cashAddrRegex.test(stripped) || legacyRegex.test(stripped);
};

/** Normalize to CashAddr with prefix for URIs (strips or adds bitcoincash: as needed) */
export const toCashAddrWithPrefix = (address: string, network: 'mainnet' | 'testnet' = 'mainnet'): string => {
  if (!address) return '';
  const prefix = network === 'testnet' ? 'bchtest:' : 'bitcoincash:';
  const lower = address.toLowerCase();
  if (lower.startsWith('bitcoincash:') || lower.startsWith('bchtest:') || lower.startsWith('bchreg:')) return address;
  if (/^[qp][a-z0-9]{41}$/i.test(address)) return prefix + address;
  return address;
};

/** Build block explorer URL for a transaction or address */
export const getBlockExplorerUrl = (
  network: string,
  type: 'tx' | 'address',
  value: string
): string => {
  const explorers = BCH_EXPLORERS[network] || BCH_EXPLORERS.mainnet;
  const base = type === 'tx' ? explorers.tx : explorers.address;
  return base === '#' ? '#' : `${base}/${value}`;
};

export const generatePaymentURI = (
  address: string,
  amountSats: number,
  label = '',
  message = ''
): string => {
  const addr = address.replace(/^(bitcoincash:|bchtest:|bchreg:)/i, '');
  const amountBCH = (amountSats / SATS_PER_BCH).toFixed(8);
  let uri = `bitcoincash:${addr}?amount=${amountBCH}`;
  if (label) uri += `&label=${encodeURIComponent(label)}`;
  if (message) uri += `&message=${encodeURIComponent(message)}`;
  return uri;
};

/**
 * Build a single BCH URI for the unified payment interface.
 * One address for all payment types (tips, subscriptions, paywalls).
 * Optional amount and message (e.g. "Tip", "Subscription", "Unlock: content-id").
 */
export const generateUnifiedPaymentURI = (
  address: string,
  opts: { amountSats?: number; message?: string; label?: string } = {}
): string => {
  const addr = address.replace(/^(bitcoincash:|bchtest:|bchreg:)/i, '');
  const params = new URLSearchParams();
  if (opts.amountSats != null && opts.amountSats > 0) {
    params.set('amount', (opts.amountSats / SATS_PER_BCH).toFixed(8));
  }
  if (opts.label) params.set('label', opts.label);
  if (opts.message) params.set('message', opts.message);
  const qs = params.toString();
  return qs ? `bitcoincash:${addr}?${qs}` : `bitcoincash:${addr}`;
};

interface ParsedTxInput {
  txid?: string;
  value?: number;
  confirmations?: number;
  blockTime?: number;
  vin?: unknown[];
  vout?: unknown[];
  fees?: number;
}

export const parseTransaction = (tx: ParsedTxInput) => {
  return {
    txid: tx.txid,
    amount: tx.value,
    confirmations: tx.confirmations,
    timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
    inputs: tx.vin,
    outputs: tx.vout,
    fee: tx.fees || 0
  };
};


