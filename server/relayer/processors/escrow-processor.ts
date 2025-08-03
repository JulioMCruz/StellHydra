import { ethers } from "ethers";
import { Stellar } from "@stellar/stellar-sdk";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";

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
	sourceChain: "stellar" | "ethereum";
}

interface EscrowTransaction {
	escrowId: string;
	sourceChain: "stellar" | "ethereum";
	destinationChain: "stellar" | "ethereum";
	maker: string;
	taker?: string;
	amount: string;
	asset: string;
	hashLock: string;
	timeLock: number;
	status: "pending" | "locked" | "completed" | "refunded" | "expired";
	sourceTxHash: string;
	destinationTxHash?: string;
	secret?: string;
	createdAt: number;
	updatedAt: number;
	error?: string;
}

export class EscrowProcessor {
	private config: RelayerConfig;
	private stellarProvider: Stellar.Server;
	private ethereumProvider: ethers.JsonRpcProvider;
	private adminWallet: ethers.Wallet;
	private pendingEscrows: Map<string, EscrowTransaction> = new Map();
	private processingTimes: number[] = [];
	private totalEscrows = 0;
	private successfulEscrows = 0;

	constructor(config: RelayerConfig) {
		this.config = config;
		this.stellarProvider = new Stellar.Server(config.stellarRpcUrl);
		this.ethereumProvider = new ethers.JsonRpcProvider(
			config.ethereumRpcUrl
		);
		this.adminWallet = new ethers.Wallet(
			config.adminPrivateKey,
			this.ethereumProvider
		);
	}

	async handleStellarEscrowCreated(event: EscrowEvent): Promise<void> {
		try {
			logger.info("Processing Stellar escrow created event", {
				escrowId: event.escrowId,
			});

			const escrowTx: EscrowTransaction = {
				escrowId: event.escrowId,
				sourceChain: "stellar",
				destinationChain: "ethereum",
				maker: event.maker,
				amount: event.amount,
				asset: event.asset,
				hashLock: event.hashLock,
				timeLock: event.timeLock,
				status: "pending",
				sourceTxHash: event.txHash,
				createdAt: event.timestamp,
				updatedAt: Date.now(),
			};

			this.pendingEscrows.set(event.escrowId, escrowTx);
			await this.processEscrow(escrowTx);
		} catch (error) {
			logger.error("Error handling Stellar escrow created", error, {
				escrowId: event.escrowId,
			});
			throw error;
		}
	}

	async handleEthereumEscrowCreated(event: EscrowEvent): Promise<void> {
		try {
			logger.info("Processing Ethereum escrow created event", {
				escrowId: event.escrowId,
			});

			const escrowTx: EscrowTransaction = {
				escrowId: event.escrowId,
				sourceChain: "ethereum",
				destinationChain: "stellar",
				maker: event.maker,
				amount: event.amount,
				asset: event.asset,
				hashLock: event.hashLock,
				timeLock: event.timeLock,
				status: "pending",
				sourceTxHash: event.txHash,
				createdAt: event.timestamp,
				updatedAt: Date.now(),
			};

			this.pendingEscrows.set(event.escrowId, escrowTx);
			await this.processEscrow(escrowTx);
		} catch (error) {
			logger.error("Error handling Ethereum escrow created", error, {
				escrowId: event.escrowId,
			});
			throw error;
		}
	}

	async handleStellarEscrowLocked(event: EscrowEvent): Promise<void> {
		try {
			logger.info("Processing Stellar escrow locked event", {
				escrowId: event.escrowId,
			});

			const escrowTx = this.pendingEscrows.get(event.escrowId);
			if (escrowTx) {
				escrowTx.status = "locked";
				escrowTx.updatedAt = Date.now();
				this.pendingEscrows.set(event.escrowId, escrowTx);
			}
		} catch (error) {
			logger.error("Error handling Stellar escrow locked", error, {
				escrowId: event.escrowId,
			});
			throw error;
		}
	}

	async handleEthereumEscrowLocked(event: EscrowEvent): Promise<void> {
		try {
			logger.info("Processing Ethereum escrow locked event", {
				escrowId: event.escrowId,
			});

			const escrowTx = this.pendingEscrows.get(event.escrowId);
			if (escrowTx) {
				escrowTx.status = "locked";
				escrowTx.updatedAt = Date.now();
				this.pendingEscrows.set(event.escrowId, escrowTx);
			}
		} catch (error) {
			logger.error("Error handling Ethereum escrow locked", error, {
				escrowId: event.escrowId,
			});
			throw error;
		}
	}

