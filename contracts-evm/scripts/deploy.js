const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 StellHydra EVM Contract Deployment");
  console.log("=====================================");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📡 Network: ${network.name} (${network.chainId})`);
  console.log(`💼 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  // Deploy StellarEthereumEscrow
  console.log("🔨 Deploying StellarEthereumEscrow...");
  
  const StellarEthereumEscrow = await ethers.getContractFactory("StellarEthereumEscrow");
  const stellarEthereumEscrow = await StellarEthereumEscrow.deploy();
  
  await stellarEthereumEscrow.waitForDeployment();
  const contractAddress = await stellarEthereumEscrow.getAddress();
  
  console.log(`✅ StellarEthereumEscrow deployed to: ${contractAddress}`);

  // Wait for a few block confirmations on testnet/mainnet
  if (network.chainId !== 31337) {
    console.log("⏳ Waiting for block confirmations...");
    await stellarEthereumEscrow.deploymentTransaction().wait(6);
    console.log("✅ Confirmed!");
  }

  // Get deployment transaction details
  const deploymentTx = stellarEthereumEscrow.deploymentTransaction();
  const receipt = await deploymentTx.wait();

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contracts: {
      StellarEthereumEscrow: {
        address: contractAddress,
        constructorArgs: [],
        blockNumber: Number(deploymentTx.blockNumber),
        transactionHash: deploymentTx.hash,
        deployedAt: new Date().toISOString()
      }
    },
    deployer: deployer.address,
    gasUsed: {
      StellarEthereumEscrow: receipt.gasUsed.toString()
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}_${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);
  console.log("");

  // Update environment configuration
  console.log("📝 Updating environment configuration...");
  const envFile = path.join(__dirname, "..", "..", ".env");
  
  let envContent = "";
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, "utf8");
  }

  // Update or add Ethereum configuration
  const ethConfig = [
    `ETHEREUM_RPC_URL=https://${network.name}.infura.io/v3/your-key`,
    `ETHEREUM_ESCROW_CONTRACT=${contractAddress}`,
    `ETHEREUM_PRIVATE_KEY=your-private-key`,
    `ETHEREUM_NETWORK=${network.name}`,
    `ETHEREUM_CHAIN_ID=${network.chainId}`,
  ];

  for (const config of ethConfig) {
    const [key, value] = config.split("=");
    const regex = new RegExp(`^${key}=.*$`, "m");
    
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, config);
    } else {
      envContent += `\n${config}`;
    }
  }

  fs.writeFileSync(envFile, envContent);
  console.log(`✅ Environment configuration updated in: ${envFile}`);
  console.log("");

  // Display contract information
  console.log("📋 Contract Information:");
  console.log("========================");
  console.log(`StellarEthereumEscrow: ${contractAddress}`);
  console.log("");

  if (network.chainId !== 31337) {
    console.log("🔍 Verification Commands:");
    console.log("=========================");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);
    console.log("");
    
    console.log("🌐 Explorer Links:");
    console.log("==================");
    if (network.chainId === 11155111) { // Sepolia
      console.log(`Contract: https://sepolia.etherscan.io/address/${contractAddress}`);
    } else if (network.chainId === 1) { // Mainnet
      console.log(`Contract: https://etherscan.io/address/${contractAddress}`);
    }
  }

  console.log("🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });