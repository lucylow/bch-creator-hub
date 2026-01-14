# **BCH Paywall Router: Technical Architecture & Implementation Plan**

## **1. System Architecture Overview**

```
┌─────────────────┐    ┌──────────────────────────────────┐    ┌────────────────┐
│   End Users     │    │     BCH Paywall Router Core      │    │  Blockchain    │
│                 │    │                                  │    │   Layer (BCH)  │
│ ┌─────────────┐ │    │  ┌────────────┐ ┌────────────┐  │    │                │
│ │  Creators   │─┼────┼─▶│  Creator   │ │  Payment   │  │    │  ┌──────────┐  │
│ │(Dashboard)  │ │    │  │ Dashboard  │ │ Aggregation│◀─┼────┼──│ Bitcoin  │  │
│ └─────────────┘ │    │  │   (UI)     │ │   Engine   │  │    │  │ Cash     │  │
│                 │    │  └────────────┘ └────────────┘  │    │  │  Network │  │
│ ┌─────────────┐ │    │          │             │        │    │  └──────────┘  │
│ │ Supporters  │─┼────┼─▶│  Payment     │      │        │    │                │
│ │(Browser Ext)│ │    │  │   Pages      │      │        │    │  ┌──────────┐  │
│ └─────────────┘ │    │  └────────────┘       │        │    │  │ Smart    │  │
│                 │    │           │            │        │    │  │Contracts │  │
└─────────────────┘    └───────────┼────────────┼────────┘    │  └──────────┘  │
                                   │            │             │                │
                            ┌──────┴─────┐ ┌────┴──────┐     │  ┌──────────┐  │
                            │   REST     │ │   Real-   │     │  │  Indexer │  │
                            │   API      │ │   Time    │─────┼─▶│(Electrum)│  │
                            │ (Express)  │ │  WebSocket│     │  └──────────┘  │
                            └──────┬─────┘ └───────────┘     │                │
                                   │                         └────────────────┘
                            ┌──────┴─────┐
                            │ PostgreSQL │
                            │  Database  │
                            └────────────┘
```

## **2. Core Technical Components**

### **2.1 Smart Contract Architecture (CashScript)**

**Primary Contract: `CreatorRouter.cash`**

```solidity
// Pseudo-CashScript contract structure
contract CreatorRouter {
    // Public key of the creator (derived from original wallet)
    pubkey creatorPubKey;
    
    // Service public key (for optional fee deduction)
    pubkey servicePubKey;
    
    // Minimum fee rate (e.g., 1% expressed as basis points)
    int feeBasisPoints;
    
    // Withdrawal function - only callable by creator
    function withdraw(sig creatorSig) {
        // Verify creator signature
        require(checkSig(creatorSig, this.creatorPubKey));
        
        // Calculate fee if servicePubKey is present
        int totalBalance = tx.value;
        int serviceFee = totalBalance * this.feeBasisPoints / 10000;
        int creatorAmount = totalBalance - serviceFee;
        
        // Send funds: creator gets majority, service gets fee (if applicable)
        bytes creatorOutput = tx.outputs[0];
        require(creatorOutput.value >= creatorAmount);
        
        if (serviceFee > 0) {
            bytes serviceOutput = tx.outputs[1];
            require(serviceOutput.value >= serviceFee);
        }
    }
    
    // Optional: Subscription lock-up function using time constraints
    function claimSubscription(sig subscriberSig, pubkey subscriberPubKey, int locktime) {
        require(checkSig(subscriberSig, subscriberPubKey));
        require(tx.time >= locktime);
        // Allow claim after subscription period ends
    }
}
```

**Payment Payload Standard (OP_RETURN Structure)**
```
OP_RETURN Format:
[1-byte version][16-byte creatorID][1-byte paymentType][4-byte contentID][optional metadata]


Example (hex):
0x01 7a3b8c9f12a45d6e 02 0000001f 436f66666565546970


Where:
- Version: 0x01 (v1 protocol)
- CreatorID: 7a3b8c9f12a45d6e (unique identifier)
- PaymentType: 0x02 (2 = tip)
- ContentID: 0000001f (content ID 31, 0 for general tip)
- Metadata: "CoffeeTip" ASCII encoded (optional)
```

