import { ethers } from "ethers";
import { Stellar } from "@stellar/stellar-sdk";
import { RelayerConfig, getNetworkConfig } from "./config";
import { createLogger, logger } from "./utils/logger";
import { StellarMonitor } from "./monitors/stellar-monitor";
import { EthereumMonitor } from "./monitors/ethereum-monitor";
import { FusionMonitor } from "./monitors/fusion-monitor";
import { BridgeProcessor } from "./processors/bridge-processor";
import { EscrowProcessor } from "./processors/escrow-processor";
import { FusionProcessor } from "./processors/fusion-processor";
import { HealthMonitor } from "./monitors/health-monitor";

export class StellHydraRelayer {
	private config: RelayerConfig;
	private stellarMonitor: StellarMonitor;
	private ethereumMonitor: EthereumMonitor;
	private fusionMonitor: FusionMonitor;
	private bridgeProcessor: BridgeProcessor;
	private escrowProcessor: EscrowProcessor;
	private fusionProcessor: FusionProcessor;
	private healthMonitor: HealthMonitor;
	private isRunning: boolean = false;
	private startTime: number = 0;

	constructor(config: RelayerConfig) {
		this.config = config;

		// Initialize logger
		createLogger(config);

		// Initialize monitors
		const networkConfig = getNetworkConfig(config);
		this.stellarMonitor = new StellarMonitor(networkConfig.stellar, config);
		this.ethereumMonitor = new EthereumMonitor(
			networkConfig.ethereum,
			config
		);
		this.fusionMonitor = new FusionMonitor(networkConfig.fusion, config);

		// Initialize processors
		this.bridgeProcessor = new BridgeProcessor(config);
		this.escrowProcessor = new EscrowProcessor(config);
		this.fusionProcessor = new FusionProcessor(config);

		// Initialize health monitor
		this.healthMonitor = new HealthMonitor(config);

		logger.info("StellHydra Relayer initialized", {
			environment: config.environment,
			stellarRpc: networkConfig.stellar.rpcUrl,
			ethereumRpc: networkConfig.ethereum.rpcUrl,
			fusionEnabled: networkConfig.fusion.enabled,
		});
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Relayer is already running");
			return;
		}

		this.startTime = Date.now();
		this.isRunning = true;

		try {
			logger.info("🚀 Starting StellHydra Relayer...");

			// Start all monitors
			await Promise.all([
				this.stellarMonitor.start(),
				this.ethereumMonitor.start(),
				this.fusionMonitor.start(),
				this.healthMonitor.start(),
			]);

			// Set up event handlers
			this.setupEventHandlers();

			logger.info("✅ StellHydra Relayer started successfully");
		} catch (error) {
			this.isRunning = false;
			logger.error("❌ Failed to start relayer", error);
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			logger.warn("Relayer is not running");
			return;
		}

		this.isRunning = false;
		logger.info("🛑 Stopping StellHydra Relayer...");

