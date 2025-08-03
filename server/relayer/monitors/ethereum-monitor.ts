import { ethers } from "ethers";
import { EventEmitter } from "events";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";

interface EthereumNetworkConfig {
	rpcUrl: string;
	chainId: number;
	bridgeContract: string;
	escrowContract: string;
}

interface BridgeEvent {
	bridgeId: string;
	user: string;
	fromToken: string;
	toChain: string;
	toAddress: string;
	amount: string;
	timestamp: number;
	txHash: string;
	blockNumber: number;
}

interface EscrowEvent {
	escrowId: string;
	maker: string;
	amount: string;
	asset: string;
	hashLock: string;
	timeLock: number;
	status: number;
	timestamp: number;
	txHash: string;
	blockNumber: number;
}

export class EthereumMonitor extends EventEmitter {
	private config: RelayerConfig;
	private networkConfig: EthereumNetworkConfig;
	private provider: ethers.JsonRpcProvider;
	private isRunning: boolean = false;
	private lastProcessedBlock: number = 0;
	private pollingInterval: NodeJS.Timeout | null = null;

	constructor(networkConfig: EthereumNetworkConfig, config: RelayerConfig) {
		super();
		this.networkConfig = networkConfig;
		this.config = config;
		this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Ethereum monitor is already running");
			return;
		}

		try {
			logger.info("📡 Starting Ethereum monitor...");
			this.isRunning = true;

			// Get initial block
			const latestBlock = await this.provider.getBlockNumber();
			this.lastProcessedBlock = latestBlock - 1;

			// Start polling
			this.startPolling();

			logger.info("✅ Ethereum monitor started successfully", {
				lastProcessedBlock: this.lastProcessedBlock,
				rpcUrl: this.networkConfig.rpcUrl,
				chainId: this.networkConfig.chainId,
			});
		} catch (error) {
			this.isRunning = false;
			logger.error("❌ Failed to start Ethereum monitor", error);
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			logger.warn("Ethereum monitor is not running");
			return;
		}

