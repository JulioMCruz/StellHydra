import {
	SDK,
	NetworkEnum,
	QuoteParams,
	OrderParams,
	PaginationParams,
	Quote,
	HashLock,
	PrivateKeyProviderConnector,
} from "@1inch/cross-chain-sdk";
import {
	FusionPlusQuote,
	FusionPlusOrder,
	FusionPlusRoute,
	FusionPlusSwapResult,
	FusionPlusReadyToAcceptSecretFills,
	FusionPlusReadyToExecutePublicActions,
	FusionPlusPublishedSecretsResponse,
	FusionPlusOrderStatus,
	FusionPlusError,
	FusionPlusErrorType,
	FusionPlusConfig,
	FusionPlusHealthStatus,
	FusionPlusMetrics,
	fusionPlusChainIds,
	fusionPlusPresetConfigs,
	FusionPlusPresetEnum,
	fusionPlusContractAddresses,
	fusionPlusTokenAddresses,
	fusionPlusTokenSymbols,
} from "./types";
import { getRandomBytes32 } from "./utils";

export class EnhancedFusionPlusAPI {
	private sdk!: SDK;
	private config: FusionPlusConfig;
	private isInitialized: boolean = false;
	private proxyUrl: string = "https://api.1inch.dev"; // Default API URL

	constructor(config?: Partial<FusionPlusConfig>) {
		this.config = {
			apiKey: config?.apiKey || process.env.VITE_FUSION_API_KEY || "",
			apiUrl: config?.apiUrl || "https://api.1inch.dev/fusion-plus",
			chainId: config?.chainId || 1,
			timeout: config?.timeout || 30000,
			retryAttempts: config?.retryAttempts || 3,
			enableLogging: config?.enableLogging ?? true,
		};

		// Set proxy URL for development
		if (process.env.NODE_ENV === "development") {
			this.proxyUrl = "https://api.1inch.dev";
		}

		this.initializeSDK();
	}

	private initializeSDK(): void {
		try {
			if (!this.config.apiKey) {
				this.log("Warning: No Fusion+ API key provided");
				return;
			}

			// Initialize with correct SDK configuration
			this.sdk = new SDK({
				url: this.config.apiUrl,
				authKey: this.config.apiKey,
			});

			this.isInitialized = true;
			this.log("Fusion+ SDK initialized successfully with real SDK");
		} catch (error) {
			this.log("Failed to initialize Fusion+ SDK:", error);
			this.isInitialized = false;
		}
	}

