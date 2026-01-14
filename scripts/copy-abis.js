/**
 * Copy compiled contract ABIs to frontend for use in components
 * Run this after compiling contracts: npm run compile (in contracts/)
 */

const fs = require('fs');
const path = require('path');

const contractsDir = path.join(__dirname, '../contracts/artifacts/contracts');
const outputDir = path.join(__dirname, '../src/lib/web3/abis');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Contract files to copy
const contracts = [
  { name: 'NFTCollection', file: 'NFTCollection.sol/NFTCollection.json' },
  { name: 'LazyNFTMarketplace', file: 'LazyNFTMarketplace.sol/LazyNFTMarketplace.json' },
];

contracts.forEach(({ name, file }) => {
  const sourcePath = path.join(contractsDir, file);
  const outputPath = path.join(outputDir, `${name}.json`);

  if (fs.existsSync(sourcePath)) {
    const artifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const abi = artifact.abi;

    // Write just the ABI
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    console.log(`✓ Copied ${name} ABI to ${outputPath}`);
  } else {
    console.warn(`⚠ Contract artifact not found: ${sourcePath}`);
    console.warn(`  Run 'npm run compile' in contracts/ directory first`);
  }
});

console.log('\n✅ ABI copy complete!');


