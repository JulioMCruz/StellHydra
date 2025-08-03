import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";
import {
	AuctionCalculator,
	WebSocketApi,
	NetworkEnum,
	AuctionSuffix,
	AuctionSalt,
} from "@1inch/fusion-sdk";

interface FusionOrderEvent {
	orderHash: string;
	maker: string;
	taker: string;
	makingAmount: string;
	takingAmount: string;
	status: "pending" | "completed" | "failed" | "cancelled";
	timestamp: number;
	chainId: number;
	fromToken: string;
	toToken: string;
}

interface LimitOrderV3Struct {
	allowedSender: string;
	interactions: string;
	maker: string;
	makerAsset: string;
	makingAmount: string;
	offsets: string;
	receiver: string;
	salt: string;
	takerAsset: string;
	takingAmount: string;
}

interface FusionTransaction {
	orderHash: string;
	maker: string;
	taker: string;
	makingAmount: string;
	takingAmount: string;
	fromToken: string;
	toToken: string;
	chainId: number;
	status: "pending" | "processing" | "completed" | "failed" | "cancelled";
	createdAt: number;
	updatedAt: number;
	error?: string;
	bridgeId?: string; // Link to bridge transaction if applicable
	auctionData?: {
		rate: number;
		auctionTakingAmount: string;
		deadline: number;
		auctionStartDate: number;
		auctionEndDate: number;
	};
}

export class FusionProcessor {
	private config: RelayerConfig;
	private pendingOrders: Map<string, FusionTransaction> = new Map();
	private processingTimes: number[] = [];
	private totalOrders = 0;
	private successfulOrders = 0;
	private wsApi?: WebSocketApi;

	constructor(config: RelayerConfig) {
		this.config = config;
		this.initializeWebSocket();
	}

	private initializeWebSocket(): void {
		try {
			if (this.config.fusionApiKey) {
				this.wsApi = new WebSocketApi({
					url: "wss://api.1inch.dev/fusion/ws",
					network: NetworkEnum.ETHEREUM,
					authKey: this.config.fusionApiKey,
					lazyInit: true,
				});

				this.setupWebSocketHandlers();
				this.wsApi.init();

				logger.info("Fusion WebSocket API initialized successfully");
			} else {
				logger.warn(
					"Fusion API key not provided, WebSocket monitoring disabled"
				);
			}
		} catch (error) {
			logger.error("Failed to initialize Fusion WebSocket API", error);
		}
	}

	private setupWebSocketHandlers(): void {
		if (!this.wsApi) return;

		// Order event handlers
		this.wsApi.order.onOrderCreated((data) => {
			logger.info("Fusion order created via WebSocket", {
				orderHash: data.data.orderHash,
				maker: data.data.order.maker,
				makingAmount: data.data.order.makingAmount,
				takingAmount: data.data.order.takingAmount,
			});

			this.handleWebSocketOrderCreated(data.data);
		});

		this.wsApi.order.onOrderFilled((data) => {
			logger.info("Fusion order filled via WebSocket", {
				orderHash: data.data.orderHash,
			});

			this.handleWebSocketOrderFilled(data.data);
		});

		this.wsApi.order.onOrderCancelled((data) => {
			logger.info("Fusion order cancelled via WebSocket", {
				orderHash: data.data.orderHash,
				remainingMakerAmount: data.data.remainingMakerAmount,
			});

			this.handleWebSocketOrderCancelled(data.data);
		});

		this.wsApi.order.onOrderInvalid((data) => {
			logger.warn("Fusion order invalid via WebSocket", {
				orderHash: data.data.orderHash,
			});

			this.handleWebSocketOrderInvalid(data.data);
		});

		// Connection event handlers
		this.wsApi.onOpen(() => {
			logger.info("Fusion WebSocket connection opened");
		});

		this.wsApi.onClose(() => {
			logger.warn("Fusion WebSocket connection closed");
		});

		this.wsApi.onError((error) => {
			logger.error("Fusion WebSocket error", error);
		});
	}

