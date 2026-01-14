const { ethers } = require("hardhat");

async function main() {
  const [deployer, acct1, acct2] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy GovernanceToken and mint some tokens
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const token = await GovernanceToken.deploy("PayRouter Token", "PRT");
  await token.deployed();
  console.log("Token deployed to:", token.address);

  // Mint tokens to accounts & delegate voting power (must delegate to themselves)
  const mintAmount = ethers.utils.parseEther("1000");
  await token.mint(deployer.address, mintAmount);
  await token.mint(acct1.address, mintAmount);
  await token.mint(acct2.address, mintAmount);
  console.log("Minted tokens to accounts");

  // delegate to self so votes are counted
  await token.connect(deployer).delegate(deployer.address);
  await token.connect(acct1).delegate(acct1.address);
  await token.connect(acct2).delegate(acct2.address);
  console.log("Delegated voting power");

  // 2. Deploy TimelockController
  const minDelay = 3600; // e.g., 1 hour for demo; use larger value in production
  const proposers = []; // Governor will be granted proposer role later
  const executors = []; // allow any executor (empty) or set specific addresses
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(minDelay, proposers, executors);
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);

  // 3. Deploy Governor
  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.deploy(token.address, timelock.address);
  await governor.deployed();
  console.log("Governor deployed to:", governor.address);

  // 4. Grant roles: timelock needs to be admin of governor via propose/execute flows
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

  // Grant governor proposer and executor roles
  await timelock.grantRole(proposerRole, governor.address);
  await timelock.grantRole(executorRole, governor.address);
  console.log("Granted proposer and executor roles to governor");

  // Revoke admin role from deployer to ensure timelock is admin (optional, be careful)
  // await timelock.revokeRole(adminRole, deployer.address); // only after you've set all roles properly

  // 5. Deploy Treasury and set timelock as TIMELOCK_ROLE
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(timelock.address);
  await treasury.deployed();
  console.log("Treasury deployed to:", treasury.address);

  // Fund treasury with some ETH for demo
  await deployer.sendTransaction({
    to: treasury.address,
    value: ethers.utils.parseEther("10")
  });
  console.log("Treasury funded with 10 ETH");

  console.log("\n=== Deployment complete ===");
  console.log("Token:", token.address);
  console.log("Timelock:", timelock.address);
  console.log("Governor:", governor.address);
  console.log("Treasury:", treasury.address);
  console.log("\nSave these addresses to your .env file");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

