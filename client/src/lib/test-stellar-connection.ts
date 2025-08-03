// Test file for Stellar wallet connection
import { stellarService } from './stellar';

export async function testStellarConnection() {
  console.log('Testing Stellar wallet connection...');
  
  try {
    // Test wallet availability
    const isAvailable = await stellarService.isFreighterAvailable();
    console.log('Stellar wallet available:', isAvailable);
    
    // Test wallet connection
    console.log('Attempting to connect Stellar wallet...');
    const wallet = await stellarService.connectWallet();
    console.log('Connected wallet:', wallet);
    
    // Test balance fetch
    const balance = await stellarService.getBalance(wallet.address);
    console.log('Wallet balance:', balance);
    
    return {
      success: true,
      wallet,
      balance,
    };
  } catch (error) {
    console.error('Stellar connection test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Expose to window for browser testing
if (typeof window !== 'undefined') {
  (window as any).testStellarConnection = testStellarConnection;
} 