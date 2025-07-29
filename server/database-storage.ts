import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { transactions, dexPrices, wallets } from "@shared/schema";
import type { IStorage } from "./storage";
import type { Transaction, InsertTransaction, DexPrice, InsertDexPrice, Wallet, InsertWallet } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [result] = await this.db.insert(transactions).values(transaction).returning();
    return result;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [result] = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return result;
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    return await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.walletAddress, walletAddress))
      .orderBy(transactions.createdAt);
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (txHash) {
      updateData.txHashFrom = txHash;
    }

    const [result] = await this.db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return result;
  }

  // DEX price methods
  async getDexPrices(fromToken: string, toToken: string): Promise<DexPrice[]> {
    return await this.db
      .select()
      .from(dexPrices)
      .where(
        and(
          eq(dexPrices.fromToken, fromToken),
          eq(dexPrices.toToken, toToken),
          eq(dexPrices.isActive, true)
        )
      )
      .orderBy(dexPrices.rate);
  }

  async updateDexPrice(price: InsertDexPrice): Promise<DexPrice> {
    const [result] = await this.db.insert(dexPrices).values(price).returning();
    return result;
  }

  // Wallet methods
  async getWallet(address: string, network: string): Promise<Wallet | undefined> {
    const [result] = await this.db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.address, address),
          eq(wallets.network, network)
        )
      );
    return result;
  }

  async createOrUpdateWallet(wallet: InsertWallet): Promise<Wallet> {
    const existing = await this.getWallet(wallet.address, wallet.network);
    
    if (existing) {
      const [result] = await this.db
        .update(wallets)
        .set({ ...wallet, lastSynced: new Date() })
        .where(
          and(
            eq(wallets.address, wallet.address),
            eq(wallets.network, wallet.network)
          )
        )
        .returning();
      return result;
    } else {
      const [result] = await this.db.insert(wallets).values(wallet).returning();
      return result;
    }
  }

  async updateWalletBalances(address: string, network: string, balances: Record<string, string>): Promise<Wallet | undefined> {
    const [result] = await this.db
      .update(wallets)
      .set({ balances, lastSynced: new Date() })
      .where(
        and(
          eq(wallets.address, address),
          eq(wallets.network, network)
        )
      )
      .returning();
    return result;
  }
}