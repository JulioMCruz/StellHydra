import { EventEmitter } from "events";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";

interface HealthStatus {
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
	errors: {
		count: number;
		lastError?: string;
		lastErrorTime?: number;
	};
}

export class HealthMonitor extends EventEmitter {
	private config: RelayerConfig;
	private isRunning: boolean = false;
	private startTime: number = 0;
	private healthCheckInterval: NodeJS.Timeout | null = null;
	private errorCount: number = 0;
	private lastError?: string;
	private lastErrorTime?: number;

	constructor(config: RelayerConfig) {
		super();
		this.config = config;
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Health monitor is already running");
			return;
		}

		try {
			logger.info("📊 Starting health monitor...");
			this.isRunning = true;
			this.startTime = Date.now();

			// Start health check interval
			this.startHealthChecks();

			logger.info("✅ Health monitor started successfully");
		} catch (error) {
			this.isRunning = false;
			logger.error("❌ Failed to start health monitor", error);
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			logger.warn("Health monitor is not running");
			return;
		}

		this.isRunning = false;
		logger.info("🛑 Stopping health monitor...");

		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}

		logger.info("✅ Health monitor stopped successfully");
	}

	private startHealthChecks(): void {
		// Run health checks every 30 seconds
		this.healthCheckInterval = setInterval(async () => {
			if (!this.isRunning) return;

			try {
				await this.performHealthCheck();
			} catch (error) {
				logger.error("Error performing health check", error);
				this.recordError(error);
			}
		}, 30000);
	}

	private async performHealthCheck(): Promise<void> {
		try {
			const healthStatus = await this.getHealthStatus();

			// Log health status
			logger.healthCheck(healthStatus);

			// Emit health status event
			this.emit("healthStatus", healthStatus);

			// Check for critical issues
			await this.checkCriticalIssues(healthStatus);
		} catch (error) {
			logger.error("Error performing health check", error);
			this.recordError(error);
		}
	}

	private async checkCriticalIssues(
		healthStatus: HealthStatus
	): Promise<void> {
		// Check if any critical services are down
		if (!healthStatus.stellarConnected || !healthStatus.ethereumConnected) {
			logger.error("Critical service down detected", {
				stellarConnected: healthStatus.stellarConnected,
				ethereumConnected: healthStatus.ethereumConnected,
			});

			this.emit("criticalIssue", {
				type: "service_down",
				services: {
					stellar: healthStatus.stellarConnected,
					ethereum: healthStatus.ethereumConnected,
				},
			});
		}

		// Check for high error rates
		if (healthStatus.errors.count > 10) {
			logger.error("High error rate detected", {
				errorCount: healthStatus.errors.count,
				lastError: healthStatus.errors.lastError,
			});

			this.emit("criticalIssue", {
				type: "high_error_rate",
				errorCount: healthStatus.errors.count,
				lastError: healthStatus.errors.lastError,
			});
		}

		// Check for low success rates
		if (healthStatus.performance.successRate < 90) {
			logger.warn("Low success rate detected", {
				successRate: healthStatus.performance.successRate,
			});

			this.emit("warning", {
				type: "low_success_rate",
				successRate: healthStatus.performance.successRate,
			});
		}

		// Check for high processing times
		if (healthStatus.performance.avgProcessingTime > 30000) {
			// 30 seconds
			logger.warn("High processing time detected", {
				avgProcessingTime: healthStatus.performance.avgProcessingTime,
			});

			this.emit("warning", {
				type: "high_processing_time",
				avgProcessingTime: healthStatus.performance.avgProcessingTime,
			});
		}
	}

	recordError(error: Error): void {
		this.errorCount++;
		this.lastError = error.message;
		this.lastErrorTime = Date.now();

		logger.error("Health monitor recorded error", error);
	}

	async getHealthStatus(): Promise<HealthStatus> {
		// This would typically gather health status from all monitors and processors
		// For now, we'll return a basic status
		return {
			isRunning: this.isRunning,
			stellarConnected: true, // This would be checked against actual monitors
			ethereumConnected: true, // This would be checked against actual monitors
			fusionConnected: true, // This would be checked against actual monitors
			uptime: this.startTime ? Date.now() - this.startTime : 0,
			lastProcessedBlock: {
				stellar: 0, // This would come from Stellar monitor
				ethereum: 0, // This would come from Ethereum monitor
			},
			pendingTransactions: {
				bridges: 0, // This would come from Bridge processor
				escrows: 0, // This would come from Escrow processor
				fusion: 0, // This would come from Fusion processor
			},
			performance: {
				avgProcessingTime: 0, // This would be calculated from all processors
				totalTransactions: 0, // This would be calculated from all processors
				successRate: 100, // This would be calculated from all processors
			},
			errors: {
				count: this.errorCount,
				lastError: this.lastError,
				lastErrorTime: this.lastErrorTime,
			},
		};
	}

	// Public methods for external health checks
	async isHealthy(): Promise<boolean> {
		try {
			const healthStatus = await this.getHealthStatus();

			return (
				healthStatus.isRunning &&
				healthStatus.stellarConnected &&
				healthStatus.ethereumConnected &&
				healthStatus.performance.successRate > 90
			);
		} catch (error) {
			logger.error("Error checking health status", error);
			return false;
		}
	}

	async getDetailedHealthStatus(): Promise<HealthStatus> {
		return await this.getHealthStatus();
	}

	// Reset error counters
	resetErrorCount(): void {
		this.errorCount = 0;
		this.lastError = undefined;
		this.lastErrorTime = undefined;

		logger.info("Health monitor error counters reset");
	}

	// Get uptime
	getUptime(): number {
		return this.startTime ? Date.now() - this.startTime : 0;
	}

	// Get error statistics
	getErrorStats(): {
		count: number;
		lastError?: string;
		lastErrorTime?: number;
	} {
		return {
			count: this.errorCount,
			lastError: this.lastError,
			lastErrorTime: this.lastErrorTime,
		};
	}
}
