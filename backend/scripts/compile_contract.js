// compile_contract.js
// Compiles CashScript contracts using cashc
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CONTRACT_SRC = path.join(__dirname, '..', 'contracts', 'src', 'RevenueSplitter.cash');
const OUT_DIR = path.join(__dirname, '..', 'contracts', 'artifacts');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

try {
  console.log('Compiling RevenueSplitter contract with cashc...');
  // compile to JSON artifact
  const outFile = path.join(OUT_DIR, 'RevenueSplitter.json');
  // Ensure cashc exists on PATH. Example: cashc contracts/src/RevenueSplitter.cash --output contracts/artifacts/RevenueSplitter.json
  execSync(`cashc ${CONTRACT_SRC} --output ${outFile}`, { stdio: 'inherit' });
  console.log('Compiled artifact written to', outFile);
} catch (err) {
  console.error('Compilation failed. Make sure `cashc` is installed and in PATH (see CashScript docs).', err.message);
  process.exit(1);
}


