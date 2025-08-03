import {
	EnhancedSwapRequest,
	EnhancedBridgeTransaction,
	FusionRoute,
	RouteComparison,
} from "./types";
import { apiRequest } from "./queryClient";

export class EnhancedStellHydraClient {
	private fusionApi: any; // Will be injected

	constructor(fusionApi?: any) {
		this.fusionApi = fusionApi;
	}

	async executeAtomicSwap(
		swapRequest: EnhancedSwapRequest
	): Promise<EnhancedBridgeTransaction> {
		try {
			// Execute traditional StellHydra atomic swap
			const response = await apiRequest("POST", "/api/bridge/simulate", {
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				fromNetwork: swapRequest.fromChain,
				toNetwork: swapRequest.toChain,
				walletAddress: swapRequest.userAddress,
			});

			const simulation = await response.json();

			// Create transaction record
			const transactionData = {
				walletAddress: swapRequest.userAddress,
				fromNetwork: swapRequest.fromChain,
				toNetwork: swapRequest.toChain,
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				toAmount: simulation.toAmount,
				status: "pending",
				dexSource: simulation.dexSource,
				fee: simulation.fee,
				estimatedTime: simulation.estimatedTime,
				bridgeType: "atomic_swap",
			};

			const txResponse = await apiRequest(
				"POST",
				"/api/transactions",
				transactionData
			);
			const transaction = await txResponse.json();

			return {
				sourceTxHash: `stellhydra_${Date.now()}`,
				status: "pending",
				escrowAddress: `escrow_${Date.now()}`,
				orderHash: transaction.id,
				bridgeType: "atomic_swap",
				executionTime: Date.now(),
			};
		} catch (error) {
			console.error("StellHydra atomic swap error:", error);
			throw new Error("Failed to execute StellHydra atomic swap");
		}
	}

	async executeFusionBridge(
		swapRequest: EnhancedSwapRequest
	): Promise<EnhancedBridgeTransaction> {
		try {
			if (!this.fusionApi) {
				throw new Error("Fusion API not available");
			}

			// Get Fusion quote
			const fusionQuote = await this.fusionApi.getQuote({
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				amount: swapRequest.fromAmount,
				fromChainId: this.getChainId(swapRequest.fromChain),
				toChainId: this.getChainId(swapRequest.toChain),
				slippage: swapRequest.slippageTolerance || 0.5,
				deadline: swapRequest.deadline || Date.now() + 300000,
			});

			// Execute Fusion swap
			const fusionResult = await this.fusionApi.executeSwap(
				fusionQuote,
				swapRequest.userAddress,
				fusionQuote.signature
			);

			// Create transaction record
			const transactionData = {
				walletAddress: swapRequest.userAddress,
				fromNetwork: swapRequest.fromChain,
				toNetwork: swapRequest.toChain,
				fromToken: swapRequest.fromToken,
				toToken: swapRequest.toToken,
				fromAmount: swapRequest.fromAmount,
				toAmount: fusionQuote.toAmount,
				status: "pending",
				dexSource: "1inch Fusion",
				fee: "0", // Fusion handles fees differently
				estimatedTime: "1-2 minutes",
				bridgeType: "fusion_bridge",
				fusionRoute: swapRequest.fusionRoute,
			};

			const txResponse = await apiRequest(
				"POST",
				"/api/transactions",
				transactionData
			);
			const transaction = await txResponse.json();

			return {
				sourceTxHash: fusionResult.txHash,
				status: "pending",
				escrowAddress: `fusion_escrow_${Date.now()}`,
				orderHash: fusionResult.orderHash,
				bridgeType: "fusion_bridge",
				fusionRouteUsed: swapRequest.fusionRoute,
				executionTime: fusionResult.executionTime,
			};
		} catch (error) {
			console.error("Fusion bridge error:", error);
			throw new Error("Failed to execute Fusion bridge");
		}
	}

	async getOptimalRoute(
		swapRequest: EnhancedSwapRequest
	): Promise<"fusion" | "stellhydra"> {
		try {
			const routeComparison = await this.compareRoutes(swapRequest);
			return routeComparison.optimalRoute;
		} catch (error) {
			console.error("Route optimization error:", error);
			return "stellhydra"; // Fallback to StellHydra
		}
	}

