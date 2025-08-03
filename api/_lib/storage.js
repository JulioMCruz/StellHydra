import { randomUUID } from "crypto";

// Proper in-memory storage for Vercel serverless functions
class MemStorage {
	constructor() {
		// Initialize with sample DEX prices since we can't persist state
		this.dexPrices = new Map();
		this.transactions = new Map();
		this.wallets = new Map();
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

		samplePrices.forEach((price) => {
			this.dexPrices.set(price.id, price);
		});
	}

	async getDexPrices(fromToken, toToken) {
		return Array.from(this.dexPrices.values())
			.filter(
				(price) =>
					price.fromToken === fromToken &&
					price.toToken === toToken &&
					price.isActive
			)
			.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
	}

	async createTransaction(transactionData) {
		const id = randomUUID();
		const transaction = {
			id,
			...transactionData,
			status: transactionData.status || "pending",
			toAmount: transactionData.toAmount || null,
			txHashFrom: transactionData.txHashFrom || null,
			txHashTo: transactionData.txHashTo || null,
			dexSource: transactionData.dexSource || null,
			fee: transactionData.fee || null,
			estimatedTime: transactionData.estimatedTime || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.transactions.set(id, transaction);
		return transaction;
	}

	async getTransaction(id) {
		return this.transactions.get(id) || null;
	}

	async getTransactionsByWallet(walletAddress) {
		return Array.from(this.transactions.values())
			.filter(
				(tx) =>
					tx.fromAddress === walletAddress ||
					tx.toAddress === walletAddress
			)
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	}

	async updateTransactionStatus(id, status, txHash) {
		const transaction = this.transactions.get(id);
		if (!transaction) return null;

		const updated = {
			...transaction,
			status,
			...(txHash && { txHashFrom: txHash }),
			updatedAt: new Date(),
		};
		this.transactions.set(id, updated);
		return updated;
	}

	async createOrUpdateWallet(walletData) {
		const existing = Array.from(this.wallets.values()).find(
			(wallet) =>
				wallet.address === walletData.address &&
				wallet.network === walletData.network
		);

		if (existing) {
			const updated = {
				...existing,
				...walletData,
				lastSynced: new Date(),
			};
			this.wallets.set(existing.id, updated);
			return updated;
		} else {
			const id = randomUUID();
			const wallet = {
				...walletData,
				id,
				balances: walletData.balances || {},
				isConnected: walletData.isConnected ?? false,
				lastSynced: new Date(),
			};
			this.wallets.set(id, wallet);
			return wallet;
		}
	}

	async updateWalletBalances(address, network, balances) {
		const wallet = Array.from(this.wallets.values()).find(
			(w) => w.address === address && w.network === network
		);

		if (!wallet) return null;

		const updated = {
			...wallet,
			balances,
			lastSynced: new Date(),
		};
		this.wallets.set(wallet.id, updated);
		return updated;
	}
}

// Export singleton instance
export const storage = new MemStorage();
