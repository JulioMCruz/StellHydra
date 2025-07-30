const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 StellHydra EVM Contract Demo");
  console.log("================================");
  
  // Contract address on Sepolia
  const contractAddress = "0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940";
  
  console.log(`📋 Contract: ${contractAddress}`);
  console.log(`🌐 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
  console.log(`🔍 Blockscout: https://eth-sepolia.blockscout.com/address/${contractAddress}`);
  console.log("");
  
  // Connect to contract
  const [signer] = await ethers.getSigners();
  const StellarEthereumEscrow = await ethers.getContractFactory("StellarEthereumEscrow");
  const contract = StellarEthereumEscrow.attach(contractAddress);
  
  console.log("📊 Contract Status:");
  console.log("==================");
  
  try {
    // Get contract balance
    const ethBalance = await contract.getBalance(ethers.ZeroAddress);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    // Get contract stats
    const stats = await contract.getStats();
    console.log(`📈 Total Escrows: ${stats[0]}`);
    console.log(`⏳ Pending: ${stats[1]}`);
    console.log(`🔒 Locked: ${stats[2]}`);
    console.log(`✅ Completed: ${stats[3]}`);
    console.log(`🔄 Refunded: ${stats[4]}`);
    
    console.log("");
    console.log("🚀 Contract Features:");
    console.log("=====================");
    console.log("✅ ETH and ERC20 token support");
    console.log("✅ Hash Time Locked Contracts (HTLC)");
    console.log("✅ Atomic cross-chain swaps");
    console.log("✅ Secure escrow with time locks");
    console.log("✅ OpenZeppelin security standards");
    console.log("✅ Comprehensive error handling");
    console.log("✅ Event emission for monitoring");
    
    console.log("");
    console.log("🔗 Integration Ready:");
    console.log("====================");
    console.log("🌉 Cross-chain bridge with Stellar network");
    console.log("💻 Frontend integration endpoints available");
    console.log("📱 Mobile-ready with responsive design");
    console.log("🔐 Production-grade security implementation");
    
    console.log("");
    console.log("🎉 Deployment Successful!");
    console.log("=========================");
    console.log("The StellarEthereumEscrow contract is live, verified, and ready for");
    console.log("integration with the StellHydra cross-chain bridge frontend!");
    
  } catch (error) {
    console.error("❌ Error interacting with contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });