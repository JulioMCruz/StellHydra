import * as StellarSdk from '@stellar/stellar-sdk';
import { EventEmitter } from "events";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";
import { StellarEscrowClient } from "../../lib/stellar-escrow-client";

interface StellarNetworkConfig {
	rpcUrl: string;
	networkPassphrase: string;
	bridgeContract: string;
	escrowContract: string;
	secretKey: string;
	network: 'testnet' | 'mainnet';
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
}

export class StellarMonitor extends EventEmitter {
	private config: RelayerConfig;
	private networkConfig: StellarNetworkConfig;
	private server: StellarSdk.Horizon.Server;
	private escrowClient?: StellarEscrowClient;
	private isRunning: boolean = false;
	private lastProcessedLedger: number = 0;
	private pollingInterval: NodeJS.Timeout | null = null;
	private startTime?: number;

	constructor(networkConfig: StellarNetworkConfig, config: RelayerConfig) {
		super();
		this.networkConfig = networkConfig;
		this.config = config;
		this.server = new StellarSdk.Horizon.Server(networkConfig.rpcUrl);
		
		// Initialize escrow client if contract address is available
		if (networkConfig.escrowContract && networkConfig.secretKey) {
			this.escrowClient = new StellarEscrowClient({
				contractId: networkConfig.escrowContract,
				network: networkConfig.network,
				rpcUrl: networkConfig.rpcUrl.replace('horizon', 'soroban-rpc'),
				secretKey: networkConfig.secretKey,
			});
		}
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Stellar monitor is already running");
			return;
		}

		try {
			logger.info("📡 Starting Stellar monitor...");
			this.isRunning = true;
			this.startTime = Date.now();

			// Get initial ledger
			const latestLedger = await this.server.ledgers().order('desc').limit(1).call();
			this.lastProcessedLedger = latestLedger.records[0].sequence - 1;

			// Start polling
			this.startPolling();

			logger.info("✅ Stellar monitor started successfully", {
				lastProcessedLedger: this.lastProcessedLedger,
				rpcUrl: this.networkConfig.rpcUrl,
			});
		} catch (error) {
			this.isRunning = false;
			logger.error("❌ Failed to start Stellar monitor", error);
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.isRunning) {
			logger.warn("Stellar monitor is not running");
			return;
		}