	async handleStellarEscrowCompleted(event: EscrowEvent): Promise<void> {
		try {
			logger.info("Processing Stellar escrow completed event", {
				escrowId: event.escrowId,
			});

			const escrowTx = this.pendingEscrows.get(event.escrowId);
			if (escrowTx) {
				escrowTx.status = "completed";
				escrowTx.destinationTxHash = event.txHash;
				escrowTx.updatedAt = Date.now();
				this.pendingEscrows.set(event.escrowId, escrowTx);
			}
		} catch (error) {
			logger.error("Error handling Stellar escrow completed", error, {
				escrowId: event.escrowId,
			});
			throw error;
		}
	}

	async handleEthereumEscrowCompleted(event: EscrowEvent): Promise<void> {
		try {
			logger.info("Processing Ethereum escrow completed event", {
				escrowId: event.escrowId,
			});

			const escrowTx = this.pendingEscrows.get(event.escrowId);
			if (escrowTx) {
				escrowTx.status = "completed";
				escrowTx.destinationTxHash = event.txHash;
				escrowTx.updatedAt = Date.now();
				this.pendingEscrows.set(event.escrowId, escrowTx);
			}
		} catch (error) {
			logger.error("Error handling Ethereum escrow completed", error, {
				escrowId: event.escrowId,
			});
			throw error;
		}
	}

	private async processEscrow(escrowTx: EscrowTransaction): Promise<void> {
		const startTime = Date.now();

		try {
			logger.info("Starting escrow processing", {
				escrowId: escrowTx.escrowId,
				sourceChain: escrowTx.sourceChain,
				destinationChain: escrowTx.destinationChain,
			});

			// Validate the escrow transaction
			await this.validateEscrowTransaction(escrowTx);

			// Check if escrow is ready for completion
			if (escrowTx.status === "locked") {
				await this.completeEscrow(escrowTx);
			} else {
				// Wait for the escrow to be locked
				logger.info("Escrow not yet locked, waiting...", {
					escrowId: escrowTx.escrowId,
				});
			}

			// Update statistics
			const processingTime = Date.now() - startTime;
			this.processingTimes.push(processingTime);
			this.totalEscrows++;
			this.successfulEscrows++;

			logger.info("Escrow processing completed successfully", {
				escrowId: escrowTx.escrowId,
				processingTime: `${processingTime}ms`,
			});
		} catch (error) {
			// Update status to failed
			escrowTx.status = "expired";
			escrowTx.error = error.message;
			escrowTx.updatedAt = Date.now();
			this.pendingEscrows.set(escrowTx.escrowId, escrowTx);

			// Update statistics
			this.totalEscrows++;

			logger.error("Escrow processing failed", error, {
				escrowId: escrowTx.escrowId,
			});
			throw error;
		}
	}

	private async validateEscrowTransaction(
		escrowTx: EscrowTransaction
	): Promise<void> {
		try {
			// Validate source transaction
			if (escrowTx.sourceChain === "stellar") {
				await this.validateStellarTransaction(escrowTx.sourceTxHash);
			} else {
				await this.validateEthereumTransaction(escrowTx.sourceTxHash);
			}

			// Validate hash lock
			if (!escrowTx.hashLock || escrowTx.hashLock.length !== 64) {
				throw new Error("Invalid hash lock format");
			}

			// Validate time lock
			if (escrowTx.timeLock <= Date.now() / 1000) {
				throw new Error("Time lock has expired");
			}

			// Validate amount
			if (parseFloat(escrowTx.amount) <= 0) {
				throw new Error("Invalid amount");
			}

			logger.info("Escrow transaction validation passed", {
				escrowId: escrowTx.escrowId,
			});
		} catch (error) {
			logger.error("Escrow transaction validation failed", error, {
				escrowId: escrowTx.escrowId,
			});
			throw error;
		}
	}

	private async validateStellarTransaction(txHash: string): Promise<void> {
		try {
			const tx = await this.stellarProvider.getTransaction(txHash);

			if (!tx || tx.successful !== true) {
				throw new Error("Stellar transaction not found or failed");
			}
		} catch (error) {
			logger.error("Error validating Stellar transaction", error, {
				txHash,
			});
			throw error;
		}
	}

	private async validateEthereumTransaction(txHash: string): Promise<void> {
		try {
			const receipt = await this.ethereumProvider.getTransactionReceipt(
				txHash
			);

			if (!receipt || receipt.status !== 1) {
				throw new Error("Ethereum transaction not found or failed");
			}
		} catch (error) {
			logger.error("Error validating Ethereum transaction", error, {
				txHash,
			});
			throw error;
		}
	}