	// Core Fusion+ API Methods
	async getActiveOrders(
		params: any = { page: 1, limit: 10 }
	): Promise<FusionPlusOrder[]> {
		try {
			this.validateInitialization();
			const orders = await this.sdk.getActiveOrders(params);
			this.log("Retrieved active orders:", orders);
			// Handle the response structure properly
			const ordersArray = Array.isArray(orders)
				? orders
				: (orders as any)?.orders || [];
			return this.transformOrders(ordersArray);
		} catch (error) {
			this.log("Failed to get active orders:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.ORDER_NOT_READY,
				message: "Failed to get active orders",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	async getOrdersByMaker(params: any): Promise<FusionPlusOrder[]> {
		try {
			this.validateInitialization();
			const orders = await this.sdk.getOrdersByMaker(params);
			this.log("Retrieved orders by maker:", orders);
			// Handle the response structure properly
			const ordersArray = Array.isArray(orders)
				? orders
				: (orders as any)?.orders || [];
			return this.transformOrders(ordersArray);
		} catch (error) {
			this.log("Failed to get orders by maker:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.ORDER_NOT_READY,
				message: "Failed to get orders by maker",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	async getQuote(params: any): Promise<FusionPlusQuote> {
		try {
			this.validateInitialization();

			// Use server proxy instead of direct API call
			const response = await fetch("/api/fusion/quote", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Quote request failed");
			}

			const data = await response.json();
			this.log("Retrieved quote:", data);

			return this.transformQuote(data);
		} catch (error) {
			this.log("Failed to get quote:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.INVALID_QUOTE,
				message: "Failed to get quote",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	async createOrder(quote: any, params: any): Promise<FusionPlusOrder> {
		try {
			this.validateInitialization();
			const order = await this.sdk.createOrder(quote, params);
			this.log("Created order:", order);
			return this.transformOrder(order);
		} catch (error) {
			this.log("Failed to create order:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.EXECUTION_FAILED,
				message: "Failed to create order",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	// Secret Management Methods
	async getReadyToAcceptSecretFills(
		orderHash: string
	): Promise<FusionPlusReadyToAcceptSecretFills> {
		try {
			this.validateInitialization();
			const result = await this.sdk.getReadyToAcceptSecretFills(
				orderHash
			);
			this.log("Ready to accept secret fills:", result);
			// Handle the response structure properly
			return {
				isReady: (result as any).isReady || false,
				escrowCreated: (result as any).escrowCreated || false,
				finalityLockExpired:
					(result as any).finalityLockExpired || false,
				orderHash,
			};
		} catch (error) {
			this.log("Failed to check ready to accept secret fills:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.FINALITY_LOCK_NOT_EXPIRED,
				message: "Failed to check ready to accept secret fills",
				details: error,
				timestamp: Date.now(),
				orderHash,
			});
		}
	}

	async getReadyToExecutePublicActions(): Promise<FusionPlusReadyToExecutePublicActions> {
		try {
			this.validateInitialization();
			const result = await this.sdk.getReadyToExecutePublicActions();
			this.log("Ready to execute public actions:", result);
			// Handle the response structure properly
			return {
				isReady: (result as any).isReady || false,
				reason: (result as any).reason || "",
			};
		} catch (error) {
			this.log("Failed to check ready to execute public actions:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.ORDER_NOT_READY,
				message: "Failed to check ready to execute public actions",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	async getPublishedSecrets(
		orderHash: string
	): Promise<FusionPlusPublishedSecretsResponse> {
		try {
			this.validateInitialization();
			const result = await this.sdk.getPublishedSecrets(orderHash);
			this.log("Published secrets:", result);
			// Handle the response structure properly
			return {
				orderHash,
				publishedSecrets: (result as any).publishedSecrets || [],
				secretCount: (result as any).secretCount || 0,
			};
		} catch (error) {
			this.log("Failed to get published secrets:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.SECRET_ALREADY_PUBLISHED,
				message: "Failed to get published secrets",
				details: error,
				timestamp: Date.now(),
				orderHash,
			});
		}
	}

	async submitSecret(orderHash: string, secret: string): Promise<void> {
		try {
			this.validateInitialization();
			await this.sdk.submitSecret(orderHash, secret);
			this.log("Secret submitted successfully for order:", orderHash);
		} catch (error) {
			this.log("Failed to submit secret:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.SECRET_SUBMISSION_FAILED,
				message: "Failed to submit secret",
				details: error,
				timestamp: Date.now(),
				orderHash,
			});
		}
	}

	// Enhanced Route Optimization
	async getRouteOptimization(params: {
		fromToken: string;
		toToken: string;
		amount: string;
		fromChainId: number;
		toChainId: number;
		preset?: FusionPlusPresetEnum;
		slippageTolerance?: number;
		walletAddress?: string;
	}): Promise<FusionPlusRoute> {
		try {
			this.validateInitialization();

			// Use server proxy instead of direct API call
			const response = await fetch("/api/fusion/route-optimization", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Route optimization failed");
			}

			const data = await response.json();
			this.log("Route optimization result:", data);

			return this.transformRoute(data);
		} catch (error) {
			this.log("Failed to optimize route:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.ROUTE_INVALID,
				message: "Failed to optimize route",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	// Enhanced Swap Execution
	async executeSwap(
		route: FusionPlusRoute,
		userAddress: string,
		blockchainProvider?: any
	): Promise<FusionPlusSwapResult> {
		try {
			this.validateInitialization();

			// Create order with the route
			const orderParams = {
				fromTokenAddress: route.fusionQuote.fromTokenAddress,
				toTokenAddress: route.fusionQuote.toTokenAddress,
				amount: route.fusionQuote.fromAmount,
				walletAddress: userAddress,
				preset: route.presetType,
			};

			const order = await this.createOrder(
				route.fusionQuote,
				orderParams
			);

			// Wait for escrow creation and finality lock
			await this.waitForEscrowCreation(order.orderHash);

			// Submit secret when ready
			await this.submitSecretWhenReady(order.orderHash, route);

			const result: FusionPlusSwapResult = {
				txHash: order.orderHash, // Use order hash as transaction hash
				orderHash: order.orderHash,
				status: "pending",
				executionTime: Date.now(),
			};

			this.log("Swap execution completed:", result);
			return result;
		} catch (error) {
			this.log("Swap execution failed:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.EXECUTION_FAILED,
				message: "Failed to execute swap",
				details: error,
				timestamp: Date.now(),
			});
		}
	}

	// Health and Status Methods
	async getHealthStatus(): Promise<FusionPlusHealthStatus> {
		try {
			this.validateInitialization();

			// Use server proxy instead of direct API call
			const response = await fetch("/api/fusion/health", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Health check failed: ${response.status}`);
			}

			const data = await response.json();
			this.log("Health status:", data);

			// If API key is missing or invalid, return offline status but don't throw
			if (data.error && data.error.includes("401")) {
				this.log(
					"API key missing or invalid - Fusion+ will be disabled"
				);
				return {
					isHealthy: false,
					apiStatus: "offline",
					lastCheck: Date.now(),
					responseTime: 0,
					errorCount: 1,
				};
			}

			return {
				isHealthy: data.isHealthy || false,
				apiStatus: data.apiStatus || "offline",
				lastCheck: data.lastCheck || Date.now(),
				responseTime: data.responseTime || 0,
				errorCount: data.errorCount || 0,
			};
		} catch (error) {
			this.log("Health check failed:", error);
			return {
				isHealthy: false,
				apiStatus: "offline",
				lastCheck: Date.now(),
				responseTime: 0,
				errorCount: 1,
			};
		}
	}

	async getOrderStatus(orderHash: string): Promise<FusionPlusOrderStatus> {
		try {
			this.validateInitialization();
			// This would need to be implemented based on the actual SDK
			const status: FusionPlusOrderStatus = {
				orderHash,
				status: "pending",
				escrowStatus: "pending",
				secretStatus: "pending",
			};

			this.log("Order status:", status);
			return status;
		} catch (error) {
			this.log("Failed to get order status:", error);
			throw new FusionPlusError({
				type: FusionPlusErrorType.ORDER_NOT_READY,
				message: "Failed to get order status",
				details: error,
				timestamp: Date.now(),
				orderHash,
			});
		}
	}

	// Utility Methods
	async getSupportedTokens(chainId: number): Promise<string[]> {
		try {
			const tokens = fusionPlusTokenAddresses[chainId];
			if (!tokens) {
				return [];
			}
			return Object.values(tokens);
		} catch (error) {
			this.log("Failed to get supported tokens:", error);
			return [];
		}
	}

	async getSupportedChains(): Promise<number[]> {
		try {
			return Object.values(fusionPlusChainIds);
		} catch (error) {
			this.log("Failed to get supported chains:", error);
			return [];
		}
	}

	async validateQuote(
		quote: FusionPlusQuote,
		expectedOutput: string
	): Promise<boolean> {
		try {
			const actualOutput = parseFloat(quote.toAmount);
			const expected = parseFloat(expectedOutput);
			const tolerance = 0.05; // 5% tolerance

			return Math.abs(actualOutput - expected) / expected <= tolerance;
		} catch (error) {
			this.log("Quote validation failed:", error);
			return false;
		}
	}

	async checkQuoteExpiry(quote: FusionPlusQuote): Promise<boolean> {
		try {
			const now = Date.now();
			return now < quote.deadline;
		} catch (error) {
			this.log("Quote expiry check failed:", error);
			return false;
		}
	}

	// Contract Address Utilities
	getContractAddresses(chainId: number): any {
		return fusionPlusContractAddresses[chainId] || {};
	}

	getTokenAddresses(chainId: number): { [symbol: string]: string } {
		return fusionPlusTokenAddresses[chainId] || {};
	}

	getTokenSymbols(chainId: number): { [address: string]: string } {
		return fusionPlusTokenSymbols[chainId] || {};
	}

	// Private Helper Methods
	private validateInitialization(): void {
		if (!this.isInitialized) {
			throw new Error("Fusion+ SDK not initialized");
		}
	}

	private log(message: string, data?: any): void {
		if (this.config.enableLogging) {
			console.log(`[Fusion+ API] ${message}`, data || "");
		}
	}

	private transformOrders(orders: any[]): FusionPlusOrder[] {
		return orders.map((order) => this.transformOrder(order));
	}

	private transformOrder(order: any): FusionPlusOrder {
		return {
			orderHash: order.orderHash,
			maker: order.maker,
			taker: order.taker,
			makingAmount: order.makingAmount,
			takingAmount: order.takingAmount,
			fromToken: order.fromToken,
			toToken: order.toToken,
			fromChainId: order.fromChainId,
			toChainId: order.toChainId,
			status: order.status,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			secrets: order.secrets,
			secretHashes: order.secretHashes,
			hashLock: order.hashLock,
		};
	}

	private transformQuote(quote: any): FusionPlusQuote {
		// Handle both direct quote response and preset-based response
		const presetData =
			quote.presets && quote.presets[quote.recommendedPreset || "fast"];
		const presetType = quote.recommendedPreset || "fast";

		return {
			quoteId: quote.quoteId || quote.orderHash || "",
			fromTokenAddress: quote.fromTokenAddress || quote.fromToken || "",
			toTokenAddress: quote.toTokenAddress || quote.toToken || "",
			fromAmount: quote.fromAmount || quote.srcTokenAmount || "0",
			toAmount:
				presetData?.auctionEndAmount ||
				quote.toAmount ||
				quote.dstTokenAmount ||
				"0",
			fromChainId: quote.fromChainId || 1,
			toChainId: quote.toChainId || 1,
			preset: quote.preset || { secretsCount: 1, presetType },
			deadline:
				presetData?.deadline || quote.deadline || Date.now() + 300000,
			priceImpact: quote.priceImpact || 0,
			gasEstimate: quote.gasEstimate || "0", // Fusion is gasless
			protocols: quote.protocols || ["1inch Fusion"],
			orderHash: quote.orderHash,
			signature: quote.signature,
		};
	}

	private transformRoute(data: any): FusionPlusRoute {
		// Handle both the original quote format and our custom route format
		const routeData = data.route || {};
		const quote = this.transformQuote(data.quote || data);
		const preset = (data.preset ||
			FusionPlusPresetEnum.FAST) as FusionPlusPresetEnum;
		const presetConfig = fusionPlusPresetConfigs[preset];

		return {
			path: [
				routeData.fromToken || data.fromToken || data.fromTokenAddress,
				routeData.toToken || data.toToken || data.toTokenAddress,
			],
			protocols: routeData.protocols ||
				data.protocols ||
				quote.protocols || ["1inch Fusion"],
			estimatedOutput:
				routeData.estimatedOutput ||
				data.estimatedOutput ||
				quote.toAmount,
			gasEstimate:
				routeData.gasEstimate ||
				data.gasEstimate ||
				quote.gasEstimate ||
				"0",
			priceImpact:
				routeData.priceImpact ||
				data.priceImpact ||
				quote.priceImpact ||
				0,
			fusionQuote: quote,
			dexAggregator: "1inch Fusion+",
			deadline: data.deadline || quote.deadline,
			slippageTolerance: data.slippageTolerance || 0.5,
			secretsCount: presetConfig?.secretsCount || 1,
			presetType: preset,
		};
	}

	private async waitForEscrowCreation(orderHash: string): Promise<void> {
		let attempts = 0;
		const maxAttempts = 30; // 30 seconds
		const interval = 1000; // 1 second

		while (attempts < maxAttempts) {
			try {
				const readyStatus = await this.getReadyToAcceptSecretFills(
					orderHash
				);
				if (readyStatus.escrowCreated) {
					this.log("Escrow created for order:", orderHash);
					return;
				}
			} catch (error) {
				this.log("Error checking escrow status:", error);
			}

			await new Promise((resolve) => setTimeout(resolve, interval));
			attempts++;
		}

		throw new FusionPlusError({
			type: FusionPlusErrorType.ESCROW_CREATION_FAILED,
			message: "Escrow creation timeout",
			timestamp: Date.now(),
			orderHash,
		});
	}

	private async submitSecretWhenReady(
		orderHash: string,
		route: FusionPlusRoute
	): Promise<void> {
		try {
			// Wait for finality lock to expire
			let attempts = 0;
			const maxAttempts = 60; // 60 seconds
			const interval = 1000; // 1 second

			while (attempts < maxAttempts) {
				try {
					const readyStatus = await this.getReadyToAcceptSecretFills(
						orderHash
					);
					if (
						readyStatus.isReady &&
						readyStatus.finalityLockExpired
					) {
						break;
					}
				} catch (error) {
					this.log("Error checking finality lock:", error);
				}

				await new Promise((resolve) => setTimeout(resolve, interval));
				attempts++;
			}

			// Check if public actions are ready
			const publicActionsReady =
				await this.getReadyToExecutePublicActions();
			if (!publicActionsReady.isReady) {
				throw new FusionPlusError({
					type: FusionPlusErrorType.ORDER_NOT_READY,
					message: "Public actions not ready",
					timestamp: Date.now(),
					orderHash,
				});
			}

			// Check if secret already published
			const publishedSecrets = await this.getPublishedSecrets(orderHash);
			if (publishedSecrets.publishedSecrets.length > 0) {
				this.log("Secret already published for order:", orderHash);
				return;
			}

			// Generate and submit secret
			const secret = getRandomBytes32();
			await this.submitSecret(orderHash, secret);

			this.log("Secret submitted successfully for order:", orderHash);
		} catch (error) {
			this.log("Failed to submit secret when ready:", error);
			throw error;
		}
	}
}
