import { FusionProcessor } from "../processors/fusion-processor";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";

// Example configuration
const config: RelayerConfig = {
	stellarRpcUrl: "https://horizon-testnet.stellar.org",
	ethereumRpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
	fusionApiKey: "your-1inch-fusion-api-key",
	bridgeContractAddress: "0x...",
	escrowContractAddress: "0x...",
	adminPrivateKey: "0x...",
	pollingInterval: 5000,
	maxRetries: 3,
	gasLimit: 300000,
	environment: "development",
	logLevel: "info",
};

// Example Fusion order data
const exampleLimitOrder = {
	allowedSender: "0x0000000000000000000000000000000000000000",
	interactions:
		"0x000c004e200000000000000000219ab540356cbb839cbe05303d7705faf486570009",
	maker: "0x00000000219ab540356cbb839cbe05303d7705fa",
	makerAsset: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
	makingAmount: "1000000000000000000", // 1 WETH
	offsets: "0",
	receiver: "0x0000000000000000000000000000000000000000",
	salt: "45118768841948961586167738353692277076075522015101619148498725069326976558864",
	takerAsset: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
	takingAmount: "1420000000", // 1420 USDC
};

export class FusionIntegrationExample {
	private fusionProcessor: FusionProcessor;

	constructor() {
		this.fusionProcessor = new FusionProcessor(config);
	}

	async runExample(): Promise<void> {
		try {
			logger.info("🚀 Starting Fusion Integration Example");

			// 1. Initialize WebSocket connection
			await this.initializeWebSocket();

			// 2. Process a Fusion order
			await this.processFusionOrder();

			// 3. Calculate auction data
			await this.calculateAuctionData();

			// 4. Monitor active orders
			await this.monitorActiveOrders();

			// 5. Test WebSocket ping
			await this.testWebSocketPing();

			logger.info("✅ Fusion Integration Example completed successfully");
		} catch (error) {
			logger.error("❌ Fusion Integration Example failed", error);
			throw error;
		}
	}

	private async initializeWebSocket(): Promise<void> {
		logger.info("📡 Initializing Fusion WebSocket connection...");

		// The WebSocket connection is automatically initialized in the FusionProcessor constructor
		// We just need to wait a moment for the connection to establish
		await new Promise((resolve) => setTimeout(resolve, 2000));

		logger.info("✅ WebSocket connection initialized");
	}

	private async processFusionOrder(): Promise<void> {
		logger.info("🔄 Processing Fusion order...");

		const orderHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

		// Create a mock Fusion order event
		const fusionEvent = {
			orderHash,
			maker: exampleLimitOrder.maker,
			taker: "0x0000000000000000000000000000000000000001",
			makingAmount: exampleLimitOrder.makingAmount,
			takingAmount: exampleLimitOrder.takingAmount,
			status: "pending" as const,
			timestamp: Date.now(),
			chainId: 1,
			fromToken: exampleLimitOrder.makerAsset,
			toToken: exampleLimitOrder.takerAsset,
		};

		// Process the order
		await this.fusionProcessor.handleOrderCreated(fusionEvent);

		logger.info("✅ Fusion order processed successfully");
	}

	private async calculateAuctionData(): Promise<void> {
		logger.info("📊 Calculating auction data...");

		const orderHash =
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
		const currentTimestamp = Math.floor(Date.now() / 1000);

		// Calculate auction rate
		const rate = await this.fusionProcessor.calculateAuctionRate(
			orderHash,
			currentTimestamp
		);

		if (rate) {
			logger.info("📈 Auction rate calculated", { rate });

			// Calculate auction taking amount
			const auctionTakingAmount =
				await this.fusionProcessor.calculateAuctionTakingAmount(
					orderHash,
					rate
				);

			if (auctionTakingAmount) {
				logger.info("💰 Auction taking amount calculated", {
					originalAmount: exampleLimitOrder.takingAmount,
					auctionAmount: auctionTakingAmount,
					rate,
				});
			}
		}

		logger.info("✅ Auction data calculated successfully");
	}

	private async monitorActiveOrders(): Promise<void> {
		logger.info("👀 Monitoring active orders...");

		try {
			const activeOrders = await this.fusionProcessor.getActiveOrders();

			logger.info("📋 Active orders retrieved", {
				count: activeOrders.length,
				orders: activeOrders.map((order) => ({
					orderHash: order.orderHash,
					maker: order.maker,
					status: order.status,
				})),
			});
		} catch (error) {
			logger.warn(
				"⚠️ Could not retrieve active orders (WebSocket may not be connected)",
				error
			);
		}
	}