		this.isRunning = false;
		logger.info("🛑 Stopping Ethereum monitor...");

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}

		logger.info("✅ Ethereum monitor stopped successfully");
	}

	private startPolling(): void {
		this.pollingInterval = setInterval(async () => {
			if (!this.isRunning) return;

			try {
				await this.pollEvents();
			} catch (error) {
				logger.error("Error polling Ethereum events", error);
			}
		}, this.config.pollingInterval);
	}

	private async pollEvents(): Promise<void> {
		try {
			const latestBlock = await this.provider.getBlockNumber();
			const currentBlock = latestBlock;

			if (currentBlock <= this.lastProcessedBlock) {
				return;
			}

			// Process blocks from last processed to current
			for (
				let block = this.lastProcessedBlock + 1;
				block <= currentBlock;
				block++
			) {
				await this.processBlock(block);
			}

			this.lastProcessedBlock = currentBlock;
		} catch (error) {
			logger.error("Error polling Ethereum events", error);
		}
	}

	private async processBlock(blockNumber: number): Promise<void> {
		try {
			const block = await this.provider.getBlock(blockNumber, true);

			if (!block || !block.transactions) {
				return;
			}

			for (const tx of block.transactions) {
				await this.processTransaction(tx, block);
			}
		} catch (error) {
			logger.error(`Error processing block ${blockNumber}`, error);
		}
	}

	private async processTransaction(
		tx: ethers.TransactionResponse,
		block: ethers.Block
	): Promise<void> {
		try {
			// Check if transaction involves our contracts
			if (!this.isRelevantTransaction(tx)) {
				return;
			}

			// Parse transaction logs for events
			const receipt = await this.provider.getTransactionReceipt(tx.hash);

			if (receipt && receipt.logs) {
				for (const log of receipt.logs) {
					await this.processLog(log, tx, block);
				}
			}
		} catch (error) {
			logger.error(`Error processing transaction ${tx.hash}`, error);
		}
	}

	private isRelevantTransaction(tx: ethers.TransactionResponse): boolean {
		return (
			tx.to === this.networkConfig.bridgeContract ||
			tx.to === this.networkConfig.escrowContract
		);
	}

	private async processLog(
		log: ethers.Log,
		tx: ethers.TransactionResponse,
		block: ethers.Block
	): Promise<void> {
		try {
			// Check for bridge events
			if (
				log.address.toLowerCase() ===
				this.networkConfig.bridgeContract.toLowerCase()
			) {
				await this.processBridgeLog(log, tx, block);
			}

			// Check for escrow events
			if (
				log.address.toLowerCase() ===
				this.networkConfig.escrowContract.toLowerCase()
			) {
				await this.processEscrowLog(log, tx, block);
			}
		} catch (error) {
			logger.error(`Error processing log ${log.transactionHash}`, error);
		}
	}

	private async processBridgeLog(
		log: ethers.Log,
		tx: ethers.TransactionResponse,
		block: ethers.Block
	): Promise<void> {
		try {
			// Parse bridge event from log
			const bridgeEvent = await this.parseBridgeLog(log, tx, block);

			if (bridgeEvent) {
				logger.bridgeEvent("initiated", bridgeEvent.bridgeId, {
					user: bridgeEvent.user,
					amount: bridgeEvent.amount,
					toChain: bridgeEvent.toChain,
				});

				this.emit("bridgeInitiated", bridgeEvent);
			}
		} catch (error) {
			logger.error("Error processing bridge log", error);
		}
	}

	private async processEscrowLog(
		log: ethers.Log,
		tx: ethers.TransactionResponse,
		block: ethers.Block
	): Promise<void> {
		try {
			// Parse escrow event from log
			const escrowEvent = await this.parseEscrowLog(log, tx, block);

			if (escrowEvent) {
				logger.escrowEvent("created", escrowEvent.escrowId, {
					maker: escrowEvent.maker,
					amount: escrowEvent.amount,
					status: escrowEvent.status,
				});

				this.emit("escrowCreated", escrowEvent);
			}
		} catch (error) {
			logger.error("Error processing escrow log", error);
		}
	}

	private async parseBridgeLog(
		log: ethers.Log,
		tx: ethers.TransactionResponse,
		block: ethers.Block
	): Promise<BridgeEvent | null> {
		try {
			// Parse bridge event from log data
			// This would depend on your specific contract event structure
			const eventData = this.parseLogData(log.data);

			return {
				bridgeId: eventData.bridgeId || `bridge_${tx.hash}`,
				user: eventData.user || tx.from,
				fromToken: eventData.fromToken || "",
				toChain: eventData.toChain || "",
				toAddress: eventData.toAddress || "",
				amount: eventData.amount || "0",
				timestamp: block.timestamp * 1000, // Convert to milliseconds
				txHash: tx.hash,
				blockNumber: block.number,
			};
		} catch (error) {
			logger.error("Error parsing bridge log", error);
			return null;
		}
	}

	private async parseEscrowLog(
		log: ethers.Log,
		tx: ethers.TransactionResponse,
		block: ethers.Block
	): Promise<EscrowEvent | null> {
		try {
			// Parse escrow event from log data
			// This would depend on your specific contract event structure
			const eventData = this.parseLogData(log.data);

			return {
				escrowId: eventData.escrowId || `escrow_${tx.hash}`,
				maker: eventData.maker || tx.from,
				amount: eventData.amount || "0",
				asset: eventData.asset || "",
				hashLock: eventData.hashLock || "",
				timeLock: eventData.timeLock || 0,
				status: eventData.status || 0,
				timestamp: block.timestamp * 1000, // Convert to milliseconds
				txHash: tx.hash,
				blockNumber: block.number,
			};
		} catch (error) {
			logger.error("Error parsing escrow log", error);
			return null;
		}
	}

	private parseLogData(data: string): any {
		try {
			// Parse log data based on your contract ABI
			// This is a simplified example - you'll need to implement based on your actual contract events
			const iface = new ethers.Interface([
				"event BridgeInitiated(string bridgeId, address user, string fromToken, string toChain, string toAddress, uint256 amount)",
				"event EscrowCreated(string escrowId, address maker, uint256 amount, address asset, bytes32 hashLock, uint256 timeLock, uint8 status)",
			]);

			const parsed = iface.parseLog({ data, topics: [] });
			return parsed?.args || {};
		} catch (error) {
			logger.error("Error parsing log data", error);
			return {};
		}
	}

	async getHealthStatus(): Promise<{
		connected: boolean;
		lastProcessedBlock: number;
		currentBlock: number;
		uptime: number;
	}> {
		try {
			const latestBlock = await this.provider.getBlockNumber();

			return {
				connected: this.isRunning,
				lastProcessedBlock: this.lastProcessedBlock,
				currentBlock: latestBlock,
				uptime: this.isRunning
					? Date.now() - (this.startTime || Date.now())
					: 0,
			};
		} catch (error) {
			logger.error("Error getting Ethereum health status", error);

			return {
				connected: false,
				lastProcessedBlock: this.lastProcessedBlock,
				currentBlock: 0,
				uptime: 0,
			};
		}
	}

	// Manual event processing methods
	async processBridgeEvent(bridgeId: string): Promise<void> {
		try {
			// Manually process a specific bridge event
			logger.info("Manually processing bridge event", { bridgeId });

			// This would involve querying the blockchain for the specific event
			// and processing it as if it was detected by the monitor
		} catch (error) {
			logger.error("Error manually processing bridge event", error, {
				bridgeId,
			});
			throw error;
		}
	}

	async processEscrowEvent(escrowId: string): Promise<void> {
		try {
			// Manually process a specific escrow event
			logger.info("Manually processing escrow event", { escrowId });

			// This would involve querying the blockchain for the specific event
			// and processing it as if it was detected by the monitor
		} catch (error) {
			logger.error("Error manually processing escrow event", error, {
				escrowId,
			});
			throw error;
		}
	}
}
