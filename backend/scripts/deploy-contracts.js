// scripts/deploy-contracts.js
// Deploys CashScript contracts to the network
const fs = require('fs');
const path = require('path');
const { Contract, Network, SignatureTemplate } = require('cashscript');
const { execSync } = require('child_process');

const ARTIFACTS_DIR = path.join(__dirname, '..', 'contracts', 'artifacts');
const DEPLOYMENTS_DIR = path.join(__dirname, '..', 'deployments');

// Ensure deployments directory exists
if (!fs.existsSync(DEPLOYMENTS_DIR)) {
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

async function deployContracts(networkName = 'testnet') {
  console.log(`Deploying contracts to ${networkName}...\n`);
  
  // Determine network
  const network = networkName === 'mainnet' ? Network.MAINNET : Network.TESTNET;
  
  // Get deployer key from environment
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployerKey) {
    console.error('Error: DEPLOYER_PRIVATE_KEY environment variable not set');
    process.exit(1);
  }
  
  const deployer = new SignatureTemplate(deployerKey);
  
  // Find all contract artifacts
  const artifactFiles = fs.readdirSync(ARTIFACTS_DIR)
    .filter(file => file.endsWith('.json') && !file.endsWith('.abi.json') && file !== 'index.js');
  
  if (artifactFiles.length === 0) {
    console.log('No contract artifacts found. Run generate-artifacts.js first.');
    return;
  }
  
  const deployedContracts = {};
  
  for (const file of artifactFiles) {
    const contractName = path.basename(file, '.json');
    const artifactPath = path.join(ARTIFACTS_DIR, file);
    
    try {
      console.log(`Deploying ${contractName}...`);
      
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      // For CashScript, we need constructor parameters
      // This is a placeholder - adjust based on actual contract requirements
      const constructorArgs = getConstructorArgs(contractName);
      
      // Deploy contract (this is a simplified example)
      // In practice, you'd use Contract.fromArtifact with proper parameters
      console.log(`  Note: Manual deployment required for ${contractName}`);
      console.log(`  Artifact: ${artifactPath}`);
      console.log(`  Constructor args: ${JSON.stringify(constructorArgs, null, 2)}\n`);
      
      // Save deployment info (you'll need to fill in address/txid after actual deployment)
      deployedContracts[contractName] = {
        address: 'TBD', // Fill after deployment
        txid: 'TBD',    // Fill after deployment
        network: networkName,
        deployedAt: new Date().toISOString(),
        constructorArgs
      };
      
    } catch (error) {
      console.error(`✗ Error deploying ${contractName}:`, error.message);
    }
  }
  
  // Save deployment info
  const deploymentFile = path.join(DEPLOYMENTS_DIR, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployedContracts, null, 2));
  
  console.log(`\nDeployment info saved to: ${deploymentFile}`);
  console.log('\n⚠️  Note: Actual contract addresses need to be filled in after deployment');
  
  // Generate TypeScript deployment types
  generateDeploymentTypes(deployedContracts, networkName);
}

function getConstructorArgs(contractName) {
  // Return default constructor args based on contract name
  // This should be customized based on actual contract requirements
  const defaults = {
    'CreatorRouter': {
      creatorPubKey: process.env.CREATOR_PUBKEY || '0x00',
      servicePubKey: process.env.SERVICE_PUBKEY || '0x00',
      feeBasisPoints: 100, // 1%
      minWithdrawalTime: 0
    },
    'RevenueSplitter': {
      recipients: [],
      shares: []
    }
  };
  
  return defaults[contractName] || {};
}

function generateDeploymentTypes(contracts, network) {
  const typesDir = path.join(__dirname, '..', 'types', 'deployments');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  const networkCapitalized = network.charAt(0).toUpperCase() + network.slice(1);
  
  const typeContent = `// Generated deployment types for ${network}
export interface ${networkCapitalized}Deployment {
  ${Object.entries(contracts)
    .map(([name, info]) => `${name}: {
    address: string;
    txid: string;
    network: string;
    deployedAt: string;
    constructorArgs: any;
  };`)
    .join('\n  ')}
}

declare const deployment: ${networkCapitalized}Deployment;
export default deployment;
`;
  
  fs.writeFileSync(path.join(typesDir, `${network}.d.ts`), typeContent);
}

// CLI interface
if (require.main === module) {
  const network = process.argv[2] || 'testnet';
  deployContracts(network).catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = { deployContracts };


