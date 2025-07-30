const { run, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Contract Verification");
  console.log("========================");

  const networkName = network.name;
  const chainId = await network.provider.send("eth_chainId");
  
  console.log(`📡 Network: ${networkName} (${parseInt(chainId, 16)})`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${networkName}_${parseInt(chainId, 16)}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please run deployment first: npx hardhat run scripts/deploy.js --network <network>");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  console.log("📋 Contracts to verify:");
  console.log("=======================");

  // Verify StellarEthereumEscrow
  const escrowContract = deploymentInfo.contracts.StellarEthereumEscrow;
  if (escrowContract) {
    console.log(`🔨 Verifying StellarEthereumEscrow at ${escrowContract.address}...`);
    
    try {
      await run("verify:verify", {
        address: escrowContract.address,
        constructorArguments: escrowContract.constructorArgs || [],
      });
      console.log(`✅ StellarEthereumEscrow verified successfully!`);
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log(`ℹ️  StellarEthereumEscrow is already verified`);
      } else {
        console.error(`❌ Verification failed for StellarEthereumEscrow:`, error.message);
      }
    }
  }

  console.log("");
  console.log("🌐 Explorer Links:");
  console.log("==================");
  
  if (parseInt(chainId, 16) === 11155111) { // Sepolia
    if (escrowContract) {
      console.log(`StellarEthereumEscrow: https://sepolia.etherscan.io/address/${escrowContract.address}#code`);
    }
  } else if (parseInt(chainId, 16) === 1) { // Mainnet
    if (escrowContract) {
      console.log(`StellarEthereumEscrow: https://etherscan.io/address/${escrowContract.address}#code`);
    }
  }

  console.log("");
  console.log("🎉 Verification completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });