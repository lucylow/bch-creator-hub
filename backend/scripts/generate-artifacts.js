// scripts/generate-artifacts.js
// Generates ABI artifacts and TypeScript types from CashScript contracts
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts', 'src');
const ARTIFACTS_DIR = path.join(__dirname, '..', 'contracts', 'artifacts');
const TYPES_DIR = path.join(__dirname, '..', 'types');

// Ensure directories exist
[ARTIFACTS_DIR, TYPES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function generateArtifacts() {
  console.log('Generating CashScript contract artifacts...\n');
  
  // Find all .cash files
  const cashFiles = fs.readdirSync(CONTRACTS_DIR)
    .filter(file => file.endsWith('.cash'));
  
  if (cashFiles.length === 0) {
    console.log('No .cash files found in', CONTRACTS_DIR);
    return;
  }
  
  const artifacts = {};
  
  for (const file of cashFiles) {
    const contractName = path.basename(file, '.cash');
    const contractPath = path.join(CONTRACTS_DIR, file);
    
    try {
      console.log(`Compiling ${contractName}...`);
      
      // Compile using cashc
      const artifactFile = path.join(ARTIFACTS_DIR, `${contractName}.json`);
      execSync(`cashc "${contractPath}" --output "${artifactFile}"`, { 
        stdio: 'inherit',
        cwd: path.dirname(CONTRACTS_DIR)
      });
      
      // Read the compiled artifact
      const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));
      artifacts[contractName] = artifact;
      
      // Generate ABI-like interface
      const abi = generateABI(contractName, artifact);
      const abiPath = path.join(ARTIFACTS_DIR, `${contractName}.abi.json`);
      fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
      
      // Generate TypeScript types
      const tsType = generateTypeScriptType(contractName, artifact);
      const tsPath = path.join(TYPES_DIR, `${contractName}.d.ts`);
      fs.writeFileSync(tsPath, tsType);
      
      console.log(`✓ Generated artifacts for ${contractName}\n`);
    } catch (error) {
      console.error(`✗ Error compiling ${contractName}:`, error.message);
    }
  }
  
  // Generate index files
  generateIndexFiles(Object.keys(artifacts));
  
  console.log('Artifact generation complete!');
}

function generateABI(contractName, artifact) {
  return {
    contractName: contractName,
    bytecode: artifact.bytecode || artifact.code || '',
    abi: artifact.abi || [],
    constructor: artifact.constructor || {},
    networks: artifact.networks || {},
    schemaVersion: artifact.schemaVersion || "1.0.0",
    updatedAt: new Date().toISOString(),
    source: artifact.source || ''
  };
}

function generateTypeScriptType(contractName, artifact) {
  const functions = extractFunctions(artifact);
  const constructorParams = extractConstructorParams(artifact);
  
  return `// Generated TypeScript definitions for ${contractName}
import { Contract, Network } from 'cashscript';

export interface ${contractName}Contract extends Contract {
  address: string;
  bytecode: string;
  opcount: number;
  bytesize: number;
  
  ${functions.map(f => f.signature).join('\n  ')}
}

export interface ${contractName}Constructor {
  ${constructorParams.map(p => `${p.name}: ${p.type};`).join('\n  ')}
}

export interface ${contractName}Functions {
  ${functions.map(f => `${f.name}: ${f.description || ''}`).join('\n  ')}
}

export declare function deploy${contractName}(
  network: Network,
  constructorArgs: ${contractName}Constructor
): Promise<${contractName}Contract>;

export const ${contractName.toUpperCase()}_ARTIFACT = ${JSON.stringify(artifact, null, 2)} as const;
`;
}

function extractFunctions(artifact) {
  // CashScript artifacts may have different structures
  // This is a basic extraction - adjust based on actual artifact format
  const functions = [];
  
  if (artifact.functions) {
    artifact.functions.forEach((func, index) => {
      functions.push({
        name: func.name || `function${index}`,
        signature: `${func.name || `function${index}`}(...args: any[]): any;`,
        description: func.description || ''
      });
    });
  }
  
  return functions;
}

function extractConstructorParams(artifact) {
  const params = [];
  
  if (artifact.constructor && artifact.constructor.parameters) {
    artifact.constructor.parameters.forEach((param, index) => {
      params.push({
        name: param.name || `param${index}`,
        type: mapCashScriptTypeToTS(param.type || 'bytes')
      });
    });
  }
  
  return params;
}

function mapCashScriptTypeToTS(type) {
  const typeMap = {
    'pubkey': 'string',
    'sig': 'string',
    'bytes': 'string',
    'int': 'number',
    'string': 'string'
  };
  
  return typeMap[type.toLowerCase()] || 'any';
}

function generateIndexFiles(contractNames) {
  // Generate artifacts index
  const artifactsIndex = contractNames
    .map(contract => `export { default as ${contract} } from './${contract}.json';`)
    .join('\n');
  
  const artifactsIndexPath = path.join(ARTIFACTS_DIR, 'index.js');
  fs.writeFileSync(artifactsIndexPath, artifactsIndex + '\n');
  
  // Generate types index
  const typesIndex = contractNames
    .map(contract => `export * from './${contract}';`)
    .join('\n');
  
  const typesIndexPath = path.join(TYPES_DIR, 'index.ts');
  fs.writeFileSync(typesIndexPath, typesIndex + '\n');
}

// Run if called directly
if (require.main === module) {
  generateArtifacts().catch(console.error);
}

module.exports = { generateArtifacts };



