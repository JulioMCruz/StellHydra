import express from "express";
import axios, { AxiosError } from "axios";

const router = express.Router();

// Add debugging middleware
router.use((req, res, next) => {
	console.log(`[Fusion API] ${req.method} ${req.path}`);
	next();
});

// Proxy for 1inch Fusion API to handle CORS
router.get("/health", async (req, res) => {
	console.log("[Fusion API] Health check requested");
	console.log("[Fusion API] Environment variables:");
	console.log(
		"  FUSION_API_KEY:",
		process.env.FUSION_API_KEY ? "SET" : "NOT SET"
	);
	console.log("  NODE_ENV:", process.env.NODE_ENV);

	try {
		const apiKey = process.env.FUSION_API_KEY || "test-key";
		console.log(
			"[Fusion API] Using API key:",
			apiKey.substring(0, 8) + "..."
		);

		// Simple health check - just verify API key is valid
		// Since there's no dedicated health endpoint, we'll consider it healthy if we have an API key
		if (!process.env.FUSION_API_KEY) {
			throw new Error("FUSION_API_KEY not configured");
		}

		// For now, we'll assume the API is healthy if we have a key
		// In production, you might want to make a lightweight test request
		console.log("[Fusion API] Health check successful (API key present)");
		res.json({
			isHealthy: true,
			apiStatus: "online",
			lastCheck: Date.now(),
			responseTime: 0,
			errorCount: 0,
			message: "Fusion API configured",
		});
	} catch (error) {
		console.error("[Fusion API] Health check failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		res.json({
			isHealthy: false,
			apiStatus: "offline",
			lastCheck: Date.now(),
			responseTime: 0,
			errorCount: 1,
			error: errorMessage,
		});
	}
});

