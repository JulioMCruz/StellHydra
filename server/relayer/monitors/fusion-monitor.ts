import { EventEmitter } from "events";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";

interface FusionNetworkConfig {
	apiKey?: string;
	apiUrl: string;
	enabled: boolean;
}

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

export class FusionMonitor extends EventEmitter {
	private config: RelayerConfig;
	private networkConfig: FusionNetworkConfig;
	private isRunning: boolean = false;
	private pollingInterval: NodeJS.Timeout | null = null;
	private lastProcessedTimestamp: number = 0;

	constructor(networkConfig: FusionNetworkConfig, config: RelayerConfig) {
		super();
		this.networkConfig = networkConfig;
		this.config = config;
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Fusion monitor is already running");
			return;
		}

		if (!this.networkConfig.enabled) {
			logger.info("Fusion monitor disabled - skipping start");
			return;
		}

		try {
			logger.info("📡 Starting Fusion monitor...");
			this.isRunning = true;

			// Get initial timestamp
			this.lastProcessedTimestamp = Date.now() - 5 * 60 * 1000; // Start from 5 minutes ago

			// Start polling
			this.startPolling();

			logger.info("✅ Fusion monitor started successfully", {
				apiUrl: this.networkConfig.apiUrl,
				enabled: this.networkConfig.enabled,
			});
		} catch (error) {
			this.isRunning = false;
			logger.error("❌ Failed to start Fusion monitor", error);
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			logger.warn("Fusion monitor is not running");
			return;
		}

