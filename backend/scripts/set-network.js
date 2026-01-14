#!/usr/bin/env node
/**
 * Network Configuration Script
 * 
 * Helps switch between testnet and mainnet configurations
 * Usage:
 *   node scripts/set-network.js testnet
 *   node scripts/set-network.js mainnet
 *   node scripts/set-network.js status
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const NETWORKS = ['testnet', 'mainnet'];
const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_FILE = path.join(__dirname, '..', '.env.example');

function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }
  
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function writeEnvFile(env) {
  const lines = Object.entries(env).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n');
}

function setNetwork(network) {
  if (!NETWORKS.includes(network)) {
    console.error(`❌ Invalid network: ${network}`);
    console.error(`   Valid networks: ${NETWORKS.join(', ')}`);
    process.exit(1);
  }

  const env = readEnvFile();
  const previousNetwork = env.BCH_NETWORK || 'testnet';
  
  if (network === previousNetwork) {
    console.log(`ℹ️  Already configured for ${network}`);
    return;
  }

  // Update network
  env.BCH_NETWORK = network;
  
  // Update network-specific URLs if not already customized
  if (!env.BCH_REST_URL || env.BCH_REST_URL.includes('fullstack.cash')) {
    env.BCH_REST_URL = 'https://api.fullstack.cash/v5/';
  }
  
  if (!env.BCH_WSS_URL || env.BCH_WSS_URL.includes('fullstack.cash')) {
    env.BCH_WSS_URL = 'wss://api.fullstack.cash/v5/';
  }

  writeEnvFile(env);
  
  console.log(`✅ Network switched from ${previousNetwork} to ${network}`);
  console.log(`\n⚠️  Important:`);
  console.log(`   - Restart your server for changes to take effect`);
  console.log(`   - Verify BCH_API_TOKEN is set correctly for ${network}`);
  console.log(`   - Review other network-specific settings in .env`);
  
  if (network === 'mainnet') {
    console.log(`\n🚨 WARNING: You are now configured for MAINNET`);
    console.log(`   - Real BCH will be used`);
    console.log(`   - Double-check all settings before proceeding`);
  }
}

function showStatus() {
  const env = readEnvFile();
  const network = env.BCH_NETWORK || 'testnet';
  const isMainnet = network === 'mainnet';
  
  console.log('\n📡 Current Network Configuration:');
  console.log(`   Network: ${network.toUpperCase()} ${isMainnet ? '🚨' : '🧪'}`);
  console.log(`   REST URL: ${env.BCH_REST_URL || 'https://api.fullstack.cash/v5/'}`);
  console.log(`   WSS URL: ${env.BCH_WSS_URL || 'wss://api.fullstack.cash/v5/'}`);
  console.log(`   API Token: ${env.BCH_API_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`   ZMQ URL: ${env.ZMQ_URL || 'tcp://127.0.0.1:28332'}`);
  
  if (isMainnet) {
    console.log(`\n⚠️  You are configured for MAINNET - real BCH will be used!`);
  } else {
    console.log(`\nℹ️  You are configured for TESTNET - safe for development`);
  }
}

function main() {
  const command = process.argv[2];
  
  if (!command || command === 'status') {
    showStatus();
  } else if (command === 'testnet' || command === 'mainnet') {
    if (command === 'mainnet') {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\n⚠️  WARNING: Switch to MAINNET? This will use real BCH. Continue? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          setNetwork('mainnet');
        } else {
          console.log('❌ Mainnet switch cancelled');
        }
        rl.close();
      });
    } else {
      setNetwork('testnet');
    }
  } else {
    console.error('Usage:');
    console.error('  node scripts/set-network.js testnet   # Switch to testnet');
    console.error('  node scripts/set-network.js mainnet   # Switch to mainnet');
    console.error('  node scripts/set-network.js status    # Show current status');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setNetwork, showStatus };