// Proxy for Fusion quotes
router.post("/quote", async (req, res) => {
	try {
		const {
			fromToken,
			toToken,
			amount,
			fromChainId,
			toChainId,
			preset,
			slippageTolerance,
			walletAddress,
		} = req.body;

		// Check if this is a cross-chain request
		if (fromChainId && toChainId && fromChainId !== toChainId) {
			return res.status(400).json({
				error: "Cross-chain swaps are not yet supported by 1inch Fusion",
				details:
					"Please use StellHydra bridge for cross-chain transfers",
			});
		}

		// Resolve token addresses
		const fromTokenAddress = resolveTokenAddress(
			fromToken,
			fromChainId || 1
		);
		const toTokenAddress = resolveTokenAddress(toToken, toChainId || 1);

		const response = await axios.post(
			"https://api.1inch.dev/fusion/orders/v1.0/quote",
			{
				fromTokenAddress,
				toTokenAddress,
				amount,
				walletAddress:
					walletAddress ||
					"0x0000000000000000000000000000000000000000",
				preset: preset || "fast",
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.FUSION_API_KEY}`,
					"Content-Type": "application/json",
				},
				timeout: 30000,
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("Fusion quote request failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorDetails =
			error instanceof AxiosError ? error.response?.data : undefined;
		res.status(500).json({
			error: "Failed to get Fusion quote",
			details: errorDetails || errorMessage,
		});
	}
});

// Token mapping for common tokens
const tokenMappings: { [chainId: number]: { [symbol: string]: string } } = {
	1: {
		// Ethereum Mainnet
		ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
		USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
		WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
	},
	11155111: {
		// Sepolia Testnet
		ETH: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
		USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
		WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
	},
	// Add more chains as needed
};

// Helper function to resolve token addresses
function resolveTokenAddress(token: string, chainId: number): string {
	// If it's already an address (starts with 0x), return as is
	if (token.startsWith("0x")) {
		return token;
	}

	// Try to find in mapping
	const chainTokens = tokenMappings[chainId];
	if (chainTokens && chainTokens[token.toUpperCase()]) {
		return chainTokens[token.toUpperCase()];
	}

	// Default to the original token string
	return token;
}

// Proxy for Fusion route optimization (using quote endpoint)
router.post("/route-optimization", async (req, res) => {
	try {
		const {
			fromToken,
			toToken,
			amount,
			fromChainId,
			toChainId,
			preset,
			slippageTolerance,
		} = req.body;

		// Resolve token addresses
		const fromTokenAddress = resolveTokenAddress(fromToken, fromChainId);
		const toTokenAddress = resolveTokenAddress(toToken, toChainId);

		// For now, since Fusion endpoints are not well documented,
		// we'll simulate a response for cross-chain scenarios
		// In production, you would use the 1inch Fusion SDK directly

		// Check if it's a cross-chain request
		if (fromChainId !== toChainId) {
			// Return error for cross-chain
			return res.status(400).json({
				error: "Cross-chain swaps are not supported by 1inch Fusion",
				details:
					"Please use StellHydra bridge for cross-chain transfers",
			});
		}

		// For same-chain swaps, we could use the 1inch Swap API as a fallback
		// But for now, return a simulated response
		const simulatedResponse = {
			data: {
				quoteId: `simulated-${Date.now()}`,
				fromTokenAddress,
				toTokenAddress,
				fromAmount: amount,
				toAmount: (parseFloat(amount) * 0.98).toString(), // Simulated 2% slippage
				protocols: ["1inch Fusion"],
				estimatedGas: "0",
				presets: {
					fast: {
						auctionStartAmount: amount,
						auctionEndAmount: (
							parseFloat(amount) * 0.98
						).toString(),
						deadline: Date.now() + 300000, // 5 minutes
					},
				},
				recommendedPreset: "fast",
			},
		};

		const response = simulatedResponse;

		// Transform the response to match expected route optimization format
		const quoteData = response.data;
		const presetKey = preset || "fast";
		const routeData = {
			...quoteData,
			route: {
				fromToken,
				toToken,
				fromChainId,
				toChainId,
				protocols: ["1inch Fusion"],
				estimatedOutput:
					quoteData.presets?.[
						presetKey as keyof typeof quoteData.presets
					]?.auctionEndAmount || quoteData.toAmount,
				gasEstimate: "0", // Fusion is gasless
				priceImpact: 0,
			},
			isOptimized: true,
		};

		res.json(routeData);
	} catch (error) {
		console.error("Fusion route optimization failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorDetails =
			error instanceof AxiosError ? error.response?.data : undefined;

		// Check if this is a cross-chain request (not supported by standard Fusion)
		if (req.body.fromChainId !== req.body.toChainId) {
			return res.status(400).json({
				error: "Cross-chain swaps are not yet supported by 1inch Fusion",
				details:
					"Please use StellHydra bridge for cross-chain transfers",
			});
		}

		res.status(500).json({
			error: "Failed to optimize Fusion route",
			details: errorDetails || errorMessage,
		});
	}
});

// Proxy for Fusion order creation
router.post("/order", async (req, res) => {
	try {
		const { quote, userAddress, deadline } = req.body;

		const response = await axios.post(
			"https://api.1inch.dev/fusion/orders/v1.0/order",
			{
				quote,
				userAddress,
				deadline: deadline || Date.now() + 300000, // 5 minutes default
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.FUSION_API_KEY}`,
					"Content-Type": "application/json",
				},
				timeout: 30000,
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("Fusion order creation failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorDetails =
			error instanceof AxiosError ? error.response?.data : undefined;
		res.status(500).json({
			error: "Failed to create Fusion order",
			details: errorDetails || errorMessage,
		});
	}
});

// Proxy for Fusion order status
router.get("/order/:orderHash/status", async (req, res) => {
	try {
		const { orderHash } = req.params;

		const response = await axios.get(
			`https://api.1inch.dev/fusion/orders/v1.0/order/${orderHash}/status`,
			{
				headers: {
					Authorization: `Bearer ${process.env.FUSION_API_KEY}`,
				},
				timeout: 10000,
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("Fusion order status check failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorDetails =
			error instanceof AxiosError ? error.response?.data : undefined;
		res.status(500).json({
			error: "Failed to get Fusion order status",
			details: errorDetails || errorMessage,
		});
	}
});

// Proxy for Fusion active orders
router.get("/orders/active", async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;

		const response = await axios.get(
			"https://api.1inch.dev/fusion/orders/v1.0/order/active/",
			{
				params: { page, limit },
				headers: {
					Authorization: `Bearer ${process.env.FUSION_API_KEY}`,
				},
				timeout: 10000,
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("Fusion active orders request failed:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		const errorDetails =
			error instanceof AxiosError ? error.response?.data : undefined;
		res.status(500).json({
			error: "Failed to get Fusion active orders",
			details: errorDetails || errorMessage,
		});
	}
});

export default router;
