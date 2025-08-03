#!/usr/bin/env tsx

import { getRelayerConfig, validateRelayerConfig } from "./config";
import { createLogger } from "./utils/logger";

// Simplified relayer for testing
class SimpleRelayer {
	private config: any;
	private isRunning: boolean = false;
	private startTime: number = 0;
	public logger: any;

	constructor() {
		this.config = getRelayerConfig();
		this.logger = createLogger(this.config);
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			this.logger.warn("Relayer is already running");
			return;
		}

		try {
			this.logger.info("🚀 Starting StellHydra Relayer...");
			this.isRunning = true;

			// Validate configuration
			validateRelayerConfig(this.config);

			this.logger.info("✅ Relayer started successfully", {
				environment: this.config.environment,
				pollingInterval: this.config.pollingInterval,
				stellarRpcUrl: this.config.stellarRpcUrl,
				ethereumRpcUrl: this.config.ethereumRpcUrl,
			});

			// Start basic monitoring
			this.startBasicMonitoring();
		} catch (error) {
			this.isRunning = false;
			this.logger.error("❌ Failed to start relayer", error as Error);
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			this.logger.warn("Relayer is not running");
			return;
		}

		this.isRunning = false;
		this.logger.info("🛑 Stopping relayer...");
		this.logger.info("✅ Relayer stopped successfully");
	}

	private startBasicMonitoring(): void {
		this.logger.info("📡 Starting basic monitoring...");

		// Simulate monitoring activity
		setInterval(() => {
			if (this.isRunning) {
				this.logger.info("💓 Relayer heartbeat", {
					timestamp: new Date().toISOString(),
					status: "healthy",
				});
			}
		}, 30000); // Log every 30 seconds
	}

	async getHealthStatus(): Promise<{
		connected: boolean;
		environment: string;
		uptime: number;
		status: string;
	}> {
		return {
			connected: this.isRunning,
			environment: this.config.environment,
			uptime: this.isRunning
				? Date.now() - (this.startTime || Date.now())
				: 0,
			status: this.isRunning ? "healthy" : "stopped",
		};
	}
}

// Main function
async function main() {
	const command = process.argv[2];

	if (!command) {
		console.log("Usage: npm run relayer:<command>");
		console.log("Commands:");
		console.log("  start    - Start the relayer");
		console.log("  stop     - Stop the relayer");
		console.log("  health   - Check relayer health");
		console.log("  status   - Get relayer status");
		return;
	}

	const relayer = new SimpleRelayer();

	try {
		switch (command) {
			case "start":
				await relayer.start();
				// Keep the process running
				process.on("SIGINT", async () => {
					relayer.logger.info("Received SIGINT, shutting down...");
					await relayer.stop();
					process.exit(0);
				});
				break;

			case "stop":
				await relayer.stop();
				break;

			case "health":
				const health = await relayer.getHealthStatus();
				console.log(
					"Relayer Health Status:",
					JSON.stringify(health, null, 2)
				);
				break;

			case "status":
				const status = await relayer.getHealthStatus();
				console.log("Relayer Status:", JSON.stringify(status, null, 2));
				break;

			default:
				console.log(`Unknown command: ${command}`);
				break;
		}
	} catch (error) {
		console.error("Relayer error:", error as Error);
		process.exit(1);
	}
}

// Run main function
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
