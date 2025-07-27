import { type Transaction, type InsertTransaction, type DexPrice, type InsertDexPrice, type Wallet, type InsertWallet } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByWallet(walletAddress: string): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction | undefined>;
  
  // DEX price methods
  getDexPrices(fromToken: string, toToken: string): Promise<DexPrice[]>;
  updateDexPrice(price: InsertDexPrice): Promise<DexPrice>;
  
  // Wallet methods
  getWallet(address: string, network: string): Promise<Wallet | undefined>;
  createOrUpdateWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalances(address: string, network: string, balances: Record<string, string>): Promise<Wallet | undefined>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private dexPrices: Map<string, DexPrice>;
  private wallets: Map<string, Wallet>;

  constructor() {
    this.transactions = new Map();
    this.dexPrices = new Map();
    this.wallets = new Map();
    
    // Initialize with some sample DEX prices
    this.initializeDexPrices();
  }

  private initializeDexPrices() {
    const samplePrices: InsertDexPrice[] = [
      {
        dexName: "StellarX",
        fromToken: "XLM",
        toToken: "ETH",
        rate: "0.0005291",
        liquidity: "1000000",
        fee: "0.25",
        isActive: true,
      },
      {
        dexName: "StellarTerm",
        fromToken: "XLM",
        toToken: "ETH",
        rate: "0.0005284",
        liquidity: "750000",
        fee: "0.30",
        isActive: true,
      },
      {
        dexName: "Allbridge",
        fromToken: "XLM",
        toToken: "ETH",
        rate: "0.0005279",
        liquidity: "500000",
        fee: "0.35",
        isActive: true,
      },
    ];

    samplePrices.forEach(price => {
      const id = randomUUID();
      const dexPrice: DexPrice = {
        ...price,
        id,
        liquidity: price.liquidity || null,
        fee: price.fee || null,
        isActive: price.isActive ?? true,
        updatedAt: new Date(),
      };
      this.dexPrices.set(id, dexPrice);
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: insertTransaction.status || "pending",
      toAmount: insertTransaction.toAmount || null,
      txHashFrom: insertTransaction.txHashFrom || null,
      txHashTo: insertTransaction.txHashTo || null,
      dexSource: insertTransaction.dexSource || null,
      fee: insertTransaction.fee || null,
      estimatedTime: insertTransaction.estimatedTime || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.walletAddress === walletAddress)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated: Transaction = {
      ...transaction,
      status,
      ...(txHash && { txHashFrom: txHash }),
      updatedAt: new Date(),
    };
    this.transactions.set(id, updated);
    return updated;
  }

  async getDexPrices(fromToken: string, toToken: string): Promise<DexPrice[]> {
    return Array.from(this.dexPrices.values())
      .filter(price => price.fromToken === fromToken && price.toToken === toToken && price.isActive)
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
  }

  async updateDexPrice(insertPrice: InsertDexPrice): Promise<DexPrice> {
    const existing = Array.from(this.dexPrices.values())
      .find(p => p.dexName === insertPrice.dexName && p.fromToken === insertPrice.fromToken && p.toToken === insertPrice.toToken);

    if (existing) {
      const updated: DexPrice = {
        ...existing,
        ...insertPrice,
        liquidity: insertPrice.liquidity || null,
        fee: insertPrice.fee || null,
        isActive: insertPrice.isActive ?? true,
        updatedAt: new Date(),
      };
      this.dexPrices.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newPrice: DexPrice = {
        ...insertPrice,
        id,
        liquidity: insertPrice.liquidity || null,
        fee: insertPrice.fee || null,
        isActive: insertPrice.isActive ?? true,
        updatedAt: new Date(),
      };
      this.dexPrices.set(id, newPrice);
      return newPrice;
    }
  }

  async getWallet(address: string, network: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values())
      .find(wallet => wallet.address === address && wallet.network === network);
  }

  async createOrUpdateWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const existing = await this.getWallet(insertWallet.address, insertWallet.network);
    
    if (existing) {
      const updated: Wallet = {
        ...existing,
        ...insertWallet,
        lastSynced: new Date(),
      };
      this.wallets.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const wallet: Wallet = {
        ...insertWallet,
        id,
        balances: insertWallet.balances || {},
        isConnected: insertWallet.isConnected ?? false,
        lastSynced: new Date(),
      };
      this.wallets.set(id, wallet);
      return wallet;
    }
  }

  async updateWalletBalances(address: string, network: string, balances: Record<string, string>): Promise<Wallet | undefined> {
    const wallet = await this.getWallet(address, network);
    if (!wallet) return undefined;

    const updated: Wallet = {
      ...wallet,
      balances,
      lastSynced: new Date(),
    };
    this.wallets.set(wallet.id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
