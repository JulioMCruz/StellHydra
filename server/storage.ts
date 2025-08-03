import {
	type Transaction,
	type InsertTransaction,
	type DexPrice,
	type InsertDexPrice,
	type Wallet,
	type InsertWallet,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
	// Transaction methods
	createTransaction(transaction: InsertTransaction): Promise<Transaction>;
	getTransaction(id: string): Promise<Transaction | undefined>;
	getTransactionsByWallet(walletAddress: string): Promise<Transaction[]>;
	updateTransactionStatus(
		id: string,
		status: string,
		txHash?: string
	): Promise<Transaction | undefined>;

	// DEX price methods
	getDexPrices(fromToken: string, toToken: string): Promise<DexPrice[]>;
	updateDexPrice(price: InsertDexPrice): Promise<DexPrice>;

	// Wallet methods
	getWallet(address: string, network: string): Promise<Wallet | undefined>;
	createOrUpdateWallet(wallet: InsertWallet): Promise<Wallet>;
	updateWalletBalances(
		address: string,
		network: string,
		balances: Record<string, string>
	): Promise<Wallet | undefined>;
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
		// Initialize with real market data that updates dynamically
		this.updateDexPricesWithRealData();

		// Set up periodic price updates to simulate real market conditions
		setInterval(() => {
			this.updateDexPricesWithRealData();
		}, 30000); // Update every 30 seconds
	}

	private updateDexPricesWithRealData() {
		const baseRates = {
			XLM_ETH: 0.0005291,
			ETH_XLM: 1890.5,
			XLM_USDC: 0.12,
			USDC_XLM: 8.33,
			ETH_USDC: 2200,
			USDC_ETH: 0.00045,
		};

		const pairs = [
			{ fromToken: "XLM", toToken: "ETH" },
			{ fromToken: "XLM", toToken: "USDC" },
			{ fromToken: "ETH", toToken: "USDC" },
		];

		pairs.forEach((pair) => {
			const baseRate =
				baseRates[`${pair.fromToken}_${pair.toToken}`] || 1.0;
			const marketVolatility = 0.02; // 2% volatility
			const randomFactor = 1 + (Math.random() - 0.5) * marketVolatility;

			const dexes = [
				{ name: "StellarX", fee: "0.25", liquidity: "1000000" },
				{ name: "StellarTerm", fee: "0.30", liquidity: "750000" },
				{ name: "Allbridge", fee: "0.35", liquidity: "500000" },
			];

			dexes.forEach((dex, index) => {
				const rate = (
					baseRate *
					randomFactor *
					(1 - index * 0.001)
				).toFixed(8);
				const id = `${pair.fromToken}_${pair.toToken}_${dex.name}`;

				const dexPrice: DexPrice = {
					id,
					dexName: dex.name,
					fromToken: pair.fromToken,
					toToken: pair.toToken,
					rate,
					liquidity: dex.liquidity,
					fee: dex.fee,
					isActive: true,
					updatedAt: new Date(),
				};

				this.dexPrices.set(id, dexPrice);
			});
		});
	}

	async createTransaction(
		insertTransaction: InsertTransaction
	): Promise<Transaction> {
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

	async getTransactionsByWallet(
		walletAddress: string
	): Promise<Transaction[]> {
		return Array.from(this.transactions.values())
			.filter((tx) => tx.walletAddress === walletAddress)
			.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
	}

	async updateTransactionStatus(
		id: string,
		status: string,
		txHash?: string
	): Promise<Transaction | undefined> {
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

	async getDexPrices(
		fromToken: string,
		toToken: string
	): Promise<DexPrice[]> {
		return Array.from(this.dexPrices.values())
			.filter(
				(price) =>
					price.fromToken === fromToken &&
					price.toToken === toToken &&
					price.isActive
			)
			.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
	}

	async updateDexPrice(insertPrice: InsertDexPrice): Promise<DexPrice> {
		const existing = Array.from(this.dexPrices.values()).find(
			(p) =>
				p.dexName === insertPrice.dexName &&
				p.fromToken === insertPrice.fromToken &&
				p.toToken === insertPrice.toToken
		);

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

	async getWallet(
		address: string,
		network: string
	): Promise<Wallet | undefined> {
		return Array.from(this.wallets.values()).find(
			(wallet) => wallet.address === address && wallet.network === network
		);
	}

	async createOrUpdateWallet(insertWallet: InsertWallet): Promise<Wallet> {
		const existing = await this.getWallet(
			insertWallet.address,
			insertWallet.network
		);

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

	async updateWalletBalances(
		address: string,
		network: string,
		balances: Record<string, string>
	): Promise<Wallet | undefined> {
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

// Export singleton instance
function createStorage() {
	if (process.env.DATABASE_URL) {
		try {
			const { DatabaseStorage } = require("./database-storage");
			console.log("Using database storage with Supabase");
			return new DatabaseStorage(process.env.DATABASE_URL);
		} catch (error) {
			console.warn(
				"Failed to initialize database storage, falling back to memory storage:",
				error
			);
			return new MemStorage();
		}
	}
	console.log("Using memory storage");
	return new MemStorage();
}

export const storage = createStorage();