		this.isRunning = false;
		logger.info("🛑 Stopping Fusion monitor...");

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}

		logger.info("✅ Fusion monitor stopped successfully");
	}

	private startPolling(): void {
		this.pollingInterval = setInterval(async () => {
			if (!this.isRunning) return;

			try {
				await this.pollEvents();
			} catch (error) {
				logger.error("Error polling Fusion events", error);
			}
		}, this.config.pollingInterval);
	}

	private async pollEvents(): Promise<void> {
		try {
			const currentTime = Date.now();

			// Poll for new orders and status updates
			await this.pollNewOrders();
			await this.pollOrderStatusUpdates();

			this.lastProcessedTimestamp = currentTime;
		} catch (error) {
			logger.error("Error polling Fusion events", error);
		}
	}

	private async pollNewOrders(): Promise<void> {
		try {
			// Query Fusion API for new orders
			const orders = await this.queryNewOrders();

			for (const order of orders) {
				await this.processNewOrder(order);
			}
		} catch (error) {
			logger.error("Error polling new Fusion orders", error);
		}
	}

	private async pollOrderStatusUpdates(): Promise<void> {
		try {
			// Query Fusion API for order status updates
			const updates = await this.queryOrderStatusUpdates();

			for (const update of updates) {
				await this.processOrderStatusUpdate(update);
			}
		} catch (error) {
			logger.error("Error polling Fusion order status updates", error);
		}
	}

	private async queryNewOrders(): Promise<FusionOrderEvent[]> {
		try {
			// This would be a real API call to 1inch Fusion
			// For now, we'll simulate the response
			const response = await this.callFusionAPI("/orders/new", {
				since: this.lastProcessedTimestamp,
				limit: 100,
			});

			return response.orders || [];
		} catch (error) {
			logger.error("Error querying new Fusion orders", error);
			return [];
		}
	}

	private async queryOrderStatusUpdates(): Promise<FusionOrderEvent[]> {
		try {
			// This would be a real API call to 1inch Fusion
			// For now, we'll simulate the response
			const response = await this.callFusionAPI("/orders/updates", {
				since: this.lastProcessedTimestamp,
				limit: 100,
			});

			return response.updates || [];
		} catch (error) {
			logger.error("Error querying Fusion order status updates", error);
			return [];
		}
	}

	private async callFusionAPI(endpoint: string, params: any): Promise<any> {
		try {
			const url = new URL(endpoint, this.networkConfig.apiUrl);

			// Add query parameters
			Object.keys(params).forEach((key) => {
				url.searchParams.append(key, params[key].toString());
			});

			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};

			if (this.networkConfig.apiKey) {
				headers[
					"Authorization"
				] = `Bearer ${this.networkConfig.apiKey}`;
			}

			const response = await fetch(url.toString(), {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				throw new Error(
					`Fusion API error: ${response.status} ${response.statusText}`
				);
			}

			return await response.json();
		} catch (error) {
			logger.error("Error calling Fusion API", error);
			throw error;
		}
	}

	private async processNewOrder(order: FusionOrderEvent): Promise<void> {
		try {
			logger.fusionEvent("created", order.orderHash, {
				maker: order.maker,
				makingAmount: order.makingAmount,
				takingAmount: order.takingAmount,
				status: order.status,
			});

			this.emit("orderCreated", order);
		} catch (error) {
			logger.error("Error processing new Fusion order", error, {
				orderHash: order.orderHash,
			});
		}
	}

	private async processOrderStatusUpdate(
		update: FusionOrderEvent
	): Promise<void> {
		try {
			if (update.status === "completed") {
				logger.fusionEvent("completed", update.orderHash, {
					maker: update.maker,
					makingAmount: update.makingAmount,
					takingAmount: update.takingAmount,
				});

				this.emit("orderCompleted", update);
			} else if (update.status === "failed") {
				logger.fusionEvent("failed", update.orderHash, {
					maker: update.maker,
					status: update.status,
				});

				this.emit("orderFailed", update);
			} else if (update.status === "cancelled") {
				logger.fusionEvent("cancelled", update.orderHash, {
					maker: update.maker,
					status: update.status,
				});

				this.emit("orderCancelled", update);
			}
		} catch (error) {
			logger.error("Error processing Fusion order status update", error, {
				orderHash: update.orderHash,
			});
		}
	}

	async getHealthStatus(): Promise<{
		connected: boolean;
		enabled: boolean;
		lastProcessedTimestamp: number;
		uptime: number;
	}> {
		try {
			// Test Fusion API connection
			const isConnected = await this.testConnection();

			return {
				connected: this.isRunning && isConnected,
				enabled: this.networkConfig.enabled,
				lastProcessedTimestamp: this.lastProcessedTimestamp,
				uptime: this.isRunning
					? Date.now() - (this.startTime || Date.now())
					: 0,
			};
		} catch (error) {
			logger.error("Error getting Fusion health status", error);

			return {
				connected: false,
				enabled: this.networkConfig.enabled,
				lastProcessedTimestamp: this.lastProcessedTimestamp,
				uptime: 0,
			};
		}
	}

	private async testConnection(): Promise<boolean> {
		try {
			// Test Fusion API connection with a simple health check
			await this.callFusionAPI("/health", {});
			return true;
		} catch (error) {
			logger.error("Fusion API connection test failed", error);
			return false;
		}
	}

	// Manual event processing methods
	async processOrder(orderHash: string): Promise<void> {
		try {
			// Manually process a specific Fusion order
			logger.info("Manually processing Fusion order", { orderHash });

			// Query the specific order from Fusion API
			const order = await this.queryOrder(orderHash);

			if (order) {
				await this.processNewOrder(order);
			}
		} catch (error) {
			logger.error("Error manually processing Fusion order", error, {
				orderHash,
			});
			throw error;
		}
	}

	private async queryOrder(
		orderHash: string
	): Promise<FusionOrderEvent | null> {
		try {
			const response = await this.callFusionAPI(
				`/orders/${orderHash}`,
				{}
			);
			return response.order || null;
		} catch (error) {
			logger.error("Error querying Fusion order", error, { orderHash });
			return null;
		}
	}

	// Utility methods for external use
	async getOrderStatus(orderHash: string): Promise<string | null> {
		try {
			const order = await this.queryOrder(orderHash);
			return order?.status || null;
		} catch (error) {
			logger.error("Error getting Fusion order status", error, {
				orderHash,
			});
			return null;
		}
	}

	async getOrderDetails(orderHash: string): Promise<FusionOrderEvent | null> {
		try {
			return await this.queryOrder(orderHash);
		} catch (error) {
			logger.error("Error getting Fusion order details", error, {
				orderHash,
			});
			return null;
		}
	}
}
