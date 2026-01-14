export const formatBCH = (satoshis: number): string => {
  const bch = satoshis / 100000000;
  return bch.toFixed(8).replace(/\.?0+$/, '') + ' BCH';
};

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const truncateAddress = (address: string, chars = 8): string => {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const satsToBCH = (sats: number): number => sats / 100000000;
export const bchToSats = (bch: number): number => Math.round(bch * 100000000);