	private async completeEscrow(escrowTx: EscrowTransaction): Promise<void> {
		try {
			// Generate secret for HTLC
			const secret = this.generateSecret();
			escrowTx.secret = secret;

			// Execute the cross-chain completion
			const destinationTxHash = await this.executeEscrowCompletion(
				escrowTx
			);

			// Update with destination transaction hash
			escrowTx.destinationTxHash = destinationTxHash;
			escrowTx.status = "completed";
			escrowTx.updatedAt = Date.now();
			this.pendingEscrows.set(escrowTx.escrowId, escrowTx);

			logger.info("Escrow completion executed successfully", {
				escrowId: escrowTx.escrowId,
				destinationTxHash,
			});
		} catch (error) {
			logger.error("Error completing escrow", error, {
				escrowId: escrowTx.escrowId,
			});
			throw error;
		}
	}

	private async executeEscrowCompletion(
		escrowTx: EscrowTransaction
	): Promise<string> {
		try {
			if (escrowTx.destinationChain === "stellar") {
				return await this.executeStellarEscrowCompletion(escrowTx);
			} else {
				return await this.executeEthereumEscrowCompletion(escrowTx);
			}
		} catch (error) {
			logger.error("Error executing escrow completion", error, {
				escrowId: escrowTx.escrowId,
			});
			throw error;
		}
	}

	private async executeStellarEscrowCompletion(
		escrowTx: EscrowTransaction
	): Promise<string> {
		try {
			// Create Stellar transaction for escrow completion
			const account = await this.stellarProvider.loadAccount(
				this.adminWallet.address
			);

			const transaction = new Stellar.TransactionBuilder(account, {
				fee: Stellar.BASE_FEE,
				networkPassphrase:
					this.config.environment === "production"
						? "Public Global Stellar Network ; September 2015"
						: "Test SDF Network ; September 2015",
			})
				.addOperation(
					Stellar.Operation.payment({
						destination: escrowTx.maker,
						asset: Stellar.Asset.native(),
						amount: escrowTx.amount,
					})
				)
				.setTimeout(30)
				.build();

			// Sign and submit transaction
			transaction.sign(this.adminWallet);
			const result = await this.stellarProvider.submitTransaction(
				transaction
			);

			logger.info("Stellar escrow completion executed successfully", {
				escrowId: escrowTx.escrowId,
				txHash: result.hash,
			});

			return result.hash;
		} catch (error) {
			logger.error("Error executing Stellar escrow completion", error, {
				escrowId: escrowTx.escrowId,
			});
			throw error;
		}
	}

	private async executeEthereumEscrowCompletion(
		escrowTx: EscrowTransaction
	): Promise<string> {
		try {
			// Create Ethereum transaction for escrow completion
			const tx = {
				to: escrowTx.maker,
				value: ethers.parseEther(escrowTx.amount),
				gasLimit: this.config.gasLimit,
			};

			// Send transaction
			const transaction = await this.adminWallet.sendTransaction(tx);
			const receipt = await transaction.wait();

			logger.info("Ethereum escrow completion executed successfully", {
				escrowId: escrowTx.escrowId,
				txHash: receipt.hash,
			});

			return receipt.hash;
		} catch (error) {
			logger.error("Error executing Ethereum escrow completion", error, {
				escrowId: escrowTx.escrowId,
			});
			throw error;
		}
	}

	private generateSecret(): string {
		// Generate a random 32-byte secret for HTLC
		return ethers.randomBytes(32).toString("hex");
	}

	async processEscrow(escrowId: string): Promise<void> {
		const escrowTx = this.pendingEscrows.get(escrowId);

		if (!escrowTx) {
			throw new Error(`Escrow transaction not found: ${escrowId}`);
		}

		await this.processEscrow(escrowTx);
	}

	async getStats(): Promise<{
		pending: number;
		total: number;
		avgProcessingTime: number;
		successRate: number;
	}> {
		const pending = this.pendingEscrows.size;
		const avgProcessingTime =
			this.processingTimes.length > 0
				? this.processingTimes.reduce((a, b) => a + b, 0) /
				  this.processingTimes.length
				: 0;
		const successRate =
			this.totalEscrows > 0
				? (this.successfulEscrows / this.totalEscrows) * 100
				: 0;

		return {
			pending,
			total: this.totalEscrows,
			avgProcessingTime,
			successRate,
		};
	}

	async getEscrowTransaction(
		escrowId: string
	): Promise<EscrowTransaction | null> {
		return this.pendingEscrows.get(escrowId) || null;
	}

	async getAllEscrowTransactions(): Promise<EscrowTransaction[]> {
		return Array.from(this.pendingEscrows.values());
	}
}