### **2.2 Payment Aggregation Engine**

**Technology Stack:** Node.js + TypeScript, connected to BCHN node + ElectrumX indexer

**Core Processing Algorithm:**
```javascript
class PaymentAggregationEngine {
    async processNewBlock(blockHeight) {
        // 1. Fetch block transactions from indexer
        const txs = await electrumx.getBlockTransactions(blockHeight);
        
        // 2. Filter for transactions with OP_RETURN outputs
        const candidateTxs = txs.filter(tx => 
            tx.outputs.some(out => out.script.startsWith('6a')) // OP_RETURN
        );
        
        // 3. Parse each candidate transaction
        for (const tx of candidateTxs) {
            const payload = this.extractOpReturnData(tx);
            
            // 4. Validate payload structure
            if (this.isValidPayload(payload)) {
                const creatorId = this.decodeCreatorId(payload);
                const paymentType = this.decodePaymentType(payload);
                
                // 5. Find corresponding output to creator contract
                const creatorOutput = tx.outputs.find(out =>
                    out.address === this.getCreatorContractAddress(creatorId)
                );
                
                if (creatorOutput) {
                    // 6. Record in database
                    await this.recordPayment({
                        txid: tx.txid,
                        creatorId,
                        amount: creatorOutput.value,
                        paymentType,
                        contentId: this.decodeContentId(payload),
                        timestamp: tx.timestamp,
                        metadata: this.decodeMetadata(payload)
                    });
                    
                    // 7. Emit real-time event
                    this.websocketServer.emit('payment-received', {
                        creatorId,
                        amount: creatorOutput.value,
                        txid: tx.txid
                    });
                }
            }
        }
    }
    
    // OP_RETURN data extraction
    extractOpReturnData(tx) {
        const opReturnOutput = tx.outputs.find(out => 
            out.script.startsWith('6a')
        );
        // Remove OP_RETURN opcode (0x6a) and length byte
        return opReturnOutput.script.slice(2);
    }
}
```

### **2.3 Creator Dashboard (React Frontend)**

**Key Components:**
1. **Authentication Module:** Web3 wallet connection via BIP-322 message signing
2. **Real-time Balance Dashboard:** WebSocket connection to aggregation engine
3. **Payment Link Generator:** UI for creating pre-configured payment requests
4. **Analytics Engine:** Charts and graphs of payment history

**Wallet Integration Flow:**
```javascript
// BIP-322 Message Signing for Authentication
async function authenticateWithWallet() {
    // 1. Request wallet connection (using Wallet Protocol)
    const wallet = await window.bitcoinCashWallet.requestConnection();
    
    // 2. Generate nonce for anti-replay
    const nonce = generateNonce();
    
    // 3. Create signable message
    const message = `BCH Paywall Router Login\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
    
    // 4. Request signature via BIP-322
    const { address, signature } = await wallet.signMessage(message, 'bip322');
    
    // 5. Verify signature server-side
    const isValid = await verifyBIP322Signature(address, message, signature);
    
    if (isValid) {
        // 6. Create or retrieve creator record
        const creatorId = await getOrCreateCreatorId(address);
        
        // 7. Issue JWT token for session management
        const token = createAuthToken(creatorId, address);
        
        return { success: true, token, creatorId };
    }
}
```

### **2.4 Browser Extension Architecture**

**Manifest Structure (Chrome/Firefox):**
```json
{
    "manifest_version": 3,
    "name": "BCH Tip Jar",
    "version": "0.1",
    "permissions": ["activeTab", "storage"],
    "content_scripts": [{
        "matches": ["<all_urls>"],
        "js": ["content.js"],
        "run_at": "document_end"
    }],
    "background": {
        "service_worker": "background.js"
    },
    "action": {
        "default_popup": "popup.html"
    }
}
```

**Content Script Payment Detection:**
```javascript
// content.js - Detects creator payment markers on web pages
class PaymentDetector {
    constructor() {
        this.initializeDetection();
    }
    
