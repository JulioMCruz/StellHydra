import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
	insertTransactionSchema,
	insertDexPriceSchema,
	insertWalletSchema,
} from "@shared/schema";
import { z } from "zod";
import fusionRoutes from "./routes/fusion";
import bridgeRoutes from "./routes/bridge";
import atomicSwapRoutes from "./routes/atomic-swap";

export async function registerRoutes(app: Express): Promise<Server> {

	// Register Fusion routes
	app.use("/api/fusion", fusionRoutes);

	// Register Bridge routes
	app.use("/api/bridge", bridgeRoutes);

	// Register Atomic Swap routes
	app.use("/api/atomic-swap", atomicSwapRoutes);

	// Get DEX prices for token pair
	app.get("/api/dex-prices/:fromToken/:toToken", async (req, res) => {
		try {
			const { fromToken, toToken } = req.params;
			const prices = await storage.getDexPrices(
				fromToken.toUpperCase(),
				toToken.toUpperCase()
			);
			res.json(prices);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch DEX prices" });
		}
	});

	// Create new bridge transaction
	app.post("/api/transactions", async (req, res) => {
		try {
			const validatedData = insertTransactionSchema.parse(req.body);
			const transaction = await storage.createTransaction(validatedData);
			res.json(transaction);
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({
					message: "Invalid transaction data",
					errors: error.errors,
				});
			} else {
				res.status(500).json({
					message: "Failed to create transaction",
				});
			}
		}
	});

	// Get transaction by ID
	app.get("/api/transactions/:id", async (req, res) => {
		try {
			const { id } = req.params;
			const transaction = await storage.getTransaction(id);
			if (!transaction) {
				return res
					.status(404)
					.json({ message: "Transaction not found" });
			}
			res.json(transaction);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch transaction" });
		}
	});

	// Get transactions by wallet address
	app.get("/api/transactions/wallet/:address", async (req, res) => {
		try {
			const { address } = req.params;
			const transactions = await storage.getTransactionsByWallet(address);
			res.json(transactions);
		} catch (error) {
			res.status(500).json({ message: "Failed to fetch transactions" });
		}
	});

	// Update transaction status
	app.patch("/api/transactions/:id/status", async (req, res) => {
		try {
			const { id } = req.params;
			const { status, txHash } = req.body;

			if (!status) {
				return res.status(400).json({ message: "Status is required" });
			}

			const transaction = await storage.updateTransactionStatus(
				id,
				status,
				txHash
			);
			if (!transaction) {
				return res
					.status(404)
					.json({ message: "Transaction not found" });
			}
			res.json(transaction);
		} catch (error) {
			res.status(500).json({
				message: "Failed to update transaction status",
			});
		}
	});

	// Get or create wallet
	app.post("/api/wallets", async (req, res) => {
		try {
			const validatedData = insertWalletSchema.parse(req.body);
			const wallet = await storage.createOrUpdateWallet(validatedData);
			res.json(wallet);
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({
					message: "Invalid wallet data",
					errors: error.errors,
				});
			} else {
				res.status(500).json({
					message: "Failed to create/update wallet",
				});
			}
		}
	});

	// Update wallet balances
	app.patch("/api/wallets/:address/:network/balances", async (req, res) => {
		try {
			const { address, network } = req.params;
			const { balances } = req.body;

			if (!balances || typeof balances !== "object") {
				return res
					.status(400)
					.json({ message: "Valid balances object is required" });
			}

			const wallet = await storage.updateWalletBalances(
				address,
				network,
				balances
			);
			if (!wallet) {
				return res.status(404).json({ message: "Wallet not found" });
			}
			res.json(wallet);
		} catch (error) {
			res.status(500).json({
				message: "Failed to update wallet balances",
			});
		}
	});

	// Simulate bridge transaction
	app.post("/api/bridge/simulate", async (req, res) => {
		try {
			const { fromToken, toToken, fromAmount, fromNetwork, toNetwork } =
				req.body;

			if (
				!fromToken ||
				!toToken ||
				!fromAmount ||
				!fromNetwork ||
				!toNetwork
			) {
				return res
					.status(400)
					.json({ message: "Missing required fields" });
			}

			// Get best rates from DEX prices
			const prices = await storage.getDexPrices(fromToken, toToken);
			const bestPrice = prices[0];

			if (!bestPrice) {
				return res
					.status(404)
					.json({
						message: "No price data available for this token pair",
					});
			}

			const toAmount = (
				parseFloat(fromAmount) * parseFloat(bestPrice.rate || "0")
			).toString();
			const fee = (
				(parseFloat(fromAmount) * parseFloat(bestPrice.fee || "0")) /
				100
			).toString();

			const simulation = {
				fromAmount,
				toAmount,
				rate: bestPrice.rate,
				fee,
				dexSource: bestPrice.dexName,
				estimatedTime: "3-5 minutes",
				priceImpact: "0.02%",
				minimumReceived: (parseFloat(toAmount) * 0.995).toString(), // 0.5% slippage
			};

			res.json(simulation);
		} catch (error) {
			res.status(500).json({
				message: "Failed to simulate bridge transaction",
			});
		}
	});

	const httpServer = createServer(app);
	return httpServer;
}