		this.isRunning = false;
		logger.info("🛑 Stopping Stellar monitor...");

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}

		logger.info("✅ Stellar monitor stopped successfully");
	}

	private startPolling(): void {
		this.pollingInterval = setInterval(async () => {
			if (!this.isRunning) return;

			try {
				await this.pollEvents();
			} catch (error) {
				logger.error("Error polling Stellar events", error);
			}
		}, this.config.pollingInterval);
	}

	private async pollEvents(): Promise<void> {
		try {
			const latestLedger = await this.server.ledgers().order('desc').limit(1).call();
			const currentLedger = latestLedger.records[0].sequence;

			if (currentLedger <= this.lastProcessedLedger) {
				return;
			}

			// Process ledgers from last processed to current
			for (
				let ledger = this.lastProcessedLedger + 1;
				ledger <= currentLedger;
				ledger++
			) {
				await this.processLedger(ledger);
			}

			this.lastProcessedLedger = currentLedger;
		} catch (error) {
			logger.error("Error polling Stellar events", error);
		}
	}

	private async processLedger(ledgerSequence: number): Promise<void> {
		try {
			// Get transactions for this ledger
			const transactions = await this.server
				.transactions()
				.forLedger(ledgerSequence)
				.call();

			for (const tx of transactions.records) {
				await this.processTransaction(tx);
			}
		} catch (error) {
			logger.error(`Error processing ledger ${ledgerSequence}`, error);
		}
	}

	private async processTransaction(
		tx: StellarSdk.ServerApi.TransactionRecord
	): Promise<void> {
		try {
			// Check if transaction involves our contracts
			if (!this.isRelevantTransaction(tx)) {
				return;
			}

			// Parse transaction operations
			const operations = await this.server
				.operations()
				.forTransaction(tx.hash)
				.call();

			for (const op of operations.records) {
				await this.processOperation(op, tx);
			}
		} catch (error) {
			logger.error(`Error processing transaction ${tx.hash}`, error);
		}
	}

	private isRelevantTransaction(tx: StellarSdk.ServerApi.TransactionRecord): boolean {
		// Check if transaction involves our bridge or escrow contracts
		return (
			tx.operations_count > 0 &&
			(tx.source_account === this.networkConfig.bridgeContract ||
				tx.source_account === this.networkConfig.escrowContract)
		);
	}

	private async processOperation(
		op: StellarSdk.ServerApi.OperationRecord,
		tx: StellarSdk.ServerApi.TransactionRecord
	): Promise<void> {
		try {
			// Check for bridge events
			if (op.source_account === this.networkConfig.bridgeContract) {
				await this.processBridgeOperation(op, tx);
			}

			// Check for escrow events
			if (op.source_account === this.networkConfig.escrowContract) {
				await this.processEscrowOperation(op, tx);
			}
		} catch (error) {
			logger.error(`Error processing operation ${op.id}`, error);
		}
	}

	private async processBridgeOperation(
		op: StellarSdk.ServerApi.OperationRecord,
		tx: StellarSdk.ServerApi.TransactionRecord
	): Promise<void> {
		try {
			// Parse bridge event from operation
			const bridgeEvent = await this.parseBridgeEvent(op, tx);

			if (bridgeEvent) {
				logger.bridgeEvent("initiated", bridgeEvent.bridgeId, {
					user: bridgeEvent.user,
					amount: bridgeEvent.amount,
					toChain: bridgeEvent.toChain,
				});

				this.emit("bridgeInitiated", bridgeEvent);
			}
		} catch (error) {
			logger.error("Error processing bridge operation", error);
		}
	}

	private async processEscrowOperation(
		op: StellarSdk.ServerApi.OperationRecord,
		tx: StellarSdk.ServerApi.TransactionRecord
	): Promise<void> {
		try {
			// Parse escrow event from operation
			const escrowEvent = await this.parseEscrowEvent(op, tx);

			if (escrowEvent) {
				logger.escrowEvent("created", escrowEvent.escrowId, {
					maker: escrowEvent.maker,
					amount: escrowEvent.amount,
					status: escrowEvent.status,
				});

				this.emit("escrowCreated", escrowEvent);
			}
		} catch (error) {
			logger.error("Error processing escrow operation", error);
		}
	}

	private async parseBridgeEvent(
		op: StellarSdk.ServerApi.OperationRecord,
		tx: StellarSdk.ServerApi.TransactionRecord
	): Promise<BridgeEvent | null> {
		try {
			// Parse bridge event from operation data
			// This would depend on your specific contract event structure
			const eventData = op.attributes?.data || {};

			return {
				bridgeId: eventData.bridge_id || `bridge_${tx.hash}`,
				user: eventData.user || op.source_account,
				fromToken: eventData.from_token || "",
				toChain: eventData.to_chain || "",
				toAddress: eventData.to_address || "",
				amount: eventData.amount || "0",
				timestamp: new Date(tx.created_at).getTime(),
				txHash: tx.hash,
			};
		} catch (error) {
			logger.error("Error parsing bridge event", error);
			return null;
		}
	}

	private async parseEscrowEvent(
		op: StellarSdk.ServerApi.OperationRecord,
		tx: StellarSdk.ServerApi.TransactionRecord
	): Promise<EscrowEvent | null> {
		try {
			// Parse escrow event from operation data
			// This would depend on your specific contract event structure
			const eventData = op.attributes?.data || {};

			return {
				escrowId: eventData.escrow_id || `escrow_${tx.hash}`,
				maker: eventData.maker || op.source_account,
				amount: eventData.amount || "0",
				asset: eventData.asset || "",
				hashLock: eventData.hash_lock || "",
				timeLock: eventData.time_lock || 0,
				status: eventData.status || 0,
				timestamp: new Date(tx.created_at).getTime(),
				txHash: tx.hash,
			};
		} catch (error) {
			logger.error("Error parsing escrow event", error);
			return null;
		}
	}

	async getHealthStatus(): Promise<{
		connected: boolean;
		lastProcessedBlock: number;
		currentLedger: number;
		uptime: number;
		escrowClientConnected: boolean;
	}> {
		try {
			const latestLedger = await this.server.ledgers().order('desc').limit(1).call();
			let escrowClientConnected = false;
			
			if (this.escrowClient) {
				escrowClientConnected = await this.escrowClient.healthCheck();
			}

			return {
				connected: this.isRunning,
				lastProcessedBlock: this.lastProcessedLedger,
				currentLedger: latestLedger.records[0].sequence,
				uptime: this.isRunning && this.startTime
					? Date.now() - this.startTime
					: 0,
				escrowClientConnected,
			};
		} catch (error) {
			logger.error("Error getting Stellar health status", error);

			return {
				connected: false,
				lastProcessedBlock: this.lastProcessedLedger,
				currentLedger: 0,
				uptime: 0,
				escrowClientConnected: false,
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

			// Query escrow data directly from contract
			if (this.escrowClient) {
				const escrowData = await this.escrowClient.getEscrow(escrowId);
				
				if (escrowData) {
					const escrowEvent: EscrowEvent = {
						escrowId: escrowData.id,
						maker: escrowData.maker,
						amount: escrowData.amount,
						asset: escrowData.asset,
						hashLock: escrowData.hashLock,
						timeLock: escrowData.timeLock,
						status: escrowData.status,
						timestamp: escrowData.createdAt,
						txHash: `manual_${Date.now()}`,
					};
					
					// Emit appropriate event based on escrow status
					switch (escrowData.status) {
						case 0:
							this.emit("escrowCreated", escrowEvent);
							break;
						case 1:
							this.emit("escrowLocked", escrowEvent);
							break;
						case 2:
							this.emit("escrowCompleted", escrowEvent);
							break;
						case 3:
							this.emit("escrowRefunded", escrowEvent);
							break;
					}
				}
			}
		} catch (error) {
			logger.error("Error manually processing escrow event", error, {
				escrowId,
			});
			throw error;
		}
	}

	/**
	 * Query escrow data directly from contract
	 */
	async getEscrowData(escrowId: string): Promise<any> {
		if (!this.escrowClient) {
			throw new Error("Escrow client not initialized");
		}
		
		return await this.escrowClient.getEscrow(escrowId);
	}

	/**
	 * Get contract statistics
	 */
	async getContractStats(): Promise<any> {
		if (!this.escrowClient) {
			throw new Error("Escrow client not initialized");
		}
		
		return await this.escrowClient.getStats();
	}
}
