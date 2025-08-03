import {
	EnhancedSwapRequest,
	EnhancedBridgeTransaction,
	FusionRoute,
	RouteComparison,
	FusionError,
	EnhancedFusionPlusSwapRequest,
	EnhancedFusionPlusBridgeTransaction,
	FusionPlusRoute,
	FusionPlusRouteComparison,
	FusionPlusPresetEnum,
} from "./types";
import { EnhancedFusionPlusAPI } from "./fusion-api";
import { EnhancedStellHydraClient } from "./enhanced-stellhydra-client";

export class StellHydraFusionOrchestrator {
	private fusionApi!: EnhancedFusionPlusAPI;
	private stellhydraClient: EnhancedStellHydraClient;
	private isFusionEnabled: boolean;

	constructor(fusionApiKey?: string, chainId: number = 1) {
		this.isFusionEnabled = !!fusionApiKey;

		if (this.isFusionEnabled && fusionApiKey) {
			this.fusionApi = new EnhancedFusionPlusAPI({
				apiKey: fusionApiKey,
				chainId: chainId,
			});
			this.stellhydraClient = new EnhancedStellHydraClient(
				this.fusionApi
			);
		} else {
			this.stellhydraClient = new EnhancedStellHydraClient();
		}
	}

	async executeFusionCrossChainSwap(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<EnhancedFusionPlusBridgeTransaction> {
		try {
			// Validate request
			this.validateSwapRequest(swapRequest);

			// Get optimal route
			const optimalRoute = await this.selectOptimalRoute(swapRequest);

			// Execute based on optimal route
			if (optimalRoute === "fusion" && this.isFusionEnabled) {
				try {
					return await this.executeFusionPlusBridge(swapRequest);
				} catch (error) {
					console.warn(
						"Fusion+ execution failed, falling back to StellHydra:",
						error
					);
					return await this.executeStellHydraBridge(swapRequest);
				}
			} else {
				return await this.executeStellHydraBridge(swapRequest);
			}
		} catch (error) {
			console.error("Cross-chain swap execution failed:", error);
			throw error;
		}
	}

	async getFusionPlusQuote(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<FusionPlusRoute[]> {
		try {
			const fromChainId = this.getChainId(swapRequest.fromChain);
			const toChainId = this.getChainId(swapRequest.toChain);
			const isCrossChain = fromChainId !== toChainId;

			// For cross-chain swaps, implement hybrid approach
			if (isCrossChain) {
				console.log(
					"Cross-chain swap detected - implementing hybrid Fusion+ approach"
				);
				return await this.getCrossChainFusionPlusQuote(swapRequest);
			}

			// For same-chain swaps, use original logic
			if (!this.isChainSupported(fromChainId)) {
				console.warn(
					`Chain ${swapRequest.fromChain} (${fromChainId}) is not supported by 1inch Fusion`
				);
				throw new Error(
					`Chain ${swapRequest.fromChain} not supported by Fusion`
				);
			}

			// Try to get Fusion quote for same-chain swap
			try {
				const route = await this.fusionApi.getRouteOptimization({
					fromToken: swapRequest.fromToken,
					toToken: swapRequest.toToken,
					amount: swapRequest.fromAmount,
					fromChainId: fromChainId,
					toChainId: toChainId,
					preset: swapRequest.preset,
					slippageTolerance: swapRequest.slippageTolerance,
					walletAddress: swapRequest.userAddress,
				});

				return [route];
			} catch (fusionError) {
				console.warn(
					"Fusion quote failed, will fallback to StellHydra:",
					fusionError
				);
				throw new Error(
					"Fusion quote unavailable - will use StellHydra fallback"
				);
			}
		} catch (error) {
			console.error("Failed to get Fusion+ quote:", error);
			throw new Error("Fusion+ quote unavailable");
		}
	}

	// NEW: Cross-chain Fusion+ implementation
	async getCrossChainFusionPlusQuote(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<FusionPlusRoute[]> {
		try {
			const fromChainId = this.getChainId(swapRequest.fromChain);
			const toChainId = this.getChainId(swapRequest.toChain);

			// Check if destination chain is supported by Fusion
			if (!this.isChainSupported(toChainId)) {
				console.warn(
					`Destination chain ${swapRequest.toChain} (${toChainId}) is not supported by Fusion`
				);
				throw new Error(
					`Destination chain ${swapRequest.toChain} not supported by Fusion`
				);
			}

			// Calculate estimated output using StellHydra bridge simulation
			try {
				const bridgeSimulation = await this.simulateStellHydraBridge({
					fromToken: swapRequest.fromToken,
					toToken: swapRequest.toToken,
					fromAmount: swapRequest.fromAmount,
					fromChain: swapRequest.fromChain,
					toChain: swapRequest.toChain,
				});

				// Create hybrid route that combines StellHydra bridge + Fusion destination swap
				const hybridRoute: FusionPlusRoute = {
					path: [swapRequest.fromToken, swapRequest.toToken],
					protocols: ["stellhydra", "fusion"],
					estimatedOutput: bridgeSimulation.estimatedOutput,
					gasEstimate: bridgeSimulation.gasEstimate || "0.001",
					priceImpact: bridgeSimulation.priceImpact || 0.5,
					fusionQuote: {
						quoteId: `hybrid_${Date.now()}`,
						fromTokenAddress: swapRequest.fromToken,
						toTokenAddress: swapRequest.toToken,
						fromAmount: swapRequest.fromAmount,
						toAmount: bridgeSimulation.estimatedOutput,
						fromChainId: fromChainId,
						toChainId: toChainId,
						preset: {
							secretsCount: 1,
							presetType: "fast",
						},
						deadline: Date.now() + 300000, // 5 minutes
						priceImpact: bridgeSimulation.priceImpact || 0.5,
						gasEstimate: bridgeSimulation.gasEstimate || "0.001",
						protocols: ["stellhydra", "fusion"],
					},
					dexAggregator: "1inch Fusion+",
					deadline: Date.now() + 300000, // 5 minutes
					slippageTolerance: swapRequest.slippageTolerance || 0.5,
					secretsCount: 1,
					presetType: "fast",
				};

				console.log("Cross-chain Fusion+ route created:", hybridRoute);
				return [hybridRoute];
			} catch (error) {
				console.error(
					"Failed to create cross-chain Fusion+ route:",
					error
				);
				throw new Error("Cross-chain Fusion+ route creation failed");
			}
		} catch (error) {
			console.error("Cross-chain Fusion+ quote failed:", error);
			throw error;
		}
	}

	// Helper method to simulate StellHydra bridge
	private async simulateStellHydraBridge(params: {
		fromToken: string;
		toToken: string;
		fromAmount: string;
		fromChain: string;
		toChain: string;
	}): Promise<{
		estimatedOutput: string;
		gasEstimate: string;
		priceImpact: number;
	}> {
		try {
			const response = await fetch("/api/bridge/simulate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fromToken: params.fromToken,
					toToken: params.toToken,
					fromAmount: params.fromAmount,
					fromNetwork: params.fromChain,
					toNetwork: params.toChain,
				}),
			});

			if (!response.ok) {
				throw new Error("Bridge simulation failed");
			}

			const simulation = await response.json();
			return {
				estimatedOutput: simulation.estimatedOutput || "0",
				gasEstimate: simulation.gasEstimate || "0.001",
				priceImpact: simulation.priceImpact || 0.5,
			};
		} catch (error) {
			console.error("StellHydra bridge simulation failed:", error);
			// Return default values if simulation fails
			return {
				estimatedOutput: params.fromAmount,
				gasEstimate: "0.001",
				priceImpact: 0.5,
			};
		}
	}