	async validateFusionQuote(quote: any): Promise<boolean> {
		try {
			if (!this.fusionApi) {
				return false;
			}

			// Check if quote is still valid
			const isExpired = await this.fusionApi.checkQuoteExpiry(quote);
			if (isExpired) {
				return false;
			}

			// Validate quote parameters
			if (!quote.fromToken || !quote.toToken || !quote.toAmount) {
				return false;
			}

			return true;
		} catch (error) {
			console.error("Fusion quote validation error:", error);
			return false;
		}
	}

	private async compareRoutes(
		swapRequest: EnhancedSwapRequest
	): Promise<RouteComparison> {
		try {
			const comparison: RouteComparison = {
				fusion: {
					available: false,
					estimatedOutput: "0",
					gasEstimate: "0",
					priceImpact: 0,
				},
				stellhydra: {
					available: false,
					estimatedOutput: "0",
					gasEstimate: "0",
					priceImpact: 0,
				},
				optimalRoute: "stellhydra",
				reason: "StellHydra fallback",
			};

			// Get StellHydra route
			try {
				const stellhydraResponse = await apiRequest(
					"POST",
					"/api/bridge/simulate",
					{
						fromToken: swapRequest.fromToken,
						toToken: swapRequest.toToken,
						fromAmount: swapRequest.fromAmount,
						fromNetwork: swapRequest.fromChain,
						toNetwork: swapRequest.toChain,
						walletAddress: swapRequest.userAddress,
					}
				);

				const stellhydraSimulation = await stellhydraResponse.json();

				comparison.stellhydra = {
					available: true,
					estimatedOutput: stellhydraSimulation.toAmount,
					gasEstimate: "200000", // Mock gas estimate
					priceImpact: parseFloat(
						stellhydraSimulation.priceImpact || "0.02"
					),
				};
			} catch (error) {
				console.error("StellHydra route error:", error);
			}

			// Get Fusion route
			if (this.fusionApi) {
				try {
					const fusionRoute =
						await this.fusionApi.getRouteOptimization({
							fromToken: swapRequest.fromToken,
							toToken: swapRequest.toToken,
							amount: swapRequest.fromAmount,
							fromChainId: this.getChainId(swapRequest.fromChain),
							toChainId: this.getChainId(swapRequest.toChain),
						});

					comparison.fusion = {
						available: true,
						route: fusionRoute,
						estimatedOutput: fusionRoute.estimatedOutput,
						gasEstimate: fusionRoute.gasEstimate,
						priceImpact: fusionRoute.priceImpact,
					};
				} catch (error) {
					console.error("Fusion route error:", error);
				}
			}

			// Determine optimal route
			if (
				comparison.fusion.available &&
				comparison.stellhydra.available
			) {
				const fusionOutput = parseFloat(
					comparison.fusion.estimatedOutput
				);
				const stellhydraOutput = parseFloat(
					comparison.stellhydra.estimatedOutput
				);

				if (fusionOutput > stellhydraOutput) {
					comparison.optimalRoute = "fusion";
					comparison.reason = "Fusion provides better output";
				} else {
					comparison.optimalRoute = "stellhydra";
					comparison.reason = "StellHydra provides better output";
				}
			} else if (comparison.fusion.available) {
				comparison.optimalRoute = "fusion";
				comparison.reason = "Only Fusion available";
			} else {
				comparison.optimalRoute = "stellhydra";
				comparison.reason = "Only StellHydra available";
			}

			return comparison;
		} catch (error) {
			console.error("Route comparison error:", error);
			throw error;
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

	async getRouteComparison(
		swapRequest: EnhancedSwapRequest
	): Promise<RouteComparison> {
		return this.compareRoutes(swapRequest);
	}

	async executeWithFallback(
		swapRequest: EnhancedSwapRequest
	): Promise<EnhancedBridgeTransaction> {
		try {
			// Try Fusion first
			if (this.fusionApi) {
				try {
					return await this.executeFusionBridge(swapRequest);
				} catch (error) {
					console.warn(
						"Fusion execution failed, falling back to StellHydra:",
						error
					);
				}
			}

			// Fallback to StellHydra
			return await this.executeAtomicSwap(swapRequest);
		} catch (error) {
			console.error("Both Fusion and StellHydra failed:", error);
			throw new Error("All bridge options failed");
		}
	}
}