    initializeDetection() {
        // Method 1: Look for microdata tags
        const microdata = document.querySelector(
            '[data-bch-creator-id], .bch-tip-jar, meta[name="bch-creator"]'
        );
        
        // Method 2: Parse OpenGraph-like meta tags
        const metaTags = {
            creatorId: document.querySelector('meta[property="bch:creator_id"]')?.content,
            defaultAmount: document.querySelector('meta[property="bch:tip_amount"]')?.content,
            contentType: document.querySelector('meta[property="bch:content_type"]')?.content
        };
        
        // Method 3: Scan for standardized JSON-LD structured data
        const jsonLdScript = document.querySelector(
            'script[type="application/ld+json"]'
        );
        
        if (jsonLdScript) {
            try {
                const data = JSON.parse(jsonLdScript.textContent);
                if (data['@type'] === 'BCHCreator') {
                    this.creatorData = data;
                }
            } catch (e) {}
        }
        
        // If any method succeeds, show tip button in browser toolbar
        if (microdata || metaTags.creatorId || this.creatorData) {
            chrome.runtime.sendMessage({
                type: 'CREATOR_DETECTED',
                data: this.compileCreatorInfo()
            });
        }
    }
    
    compileCreatorInfo() {
        return {
            creatorId: this.extractCreatorId(),
            context: window.location.href,
            pageTitle: document.title,
            suggestedAmounts: [0.5, 1, 3, 5] // In USD, converted to BCH
        };
    }
}
```

## **3. Data Models & Database Schema**

### **3.1 PostgreSQL Schema**

```sql
-- Core tables for MVP
CREATE TABLE creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id CHAR(16) UNIQUE NOT NULL, -- Public facing ID
    bch_address VARCHAR(64) NOT NULL, -- Contract address
    pub_key_hex VARCHAR(130) NOT NULL, -- Public key for verification
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id CHAR(16) REFERENCES creators(creator_id),
    intent_type SMALLINT NOT NULL, -- 1:tip, 2:unlock, 3:subscription
    content_id VARCHAR(32), -- Optional content identifier
    amount_sats BIGINT NOT NULL,
    amount_usd DECIMAL(10,2), -- For display purposes
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    txid VARCHAR(64) NOT NULL UNIQUE,
    creator_id CHAR(16) REFERENCES creators(creator_id),
    intent_id UUID REFERENCES payment_intents(id),
    amount_sats BIGINT NOT NULL,
    payment_type SMALLINT NOT NULL,
    content_id VARCHAR(32),
    payload_hex TEXT, -- Raw OP_RETURN data
    block_height INTEGER,
    confirmed_at TIMESTAMP,
    sender_address VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    indexed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_creator ON transactions(creator_id, confirmed_at);
CREATE INDEX idx_transactions_unconfirmed ON transactions(creator_id) WHERE confirmed_at IS NULL;
```

### **3.2 In-Memory Cache Structure (Redis)**
```javascript
// Redis data structures for performance
const redisSchema = {
    // Real-time creator balance (updated on new block)
    `creator:${creatorId}:balance`: "integer_sats",
    
    // Recent unconfirmed transactions (expire in 2 hours)
    `creator:${creatorId}:pending`: "sorted_set_txids",
    
    // Rate limiting for API endpoints
    `rate_limit:${ip}:${endpoint}`: "counter_with_expiry",
    
    // WebSocket connections for live updates
    `ws:connections:${creatorId}`: "set_of_connection_ids"
};
```

## **4. Payment Flow Sequence Diagrams**

### **4.1 Standard Tip Flow**
```
Supporter                    Browser Extension               Wallet                   Blockchain                 Backend
    |                              |                            |                         |                          |
    | 1. Click "Tip $1" button     |                            |                         |                          |
    |------------------------------>|                            |                         |                          |
    |                              | 2. Compose payment request |                         |                          |
    |                              | with creator ID & metadata |                         |                          |
    |                              |--------------------------->|                         |                          |
    |                              |                            | 3. Show confirmation    |                          |
    |                              |                            | dialog with details     |                          |
    |                              |                            |<-------------------------|                          |
    |                              |                            | 4. User approves        |                          |
    |                              |                            |------------------------->|                          |
    |                              |                            | 5. Construct & sign     |                          |
    |                              |                            | transaction with        |                          |
    |                              |                            | OP_RETURN payload       |                          |
    |                              |                            |------------------------->| 6. Broadcast            |
    |                              |                            |                         |------------------------->|
    |                              |                            |                         | 7. Return TXID          |
    |                              |                            |                         |<-------------------------|
    |                              | 8. Display success with    |                         |                          |
    |                              | TXID link                  |                         |                          |
    |<-----------------------------------------------------------|                         |                          |
    |                              |                            |                         | 9. Indexer detects new  |
    |                              |                            |                         | transaction in mempool  |
    |                              |                            |                         |------------------------->|
    |                              |                            |                         | 10. Parse payload,      |
    |                              |                            |                         | update database         |
    |                              |                            |                         | 11. Emit WebSocket event|
    |                              |                            |                         |------------------------->|
    |                              |                            |                         | 12. Creator dashboard   |
    |                              |                            |                         | updates in real-time    |
