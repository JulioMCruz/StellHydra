// Test file for Fusion integration fixes
import { EnhancedFusionPlusAPI } from "./fusion-api";
import { StellHydraFusionOrchestrator } from "./stellhydra-fusion-orchestrator";

export async function testFusionIntegration() {
	console.log("🧪 Testing Fusion Integration...");

	try {
		// Test 1: Initialize Fusion API
		console.log("1. Testing Fusion API initialization...");
		const fusionApi = new EnhancedFusionPlusAPI({
			apiKey: process.env.VITE_FUSION_API_KEY || "test-key",
			chainId: 1,
		});

		// Test 2: Health check
		console.log("2. Testing Fusion health check...");
		const healthStatus = await fusionApi.getHealthStatus();
		console.log("Health status:", healthStatus);

		// Test 3: Initialize orchestrator
		console.log("3. Testing orchestrator initialization...");
		const orchestrator = new StellHydraFusionOrchestrator(
			process.env.VITE_FUSION_API_KEY || "test-key",
			1
		);

		// Test 4: Test chain validation
		console.log("4. Testing chain validation...");
		const testRequest = {
			fromToken: "0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C",
			toToken: "0xB0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C",
			fromAmount: "1000000000000000000", // 1 ETH
			fromChain: "ethereum",
			toChain: "polygon", // Different chain
			userAddress: "0x1234567890123456789012345678901234567890",
			useFusion: true,
			slippageTolerance: 0.5,
		};

		try {
			const routes = await orchestrator.getFusionPlusQuote(testRequest);
			console.log(
				"✅ Cross-chain quote successful:",
				routes.length,
				"routes found"
			);
		} catch (error) {
			console.log(
				"⚠️ Cross-chain quote failed (expected if no API key):",
				error.message
			);
		}

		// Test 5: Test same chain validation
		console.log("5. Testing same chain validation...");
		const sameChainRequest = {
			...testRequest,
			fromChain: "ethereum",
			toChain: "ethereum", // Same chain
		};

		try {
			await orchestrator.getFusionPlusQuote(sameChainRequest);
			console.log(
				"❌ Same chain validation failed - should have thrown error"
			);
		} catch (error) {
			console.log("✅ Same chain validation working:", error.message);
		}

		console.log("✅ Fusion integration tests completed");
	} catch (error) {
		console.error("❌ Fusion integration test failed:", error);
	}
}

// Test specific error scenarios
export async function testErrorScenarios() {
	console.log("🧪 Testing Error Scenarios...");

	try {
		const orchestrator = new StellHydraFusionOrchestrator("invalid-key", 1);

		// Test invalid API key
		console.log("1. Testing invalid API key...");
		const healthStatus = await orchestrator.getFusionPlusHealthStatus();
		console.log("Health status with invalid key:", healthStatus);

		// Test unsupported chain
		console.log("2. Testing unsupported chain...");
		const unsupportedRequest = {
			fromToken: "0xA0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C",
			toToken: "0xB0b86a33E6441b8c4C8C0C8C0C8C0C8C0C8C0C8C",
			fromAmount: "1000000000000000000",
			fromChain: "stellar", // Unsupported by Fusion
			toChain: "ethereum",
			userAddress: "0x1234567890123456789012345678901234567890",
			useFusion: true,
		};

		try {
			await orchestrator.getFusionPlusQuote(unsupportedRequest);
			console.log("❌ Unsupported chain validation failed");
		} catch (error) {
			console.log(
				"✅ Unsupported chain validation working:",
				error.message
			);
		}

		console.log("✅ Error scenario tests completed");
	} catch (error) {
		console.error("❌ Error scenario tests failed:", error);
	}
}