	private async testWebSocketPing(): Promise<void> {
		logger.info("🏓 Testing WebSocket ping...");

		try {
			const pong = await this.fusionProcessor.ping();

			logger.info("✅ WebSocket ping successful", { pong });
		} catch (error) {
			logger.warn(
				"⚠️ WebSocket ping failed (WebSocket may not be connected)",
				error
			);
		}
	}

	async demonstrateAuctionCalculator(): Promise<void> {
		logger.info("🧮 Demonstrating Auction Calculator functionality...");

		try {
			// Create auction suffix
			const suffix = new (
				await import("@1inch/fusion-sdk")
			).AuctionSuffix({
				points: [
					{
						coefficient: 20000,
						delay: 12,
					},
				],
				whitelist: [
					{
						address: "0x00000000219ab540356cbb839cbe05303d7705fa",
						allowance: 0,
					},
				],
			});

			const encodedSuffix = suffix.build();
			logger.info("📝 Auction suffix created", { encodedSuffix });

			// Decode auction suffix
			const decodedSuffix = (
				await import("@1inch/fusion-sdk")
			).AuctionSuffix.decode(encodedSuffix);
			logger.info("🔍 Auction suffix decoded successfully");

			// Create auction salt
			const salt = (await import("@1inch/fusion-sdk")).AuctionSalt.decode(
				"45118768841948961586167738353692277076075522015101619148498725069326976558864"
			);
			logger.info("🧂 Auction salt decoded successfully");

			// Create auction calculator from auction data
			const calculator = (
				await import("@1inch/fusion-sdk")
			).AuctionCalculator.fromAuctionData(decodedSuffix, salt);
			logger.info("🧮 Auction calculator created from auction data");

			// Calculate rate bump
			const currentTime = Math.floor(Date.now() / 1000);
			const rateBump = calculator.calcRateBump(currentTime);
			logger.info("📈 Rate bump calculated", { currentTime, rateBump });

			// Calculate auction taking amount
			const auctionTakingAmount = calculator.calcAuctionTakingAmount(
				exampleLimitOrder.takingAmount,
				rateBump
			);
			logger.info("💰 Auction taking amount calculated", {
				originalAmount: exampleLimitOrder.takingAmount,
				auctionAmount: auctionTakingAmount,
				rateBump,
			});

			logger.info(
				"✅ Auction Calculator demonstration completed successfully"
			);
		} catch (error) {
			logger.error("❌ Auction Calculator demonstration failed", error);
		}
	}

	async demonstrateWebSocketEvents(): Promise<void> {
		logger.info("📡 Demonstrating WebSocket event handling...");

		// Set up event listeners
		this.fusionProcessor.on("orderCreated", (order) => {
			logger.info("🆕 Order created event received", {
				orderHash: order.orderHash,
				maker: order.maker,
				status: order.status,
			});
		});

		this.fusionProcessor.on("orderCompleted", (order) => {
			logger.info("✅ Order completed event received", {
				orderHash: order.orderHash,
				status: order.status,
			});
		});

		this.fusionProcessor.on("orderCancelled", (order) => {
			logger.info("❌ Order cancelled event received", {
				orderHash: order.orderHash,
				status: order.status,
			});
		});

		this.fusionProcessor.on("orderInvalid", (order) => {
			logger.info("⚠️ Order invalid event received", {
				orderHash: order.orderHash,
				error: order.error,
			});
		});

		logger.info("✅ WebSocket event handlers set up successfully");
	}

	async getStatistics(): Promise<void> {
		logger.info("📊 Getting Fusion processor statistics...");

		const stats = await this.fusionProcessor.getStats();

		logger.info("📈 Fusion processor statistics", {
			pending: stats.pending,
			total: stats.total,
			avgProcessingTime: `${stats.avgProcessingTime}ms`,
			successRate: `${stats.successRate}%`,
		});
	}

	async cleanup(): Promise<void> {
		logger.info("🧹 Cleaning up Fusion integration...");

		await this.fusionProcessor.cleanup();

		logger.info("✅ Fusion integration cleanup completed");
	}
}

// Example usage
async function main() {
	const example = new FusionIntegrationExample();

	try {
		await example.runExample();
		await example.demonstrateAuctionCalculator();
		await example.demonstrateWebSocketEvents();
		await example.getStatistics();
	} catch (error) {
		logger.error("❌ Example failed", error);
	} finally {
		await example.cleanup();
	}
}

// Run the example if this file is executed directly
if (require.main === module) {
	main().catch(console.error);
}

export { FusionIntegrationExample };