```

### **4.2 Subscription Payment Flow with CashTokens**
```
Supporter                    Web Dashboard                   Smart Contract             Blockchain
    |                              |                            |                         |
    | 1. Select "Monthly Premium"  |                            |                         |
    |------------------------------>|                            |                         |
    |                              | 2. Generate subscription   |                         |
    |                              | NFT details & pricing      |                         |
    |                              |<---------------------------|                         |
    | 3. Approve payment & NFT mint|                            |                         |
    |------------------------------>|                            |                         |
    |                              | 4. Create & broadcast      |                         |
    |                              | minting transaction        |                         |
    |                              |--------------------------->| 5. Execute              |
    |                              |                            |------------------------>|
    |                              |                            | 6. Mint Subscription    |
    |                              |                            | NFT to supporter        |
    |                              | 7. Return NFT ID &         |                         |
    |                              | access confirmation        |                         |
    |<-----------------------------------------------------------|                         |
    | 8. NFT appears in wallet     |                            |                         |
    |                              | 9. Future content checks   |                         |
    |                              | NFT ownership via          |                         |
    |                              | contract call              |                         |
    |                              |--------------------------->| 10. Verify ownership   |
    |                              |                            | & expiration           |
```

## **5. Security Considerations**

### **5.1 Smart Contract Security**
- **Minimal Logic:** Contracts only handle withdrawal authorization
- **Time-locks:** For subscriptions, use `nLockTime` rather than complex state management
- **Fee Safety:** Maximum fee capped at 2% in contract logic
- **No Admin Keys:** No ability to upgrade or modify deployed contracts

### **5.2 API & Backend Security**
```javascript
// Comprehensive security middleware
app.use('/api/', [
    rateLimiter({ windowMs: 15*60*1000, max: 100 }), // 100 requests per 15min
    helmet(), // Security headers
    cors({ origin: config.allowedOrigins }),
    validateBIP322Signature, // For wallet-authenticated endpoints
    auditLogger // Log all financial actions
]);

// BIP-322 Signature Verification Middleware
async function validateBIP322Signature(req, res, next) {
    const { address, message, signature } = req.headers;
    
    if (!address || !signature) {
        return res.status(401).json({ error: 'Wallet signature required' });
    }
    
    const isValid = await bitcoinCash.verifyMessage(
        address, 
        message, 
        signature, 
        'bip322'
    );
    
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    req.authenticatedAddress = address;
    next();
}
```

### **5.3 Privacy Considerations**
- **No KYC Required:** Only wallet addresses are stored
- **Optional Pseudonymity:** Creators can use pseudonyms
- **Data Minimization:** Only essential transaction data stored off-chain
- **Transparent Privacy:** Clear disclosure of what's on-chain vs. off-chain

## **6. Deployment & Scaling Strategy**

### **6.1 MVP Deployment (Hackathon Scope)**
```
Environment: Docker Compose
Services:
- postgres:14 (database)
- redis:7 (cache)
- node:18 (backend API)
- node:18 (aggregation engine)
- nginx (reverse proxy + static hosting)

