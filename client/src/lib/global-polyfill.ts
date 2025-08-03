// Global polyfill for browser environment
if (typeof global === "undefined") {
	(window as any).global = window;
}

if (typeof process === "undefined") {
	(window as any).process = {
		env: {
			NODE_ENV: import.meta.env.MODE,
			// Add all the environment variables that the application needs
			FUSION_API_KEY: import.meta.env.VITE_FUSION_API_KEY || "",
			FUSION_PLUS_API_KEY: import.meta.env.VITE_FUSION_PLUS_API_KEY || "",
			STELLAR_RPC_URL:
				import.meta.env.VITE_STELLAR_RPC_URL ||
				"https://horizon-testnet.stellar.org",
			ETHEREUM_RPC_URL:
				import.meta.env.VITE_ETHEREUM_RPC_URL ||
				"https://sepolia.infura.io/v3/YOUR_KEY",
			BRIDGE_CONTRACT_ADDRESS:
				import.meta.env.VITE_BRIDGE_CONTRACT_ADDRESS || "",
			ESCROW_CONTRACT_ADDRESS:
				import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "",
			ADMIN_PRIVATE_KEY: import.meta.env.VITE_ADMIN_PRIVATE_KEY || "",
			DATABASE_URL: import.meta.env.VITE_DATABASE_URL || "",
			PORT: import.meta.env.VITE_PORT || "3001",
			LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || "info",
		},
	};
}

export {};
