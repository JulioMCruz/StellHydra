import { ethers } from "ethers";
import { Stellar } from "@stellar/stellar-sdk";
import { RelayerConfig } from "../config";
import { logger } from "../utils/logger";

interface BridgeEvent {
	bridgeId: string;
	user: string;
	fromToken: string;
	toChain: string;
	toAddress: string;
	amount: string;
	timestamp: number;
	txHash: string;
	sourceChain: "stellar" | "ethereum";
}

interface BridgeTransaction {
	bridgeId: string;
	sourceChain: "stellar" | "ethereum";
	destinationChain: "stellar" | "ethereum";
	user: string;
	fromToken: string;
	toToken: string;
	amount: string;
	toAddress: string;
	status: "pending" | "processing" | "completed" | "failed";
	sourceTxHash: string;
	destinationTxHash?: string;
	createdAt: number;
	updatedAt: number;
	error?: string;
}

export class BridgeProcessor {
	private config: RelayerConfig;
	private stellarProvider: Stellar.Server;
	private ethereumProvider: ethers.JsonRpcProvider;
	private adminWallet: ethers.Wallet;
	private pendingTransactions: Map<string, BridgeTransaction> = new Map();
	private processingTimes: number[] = [];
	private totalTransactions = 0;
	private successfulTransactions = 0;

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

	async handleStellarBridgeInitiated(event: BridgeEvent): Promise<void> {
		try {
			logger.info("Processing Stellar bridge initiated event", {
				bridgeId: event.bridgeId,
			});

			const bridgeTx: BridgeTransaction = {
				bridgeId: event.bridgeId,
				sourceChain: "stellar",
				destinationChain: "ethereum",
				user: event.user,
				fromToken: event.fromToken,
				toToken: this.mapStellarToEthereumToken(event.fromToken),
				amount: event.amount,
				toAddress: event.toAddress,
				status: "pending",
				sourceTxHash: event.txHash,
				createdAt: event.timestamp,
				updatedAt: Date.now(),
			};

			this.pendingTransactions.set(event.bridgeId, bridgeTx);
			await this.processBridge(bridgeTx);
		} catch (error) {
			logger.error("Error handling Stellar bridge initiated", error, {
				bridgeId: event.bridgeId,
			});
			throw error;
		}
	}

	async handleEthereumBridgeInitiated(event: BridgeEvent): Promise<void> {
		try {
			logger.info("Processing Ethereum bridge initiated event", {
				bridgeId: event.bridgeId,
			});

			const bridgeTx: BridgeTransaction = {
				bridgeId: event.bridgeId,
				sourceChain: "ethereum",
				destinationChain: "stellar",
				user: event.user,
				fromToken: event.fromToken,
				toToken: this.mapEthereumToStellarToken(event.fromToken),
				amount: event.amount,
				toAddress: event.toAddress,
				status: "pending",
				sourceTxHash: event.txHash,
				createdAt: event.timestamp,
				updatedAt: Date.now(),
			};

			this.pendingTransactions.set(event.bridgeId, bridgeTx);
			await this.processBridge(bridgeTx);
		} catch (error) {
			logger.error("Error handling Ethereum bridge initiated", error, {
				bridgeId: event.bridgeId,
			});
			throw error;
		}
	}

	private async processBridge(bridgeTx: BridgeTransaction): Promise<void> {
		const startTime = Date.now();

		try {
			logger.info("Starting bridge processing", {
				bridgeId: bridgeTx.bridgeId,
				sourceChain: bridgeTx.sourceChain,
				destinationChain: bridgeTx.destinationChain,
			});

			// Update status to processing
			bridgeTx.status = "processing";
			bridgeTx.updatedAt = Date.now();
			this.pendingTransactions.set(bridgeTx.bridgeId, bridgeTx);

			// Validate the bridge transaction
			await this.validateBridgeTransaction(bridgeTx);

			// Execute the cross-chain transfer
			const destinationTxHash = await this.executeCrossChainTransfer(
				bridgeTx
			);

			// Update with destination transaction hash
			bridgeTx.destinationTxHash = destinationTxHash;
			bridgeTx.status = "completed";
			bridgeTx.updatedAt = Date.now();
			this.pendingTransactions.set(bridgeTx.bridgeId, bridgeTx);

			// Update statistics
			const processingTime = Date.now() - startTime;
			this.processingTimes.push(processingTime);
			this.totalTransactions++;
			this.successfulTransactions++;

			logger.info("Bridge processing completed successfully", {
				bridgeId: bridgeTx.bridgeId,
				destinationTxHash,
				processingTime: `${processingTime}ms`,
			});
		} catch (error) {
			// Update status to failed
			bridgeTx.status = "failed";
			bridgeTx.error = error.message;
			bridgeTx.updatedAt = Date.now();
			this.pendingTransactions.set(bridgeTx.bridgeId, bridgeTx);

			// Update statistics
			this.totalTransactions++;

			logger.error("Bridge processing failed", error, {
				bridgeId: bridgeTx.bridgeId,
			});
			throw error;
		}
	}

