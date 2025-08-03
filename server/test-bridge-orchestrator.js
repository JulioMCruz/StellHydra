#!/usr/bin/env node

/**
 * Test script for the enhanced Bridge Orchestrator with error handling
 */

const { BridgeOrchestrator } = require('./dist/src/bridge-orchestrator');

async function testBridgeOrchestrator() {
  console.log('🧪 Testing Bridge Orchestrator with Error Handling');
  console.log('==================================================');

  const orchestrator = new BridgeOrchestrator();

  try {
    // Test health check
    console.log('\n📊 Testing health check...');
    const health = await orchestrator.healthCheck();
    console.log('Health Status:', JSON.stringify(health, null, 2));

    // Test swap statistics
    console.log('\n📈 Testing swap statistics...');
    const stats = orchestrator.getSwapStatistics();
    console.log('Swap Statistics:', JSON.stringify(stats, null, 2));

    // Test cleanup functionality
    console.log('\n🧹 Testing old swap cleanup...');
    const cleaned = orchestrator.cleanupOldSwaps();
    console.log(`Cleaned up ${cleaned} old swaps`);

    // Test configuration
    console.log('\n⚙️  Bridge Orchestrator Configuration:');
    console.log('- Ethereum Network:', process.env.ETHEREUM_NETWORK || 'testnet');
    console.log('- Stellar Network:', process.env.STELLAR_NETWORK || 'testnet');
    console.log('- Ethereum Contract:', process.env.ETHEREUM_ESCROW_CONTRACT || 'Not configured');
    console.log('- Stellar Contract:', process.env.STELLAR_CONTRACT_ID || 'Not configured');

    console.log('\n✅ Bridge Orchestrator test completed successfully!');

    // Note about actual swap testing
    console.log('\n💡 To test actual atomic swaps:');
    console.log('   1. Deploy contracts using: ./deploy-all-contracts.sh testnet');
    console.log('   2. Configure environment variables in .env');
    console.log('   3. Fund contracts with test tokens');
    console.log('   4. Use the atomic swap API endpoints');

  } catch (error) {
    console.error('❌ Bridge Orchestrator test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBridgeOrchestrator().catch(console.error);