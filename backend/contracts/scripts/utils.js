const crypto = require('crypto');
const { ECPair, crypto: btcCrypto } = require('bitcoinjs-lib');

class ContractUtils {
  // Generate deterministic contract address from creator address
  static generateContractAddress(creatorAddress, salt = '') {
    const hash = crypto.createHash('sha256')
      .update(creatorAddress + salt)
      .digest('hex');
    
    // Simulate CashAddr generation (simplified for demo)
    return `bitcoincash:q${hash.slice(0, 40)}`;
  }

  // Calculate fee amount
  static calculateFee(amountSatoshis, feeBasisPoints) {
    const fee = Math.floor(amountSatoshis * feeBasisPoints / 10000);
    return Math.max(fee, 0);
  }

  // Validate BCH address format
  static isValidBCHAddress(address) {
    const cashAddrRegex = /^(bitcoincash:|bchtest:|bchreg:)?[qp][a-z0-9]{41}$/i;
    return cashAddrRegex.test(address);
  }

  // Generate CashToken category ID
  static generateTokenCategory(creatorPubKey) {
    const hash = btcCrypto.sha256(creatorPubKey);
    return hash.slice(0, 20); // First 20 bytes
  }

  // Encode expiration time to commitment
  static encodeExpiration(timestamp) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(timestamp));
    return buffer;
  }

  // Decode expiration time from commitment
  static decodeExpiration(commitment) {
    if (commitment.length < 8) return 0;
    return Number(commitment.readBigUInt64BE(0));
  }

  // Create OP_RETURN payload for payment metadata
  static createPaymentPayload(creatorId, paymentType, contentId = '', metadata = {}) {
    const payload = {
      v: 1, // Version
      c: creatorId,
      t: paymentType,
      i: contentId,
      m: metadata,
      ts: Date.now()
    };
    
    const json = JSON.stringify(payload);
    const buffer = Buffer.from(json, 'utf8');
    
    // OP_RETURN script: 0x6a <length> <data>
    const script = Buffer.concat([
      Buffer.from([0x6a, buffer.length]),
      buffer
    ]);
    
    return {
      script: script.toString('hex'),
      json: payload
    };
  }

  // Parse OP_RETURN payload
  static parsePaymentPayload(scriptHex) {
    try {
      const script = Buffer.from(scriptHex, 'hex');
      
      if (script[0] !== 0x6a) {
        return null; // Not OP_RETURN
      }
      
      const dataLength = script[1];
      const data = script.slice(2, 2 + dataLength);
      const json = JSON.parse(data.toString('utf8'));
      
      return json;
    } catch (error) {
      console.error('Failed to parse payload:', error);
      return null;
    }
  }

  // Generate test keypairs
  static generateKeyPairs(count = 3) {
    const keyPairs = [];
    
    for (let i = 0; i < count; i++) {
      const privateKey = btcCrypto.randomBytes(32);
      const keyPair = ECPair.fromPrivateKey(privateKey);
      
      keyPairs.push({
        privateKey: privateKey.toString('hex'),
        publicKey: keyPair.publicKey.toString('hex'),
        publicKeyCompressed: keyPair.publicKey.toString('hex'), // Already compressed
        address: keyPair.address,
        wif: keyPair.toWIF()
      });
    }
    
    return keyPairs;
  }

  // Calculate shares for payment splitter
  static calculateShares(amountSatoshis, shares) {
    const totalShares = shares.reduce((sum, s) => sum + s.share, 0);
    
    const allocations = shares.map(share => {
      const amount = Math.floor(amountSatoshis * share.share / totalShares);
      return {
        address: share.address,
        share: share.share,
        amount: Math.max(amount, share.minPayment || 0),
        percentage: (share.share / totalShares * 100).toFixed(2) + '%'
      };
    });
    
    // Adjust for rounding errors
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    const difference = amountSatoshis - totalAllocated;
    
    if (difference !== 0 && allocations.length > 0) {
      allocations[0].amount += difference;
    }
    
    return allocations;
  }

  // Validate contract parameters
  static validateContractParams(type, params) {
    const errors = [];
    
    switch (type) {
      case 'CreatorRouter':
        if (params.feeBasisPoints < 0 || params.feeBasisPoints > 200) {
          errors.push('Fee must be between 0 and 200 basis points (0-2%)');
        }
        if (params.minWithdrawalTime < 0 || params.minWithdrawalTime > 604800) {
          errors.push('Withdrawal time must be between 0 and 604800 seconds (0-7 days)');
        }
        break;
        
      case 'SubscriptionPass':
        if (params.subscriptionPrice < 546) {
          errors.push('Subscription price must be at least 546 satoshis');
        }
        if (params.subscriptionPeriod < 86400 || params.subscriptionPeriod > 31536000) {
          errors.push('Subscription period must be between 1 day and 1 year');
        }
        break;
        
      case 'MultiSigVault':
        if (params.signers.length < 2 || params.signers.length > 10) {
          errors.push('Need 2-10 signers');
        }
        if (params.threshold < 1 || params.threshold > params.signers.length) {
          errors.push('Threshold must be between 1 and number of signers');
        }
        if (params.emergencyDelay < 86400 || params.emergencyDelay > 2592000) {
          errors.push('Emergency delay must be between 1 and 30 days');
        }
        break;
        
      case 'PaymentSplitter':
        const totalShares = params.recipients.reduce((sum, r) => sum + r.share, 0);
        if (totalShares !== 10000) {
          errors.push(`Shares must sum to 10000, got ${totalShares}`);
        }
        if (params.recipients.length < 2 || params.recipients.length > 10) {
          errors.push('Need 2-10 recipients');
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate contract deployment metadata
  static generateDeploymentMetadata(contractType, params, network = 'testnet') {
    const metadata = {
      contractType,
      network,
      deploymentTime: new Date().toISOString(),
      version: '1.0.0',
      parameters: params
    };
    
    // Add type-specific metadata
    switch (contractType) {
      case 'CreatorRouter':
        metadata.description = 'BCH Paywall Router - Creator Payment Aggregation';
        metadata.features = [
          'Non-custodial payments',
          'Configurable service fee',
          'Emergency withdrawal',
          'Time-locked withdrawals'
        ];
        break;
        
      case 'SubscriptionPass':
        metadata.description = 'CashToken Subscription System';
        metadata.features = [
          'NFT-based subscriptions',
          'Time-based access control',
          'Renewable subscriptions',
          'Transferable passes'
        ];
        break;
        
      case 'MultiSigVault':
        metadata.description = 'Multi-signature Team Vault';
        metadata.features = [
          'M-of-N signature requirement',
          'Emergency withdrawal after delay',
          'Dynamic signer management',
          'Team fund management'
        ];
        break;
        
      case 'PaymentSplitter':
        metadata.description = 'Automatic Payment Distribution';
        metadata.features = [
          'Proportional payment splitting',
          'Minimum payment thresholds',
          'Manager-controlled updates',
          'Emergency redistribution'
        ];
        break;
    }
    
    return metadata;
  }
}

module.exports = ContractUtils;


