/**
 * Upload NFT image and metadata to IPFS using nft.storage
 * 
 * Usage:
 *   node uploadToIPFS.js <image-path> <name> <description> [attributes-json]
 * 
 * Example:
 *   node uploadToIPFS.js ./art.png "My NFT" "This is a test NFT" '[{"trait_type":"Rarity","value":"Legendary"}]'
 * 
 * Environment variables:
 *   NFT_STORAGE_KEY - API key from nft.storage
 */

const { NFTStorage, File } = require('nft.storage');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require("path").join(__dirname, "../../.env") });

const API_KEY = process.env.NFT_STORAGE_KEY;

if (!API_KEY) {
  console.error("Error: NFT_STORAGE_KEY not set in environment");
  console.error("Get your API key from https://nft.storage/");
  process.exit(1);
}

async function uploadImageAndMetadata(imagePath, name, description, attributes = []) {
  const client = new NFTStorage({ token: API_KEY });

  // Read image file
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const imageBuffer = await fs.promises.readFile(imagePath);
  const imageFile = new File([imageBuffer], path.basename(imagePath), {
    type: `image/${path.extname(imagePath).slice(1)}` || 'image/png'
  });

  // Create metadata
  const metadata = await client.store({
    name,
    description,
    image: imageFile,
    properties: {
      attributes: Array.isArray(attributes) ? attributes : JSON.parse(attributes || '[]')
    }
  });

  // metadata.url is ipfs://<cid>/metadata.json
  console.log('\n=== IPFS Upload Complete ===\n');
  console.log('Metadata URL:', metadata.url);
  console.log('Image URL:', metadata.data.image.href);
  console.log('\nUse this metadata URL as your tokenURI when minting:\n');
  console.log(metadata.url);
  console.log('\n');

  return metadata.url;
}

// CLI usage
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node uploadToIPFS.js <image-path> <name> <description> [attributes-json]');
  console.error('\nExample:');
  console.error('  node uploadToIPFS.js ./art.png "My NFT" "This is a test NFT" \'[{"trait_type":"Rarity","value":"Legendary"}]\'');
  process.exit(1);
}

const [imagePath, name, description, attributesJson] = args;
let attributes = [];

if (attributesJson) {
  try {
    attributes = JSON.parse(attributesJson);
  } catch (error) {
    console.warn('Warning: Could not parse attributes JSON, using empty array');
  }
}

uploadImageAndMetadata(imagePath, name, description, attributes)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });


