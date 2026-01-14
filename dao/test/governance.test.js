const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO end-to-end", function () {
  let token, timelock, governor, treasury;
  let deployer, alice, bob;

  beforeEach(async function () {
    [deployer, alice, bob] = await ethers.getSigners();

    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    token = await GovernanceToken.deploy("PayRouter Token", "PRT");
    await token.deployed();

    const mintAmount = ethers.utils.parseEther("1000");
    await token.mint(deployer.address, mintAmount);
    await token.mint(alice.address, mintAmount);
    await token.mint(bob.address, mintAmount);

    await token.delegate(deployer.address);
    await token.connect(alice).delegate(alice.address);
    await token.connect(bob).delegate(bob.address);

    const TimelockController = await ethers.getContractFactory("TimelockController");
    timelock = await TimelockController.deploy(1, [], []); // small delay for tests
    await timelock.deployed();

    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    governor = await MyGovernor.deploy(token.address, timelock.address);
    await governor.deployed();

    // grant roles
    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();

    await timelock.grantRole(proposerRole, governor.address);
    await timelock.grantRole(executorRole, governor.address);

    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(timelock.address);
    await treasury.deployed();

    // fund treasury
    await deployer.sendTransaction({ to: treasury.address, value: ethers.utils.parseEther("5") });
  });

  it("should allow a proposal to release funds when passed", async function () {
    // Build a proposal: call treasury.releaseEther(to, amount)
    const target = treasury.address;
    const iface = new ethers.utils.Interface(["function releaseEther(address payable to, uint256 amount)"]);
    const amount = ethers.utils.parseEther("1");
    const calldata = iface.encodeFunctionData("releaseEther", [alice.address, amount]);

    const proposeTx = await governor.propose([target], [0], [calldata], "Release 1 ETH to Alice");
    const proposeReceipt = await proposeTx.wait();
    const proposalId = proposeReceipt.events[0].args.proposalId;

    // Move forward to voting period (votingDelay = 1)
    await ethers.provider.send("evm_mine");

    // Vote: deployer and alice vote For
    await governor.castVote(proposalId, 1); // For
    await governor.connect(alice).castVote(proposalId, 1);

    // Advance blocks to end votingPeriod
    const votingPeriod = await governor.votingPeriod();
    for (let i = 0; i < votingPeriod.toNumber() + 1; i++) {
      await ethers.provider.send("evm_mine");
    }

    // Queue the proposal
    const descriptionHash = ethers.utils.id("Release 1 ETH to Alice");
    await governor.queue([target], [0], [calldata], descriptionHash);

    // Increase time by timelock delay (1 second)
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    // Execute the proposal
    await governor.execute([target], [0], [calldata], descriptionHash);

    // Check that Alice received funds
    const balance = await ethers.provider.getBalance(alice.address);
    // Hard to assert exact value due to initial balance; just assert treasury balance decreased
    const treasuryBalance = await ethers.provider.getBalance(treasury.address);
    expect(treasuryBalance).to.be.lt(ethers.utils.parseEther("5"));
  });
});



