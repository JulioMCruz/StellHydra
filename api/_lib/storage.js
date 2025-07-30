import { randomUUID } from 'crypto';

// Simple in-memory storage for Vercel serverless functions
class MemStorage {
  constructor() {
    // Initialize with sample DEX prices since we can't persist state
    this.dexPrices = new Map();
    this.initializeDexPrices();
  }

  initializeDexPrices() {
    const samplePrices = [
      {
        id: randomUUID(),
        dexName: "StellarX",
        fromToken: "XLM",
        toToken: "ETH",
        rate: "0.0005291",
        liquidity: "1000000",
        fee: "0.25",
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        dexName: "StellarTerm",
        fromToken: "XLM",
        toToken: "ETH",
        rate: "0.0005284",
        liquidity: "750000",
        fee: "0.30",
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        dexName: "Allbridge",
        fromToken: "XLM",
        toToken: "ETH",
        rate: "0.0005279",
        liquidity: "500000",
        fee: "0.35",
        isActive: true,
        updatedAt: new Date(),
      },
    ];

    samplePrices.forEach(price => {
      this.dexPrices.set(price.id, price);
    });
  }

  async getDexPrices(fromToken, toToken) {
    return Array.from(this.dexPrices.values())
      .filter(price => price.fromToken === fromToken && price.toToken === toToken && price.isActive)
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
  }

  async createTransaction(transactionData) {
    // For serverless, we can't persist transactions
    // Return a mock response
    const id = randomUUID();
    return {
      id,
      ...transactionData,
      status: transactionData.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getTransaction(id) {
    // Mock response - in production you'd use a database
    return null;
  }

  async getTransactionsByWallet(walletAddress) {
    // Mock response - in production you'd use a database
    return [];
  }

  async updateTransactionStatus(id, status, txHash) {
    // Mock response - in production you'd use a database
    return null;
  }

  async createOrUpdateWallet(walletData) {
    // Mock response - in production you'd use a database
    const id = randomUUID();
    return {
      id,
      ...walletData,
      balances: walletData.balances || {},
      isConnected: walletData.isConnected ?? false,
      lastSynced: new Date(),
    };
  }

  async updateWalletBalances(address, network, balances) {
    // Mock response - in production you'd use a database
    return null;
  }
}

// Export singleton instance
export const storage = new MemStorage();