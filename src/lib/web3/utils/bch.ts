// BCH utility functions
export const formatBCH = (sats: number, decimals = 8): string => {
  if (!sats && sats !== 0) return '0 BCH';
  
  const bch = sats / 100000000;
  
  // Remove trailing zeros
  const formatted = bch.toFixed(decimals).replace(/\.?0+$/, '');
  
  return `${formatted} BCH`;
};

export const formatUSD = (sats: number, rate = 250): string => {
  if (!sats && sats !== 0) return '$0.00';
  
  const bch = sats / 100000000;
  const usd = bch * rate;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usd);
};

export const truncateAddress = (address: string, start = 6, end = 4): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};

export const isValidBCHAddress = (address: string): boolean => {
  const cashAddrRegex = /^(bitcoincash:|bchtest:|bchreg:)?[qp][a-z0-9]{41}$/i;
  return cashAddrRegex.test(address);
};

export const generatePaymentURI = (
  address: string,
  amountSats: number,
  label = '',
  message = ''
): string => {
  const amountBCH = (amountSats / 100000000).toFixed(8);
  
  let uri = `bitcoincash:${address}?amount=${amountBCH}`;
  
  if (label) {
    uri += `&label=${encodeURIComponent(label)}`;
  }
  
  if (message) {
    uri += `&message=${encodeURIComponent(message)}`;
  }
  
  return uri;
};

export const parseTransaction = (tx: any) => {
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

