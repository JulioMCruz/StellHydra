const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💼 Creating Development Wallet");
  console.log("==============================");

  // Generate a new wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("🔑 Wallet Generated:");
  console.log(`📍 Public Address: ${wallet.address}`);
  console.log(`🔐 Private Key: [HIDDEN - saved to .env file]`);
  console.log(`🌱 Mnemonic: [HIDDEN - for security]`);
  console.log("");

  // Create .env file with the wallet details
  const envContent = `# StellHydra EVM Development Wallet
# Generated on: ${new Date().toISOString()}

# Network RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY

# Development wallet private key
PRIVATE_KEY=${wallet.privateKey}

# Etherscan API key for contract verification (get from https://etherscan.io/apis)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Gas reporting
REPORT_GAS=true

# StellHydra Configuration
STELLHYDRA_RESOLVER_ADDRESS=${wallet.address}
STELLHYDRA_FEE_RECIPIENT=${wallet.address}
STELLHYDRA_FEE_BASIS_POINTS=100
`;

  // Write to .env file
  const envPath = path.join(__dirname, "..", ".env");
  fs.writeFileSync(envPath, envContent);
  
  console.log("📄 Environment file created: .env");
  console.log("");

  // Note: Private key is ONLY saved to .env file (which is in .gitignore)
  // We do NOT create additional wallet files to prevent accidental exposure
  console.log("💾 Private key saved securely to: .env file only");
  console.log("");

  console.log("🚀 Next Steps:");
  console.log("==============");
  console.log("1. Fund your wallet with Sepolia ETH:");
  console.log(`   📍 Address: ${wallet.address}`);
  console.log("");
  console.log("2. Get Sepolia ETH from faucets:");
  console.log("   🚰 Sepolia Faucet: https://sepoliafaucet.com/");
  console.log("   🚰 Alchemy Faucet: https://sepoliafaucet.com/");
  console.log("   🚰 Chainlink Faucet: https://faucets.chain.link/sepolia");
  console.log("");
  console.log("3. Get Etherscan API key (optional for verification):");
  console.log("   🔍 https://etherscan.io/apis");
  console.log("   📝 Add it to .env file: ETHERSCAN_API_KEY=your_key_here");
  console.log("");
  console.log("4. Deploy contract to Sepolia:");
  console.log("   📜 npx hardhat run scripts/deploy.js --network sepolia");
  console.log("");
  console.log("5. Verify contract (after deployment):");
  console.log("   ✅ npx hardhat run scripts/verify.js --network sepolia");
  console.log("");

  console.log("⚠️  SECURITY WARNING:");
  console.log("===================");
  console.log("🔒 Keep your private key secure and never commit it to version control");
  console.log("🔒 The .env file is already in .gitignore");
  console.log("🔒 Consider using a hardware wallet for mainnet deployments");
  console.log("");

  console.log("🎯 Your wallet address to fund:");
  console.log("===============================");
  console.log(`${wallet.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Wallet creation failed:", error);
    process.exit(1);
  });