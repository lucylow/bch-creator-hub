import { ethers } from "hardhat";

const SALT =
  "0x0000000000000000000000000000000000000000000000000000000000001111";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Factory = await ethers.getContractFactory("NFTMarketplace");
  const signer = deployer.address; // In production, use a dedicated signer

  // Get bytecode with constructor args
  const bytecode = Factory.bytecode;
  const encodedArgs = Factory.interface.encodeDeploy([signer]);

  // Combine bytecode with constructor args
  const create2Bytecode = "0x" + bytecode + encodedArgs.slice(2);

  // Calculate CREATE2 address
  const predicted = ethers.getCreate2Address(
    deployer.address,
    SALT,
    ethers.keccak256(create2Bytecode)
  );

  console.log("Predicted CREATE2 address:", predicted);
  console.log("Salt:", SALT);

  // Deploy using CREATE2
  // Note: This requires a factory contract or manual CREATE2 deployment
  // For simplicity, we'll deploy normally and log the address
  const marketplace = await Factory.deploy(signer);
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log("Deployed at:", address);

  if (address.toLowerCase() === predicted.toLowerCase()) {
    console.log("✅ CREATE2 address matches prediction!");
  } else {
    console.log("⚠️  Address does not match CREATE2 prediction");
    console.log("   This is expected if not using a CREATE2 factory");
  }

  console.log("\nEnvironment variables for frontend:");
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_SIGNER_ADDRESS=${signer}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