		try {
			// Stop all monitors
			await Promise.all([
				this.stellarMonitor.stop(),
				this.ethereumMonitor.stop(),
				this.fusionMonitor.stop(),
				this.healthMonitor.stop(),
			]);

			logger.info("✅ StellHydra Relayer stopped successfully");
		} catch (error) {
			logger.error("❌ Error stopping relayer", error);
			throw error;
		}
	}

	private setupEventHandlers(): void {
		// Bridge event handlers
		this.stellarMonitor.on("bridgeInitiated", async (event) => {
			try {
				await this.bridgeProcessor.handleStellarBridgeInitiated(event);
			} catch (error) {
				logger.error("Error handling Stellar bridge initiated", error, {
					bridgeId: event.bridgeId,
				});
			}
		});

		this.ethereumMonitor.on("bridgeInitiated", async (event) => {
			try {
				await this.bridgeProcessor.handleEthereumBridgeInitiated(event);
			} catch (error) {
				logger.error(
					"Error handling Ethereum bridge initiated",
					error,
					{ bridgeId: event.bridgeId }
				);
			}
		});

		// Escrow event handlers
		this.stellarMonitor.on("escrowCreated", async (event) => {
			try {
				await this.escrowProcessor.handleStellarEscrowCreated(event);
			} catch (error) {
				logger.error("Error handling Stellar escrow created", error, {
					escrowId: event.escrowId,
				});
			}
		});

		this.ethereumMonitor.on("escrowCreated", async (event) => {
			try {
				await this.escrowProcessor.handleEthereumEscrowCreated(event);
			} catch (error) {
				logger.error("Error handling Ethereum escrow created", error, {
					escrowId: event.escrowId,
				});
			}
		});

		this.stellarMonitor.on("escrowLocked", async (event) => {
			try {
				await this.escrowProcessor.handleStellarEscrowLocked(event);
			} catch (error) {
				logger.error("Error handling Stellar escrow locked", error, {
					escrowId: event.escrowId,
				});
			}
		});

		this.ethereumMonitor.on("escrowLocked", async (event) => {
			try {
				await this.escrowProcessor.handleEthereumEscrowLocked(event);
			} catch (error) {
				logger.error("Error handling Ethereum escrow locked", error, {
					escrowId: event.escrowId,
				});
			}
		});

		this.stellarMonitor.on("escrowCompleted", async (event) => {
			try {
				await this.escrowProcessor.handleStellarEscrowCompleted(event);
			} catch (error) {
				logger.error("Error handling Stellar escrow completed", error, {
					escrowId: event.escrowId,
				});
			}
		});

		this.ethereumMonitor.on("escrowCompleted", async (event) => {
			try {
				await this.escrowProcessor.handleEthereumEscrowCompleted(event);
			} catch (error) {
				logger.error(
					"Error handling Ethereum escrow completed",
					error,
					{ escrowId: event.escrowId }
				);
			}
		});

		// Fusion event handlers
		this.fusionMonitor.on("orderCreated", async (event) => {
			try {
				await this.fusionProcessor.handleOrderCreated(event);
			} catch (error) {
				logger.error("Error handling Fusion order created", error, {
					orderHash: event.orderHash,
				});
			}
		});

		this.fusionMonitor.on("orderCompleted", async (event) => {
			try {
				await this.fusionProcessor.handleOrderCompleted(event);
			} catch (error) {
				logger.error("Error handling Fusion order completed", error, {
					orderHash: event.orderHash,
				});
			}
		});

		this.fusionMonitor.on("orderFailed", async (event) => {
			try {
				await this.fusionProcessor.handleOrderFailed(event);
			} catch (error) {
				logger.error("Error handling Fusion order failed", error, {
					orderHash: event.orderHash,
				});
			}
		});

		logger.info("Event handlers configured successfully");
	}

	async getHealthStatus(): Promise<{
		isRunning: boolean;
		stellarConnected: boolean;
		ethereumConnected: boolean;
		fusionConnected: boolean;
		uptime: number;
		lastProcessedBlock: {
			stellar: number;
			ethereum: number;
		};
		pendingTransactions: {
			bridges: number;
			escrows: number;
			fusion: number;
		};
		performance: {
			avgProcessingTime: number;
			totalTransactions: number;
			successRate: number;
		};
	}> {
		const stellarHealth = await this.stellarMonitor.getHealthStatus();
		const ethereumHealth = await this.ethereumMonitor.getHealthStatus();
		const fusionHealth = await this.fusionMonitor.getHealthStatus();
		const bridgeStats = await this.bridgeProcessor.getStats();
		const escrowStats = await this.escrowProcessor.getStats();
		const fusionStats = await this.fusionProcessor.getStats();

		return {
			isRunning: this.isRunning,
			stellarConnected: stellarHealth.connected,
			ethereumConnected: ethereumHealth.connected,
			fusionConnected: fusionHealth.connected,
			uptime: this.startTime ? Date.now() - this.startTime : 0,
			lastProcessedBlock: {
				stellar: stellarHealth.lastProcessedBlock,
				ethereum: ethereumHealth.lastProcessedBlock,
			},
			pendingTransactions: {
				bridges: bridgeStats.pending,
				escrows: escrowStats.pending,
				fusion: fusionStats.pending,
			},
			performance: {
				avgProcessingTime: bridgeStats.avgProcessingTime,
				totalTransactions:
					bridgeStats.total + escrowStats.total + fusionStats.total,
				successRate: bridgeStats.successRate,
			},
		};
	}

	// Public methods for manual operations
	async processBridge(bridgeId: string): Promise<void> {
		try {
			await this.bridgeProcessor.processBridge(bridgeId);
		} catch (error) {
			logger.error("Error processing bridge manually", error, {
				bridgeId,
			});
			throw error;
		}
	}

	async processEscrow(escrowId: string): Promise<void> {
		try {
			await this.escrowProcessor.processEscrow(escrowId);
		} catch (error) {
			logger.error("Error processing escrow manually", error, {
				escrowId,
			});
			throw error;
		}
	}

	async processFusionOrder(orderHash: string): Promise<void> {
		try {
			await this.fusionProcessor.processOrder(orderHash);
		} catch (error) {
			logger.error("Error processing Fusion order manually", error, {
				orderHash,
			});
			throw error;
		}
	}

	// Emergency methods
	async emergencyStop(): Promise<void> {
		logger.warn("🚨 Emergency stop initiated");
		await this.stop();
	}

	async restart(): Promise<void> {
		logger.info("🔄 Restarting relayer...");
		await this.stop();
		await this.start();
	}
}