	private async validateBridgeTransaction(
		bridgeTx: BridgeTransaction
	): Promise<void> {
		try {
			// Validate source transaction
			if (bridgeTx.sourceChain === "stellar") {
				await this.validateStellarTransaction(bridgeTx.sourceTxHash);
			} else {
				await this.validateEthereumTransaction(bridgeTx.sourceTxHash);
			}

			// Validate user address format
			if (bridgeTx.destinationChain === "stellar") {
				if (
					!Stellar.StrKey.isValidEd25519PublicKey(bridgeTx.toAddress)
				) {
					throw new Error("Invalid Stellar address format");
				}
			} else {
				if (!ethers.isAddress(bridgeTx.toAddress)) {
					throw new Error("Invalid Ethereum address format");
				}
			}

			// Validate amount
			if (parseFloat(bridgeTx.amount) <= 0) {
				throw new Error("Invalid amount");
			}

			logger.info("Bridge transaction validation passed", {
				bridgeId: bridgeTx.bridgeId,
			});
		} catch (error) {
			logger.error("Bridge transaction validation failed", error, {
				bridgeId: bridgeTx.bridgeId,
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

	private async executeCrossChainTransfer(
		bridgeTx: BridgeTransaction
	): Promise<string> {
		try {
			if (bridgeTx.destinationChain === "stellar") {
				return await this.executeStellarTransfer(bridgeTx);
			} else {
				return await this.executeEthereumTransfer(bridgeTx);
			}
		} catch (error) {
			logger.error("Error executing cross-chain transfer", error, {
				bridgeId: bridgeTx.bridgeId,
			});
			throw error;
		}
	}

	private async executeStellarTransfer(
		bridgeTx: BridgeTransaction
	): Promise<string> {
		try {
			// Create Stellar transaction
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
						destination: bridgeTx.toAddress,
						asset: Stellar.Asset.native(),
						amount: bridgeTx.amount,
					})
				)
				.setTimeout(30)
				.build();

			// Sign and submit transaction
			transaction.sign(this.adminWallet);
			const result = await this.stellarProvider.submitTransaction(
				transaction
			);

			logger.info("Stellar transfer executed successfully", {
				bridgeId: bridgeTx.bridgeId,
				txHash: result.hash,
			});

			return result.hash;
		} catch (error) {
			logger.error("Error executing Stellar transfer", error, {
				bridgeId: bridgeTx.bridgeId,
			});
			throw error;
		}
	}

	private async executeEthereumTransfer(
		bridgeTx: BridgeTransaction
	): Promise<string> {
		try {
			// Create Ethereum transaction
			const tx = {
				to: bridgeTx.toAddress,
				value: ethers.parseEther(bridgeTx.amount),
				gasLimit: this.config.gasLimit,
			};

			// Send transaction
			const transaction = await this.adminWallet.sendTransaction(tx);
			const receipt = await transaction.wait();

			logger.info("Ethereum transfer executed successfully", {
				bridgeId: bridgeTx.bridgeId,
				txHash: receipt.hash,
			});

			return receipt.hash;
		} catch (error) {
			logger.error("Error executing Ethereum transfer", error, {
				bridgeId: bridgeTx.bridgeId,
			});
			throw error;
		}
	}

	private mapStellarToEthereumToken(stellarToken: string): string {
		// Map Stellar tokens to Ethereum tokens
		const tokenMap: Record<string, string> = {
			XLM: "0x0000000000000000000000000000000000000000", // Native ETH
			USDC: "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8", // USDC on Ethereum
			// Add more token mappings as needed
		};

		return tokenMap[stellarToken] || stellarToken;
	}

	private mapEthereumToStellarToken(ethereumToken: string): string {
		// Map Ethereum tokens to Stellar tokens
		const tokenMap: Record<string, string> = {
			"0x0000000000000000000000000000000000000000": "XLM", // Native ETH to XLM
			"0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8": "USDC", // USDC on Ethereum to USDC on Stellar
			// Add more token mappings as needed
		};

		return tokenMap[ethereumToken] || ethereumToken;
	}

	async processBridge(bridgeId: string): Promise<void> {
		const bridgeTx = this.pendingTransactions.get(bridgeId);

		if (!bridgeTx) {
			throw new Error(`Bridge transaction not found: ${bridgeId}`);
		}

		await this.processBridge(bridgeTx);
	}

	async getStats(): Promise<{
		pending: number;
		total: number;
		avgProcessingTime: number;
		successRate: number;
	}> {
		const pending = this.pendingTransactions.size;
		const avgProcessingTime =
			this.processingTimes.length > 0
				? this.processingTimes.reduce((a, b) => a + b, 0) /
				  this.processingTimes.length
				: 0;
		const successRate =
			this.totalTransactions > 0
				? (this.successfulTransactions / this.totalTransactions) * 100
				: 0;

		return {
			pending,
			total: this.totalTransactions,
			avgProcessingTime,
			successRate,
		};
	}

	async getBridgeTransaction(
		bridgeId: string
	): Promise<BridgeTransaction | null> {
		return this.pendingTransactions.get(bridgeId) || null;
	}

	async getAllBridgeTransactions(): Promise<BridgeTransaction[]> {
		return Array.from(this.pendingTransactions.values());
	}
}