	private handleWebSocketOrderCreated(data: any): void {
		try {
			const fusionTx: FusionTransaction = {
				orderHash: data.orderHash,
				maker: data.order.maker,
				taker: "", // Will be filled when order is taken
				makingAmount: data.order.makingAmount,
				takingAmount: data.order.takingAmount,
				fromToken: data.order.makerAsset,
				toToken: data.order.takerAsset,
				chainId: 1, // Ethereum mainnet
				status: "pending",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			// Calculate auction data if available
			if (data.order.interactions) {
				const auctionData = this.calculateAuctionData(data.order);
				if (auctionData) {
					fusionTx.auctionData = auctionData;
				}
			}

			this.pendingOrders.set(data.orderHash, fusionTx);
			this.emit("orderCreated", fusionTx);
		} catch (error) {
			logger.error("Error handling WebSocket order created", error, {
				orderHash: data.orderHash,
			});
		}
	}

	private handleWebSocketOrderFilled(data: any): void {
		try {
			const fusionTx = this.pendingOrders.get(data.orderHash);
			if (fusionTx) {
				fusionTx.status = "completed";
				fusionTx.updatedAt = Date.now();
				this.pendingOrders.set(data.orderHash, fusionTx);

				// Update statistics
				this.totalOrders++;
				this.successfulOrders++;

				this.emit("orderCompleted", fusionTx);
			}
		} catch (error) {
			logger.error("Error handling WebSocket order filled", error, {
				orderHash: data.orderHash,
			});
		}
	}

	private handleWebSocketOrderCancelled(data: any): void {
		try {
			const fusionTx = this.pendingOrders.get(data.orderHash);
			if (fusionTx) {
				fusionTx.status = "cancelled";
				fusionTx.updatedAt = Date.now();
				this.pendingOrders.set(data.orderHash, fusionTx);

				this.emit("orderCancelled", fusionTx);
			}
		} catch (error) {
			logger.error("Error handling WebSocket order cancelled", error, {
				orderHash: data.orderHash,
			});
		}
	}

	private handleWebSocketOrderInvalid(data: any): void {
		try {
			const fusionTx = this.pendingOrders.get(data.orderHash);
			if (fusionTx) {
				fusionTx.status = "failed";
				fusionTx.error = "Order invalid";
				fusionTx.updatedAt = Date.now();
				this.pendingOrders.set(data.orderHash, fusionTx);

				this.emit("orderInvalid", fusionTx);
			}
		} catch (error) {
			logger.error("Error handling WebSocket order invalid", error, {
				orderHash: data.orderHash,
			});
		}
	}

	private calculateAuctionData(order: LimitOrderV3Struct): any {
		try {
			const calculator = AuctionCalculator.fromLimitOrderV3Struct(order);
			const currentTime = Math.floor(Date.now() / 1000);

			const rate = calculator.calcRateBump(currentTime);
			const auctionTakingAmount = calculator.calcAuctionTakingAmount(
				order.takingAmount,
				rate
			);

			return {
				rate,
				auctionTakingAmount,
				deadline: currentTime + 3600, // 1 hour from now
				auctionStartDate: currentTime,
				auctionEndDate: currentTime + 7200, // 2 hours from now
			};
		} catch (error) {
			logger.error("Error calculating auction data", error);
			return null;
		}
	}

	async handleOrderCreated(event: FusionOrderEvent): Promise<void> {
		try {
			logger.info("Processing Fusion order created event", {
				orderHash: event.orderHash,
			});

			const fusionTx: FusionTransaction = {
				orderHash: event.orderHash,
				maker: event.maker,
				taker: event.taker,
				makingAmount: event.makingAmount,
				takingAmount: event.takingAmount,
				fromToken: event.fromToken,
				toToken: event.toToken,
				chainId: event.chainId,
				status: "pending",
				createdAt: event.timestamp,
				updatedAt: Date.now(),
			};

			this.pendingOrders.set(event.orderHash, fusionTx);
			await this.processOrder(fusionTx);
		} catch (error) {
			logger.error("Error handling Fusion order created", error, {
				orderHash: event.orderHash,
			});
			throw error;
		}
	}

	async handleOrderCompleted(event: FusionOrderEvent): Promise<void> {
		try {
			logger.info("Processing Fusion order completed event", {
				orderHash: event.orderHash,
			});

			const fusionTx = this.pendingOrders.get(event.orderHash);
			if (fusionTx) {
				fusionTx.status = "completed";
				fusionTx.updatedAt = Date.now();
				this.pendingOrders.set(event.orderHash, fusionTx);

				// Update statistics
				this.totalOrders++;
				this.successfulOrders++;

				logger.info("Fusion order completed successfully", {
					orderHash: event.orderHash,
					maker: event.maker,
					makingAmount: event.makingAmount,
					takingAmount: event.takingAmount,
				});
			}
		} catch (error) {
			logger.error("Error handling Fusion order completed", error, {
				orderHash: event.orderHash,
			});
			throw error;
		}
	}

	async handleOrderFailed(event: FusionOrderEvent): Promise<void> {
		try {
			logger.info("Processing Fusion order failed event", {
				orderHash: event.orderHash,
			});

			const fusionTx = this.pendingOrders.get(event.orderHash);
			if (fusionTx) {
				fusionTx.status = "failed";
				fusionTx.error = "Fusion order failed";
				fusionTx.updatedAt = Date.now();
				this.pendingOrders.set(event.orderHash, fusionTx);

				// Update statistics
				this.totalOrders++;

				logger.error("Fusion order failed", {
					orderHash: event.orderHash,
					maker: event.maker,
					error: "Fusion order failed",
				});
			}
		} catch (error) {
			logger.error("Error handling Fusion order failed", error, {
				orderHash: event.orderHash,
			});
			throw error;
		}
	}

	private async processOrder(fusionTx: FusionTransaction): Promise<void> {
		const startTime = Date.now();

		try {
			logger.info("Starting Fusion order processing", {
				orderHash: fusionTx.orderHash,
				maker: fusionTx.maker,
				fromToken: fusionTx.fromToken,
				toToken: fusionTx.toToken,
			});

			// Update status to processing
			fusionTx.status = "processing";
			fusionTx.updatedAt = Date.now();
			this.pendingOrders.set(fusionTx.orderHash, fusionTx);

			// Validate the Fusion order
			await this.validateFusionOrder(fusionTx);

			// Check if this order is part of a bridge transaction
			const bridgeId = await this.checkBridgeIntegration(fusionTx);
			if (bridgeId) {
				fusionTx.bridgeId = bridgeId;
				logger.info("Fusion order linked to bridge transaction", {
					orderHash: fusionTx.orderHash,
					bridgeId,
				});
			}

			// Process the Fusion order
			await this.executeFusionOrder(fusionTx);

			// Update statistics
			const processingTime = Date.now() - startTime;
			this.processingTimes.push(processingTime);

			logger.info("Fusion order processing completed successfully", {
				orderHash: fusionTx.orderHash,
				processingTime: `${processingTime}ms`,
			});
		} catch (error) {
			// Update status to failed
			fusionTx.status = "failed";
			fusionTx.error = error.message;
			fusionTx.updatedAt = Date.now();
			this.pendingOrders.set(fusionTx.orderHash, fusionTx);

			// Update statistics
			this.totalOrders++;

			logger.error("Fusion order processing failed", error, {
				orderHash: fusionTx.orderHash,
			});
			throw error;
		}
	}

	private async validateFusionOrder(
		fusionTx: FusionTransaction
	): Promise<void> {
		try {
			// Validate order hash
			if (!fusionTx.orderHash || fusionTx.orderHash.length !== 66) {
				throw new Error("Invalid Fusion order hash format");
			}

			// Validate amounts
			if (
				parseFloat(fusionTx.makingAmount) <= 0 ||
				parseFloat(fusionTx.takingAmount) <= 0
			) {
				throw new Error("Invalid Fusion order amounts");
			}

			// Validate tokens
			if (!fusionTx.fromToken || !fusionTx.toToken) {
				throw new Error("Invalid Fusion order tokens");
			}

			// Validate chain ID
			if (fusionTx.chainId <= 0) {
				throw new Error("Invalid Fusion order chain ID");
			}

			logger.info("Fusion order validation passed", {
				orderHash: fusionTx.orderHash,
			});
		} catch (error) {
			logger.error("Fusion order validation failed", error, {
				orderHash: fusionTx.orderHash,
			});
			throw error;
		}
	}

	private async checkBridgeIntegration(
		fusionTx: FusionTransaction
	): Promise<string | null> {
		try {
			// Check if this Fusion order is part of a bridge transaction
			// This would involve checking if the maker or taker is involved in a bridge transaction
			// For now, we'll return null (no bridge integration)

			// In a real implementation, you would:
			// 1. Check if the maker/taker has pending bridge transactions
			// 2. Match the tokens and amounts
			// 3. Link the Fusion order to the bridge transaction

			return null;
		} catch (error) {
			logger.error("Error checking bridge integration", error, {
				orderHash: fusionTx.orderHash,
			});
			return null;
		}
	}

	private async executeFusionOrder(
		fusionTx: FusionTransaction
	): Promise<void> {
		try {
			// Execute the Fusion order
			// This would involve calling the 1inch Fusion API to execute the order

			logger.info("Executing Fusion order", {
				orderHash: fusionTx.orderHash,
				maker: fusionTx.maker,
				makingAmount: fusionTx.makingAmount,
				takingAmount: fusionTx.takingAmount,
			});

			// Simulate order execution
			await this.simulateFusionExecution(fusionTx);

			// Update status to completed
			fusionTx.status = "completed";
			fusionTx.updatedAt = Date.now();
			this.pendingOrders.set(fusionTx.orderHash, fusionTx);

			logger.info("Fusion order executed successfully", {
				orderHash: fusionTx.orderHash,
			});
		} catch (error) {
			logger.error("Error executing Fusion order", error, {
				orderHash: fusionTx.orderHash,
			});
			throw error;
		}
	}

	private async simulateFusionExecution(
		fusionTx: FusionTransaction
	): Promise<void> {
		// Simulate Fusion order execution
		// In a real implementation, this would call the 1inch Fusion API

		return new Promise((resolve, reject) => {
			setTimeout(() => {
				// Simulate 90% success rate
				if (Math.random() > 0.1) {
					resolve();
				} else {
					reject(new Error("Fusion order execution failed"));
				}
			}, 1000);
		});
	}

	// Auction calculation methods
	async calculateAuctionRate(
		orderHash: string,
		timestamp: number
	): Promise<number | null> {
		try {
			const order = this.pendingOrders.get(orderHash);
			if (!order) {
				throw new Error(`Order not found: ${orderHash}`);
			}

			// Create a mock limit order struct for auction calculation
			const limitOrderStruct: LimitOrderV3Struct = {
				allowedSender: "0x0000000000000000000000000000000000000000",
				interactions:
					"0x000c004e200000000000000000219ab540356cbb839cbe05303d7705faf486570009",
				maker: order.maker,
				makerAsset: order.fromToken,
				makingAmount: order.makingAmount,
				offsets: "0",
				receiver: "0x0000000000000000000000000000000000000000",
				salt: "45118768841948961586167738353692277076075522015101619148498725069326976558864",
				takerAsset: order.toToken,
				takingAmount: order.takingAmount,
			};

			const calculator =
				AuctionCalculator.fromLimitOrderV3Struct(limitOrderStruct);
			const rate = calculator.calcRateBump(timestamp);

			logger.info("Auction rate calculated", {
				orderHash,
				timestamp,
				rate,
			});

			return rate;
		} catch (error) {
			logger.error("Error calculating auction rate", error, {
				orderHash,
				timestamp,
			});
			return null;
		}
	}

	async calculateAuctionTakingAmount(
		orderHash: string,
		rate: number
	): Promise<string | null> {
		try {
			const order = this.pendingOrders.get(orderHash);
			if (!order) {
				throw new Error(`Order not found: ${orderHash}`);
			}

			const limitOrderStruct: LimitOrderV3Struct = {
				allowedSender: "0x0000000000000000000000000000000000000000",
				interactions:
					"0x000c004e200000000000000000219ab540356cbb839cbe05303d7705faf486570009",
				maker: order.maker,
				makerAsset: order.fromToken,
				makingAmount: order.makingAmount,
				offsets: "0",
				receiver: "0x0000000000000000000000000000000000000000",
				salt: "45118768841948961586167738353692277076075522015101619148498725069326976558864",
				takerAsset: order.toToken,
				takingAmount: order.takingAmount,
			};

			const calculator =
				AuctionCalculator.fromLimitOrderV3Struct(limitOrderStruct);
			const auctionTakingAmount = calculator.calcAuctionTakingAmount(
				order.takingAmount,
				rate
			);

			logger.info("Auction taking amount calculated", {
				orderHash,
				rate,
				auctionTakingAmount,
			});

			return auctionTakingAmount;
		} catch (error) {
			logger.error("Error calculating auction taking amount", error, {
				orderHash,
				rate,
			});
			return null;
		}
	}

	async processOrder(orderHash: string): Promise<void> {
		const fusionTx = this.pendingOrders.get(orderHash);

		if (!fusionTx) {
			throw new Error(`Fusion order not found: ${orderHash}`);
		}

		await this.processOrder(fusionTx);
	}

	async getStats(): Promise<{
		pending: number;
		total: number;
		avgProcessingTime: number;
		successRate: number;
	}> {
		const pending = this.pendingOrders.size;
		const avgProcessingTime =
			this.processingTimes.length > 0
				? this.processingTimes.reduce((a, b) => a + b, 0) /
				  this.processingTimes.length
				: 0;
		const successRate =
			this.totalOrders > 0
				? (this.successfulOrders / this.totalOrders) * 100
				: 0;

		return {
			pending,
			total: this.totalOrders,
			avgProcessingTime,
			successRate,
		};
	}

	async getFusionOrder(orderHash: string): Promise<FusionTransaction | null> {
		return this.pendingOrders.get(orderHash) || null;
	}

	async getAllFusionOrders(): Promise<FusionTransaction[]> {
		return Array.from(this.pendingOrders.values());
	}

	// Utility methods for Fusion API integration
	async getOrderStatus(orderHash: string): Promise<string | null> {
		const order = this.pendingOrders.get(orderHash);
		return order?.status || null;
	}

	async getOrderDetails(
		orderHash: string
	): Promise<FusionTransaction | null> {
		return this.pendingOrders.get(orderHash) || null;
	}

	// Methods for bridge integration
	async linkToBridge(orderHash: string, bridgeId: string): Promise<void> {
		const order = this.pendingOrders.get(orderHash);
		if (order) {
			order.bridgeId = bridgeId;
			order.updatedAt = Date.now();
			this.pendingOrders.set(orderHash, order);

			logger.info("Fusion order linked to bridge", {
				orderHash,
				bridgeId,
			});
		}
	}

	async getOrdersByBridgeId(bridgeId: string): Promise<FusionTransaction[]> {
		return Array.from(this.pendingOrders.values()).filter(
			(order) => order.bridgeId === bridgeId
		);
	}

	// WebSocket API methods
	async getActiveOrders(): Promise<any[]> {
		if (!this.wsApi) {
			throw new Error("WebSocket API not initialized");
		}

		return new Promise((resolve, reject) => {
			this.wsApi!.rpc.getActiveOrders();

			const timeout = setTimeout(() => {
				reject(new Error("Timeout getting active orders"));
			}, 10000);

			this.wsApi!.rpc.onGetActiveOrders((data) => {
				clearTimeout(timeout);
				resolve(data.data || []);
			});
		});
	}

	async ping(): Promise<string> {
		if (!this.wsApi) {
			throw new Error("WebSocket API not initialized");
		}

		return new Promise((resolve, reject) => {
			this.wsApi!.rpc.ping();

			const timeout = setTimeout(() => {
				reject(new Error("Timeout pinging WebSocket"));
			}, 5000);

			this.wsApi!.rpc.onPong((data) => {
				clearTimeout(timeout);
				resolve(data);
			});
		});
	}

	// Cleanup method
	async cleanup(): Promise<void> {
		if (this.wsApi) {
			this.wsApi.close();
			logger.info("Fusion WebSocket API closed");
		}
	}
}