Hosting: DigitalOcean Droplet ($10-20/month scale)
Blockchain Connections: Public BCHN node + paid ElectrumX service
```

### **6.2 Scaling for Production**
- **Database:** PostgreSQL read replicas for analytics
- **Cache:** Redis Cluster for distributed session storage
- **Blockchain:** Dedicated BCHN node + fallback nodes
- **CDN:** Cloudflare for static assets and DDoS protection
- **Monitoring:** Prometheus + Grafana for performance metrics

### **6.3 Cost Structure Estimate**
```yaml
MVP Phase (First 6 months):
- Infrastructure: $100/month
- Blockchain node: $50/month (VPS for BCHN)
- Indexer service: $50/month (ElectrumX cluster)
- Total: ~$200/month

Revenue Break-even Point:
- 500 active creators
- Average $100/month in processed payments
- 1% fee = $500/month revenue
```

## **7. Testing Strategy**

### **7.1 Test Environments**
```javascript
// Three-tier testing environment
const environments = {
    development: {
        bchNetwork: 'chipnet',
        contractAddress: 'mock',
        apiEndpoint: 'http://localhost:3000'
    },
    staging: {
        bchNetwork: 'testnet4',
        contractAddress: 'deployed_test_contracts',
        apiEndpoint: 'https://staging.paywallrouter.bch'
    },
    production: {
        bchNetwork: 'mainnet',
        contractAddress: 'live_contracts',
        apiEndpoint: 'https://api.paywallrouter.bch'
    }
};
```

### **7.2 Automated Test Suite**
```javascript
// Sample test cases for critical paths
describe('Payment Aggregation Engine', () => {
    test('should correctly parse OP_RETURN payload', async () => {
        const mockTx = {
            outputs: [{
                script: '6a1a01587a3b8c9f12a45d6e020000001f436f66666565546970',
                address: 'bitcoincash:qrcreator...',
                value: 5000 // satoshis
            }]
        };
        
        const result = await engine.processTransaction(mockTx);
        expect(result.creatorId).toBe('587a3b8c9f12a45d6e');
        expect(result.paymentType).toBe(2);
        expect(result.amountSats).toBe(5000);
    });
    
    test('should handle multiple payments in same block', async () => {
        // Test concurrent processing
    });
    
    test('should recover from node disconnection', async () => {
        // Test reconnection logic
    });
});
```

## **8. Integration Points for Hackathon Demo**

### **8.1 Minimum Viable Demo Scope**
```yaml
Core Features to Demonstrate:
1. Creator Registration & Wallet Connection
   - [x] BIP-322 authentication
   - [x] Contract deployment (testnet)
   - [x] Unique creator ID generation

2. Payment Link Creation
   - [x] Generate shareable links/QR codes
   - [x] Custom amount setting
   - [x] Metadata attachment

3. Payment Processing
   - [x] OP_RETURN payload creation
   - [x] Transaction broadcasting
   - [x] Mempool detection

4. Real-time Dashboard
   - [x] Balance updates via WebSocket
   - [x] Transaction history
   - [x] Basic analytics

5. Browser Extension (Basic)
   - [x] Creator detection on simple pages
   - [x] One-click tipping interface
   - [x] Wallet integration

Stretch Goals (if time):
- CashToken subscription passes
- Recurring payment scheduling
- Advanced analytics charts
- Mobile-responsive design
```

### **8.2 Demo Script for Judges**
```
1. Introduction (30 seconds)
   - Problem statement: Creator payment fragmentation
   - Our solution: One BCH address for everything

2. Live Demo (2 minutes)
   - Show creator dashboard (empty state)
   - Generate a payment link for "Unlock Article #5: $0.50"
   - Open link in "supporter" view
   - Send payment from test wallet
   - Show real-time update on creator dashboard
   - Show transaction on block explorer

3. Technical Highlights (1 minute)
   - Show OP_RETURN payload structure
   - Show smart contract code simplicity
   - Demonstrate browser extension detection

4. Conclusion (30 seconds)
   - Recap benefits: 1% fees vs 10%+ competitors
   - Non-custodial design
   - Roadmap: Subscriptions, plugins, protocol evolution
```

This technical approach provides a realistic, implementable plan for the BCH-1 Hackcelerator timeframe while laying groundwork for a production-ready system. The architecture prioritizes security, simplicity, and scalability while fully leveraging Bitcoin Cash's unique capabilities for micro-payments.


