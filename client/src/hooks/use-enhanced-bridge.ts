import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StellHydraFusionOrchestrator } from "@/lib/stellhydra-fusion-orchestrator";
import {
	EnhancedFusionPlusSwapRequest,
	EnhancedFusionPlusBridgeTransaction,
	BridgeSimulation,
	FusionPlusRouteComparison,
	FusionPlusError,
} from "@/lib/types";

interface EnhancedBridgeParams {
	fromToken: string;
	toToken: string;
	fromAmount: string;
	fromNetwork: string;
	toNetwork: string;
	walletAddress: string;
	useFusion?: boolean;
	slippageTolerance?: number;
	deadline?: number;
}

export function useEnhancedBridge(params: EnhancedBridgeParams) {
	const [simulation, setSimulation] = useState<BridgeSimulation | null>(null);
	const [routeComparison, setRouteComparison] =
		useState<FusionPlusRouteComparison | null>(null);
	const [orchestrator, setOrchestrator] =
		useState<StellHydraFusionOrchestrator | null>(null);
	const { toast } = useToast();
	const queryClient = useQueryClient();

	// Initialize orchestrator
	useEffect(() => {
		// For hackathon, use a mock API key - in production, get from environment
		const fusionApiKey = import.meta.env.DEV
			? "mock-fusion-key"
			: undefined;
		const newOrchestrator = new StellHydraFusionOrchestrator(
			fusionApiKey,
			1
		);
		setOrchestrator(newOrchestrator);
	}, []);

	// Enhanced bridge simulation with Fusion integration
	const { mutate: simulateEnhancedBridge, isPending: isSimulating } =
		useMutation({
			mutationFn: async (simulationParams: EnhancedBridgeParams) => {
				if (!orchestrator) {
					throw new Error("Orchestrator not initialized");
				}

				// Create enhanced swap request
				const swapRequest: EnhancedFusionPlusSwapRequest = {
					fromToken: simulationParams.fromToken,
					toToken: simulationParams.toToken,
					fromAmount: simulationParams.fromAmount,
					toAmount: "0", // Will be calculated
					fromChain: simulationParams.fromNetwork,
					toChain: simulationParams.toNetwork,
					userAddress: simulationParams.walletAddress,
					useFusion: simulationParams.useFusion,
					slippageTolerance:
						simulationParams.slippageTolerance || 0.5,
					deadline: simulationParams.deadline || Date.now() + 300000,
				};

				// Get route comparison
				const comparison = await orchestrator.getRouteComparison(
					swapRequest
				);
				setRouteComparison(comparison);

				// Get optimal route
				const optimalRoute = await orchestrator.selectOptimalRoute(
					swapRequest
				);

				// Log route selection
				await orchestrator.logRouteSelection(
					swapRequest,
					optimalRoute,
					comparison.reason
				);

				// Get simulation based on optimal route
				let simulation: BridgeSimulation;

				if (optimalRoute === "fusion" && comparison.fusionRoute) {
					// Fusion simulation
					const fusionRoute = comparison.fusionRoute;
					simulation = {
						fromAmount: simulationParams.fromAmount,
						toAmount: fusionRoute?.estimatedOutput || "0",
						rate: (
							parseFloat(fusionRoute?.estimatedOutput || "0") /
							parseFloat(simulationParams.fromAmount)
						).toString(),
						fee: "0", // Fusion handles fees differently
						dexSource: "1inch Fusion+",
						estimatedTime: "1-2 minutes",
						priceImpact: (
							fusionRoute?.priceImpact || 0.02
						).toString(),
						minimumReceived: (
							parseFloat(fusionRoute?.estimatedOutput || "0") *
							0.995
						).toString(),
						fusionRoute: fusionRoute,
						stellhydraRoute: comparison.stellhydraRoute,
						optimalRoute: "fusion",
						gasEstimate: fusionRoute?.gasEstimate || "150000",
						deadline: fusionRoute?.deadline,
					};
				} else {
					// StellHydra simulation
					const response = await apiRequest(
						"POST",
						"/api/bridge/simulate",
						{
							fromToken: simulationParams.fromToken,
							toToken: simulationParams.toToken,
							fromAmount: simulationParams.fromAmount,
							fromNetwork: simulationParams.fromNetwork,
							toNetwork: simulationParams.toNetwork,
							walletAddress: simulationParams.walletAddress,
						}
					);

					const stellhydraSimulation = await response.json();

					simulation = {
						...stellhydraSimulation,
						fusionRoute: comparison.fusionRoute,
						stellhydraRoute: comparison.stellhydraRoute,
						optimalRoute: "stellhydra",
						gasEstimate: "200000", // Mock gas estimate
						deadline: Date.now() + 300000,
					};
				}

				return simulation;
			},
			onSuccess: (data) => {
				setSimulation(data);
			},
			onError: (error: any) => {
				console.error("Enhanced simulation failed:", error);
				setSimulation(null);
				setRouteComparison(null);
			},
		});

	// Execute enhanced bridge transaction
	const { mutate: executeEnhancedBridge, isPending: isExecuting } =
		useMutation({
			mutationFn: async (params: EnhancedBridgeParams) => {
				if (!simulation || !params.walletAddress || !orchestrator) {
					throw new Error(
						"Missing simulation, wallet address, or orchestrator"
					);
				}

				// Validate required parameters
				if (
					!params.fromToken ||
					!params.toToken ||
					!params.fromAmount ||
					!params.fromNetwork ||
					!params.toNetwork
				) {
					throw new Error("Missing required bridge parameters");
				}

				// Create swap request
				const swapRequest: EnhancedFusionPlusSwapRequest = {
					fromToken: params.fromToken,
					toToken: params.toToken,
					fromAmount: params.fromAmount,
					toAmount: simulation.toAmount,
					fromChain: params.fromNetwork,
					toChain: params.toNetwork,
					userAddress: params.walletAddress,
					useFusion: params.useFusion || false,
					slippageTolerance: params.slippageTolerance || 0.5,
					deadline: params.deadline || Date.now() + 300000,
				};

				// Execute cross-chain swap
				const result = await orchestrator.executeFusionCrossChainSwap(
					swapRequest
				);

				// Update transaction status
				await updateTransactionStatus(
					result.sourceTxHash,
					result.status,
					result.destinationTxHash
				);

				return result;
			},
			onSuccess: (data) => {
				console.log("Enhanced bridge execution successful:", data);
				toast({
					title: "Bridge Transaction Successful",
					description: `Transaction hash: ${data.sourceTxHash}`,
				});
			},
			onError: (error: any) => {
				console.error("Enhanced bridge execution failed:", error);
				toast({
					title: "Bridge Transaction Failed",
					description:
						error.message ||
						"An error occurred during bridge execution",
					variant: "destructive",
				});
			},
		});

	const updateTransactionStatus = async (
		txId: string,
		status: string,
		txHash?: string
	) => {
		try {
			// For Fusion+ transactions, the transaction might not exist in the database yet
			// This is expected behavior for mock transactions
			await apiRequest("PATCH", `/api/transactions/${txId}/status`, {
				status,
				txHash,
			});

			// Invalidate queries to refresh transaction history
			queryClient.invalidateQueries({
				queryKey: ["/api/transactions/wallet", params.walletAddress],
			});

			if (status === "completed") {
				toast({
					title: "Bridge Completed",
					description: "Your tokens have been successfully bridged!",
				});
			}
		} catch (error: any) {
			// Handle the case where transaction doesn't exist in database (expected for mock Fusion+)
			if (
				error.message?.includes("404") ||
				error.message?.includes("Transaction not found")
			) {
				console.log(
					"Transaction not found in database (expected for mock Fusion+ transactions)"
				);

				// Still show success toast for completed transactions
				if (status === "completed") {
					toast({
						title: "Bridge Completed",
						description:
							"Your tokens have been successfully bridged via Fusion+!",
					});
				}
			} else {
				console.error("Failed to update transaction status:", error);
			}
		}
	};

	// Auto-simulate when parameters change
	useEffect(() => {
		if (
			params.fromAmount &&
			parseFloat(params.fromAmount) > 0 &&
			params.fromToken &&
			params.toToken &&
			params.fromNetwork &&
			params.toNetwork &&
			orchestrator
		) {
			const timeoutId = setTimeout(() => {
				simulateEnhancedBridge(params);
			}, 500); // Debounce simulation calls

			return () => clearTimeout(timeoutId);
		} else {
			setSimulation(null);
			setRouteComparison(null);
		}
	}, [
		params.fromAmount,
		params.fromToken,
		params.toToken,
		params.fromNetwork,
		params.toNetwork,
		orchestrator,
	]);

	// Get Fusion health status
	const { data: fusionHealth } = useQuery({
		queryKey: ["fusion-health"],
		queryFn: async () => {
			if (!orchestrator) return false;
			return await orchestrator.getFusionPlusHealthStatus();
		},
		enabled: !!orchestrator,
		refetchInterval: 30000, // Check every 30 seconds
	});

	// Get supported tokens for current chain
	const { data: supportedTokens } = useQuery({
		queryKey: ["supported-tokens", params.fromNetwork],
		queryFn: async () => {
			if (!orchestrator) return [];
			const chainId = getChainId(params.fromNetwork);
			return await orchestrator.getSupportedTokens(chainId);
		},
		enabled: !!orchestrator && !!params.fromNetwork,
	});

	const getChainId = (chainName: string): number => {
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
	};

	return {
		simulation,
		routeComparison,
		isSimulating,
		executeEnhancedBridge: () => executeEnhancedBridge(params),
		isExecuting,
		fusionHealth,
		supportedTokens,
		optimalRoute: simulation?.optimalRoute || "stellhydra",
	};
}
