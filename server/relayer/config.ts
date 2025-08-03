export interface RelayerConfig {
	stellarRpcUrl: string;
	ethereumRpcUrl: string;
	fusionApiKey?: string;
	bridgeContractAddress: string;
	escrowContractAddress: string;
	adminPrivateKey: string;
	pollingInterval: number;
	maxRetries: number;
	gasLimit: number;
	environment: "development" | "testnet" | "production";
	logLevel: "debug" | "info" | "warn" | "error";
}

export const getRelayerConfig = (): RelayerConfig => {
	const environment = (process.env.NODE_ENV || "development") as
		| "development"
		| "testnet"
		| "production";

	const baseConfig = {
		pollingInterval: 5000, // 5 seconds
		maxRetries: 3,
		gasLimit: 300000,
		logLevel: (process.env.LOG_LEVEL || "info") as
			| "debug"
			| "info"
			| "warn"
			| "error",
	};

	switch (environment) {
		case "production":
			return {
				...baseConfig,
				environment,
				stellarRpcUrl:
					process.env.STELLAR_RPC_URL ||
					"https://horizon.stellar.org",
				ethereumRpcUrl:
					process.env.ETHEREUM_RPC_URL ||
					"https://mainnet.infura.io/v3/YOUR_KEY",
				fusionApiKey: process.env.FUSION_API_KEY,
				bridgeContractAddress: process.env.BRIDGE_CONTRACT_ADDRESS!,
				escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS!,
				adminPrivateKey: process.env.ADMIN_PRIVATE_KEY!,
				pollingInterval: 3000, // Faster polling for production
				maxRetries: 5,
				gasLimit: 500000,
			};

		case "testnet":
			return {
				...baseConfig,
				environment,
				stellarRpcUrl:
					process.env.STELLAR_RPC_URL ||
					"https://horizon-testnet.stellar.org",
				ethereumRpcUrl:
					process.env.ETHEREUM_RPC_URL ||
					"https://sepolia.infura.io/v3/YOUR_KEY",
				fusionApiKey: process.env.FUSION_API_KEY,
				bridgeContractAddress: process.env.BRIDGE_CONTRACT_ADDRESS!,
				escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS!,
				adminPrivateKey: process.env.ADMIN_PRIVATE_KEY!,
				pollingInterval: 2000, // Faster polling for testnet
				maxRetries: 3,
				gasLimit: 400000,
			};

		case "development":
		default:
			return {
				...baseConfig,
				environment,
				stellarRpcUrl:
					process.env.STELLAR_RPC_URL ||
					"https://horizon-testnet.stellar.org",
				ethereumRpcUrl:
					process.env.ETHEREUM_RPC_URL ||
					"https://sepolia.infura.io/v3/YOUR_KEY",
				fusionApiKey: process.env.FUSION_API_KEY,
				bridgeContractAddress:
					process.env.BRIDGE_CONTRACT_ADDRESS ||
					"0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940",
				escrowContractAddress:
					process.env.ESCROW_CONTRACT_ADDRESS ||
					"0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940",
				adminPrivateKey:
					process.env.ADMIN_PRIVATE_KEY ||
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				pollingInterval: 10000, // Slower polling for development
				maxRetries: 2,
				gasLimit: 300000,
			};
	}
};

export const validateRelayerConfig = (config: RelayerConfig): void => {
	const requiredFields = [
		"stellarRpcUrl",
		"ethereumRpcUrl",
		"bridgeContractAddress",
		"escrowContractAddress",
		"adminPrivateKey",
	];

	for (const field of requiredFields) {
		if (!config[field as keyof RelayerConfig]) {
			throw new Error(`Missing required relayer config field: ${field}`);
		}
	}

	// Only validate contract addresses in production and testnet
	if (config.environment !== "development") {
		if (
			config.bridgeContractAddress ===
			"0x0000000000000000000000000000000000000000"
		) {
			throw new Error("Bridge contract address not configured");
		}

		if (
			config.escrowContractAddress ===
			"0x0000000000000000000000000000000000000000"
		) {
			throw new Error("Escrow contract address not configured");
		}

		if (
			config.adminPrivateKey ===
			"0x0000000000000000000000000000000000000000000000000000000000000000"
		) {
			throw new Error("Admin private key not configured");
		}
	}

	// Validate URLs
	try {
		new URL(config.stellarRpcUrl);
		new URL(config.ethereumRpcUrl);
	} catch (error) {
		throw new Error("Invalid RPC URL format");
	}

	// Validate polling interval
	if (config.pollingInterval < 1000 || config.pollingInterval > 60000) {
		throw new Error("Polling interval must be between 1000ms and 60000ms");
	}

	// Validate gas limit
	if (config.gasLimit < 21000 || config.gasLimit > 30000000) {
		throw new Error("Gas limit must be between 21000 and 30000000");
	}
};

export const getNetworkConfig = (config: RelayerConfig) => {
	return {
		stellar: {
			rpcUrl: config.stellarRpcUrl,
			networkPassphrase:
				config.environment === "production"
					? "Public Global Stellar Network ; September 2015"
					: "Test SDF Network ; September 2015",
			bridgeContract: config.bridgeContractAddress,
			escrowContract: config.escrowContractAddress,
		},
		ethereum: {
			rpcUrl: config.ethereumRpcUrl,
			chainId: config.environment === "production" ? 1 : 11155111, // Mainnet vs Sepolia
			bridgeContract: config.bridgeContractAddress,
			escrowContract: config.escrowContractAddress,
		},
		fusion: {
			apiKey: config.fusionApiKey,
			apiUrl: "https://fusion.1inch.io",
			enabled: !!config.fusionApiKey,
		},
	};
};
