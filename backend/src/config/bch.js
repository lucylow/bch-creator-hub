module.exports = {
  network: process.env.BCH_NETWORK || 'testnet',
  restUrl: process.env.BCH_REST_URL || 'https://api.fullstack.cash/v5/',
  apiToken: process.env.BCH_API_TOKEN,
  wssUrl: process.env.BCH_WSS_URL || 'wss://api.fullstack.cash/v5/',
};
