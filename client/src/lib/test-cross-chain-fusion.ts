import { StellHydraFusionOrchestrator } from "./stellhydra-fusion-orchestrator";
import { EnhancedFusionPlusSwapRequest } from "./types";

// Test cross-chain Fusion+ functionality
export async function testCrossChainFusion() {
	console.log("🧪 Testing Cross-Chain Fusion+ Implementation...");

	const orchestrator = new StellHydraFusionOrchestrator();

	// Test cross-chain swap: XLM (Stellar) → ETH (Ethereum)
	const crossChainRequest: EnhancedFusionPlusSwapRequest = {
		fromToken: "XLM",
		toToken: "ETH",
		fromAmount: "1000",
		fromChain: "stellar",
		toChain: "ethereum",
		userAddress: "test_user_address",
		useFusion: true,
		slippageTolerance: 0.5,
		deadline: Date.now() + 300000, // 5 minutes
	};

	try {
		console.log("📋 Testing cross-chain quote generation...");
		const routes = await orchestrator.getFusionPlusQuote(crossChainRequest);

		if (routes.length > 0) {
			console.log("✅ Cross-chain Fusion+ quote generated successfully!");
			console.log("Route details:", routes[0]);

			// Test route comparison
			console.log("📊 Testing route comparison...");
			const comparison = await orchestrator.getRouteComparison(
				crossChainRequest
			);
			console.log("Route comparison:", comparison);

			// Test execution (simulation only)
			console.log("🚀 Testing cross-chain execution (simulation)...");
			const result = await orchestrator.executeFusionCrossChainSwap(
				crossChainRequest
			);
			console.log("✅ Cross-chain execution completed:", result);

			return {
				success: true,
				message: "Cross-chain Fusion+ implementation working correctly",
				result,
			};
		} else {
			console.log("❌ No routes generated for cross-chain swap");
			return {
				success: false,
				message: "No routes generated",
			};
		}
	} catch (error) {
		console.error("❌ Cross-chain Fusion+ test failed:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error",
			error,
		};
	}
}

// Test same-chain Fusion+ functionality
export async function testSameChainFusion() {
	console.log("🧪 Testing Same-Chain Fusion+ Implementation...");

	const orchestrator = new StellHydraFusionOrchestrator();

	// Test same-chain swap: ETH → USDC (both on Ethereum)
	const sameChainRequest: EnhancedFusionPlusSwapRequest = {
		fromToken: "ETH",
		toToken: "USDC",
		fromAmount: "0.1",
		fromChain: "ethereum",
		toChain: "ethereum",
		userAddress: "test_user_address",
		useFusion: true,
		slippageTolerance: 0.5,
		deadline: Date.now() + 300000, // 5 minutes
	};

	try {
		console.log("📋 Testing same-chain quote generation...");
		const routes = await orchestrator.getFusionPlusQuote(sameChainRequest);

		if (routes.length > 0) {
			console.log("✅ Same-chain Fusion+ quote generated successfully!");
			console.log("Route details:", routes[0]);
			return {
				success: true,
				message: "Same-chain Fusion+ implementation working correctly",
				routes,
			};
		} else {
			console.log("❌ No routes generated for same-chain swap");
			return {
				success: false,
				message: "No routes generated",
			};
		}
	} catch (error) {
		console.error("❌ Same-chain Fusion+ test failed:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error",
			error,
		};
	}
}

// Run all tests
export async function runAllFusionTests() {
	console.log("🚀 Starting Fusion+ Implementation Tests...\n");

	const results = {
		crossChain: await testCrossChainFusion(),
		sameChain: await testSameChainFusion(),
	};

	console.log("\n📊 Test Results Summary:");
	console.log(
		"Cross-Chain Fusion+:",
		results.crossChain.success ? "✅ PASS" : "❌ FAIL"
	);
	console.log(
		"Same-Chain Fusion+:",
		results.sameChain.success ? "✅ PASS" : "❌ FAIL"
	);

	return results;
}

// Export for use in browser console
if (typeof window !== "undefined") {
	(window as any).testCrossChainFusion = testCrossChainFusion;
	(window as any).testSameChainFusion = testSameChainFusion;
	(window as any).runAllFusionTests = runAllFusionTests;
}
