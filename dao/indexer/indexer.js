const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const GOVERNOR_ADDRESS = process.env.GOVERNOR_ADDRESS || "";
const DB_PATH = path.join(__dirname, "proposals.db.json");

// Minimal ABI for ProposalCreated event
const GOVERNOR_ABI = [
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)"
];

let proposals = {};

// Load existing proposals
function loadProposals() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf8");
      proposals = JSON.parse(data);
      console.log(`Loaded ${Object.keys(proposals).length} proposals from database`);
    }
  } catch (err) {
    console.error("Error loading proposals:", err);
    proposals = {};
  }
}

// Save proposals to disk
function saveProposals() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(proposals, null, 2));
  } catch (err) {
    console.error("Error saving proposals:", err);
  }
}

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);

async function indexHistoricalProposals() {
  console.log("Indexing historical proposals...");
  try {
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000); // Look back 10k blocks

    // Query ProposalCreated events
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter, fromBlock, currentBlock);

    for (const event of events) {
      const proposalId = event.args.proposalId.toString();
      if (!proposals[proposalId]) {
        proposals[proposalId] = {
          proposalId,
          proposer: event.args.proposer,
          targets: event.args.targets,
          values: event.args.values.map(v => v.toString()),
          signatures: event.args.signatures,
          calldatas: event.args.calldatas,
          startBlock: event.args.startBlock.toString(),
          endBlock: event.args.endBlock.toString(),
          description: event.args.description,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
        console.log(`Indexed proposal ${proposalId}`);
      }
    }

    saveProposals();
    console.log(`Indexed ${events.length} historical proposals`);
  } catch (err) {
    console.error("Error indexing historical proposals:", err);
  }
}

async function startListening() {
  console.log(`Starting indexer for Governor at ${GOVERNOR_ADDRESS}`);
  console.log(`RPC URL: ${RPC_URL}`);

  // Index historical proposals first
  await indexHistoricalProposals();

  // Listen for new proposals
  governor.on("ProposalCreated", (proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description, event) => {
    const id = proposalId.toString();
    proposals[id] = {
      proposalId: id,
      proposer,
      targets,
      values: values.map(v => v.toString()),
      signatures,
      calldatas,
      startBlock: startBlock.toString(),
      endBlock: endBlock.toString(),
      description,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    };
    saveProposals();
    console.log(`New proposal indexed: ${id}`);
  });

  console.log("Indexer running. Listening for new proposals...");
}

// Simple HTTP server to serve proposals
function startServer() {
  const http = require("http");
  const url = require("url");

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (parsedUrl.pathname === "/proposals") {
      // Return all proposals as array
      const proposalsArray = Object.values(proposals);
      res.writeHead(200);
      res.end(JSON.stringify(proposalsArray));
    } else if (parsedUrl.pathname.startsWith("/proposals/")) {
      // Return specific proposal
      const proposalId = parsedUrl.pathname.split("/")[2];
      const proposal = proposals[proposalId];
      if (proposal) {
        res.writeHead(200);
        res.end(JSON.stringify(proposal));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Proposal not found" }));
      }
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  const PORT = process.env.PORT || 3002;
  server.listen(PORT, () => {
    console.log(`Indexer API server running on http://localhost:${PORT}`);
  });
}

// Main
if (require.main === module) {
  loadProposals();
  startListening();
  startServer();

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    saveProposals();
    process.exit(0);
  });
}

module.exports = { loadProposals, saveProposals, proposals };

