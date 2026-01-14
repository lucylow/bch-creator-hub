// Network configurations for testnet and mainnet
const NETWORK_CONFIGS = {
  testnet: {
    name: 'testnet',
    restUrl: 'https://api.fullstack.cash/v5/',
    wssUrl: 'wss://api.fullstack.cash/v5/',
    explorerUrl: 'https://www.blockchain.com/bch-testnet',
    zmqUrl: process.env.ZMQ_URL || 'tcp://127.0.0.1:28332',
    chainId: 'bchtest',
    isMainnet: false
  },
  mainnet: {
    name: 'mainnet',
    restUrl: 'https://api.fullstack.cash/v5/',
    wssUrl: 'wss://api.fullstack.cash/v5/',
    explorerUrl: 'https://www.blockchain.com/bch',
    zmqUrl: process.env.ZMQ_URL || 'tcp://127.0.0.1:28332',
    chainId: 'bch',
    isMainnet: true
  }
};

// Get current network from environment (default to testnet for safety)
let currentNetwork = (process.env.BCH_NETWORK || 'testnet').toLowerCase();

// Validate network
if (!NETWORK_CONFIGS[currentNetwork]) {
  console.warn(`Invalid network "${currentNetwork}", defaulting to testnet`);
  currentNetwork = 'testnet';
}

// Get configuration for current network
const networkConfig = NETWORK_CONFIGS[currentNetwork];

// Allow override via environment variables
const config = {
  network: currentNetwork,
  restUrl: process.env.BCH_REST_URL || networkConfig.restUrl,
  wssUrl: process.env.BCH_WSS_URL || networkConfig.wssUrl,
  explorerUrl: networkConfig.explorerUrl,
  zmqUrl: networkConfig.zmqUrl,
  chainId: networkConfig.chainId,
  isMainnet: networkConfig.isMainnet,
  apiToken: process.env.BCH_API_TOKEN,
  // Network-specific settings
  ...networkConfig
};

// Helper function to get network config
config.getNetworkConfig = (network) => {
  return NETWORK_CONFIGS[network] || NETWORK_CONFIGS.testnet;
};

// Helper to check if current network is mainnet
config.isMainnetNetwork = () => config.isMainnet;

// Helper to check if current network is testnet
config.isTestnetNetwork = () => !config.isMainnet;

module.exports = config;