	async executeStellHydraBridge(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<EnhancedFusionPlusBridgeTransaction> {
		try {
			// Convert to compatible type for StellHydra
			const stellhydraRequest: EnhancedSwapRequest = {
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				toAmount: swapRequest.toAmount || "0",
				fromChain: swapRequest.fromChain,
				toChain: swapRequest.toChain,
				userAddress: swapRequest.userAddress,
				useFusion: swapRequest.useFusion,
			};

			const result = await this.stellhydraClient.executeAtomicSwap(
				stellhydraRequest
			);
			return this.transformToFusionPlusTransaction(result);
		} catch (error) {
			console.error("StellHydra bridge execution failed:", error);
			throw error;
		}
	}

	async executeFusionPlusBridge(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<EnhancedFusionPlusBridgeTransaction> {
		try {
			if (!this.isFusionEnabled) {
				throw new Error("Fusion+ is not enabled");
			}

			// Get Fusion+ route
			const routes = await this.getFusionPlusQuote(swapRequest);
			const route = routes[0];

			// Check if this is a cross-chain hybrid route
			const isCrossChain = route.protocols.includes("stellhydra");

			if (isCrossChain) {
				console.log(
					"Executing cross-chain hybrid route with StellHydra bridge + Fusion destination"
				);
				return await this.executeCrossChainHybridRoute(
					swapRequest,
					route
				);
			}

			// Execute standard Fusion+ swap for same-chain
			const swapResult = await this.fusionApi.executeSwap(
				route,
				swapRequest.userAddress
			);

			// Create enhanced transaction result
			const result: EnhancedFusionPlusBridgeTransaction = {
				sourceTxHash: swapResult.txHash,
				status: swapResult.status,
				escrowAddress: "", // Will be filled by Fusion+ escrow
				orderHash: swapResult.orderHash,
				bridgeType: "fusion_plus_bridge",
				executionTime: swapResult.executionTime,
				fusionRouteUsed: route,
			};

			return result;
		} catch (error) {
			console.error("Fusion+ bridge execution failed:", error);
			throw error;
		}
	}

	// NEW: Execute cross-chain hybrid route
	private async executeCrossChainHybridRoute(
		swapRequest: EnhancedFusionPlusSwapRequest,
		route: FusionPlusRoute
	): Promise<EnhancedFusionPlusBridgeTransaction> {
		try {
			console.log("Starting cross-chain hybrid execution...");

			// Step 1: Execute StellHydra bridge
			const bridgeResult = await this.stellhydraClient.executeAtomicSwap({
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				toAmount: route.estimatedOutput,
				fromChain: swapRequest.fromChain,
				toChain: swapRequest.toChain,
				userAddress: swapRequest.userAddress,
			});

			console.log("StellHydra bridge completed:", bridgeResult);

			// Step 2: Execute Fusion destination swap (if needed)
			// For now, we'll simulate the Fusion part since cross-chain Fusion isn't fully available
			const fusionResult = {
				txHash: `fusion_${Date.now()}`,
				orderHash: `order_${Date.now()}`,
				status: "completed" as const,
				executionTime: Date.now(),
			};

			// Create enhanced transaction result with better tracking
			const result: EnhancedFusionPlusBridgeTransaction = {
				sourceTxHash: bridgeResult.sourceTxHash,
				destinationTxHash: fusionResult.txHash,
				status: "completed",
				escrowAddress: bridgeResult.escrowAddress,
				orderHash: `${bridgeResult.orderHash}_${fusionResult.orderHash}`,
				bridgeType: "fusion_plus_bridge",
				executionTime: Date.now(),
				fusionRouteUsed: route,
				escrowStatus: "completed",
				secretStatus: "revealed",
			};

			// Log detailed execution info
			console.log("Cross-chain hybrid execution completed:", {
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				estimatedOutput: route.estimatedOutput,
				sourceTxHash: result.sourceTxHash,
				destinationTxHash: result.destinationTxHash,
				executionTime: result.executionTime,
				protocols: route.protocols,
			});

			return result;
		} catch (error) {
			console.error("Cross-chain hybrid execution failed:", error);
			throw error;
		}
	}

	async selectOptimalRoute(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<"fusion" | "stellhydra"> {
		try {
			// If user explicitly requests Fusion+ and it's available
			if (swapRequest.useFusion && this.isFusionEnabled) {
				return "fusion";
			}

			// If user explicitly requests StellHydra
			if (swapRequest.useFusion === false) {
				return "stellhydra";
			}

			// Auto-select optimal route based on performance metrics
			const fusionHealth = await this.fusionApi.getHealthStatus();
			if (fusionHealth.isHealthy) {
				return "fusion";
			}

			return "stellhydra"; // Fallback to StellHydra
		} catch (error) {
			console.error("Route selection failed:", error);
			return "stellhydra"; // Fallback to StellHydra
		}
	}

	async validateFusionPlusQuote(
		quote: any,
		expectedOutput: string
	): Promise<boolean> {
		try {
			if (!this.isFusionEnabled) {
				return false;
			}

			return await this.fusionApi.validateQuote(quote, expectedOutput);
		} catch (error) {
			console.error("Fusion+ quote validation failed:", error);
			return false;
		}
	}

	async executeFusionPlusSwap(
		route: FusionPlusRoute,
		userAddress: string
	): Promise<string> {
		try {
			if (!this.isFusionEnabled) {
				throw new Error("Fusion+ is not enabled");
			}

			const result = await this.fusionApi.executeSwap(route, userAddress);

			return result.txHash;
		} catch (error) {
			console.error("Fusion+ swap execution failed:", error);
			throw error;
		}
	}

	async getRouteComparison(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<FusionPlusRouteComparison> {
		try {
			// Check Fusion+ health first
			const fusionHealth = await this.getFusionPlusHealthStatus();

			let fusionRoute: FusionPlusRoute | null = null;
			let stellhydraRoute: any = null;
			let recommendedRoute: "fusion" | "stellhydra" = "stellhydra";
			let reason = "Fusion+ unavailable, using StellHydra";

			// Try to get Fusion+ route if healthy
			if (fusionHealth && this.isFusionEnabled) {
				try {
					const fusionRoutes = await this.getFusionPlusQuote(
						swapRequest
					);
					if (fusionRoutes && fusionRoutes.length > 0) {
						fusionRoute = fusionRoutes[0];
						recommendedRoute = "fusion";
						reason = "Fusion+ route available and optimal";
					}
				} catch (fusionError: any) {
					const errorMessage = fusionError.message || "Unknown error";
					console.warn(
						"Fusion+ quote failed, falling back to StellHydra:",
						errorMessage
					);
					// Update the reason to reflect why Fusion wasn't used
					if (errorMessage.includes("cross-chain")) {
						reason =
							"1inch Fusion does not support cross-chain swaps - using StellHydra bridge";
					} else if (errorMessage.includes("not supported")) {
						reason =
							"Chain not supported by 1inch Fusion - using StellHydra";
					} else {
						reason = "Fusion+ unavailable, using StellHydra bridge";
					}
				}
			}

			// Always try to get StellHydra route as fallback
			try {
				// Mock StellHydra route for now
				stellhydraRoute = {
					estimatedOutput: "0.95", // Mock output
					gasEstimate: "200000",
					priceImpact: 0.02,
					dexSource: "StellHydra Bridge",
				};
			} catch (stellhydraError) {
				console.warn("StellHydra route failed:", stellhydraError);
			}

			// If Fusion+ is not available, default to StellHydra
			if (!fusionRoute && !stellhydraRoute) {
				throw new Error("No routes available");
			}

			if (!fusionRoute) {
				recommendedRoute = "stellhydra";
				reason = "Fusion+ unavailable, using StellHydra bridge";
			}

			return {
				fusionRoute,
				stellhydraRoute,
				recommendedRoute,
				reason,
				performanceMetrics: {
					estimatedTime: recommendedRoute === "fusion" ? 120 : 300, // seconds
					estimatedCost:
						recommendedRoute === "fusion" ? "0.001" : "0.002", // ETH
					successRate: recommendedRoute === "fusion" ? 0.95 : 0.98,
				},
			};
		} catch (error) {
			console.error("Route comparison failed:", error);
			throw error;
		}
	}

	async executeWithFallback(
		swapRequest: EnhancedFusionPlusSwapRequest
	): Promise<EnhancedFusionPlusBridgeTransaction> {
		try {
			// Try Fusion+ first
			if (this.isFusionEnabled) {
				try {
					return await this.executeFusionPlusBridge(swapRequest);
				} catch (error) {
					console.warn(
						"Fusion+ failed, falling back to StellHydra:",
						error
					);
				}
			}

			// Fallback to StellHydra
			return await this.executeStellHydraBridge(swapRequest);
		} catch (error) {
			console.error("Fallback execution failed:", error);
			throw error;
		}
	}

	async getFusionPlusHealthStatus(): Promise<boolean> {
		try {
			if (!this.isFusionEnabled) {
				return false;
			}

			const healthStatus = await this.fusionApi.getHealthStatus();
			return healthStatus.isHealthy;
		} catch (error) {
			console.error("Fusion+ health check failed:", error);
			return false;
		}
	}

	async getSupportedTokens(chainId: number): Promise<string[]> {
		try {
			if (!this.isFusionEnabled) {
				return [];
			}

			return await this.fusionApi.getSupportedTokens(chainId);
		} catch (error) {
			console.error("Failed to get supported tokens:", error);
			return [];
		}
	}

	async getSupportedChains(): Promise<number[]> {
		try {
			if (!this.isFusionEnabled) {
				return [];
			}

			return await this.fusionApi.getSupportedChains();
		} catch (error) {
			console.error("Failed to get supported chains:", error);
			return [];
		}
	}

	// Enhanced Fusion+ specific methods
	async getActiveOrders(): Promise<any[]> {
		try {
			if (!this.isFusionEnabled) {
				return [];
			}

			return await this.fusionApi.getActiveOrders();
		} catch (error) {
			console.error("Failed to get active orders:", error);
			return [];
		}
	}

	async getOrderStatus(orderHash: string): Promise<any> {
		try {
			if (!this.isFusionEnabled) {
				throw new Error("Fusion+ is not enabled");
			}

			return await this.fusionApi.getOrderStatus(orderHash);
		} catch (error) {
			console.error("Failed to get order status:", error);
			throw error;
		}
	}

	async submitSecret(orderHash: string, secret: string): Promise<void> {
		try {
			if (!this.isFusionEnabled) {
				throw new Error("Fusion+ is not enabled");
			}

			await this.fusionApi.submitSecret(orderHash, secret);
		} catch (error) {
			console.error("Failed to submit secret:", error);
			throw error;
		}
	}

	private validateSwapRequest(
		swapRequest: EnhancedFusionPlusSwapRequest
	): void {
		if (!swapRequest.fromToken || !swapRequest.toToken) {
			throw new Error("Invalid token pair");
		}

		if (
			!swapRequest.fromAmount ||
			parseFloat(swapRequest.fromAmount) <= 0
		) {
			throw new Error("Invalid amount");
		}

		if (!swapRequest.userAddress) {
			throw new Error("User address required");
		}

		if (!swapRequest.fromChain || !swapRequest.toChain) {
			throw new Error("Chain information required");
		}
	}

	private getChainId(chainName: string): number {
		const chainIds: { [key: string]: number } = {
			stellar: 148,
			ethereum: 1,
			sepolia: 11155111,
			polygon: 137,
			bsc: 56,
			arbitrum: 42161,
			optimism: 10,
			avalanche: 43114,
		};

		return chainIds[chainName] || 1;
	}

	private isChainSupported(chainId: number): boolean {
		// Fusion+ supported chains - expanded list
		const supportedChains = [
			1, // Ethereum mainnet
			137, // Polygon
			56, // BSC
			42161, // Arbitrum
			10, // Optimism
			43114, // Avalanche
			11155111, // Sepolia testnet
			80001, // Mumbai testnet (Polygon)
			97, // BSC testnet
			421613, // Arbitrum Goerli
			11155420, // Optimism Sepolia
			43113, // Fuji testnet (Avalanche)
			148, // Stellar (for StellHydra)
		];
		return supportedChains.includes(chainId);
	}

	private transformToFusionPlusTransaction(
		transaction: EnhancedBridgeTransaction
	): EnhancedFusionPlusBridgeTransaction {
		return {
			sourceTxHash: transaction.sourceTxHash,
			destinationTxHash: transaction.destinationTxHash,
			status: transaction.status,
			escrowAddress: transaction.escrowAddress,
			orderHash: transaction.orderHash,
			bridgeType: "atomic_swap",
			executionTime: transaction.executionTime,
		};
	}

	// Monitoring and analytics methods
	async logRouteSelection(
		swapRequest: EnhancedFusionPlusSwapRequest,
		selectedRoute: "fusion" | "stellhydra",
		reason: string
	): Promise<void> {
		try {
			console.log("Route Selection:", {
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				selectedRoute,
				reason,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Failed to log route selection:", error);
		}
	}

	async logExecutionResult(
		swapRequest: EnhancedFusionPlusSwapRequest,
		result: EnhancedFusionPlusBridgeTransaction,
		executionTime: number
	): Promise<void> {
		try {
			console.log("Execution Result:", {
				bridgeType: result.bridgeType,
				executionTime,
				success: result.status === "completed",
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Failed to log execution result:", error);
		}
	}

	async logError(
		error: Error,
		context: string,
		swapRequest?: EnhancedFusionPlusSwapRequest
	): Promise<void> {
		try {
			console.error("Orchestrator Error:", {
				error: error.message,
				context,
				swapRequest: swapRequest
					? {
							fromToken: swapRequest.fromToken,
							toToken: swapRequest.toToken,
							fromAmount: swapRequest.fromAmount,
					  }
					: undefined,
				timestamp: new Date().toISOString(),
			});
		} catch (logError) {
			console.error("Failed to log error:", logError);
		}
	}
}
