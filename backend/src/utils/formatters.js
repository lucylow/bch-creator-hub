/**
 * Format satoshis to BCH
 */
const satsToBch = (sats) => {
  return (sats / 100000000).toFixed(8);
};

/**
 * Format BCH to satoshis
 */
const bchToSats = (bch) => {
  return Math.round(bch * 100000000);
};

/**
 * Format satoshis to USD (assuming price)
 */
const satsToUsd = (sats, bchPrice = 250) => {
  return ((sats / 100000000) * bchPrice).toFixed(2);
};

/**
 * Format number with commas
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format date to ISO string
 */
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Truncate address for display
 */
const truncateAddress = (address, start = 6, end = 4) => {
  if (!address || address.length <= start + end) {
    return address;
  }
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

module.exports = {
  satsToBch,
  bchToSats,
  satsToUsd,
  formatNumber,
  formatDate,
  truncateAddress,
  formatBytes
};


