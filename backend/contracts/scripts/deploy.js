const { Contract, ElectrumNetworkProvider } = require('cashscript');
const { compileFile } = require('cashc');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

class ContractDeployer {
  constructor() {
    this.network = process.env.BCH_NETWORK || 'testnet';
    this.provider = new ElectrumNetworkProvider(this.network);
  }

  async deployCreatorRouter(creatorPubKey, servicePubKey = null, feeBasisPoints = 100) {
    try {
      console.log('Deploying CreatorRouter contract...');
      
      // Load and compile contract
      const artifact = await compileFile(path.join(__dirname, '../src/CreatorRouter.cash'));
      
      // Set servicePubKey to zero if not provided
      const serviceKey = servicePubKey || Buffer.alloc(33, 0);
      
      // Deploy contract
      const contract = new Contract(artifact, [creatorPubKey, serviceKey, feeBasisPoints, 0], {
        provider: this.provider,
        addressType: 'p2sh20'
      });
      
      console.log('Contract deployed successfully!');
      console.log('Contract address:', contract.address);
      console.log('Contract bytecode:', artifact.bytecode);
      
      // Save artifact
      this.saveArtifact('CreatorRouter', artifact, contract.address, {
        creatorPubKey: creatorPubKey.toString('hex'),
        servicePubKey: serviceKey.toString('hex'),
        feeBasisPoints,
        network: this.network
      });
      
      return {
        success: true,
        address: contract.address,
        artifact,
        contract
      };
    } catch (error) {
      console.error('Deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deploySubscriptionPass(creatorPubKey, subscriptionPrice, subscriptionPeriod = 2592000) {
    try {
      console.log('Deploying SubscriptionPass contract...');
      
      const artifact = await compileFile(path.join(__dirname, '../src/SubscriptionPass.cash'));
      
      // For new token category, use zero
      const zeroCategory = Buffer.alloc(20, 0);
      
      const contract = new Contract(artifact, [creatorPubKey, zeroCategory, subscriptionPrice, subscriptionPeriod], {
        provider: this.provider,
        addressType: 'p2sh20'
      });
      
      console.log('Subscription contract deployed!');
      console.log('Address:', contract.address);
      
      this.saveArtifact('SubscriptionPass', artifact, contract.address, {
        creatorPubKey: creatorPubKey.toString('hex'),
        subscriptionPrice,
        subscriptionPeriod,
        network: this.network
      });
      
      return {
        success: true,
        address: contract.address,
        artifact,
        contract
      };
    } catch (error) {
      console.error('Subscription deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deployMultiSigVault(signers, threshold = 2, emergencyDelay = 604800) {
    try {
      console.log('Deploying MultiSigVault contract...');
      
      if (signers.length < 2 || signers.length > 10) {
        throw new Error('Need 2-10 signers');
      }
      
      if (threshold < 1 || threshold > signers.length) {
        throw new Error('Threshold must be between 1 and number of signers');
      }
      
      const artifact = await compileFile(path.join(__dirname, '../src/MultiSigVault.cash'));
      
      const contract = new Contract(artifact, [signers, threshold, emergencyDelay], {
        provider: this.provider,
        addressType: 'p2sh20'
      });
      
      console.log('MultiSig vault deployed!');
      console.log('Address:', contract.address);
      console.log('Signers:', signers.length);
      console.log('Threshold:', threshold);
      
      this.saveArtifact('MultiSigVault', artifact, contract.address, {
        signers: signers.map(s => s.toString('hex')),
        threshold,
        emergencyDelay,
        network: this.network
      });
      
      return {
        success: true,
        address: contract.address,
        artifact,
        contract
      };
    } catch (error) {
      console.error('MultiSig deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deployPaymentSplitter(recipients, managerPubKey) {
    try {
      console.log('Deploying PaymentSplitter contract...');
      
      if (recipients.length < 2 || recipients.length > 10) {
        throw new Error('Need 2-10 recipients');
      }
      
      // Verify shares sum to 10000 (100%)
      const totalShares = recipients.reduce((sum, r) => sum + r.share, 0);
      if (totalShares !== 10000) {
        throw new Error(`Shares must sum to 10000, got ${totalShares}`);
      }
      
      const artifact = await compileFile(path.join(__dirname, '../src/PaymentSplitter.cash'));
      
      const contract = new Contract(artifact, [recipients, managerPubKey], {
        provider: this.provider,
        addressType: 'p2sh20'
      });
      
      console.log('PaymentSplitter deployed!');
      console.log('Address:', contract.address);
      console.log('Recipients:', recipients.length);
      
      this.saveArtifact('PaymentSplitter', artifact, contract.address, {
        recipients: recipients.map(r => ({
          pubKeyHash: r.pubKeyHash.toString('hex'),
          share: r.share,
          minPayment: r.minPayment
        })),
        managerPubKey: managerPubKey.toString('hex'),
        network: this.network
      });
      
      return {
        success: true,
        address: contract.address,
        artifact,
        contract
      };
    } catch (error) {
      console.error('PaymentSplitter deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  saveArtifact(name, artifact, address, metadata) {
    const artifactData = {
      name,
      address,
      network: this.network,
      bytecode: artifact.bytecode,
      abi: artifact.abi,
      source: artifact.source,
      compiledAt: new Date().toISOString(),
      metadata
    };
    
    const filename = `${name}_${this.network}_${Date.now()}.json`;
    const filepath = path.join(__dirname, '../artifacts', filename);
    
    // Ensure artifacts directory exists
    const artifactsDir = path.join(__dirname, '../artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(artifactData, null, 2));
    console.log(`Artifact saved to: ${filepath}`);
    
    // Also update latest artifact
    const latestFile = path.join(artifactsDir, `${name}_latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(artifactData, null, 2));
  }

  async testWithdrawal(contractAddress, creatorPrivateKey, amount) {
    try {
      // Load contract artifact
      const artifactPath = path.join(__dirname, '../artifacts/CreatorRouter_latest.json');
      const artifactData = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      const contract = new Contract(artifactData.abi, artifactData.bytecode, {
        address: contractAddress,
        provider: this.provider
      });
      
      // Get contract UTXOs
      const utxos = await this.provider.getUtxos(contractAddress);
      
      if (utxos.length === 0) {
        throw new Error('No funds in contract');
      }
      
      // Build withdrawal transaction
      const tx = contract.functions
        .withdraw(creatorPrivateKey)
        .from(utxos)
        .to(creatorPrivateKey.toAddress(), amount)
        .withChange(creatorPrivateKey.toAddress());
      
      // Send transaction
      const result = await tx.send();
      
      console.log('Withdrawal successful!');
      console.log('Transaction ID:', result.txid);
      console.log('Amount:', amount, 'satoshis');
      
      return {
        success: true,
        txid: result.txid,
        amount
      };
    } catch (error) {
      console.error('Withdrawal test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getContractBalance(contractAddress) {
    try {
      const utxos = await this.provider.getUtxos(contractAddress);
      
      const balance = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);
      
      console.log(`Contract ${contractAddress}`);
      console.log(`Balance: ${balance} satoshis (${balance / 100000000} BCH)`);
      console.log(`UTXOs: ${utxos.length}`);
      
      return {
        success: true,
        balance,
        utxos: utxos.length
      };
    } catch (error) {
      console.error('Balance check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateTestKeys() {
    // Generate test keypairs for development
    const { ECPair } = require('ecpair');
    const { crypto } = require('bitcoinjs-lib');
    
    const keyPairs = [];
    
    for (let i = 0; i < 3; i++) {
      const privateKey = crypto.randomBytes(32);
      const keyPair = ECPair.fromPrivateKey(privateKey);
      
      keyPairs.push({
        privateKey: privateKey.toString('hex'),
        publicKey: keyPair.publicKey.toString('hex'),
        address: keyPair.address
      });
    }
    
    console.log('Generated test keypairs:');
    keyPairs.forEach((kp, i) => {
      console.log(`\nKeypair ${i + 1}:`);
      console.log(`Private: ${kp.privateKey}`);
      console.log(`Public: ${kp.publicKey}`);
      console.log(`Address: ${kp.address}`);
    });
    
    return keyPairs;
  }
}

// CLI interface
async function main() {
  const deployer = new ContractDeployer();
  const command = process.argv[2];
  
  switch (command) {
    case 'deploy-creator':
      if (process.argv.length < 4) {
        console.error('Usage: node deploy.js deploy-creator <creatorPubKeyHex> [servicePubKeyHex] [feeBasisPoints]');
        process.exit(1);
      }
      
      const creatorPubKey = Buffer.from(process.argv[3], 'hex');
      const servicePubKey = process.argv[4] ? Buffer.from(process.argv[4], 'hex') : null;
      const fee = process.argv[5] ? parseInt(process.argv[5]) : 100;
      
      await deployer.deployCreatorRouter(creatorPubKey, servicePubKey, fee);
      break;
      
    case 'deploy-subscription':
      if (process.argv.length < 5) {
        console.error('Usage: node deploy.js deploy-subscription <creatorPubKeyHex> <priceSatoshis> [periodSeconds]');
        process.exit(1);
      }
      
      const subCreatorKey = Buffer.from(process.argv[3], 'hex');
      const price = parseInt(process.argv[4]);
      const period = process.argv[5] ? parseInt(process.argv[5]) : 2592000;
      
      await deployer.deploySubscriptionPass(subCreatorKey, price, period);
      break;
      
    case 'deploy-multisig':
      if (process.argv.length < 6) {
        console.error('Usage: node deploy.js deploy-multisig <signer1PubKeyHex> <signer2PubKeyHex> [signer3...] --threshold <N>');
        process.exit(1);
      }
      
      const signers = [];
      let threshold = 2;
      
      for (let i = 3; i < process.argv.length; i++) {
        if (process.argv[i] === '--threshold') {
          threshold = parseInt(process.argv[i + 1]);
          break;
        }
        signers.push(Buffer.from(process.argv[i], 'hex'));
      }
      
      await deployer.deployMultiSigVault(signers, threshold);
      break;
      
    case 'balance':
      if (process.argv.length < 4) {
        console.error('Usage: node deploy.js balance <contractAddress>');
        process.exit(1);
      }
      
      await deployer.getContractBalance(process.argv[3]);
      break;
      
    case 'test-withdraw':
      if (process.argv.length < 6) {
        console.error('Usage: node deploy.js test-withdraw <contractAddress> <privateKeyHex> <amountSatoshis>');
        process.exit(1);
      }
      
      const { ECPair } = require('ecpair');
      const privateKey = Buffer.from(process.argv[4], 'hex');
      const keyPair = ECPair.fromPrivateKey(privateKey);
      const amount = parseInt(process.argv[5]);
      
      await deployer.testWithdrawal(process.argv[3], keyPair, amount);
      break;
      
    case 'generate-keys':
      await deployer.generateTestKeys();
      break;
      
    case 'help':
    default:
      console.log(`
BCH Paywall Router Contract Deployer
====================================

Commands:
  deploy-creator <creatorPubKeyHex> [servicePubKeyHex] [feeBasisPoints]
    Deploy a CreatorRouter contract
    
  deploy-subscription <creatorPubKeyHex> <priceSatoshis> [periodSeconds]
    Deploy a SubscriptionPass contract
    
  deploy-multisig <signer1> <signer2> [signer3...] --threshold <N>
    Deploy a MultiSigVault contract
    
  balance <contractAddress>
    Check contract balance
    
  test-withdraw <contractAddress> <privateKeyHex> <amountSatoshis>
    Test withdrawal from contract
    
  generate-keys
    Generate test keypairs
    
  help
    Show this help message
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContractDeployer;



