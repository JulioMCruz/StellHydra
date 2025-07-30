const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔄 Contract Interaction Script");
  console.log("==============================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📡 Network: ${network.name} (${network.chainId})`);
  console.log(`💼 Account: ${deployer.address}`);
  console.log("");

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}_${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please run deployment first: npx hardhat run scripts/deploy.js --network <network>");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contracts.StellarEthereumEscrow.address;

  // Get contract instance
  const StellarEthereumEscrow = await ethers.getContractFactory("StellarEthereumEscrow");
  const escrow = StellarEthereumEscrow.attach(contractAddress);

  console.log(`📋 Interacting with StellarEthereumEscrow at: ${contractAddress}`);
  console.log("");

  try {
    // Get contract balance
    console.log("💰 Contract Balances:");
    const ethBalance = await escrow.getBalance(ethers.ZeroAddress);
    console.log(`  ETH: ${ethers.formatEther(ethBalance)} ETH`);

    // Get contract stats
    console.log("");
    console.log("📊 Contract Statistics:");
    const stats = await escrow.getStats();
    console.log(`  Total Escrows: ${stats[0]}`);
    console.log(`  Pending: ${stats[1]}`);
    console.log(`  Locked: ${stats[2]}`);
    console.log(`  Completed: ${stats[3]}`);
    console.log(`  Refunded: ${stats[4]}`);

    console.log("");
    console.log("✅ Contract interaction completed successfully!");

  } catch (error) {
    console.error("❌ Contract interaction failed:", error.message);
  }
}

// Example functions for testing
async function createTestEscrow() {
  console.log("🧪 Creating test escrow...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}_${network.chainId}.json`);
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contracts.StellarEthereumEscrow.address;

  const StellarEthereumEscrow = await ethers.getContractFactory("StellarEthereumEscrow");
  const escrow = StellarEthereumEscrow.attach(contractAddress);

  // Create test secret and hash
  const secret = ethers.randomBytes(32);
  const hashLock = ethers.keccak256(secret);

  // Set time locks (1 hour withdrawal, 2 hours refund)
  const now = Math.floor(Date.now() / 1000);
  const timeLocks = {
    withdrawal: now + 3600, // 1 hour
    refund: now + 7200      // 2 hours
  };

  // Create escrow with 0.01 ETH
  const amount = ethers.parseEther("0.01");
  
  try {
    const tx = await escrow.createEscrow(
      ethers.ZeroAddress, // ETH
      amount,
      hashLock,
      timeLocks,
      { value: amount }
    );
    
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return escrow.interface.parseLog(log).name === 'EscrowCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsedEvent = escrow.interface.parseLog(event);
      const escrowId = parsedEvent.args.escrowId;
      
      console.log(`✅ Test escrow created: ${escrowId}`);
      console.log(`🔑 Secret: ${ethers.hexlify(secret)}`);
      console.log(`🔒 Hash Lock: ${hashLock}`);
      
      return { escrowId, secret, hashLock };
    }
  } catch (error) {
    console.error("❌ Failed to create test escrow:", error.message);
  }
}

// Allow running specific functions
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes("--create-test")) {
    createTestEscrow()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Test escrow creation failed:", error);
        process.exit(1);
      });
  } else {
    main()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
      });
  }
}

module.exports = { createTestEscrow };