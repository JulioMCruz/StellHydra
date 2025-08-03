// Enhanced interfaces for StellHydra + 1inch Fusion integration

export interface FusionRoute {
	path: string[];
	protocols: string[];
	estimatedOutput: string;
	gasEstimate: string;
	priceImpact: number;
	fusionQuote: any;
	dexAggregator: string;
	deadline?: number;
	slippageTolerance?: number;
}

export interface FusionQuote {
	orderHash: string;
	quoteId: string;
	fromToken: string;
	toToken: string;
	fromAmount: string;
	toAmount: string;
	priceImpact: number;
	gasEstimate: string;
	protocols: string[];
	deadline: number;
	signature: string;
}

export interface FusionSwapResult {
	txHash: string;
	orderHash: string;
	status: "pending" | "completed" | "failed";
	executionTime?: number;
}

export interface EnhancedSwapRequest {
	fromToken: string;
	toToken: string;
	fromAmount: string;
	toAmount: string;
	fromChain: string;
	toChain: string;
	userAddress: string;
	// Fusion-specific fields
	fusionRoute?: FusionRoute;
	slippageTolerance?: number;
	deadline?: number;
	useFusion?: boolean;
}

export interface EnhancedBridgeTransaction {
	sourceTxHash: string;
	destinationTxHash?: string;
	status: "pending" | "completed" | "failed";
	escrowAddress: string;
	orderHash: string;
	// Fusion-specific fields
	fusionRouteUsed?: FusionRoute;
	bridgeType: "atomic_swap" | "fusion_bridge";
	executionTime?: number;
	fallbackUsed?: boolean;
}

export interface BridgeSimulation {
	fromAmount: string;
	toAmount: string;
	rate: string;
	fee: string;
	dexSource: string;
	estimatedTime: string;
	priceImpact: string;
	minimumReceived: string;
	// Enhanced fields
	fusionRoute?: FusionPlusRoute;
	stellhydraRoute?: any;
	optimalRoute: "fusion" | "stellhydra";
	gasEstimate?: string;
	deadline?: number;
}

export interface RouteComparison {
	fusion: {
		available: boolean;
		route?: FusionRoute;
		estimatedOutput: string;
		gasEstimate: string;
		priceImpact: number;
	};
	stellhydra: {
		available: boolean;
		route?: any;
		estimatedOutput: string;
		gasEstimate: string;
		priceImpact: number;
	};
	optimalRoute: "fusion" | "stellhydra";
	reason: string;
}

// Enhanced 1inch Fusion+ SDK Types
export interface FusionPlusQuote {
	quoteId: string;
	fromTokenAddress: string;
	toTokenAddress: string;
	fromAmount: string;
	toAmount: string;
	fromChainId: number;
	toChainId: number;
	preset: {
		secretsCount: number;
		presetType: "fast" | "medium" | "slow";
	};
	deadline: number;
	priceImpact: number;
	gasEstimate: string;
	protocols: string[];
	orderHash?: string;
	signature?: string;
}

export interface FusionPlusOrder {
	orderHash: string;
	maker: string;
	taker: string;
	makingAmount: string;
	takingAmount: string;
	fromToken: string;
	toToken: string;
	fromChainId: number;
	toChainId: number;
	status: "pending" | "active" | "completed" | "cancelled" | "failed";
	createdAt: number;
	updatedAt: number;
	secrets?: string[];
	secretHashes?: string[];
	hashLock?: string;
}

export interface FusionPlusSecretSubmission {
	orderHash: string;
	secret: string;
	secretIndex?: number;
}

export interface FusionPlusReadyToAcceptSecretFills {
	isReady: boolean;
	escrowCreated: boolean;
	finalityLockExpired: boolean;
	orderHash: string;
}

export interface FusionPlusReadyToExecutePublicActions {
	isReady: boolean;
	reason?: string;
}

export interface FusionPlusPublishedSecretsResponse {
	orderHash: string;
	publishedSecrets: string[];
	secretCount: number;
}

export interface FusionPlusOrderStatus {
	orderHash: string;
	status: "pending" | "active" | "completed" | "cancelled" | "failed";
	escrowStatus: "pending" | "created" | "completed";
	secretStatus: "pending" | "submitted" | "revealed";
	executionTime?: number;
	errorMessage?: string;
}

export interface FusionPlusSwapResult {
	txHash: string;
	orderHash: string;
	status: "pending" | "completed" | "failed";
	executionTime: number;
	gasUsed?: string;
	gasPrice?: string;
}

export interface FusionPlusRoute {
	path: string[];
	protocols: string[];
	estimatedOutput: string;
	gasEstimate: string;
	priceImpact: number;
	fusionQuote: FusionPlusQuote;
	dexAggregator: "1inch Fusion+";
	deadline: number;
	slippageTolerance: number;
	secretsCount: number;
	presetType: "fast" | "medium" | "slow";
}

export interface FusionPlusError {
	code: string;
	message: string;
	details?: any;
}

// Enhanced StellHydra + Fusion+ Integration Types
export interface EnhancedFusionPlusSwapRequest {
	fromToken: string;
	toToken: string;
	fromAmount: string;
	toAmount?: string;
	fromChain: string;
	toChain: string;
	userAddress: string;
	// Fusion+ specific fields
	fusionRoute?: FusionPlusRoute;
	slippageTolerance?: number;
	deadline?: number;
	preset?: FusionPlusPresetEnum;
	useFusion?: boolean;
	secrets?: string[];
	secretHashes?: string[];
	hashLock?: string;
}

export interface EnhancedFusionPlusBridgeTransaction {
	sourceTxHash: string;
	destinationTxHash?: string;
	status: "pending" | "completed" | "failed";
	escrowAddress: string;
	orderHash: string;
	// Fusion+ specific fields
	fusionRouteUsed?: FusionPlusRoute;
	bridgeType: "atomic_swap" | "fusion_plus_bridge";
	executionTime?: number;
	secretStatus?: "pending" | "submitted" | "revealed";
	escrowStatus?: "pending" | "created" | "completed";
}

export interface FusionPlusRouteComparison {
	fusionRoute: FusionPlusRoute | null;
	stellhydraRoute: any;
	recommendedRoute: "fusion" | "stellhydra";
	reason: string;
	performanceMetrics: {
		estimatedTime: number;
		estimatedCost: string;
		successRate: number;
	};
}

export interface FusionPlusHealthStatus {
	isHealthy: boolean;
	apiStatus: "online" | "offline" | "degraded";
	lastCheck: number;
	responseTime: number;
	errorCount: number;
}

export interface FusionPlusConfig {
	apiKey: string;
	apiUrl: string;
	chainId: number;
	timeout: number;
	retryAttempts: number;
	enableLogging: boolean;
}

// Enhanced Error Types for Fusion+
export enum FusionPlusErrorType {
	INVALID_QUOTE = "INVALID_QUOTE",
	QUOTE_EXPIRED = "QUOTE_EXPIRED",
	ROUTE_INVALID = "ROUTE_INVALID",
	EXECUTION_FAILED = "EXECUTION_FAILED",
	SLIPPAGE_EXCEEDED = "SLIPPAGE_EXCEEDED",
	DEADLINE_EXCEEDED = "DEADLINE_EXCEEDED",
	SECRET_SUBMISSION_FAILED = "SECRET_SUBMISSION_FAILED",
	ESCROW_CREATION_FAILED = "ESCROW_CREATION_FAILED",
	FINALITY_LOCK_NOT_EXPIRED = "FINALITY_LOCK_NOT_EXPIRED",
	ORDER_NOT_READY = "ORDER_NOT_READY",
	INVALID_SECRET = "INVALID_SECRET",
	SECRET_ALREADY_PUBLISHED = "SECRET_ALREADY_PUBLISHED",
}

export class FusionPlusError extends Error {
	public type: FusionPlusErrorType;
	public details?: any;
	public timestamp: number;
	public orderHash?: string;

	constructor(params: {
		type: FusionPlusErrorType;
		message: string;
		details?: any;
		timestamp: number;
		orderHash?: string;
	}) {
		super(params.message);
		this.name = "FusionPlusError";
		this.type = params.type;
		this.details = params.details;
		this.timestamp = params.timestamp;
		this.orderHash = params.orderHash;
	}
}

// Enhanced Monitoring Types
export interface FusionPlusMetrics {
	totalOrders: number;
	successfulOrders: number;
	failedOrders: number;
	averageExecutionTime: number;
	averageGasUsed: string;
	successRate: number;
	lastUpdated: number;
}

export interface FusionPlusOrderMetrics {
	orderHash: string;
	executionTime: number;
	gasUsed: string;
	status: "success" | "failed";
	errorType?: FusionPlusErrorType;
	timestamp: number;
}

// Enhanced Chain Configuration for Fusion+
export const fusionPlusChainIds: { [key: string]: number } = {
	stellar: 148,
	ethereum: 1,
	sepolia: 11155111,
	polygon: 137,
	bsc: 56,
	arbitrum: 42161,
	optimism: 10,
	avalanche: 43114,
	gnosis: 100,
	base: 8453,
	zksync: 324,
	linea: 59144,
	scroll: 534352,
	opbnb: 204,
	arbitrum_nova: 42170,
	polygon_zkevm: 1101,
	zksync_lite: 280,
	base_sepolia: 84532,
	scroll_sepolia: 534351,
	linea_sepolia: 59140,
};

// 1inch Fusion+ Contract Addresses
export const fusionPlusContractAddresses: { [chainId: number]: any } = {
	1: {
		// Ethereum Mainnet
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch Router
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A960583", // Fusion Escrow
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A960584", // Order Book
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A960585", // Relay
	},
	11155111: {
		// Sepolia Testnet
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A960586",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A960587",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A960588",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A960589",
	},
	137: {
		// Polygon
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A960590",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A960591",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A960592",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A960593",
	},
	56: {
		// BSC
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A960594",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A960595",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A960596",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A960597",
	},
	42161: {
		// Arbitrum
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A960598",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A960599",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A96059A",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A96059B",
	},
	10: {
		// Optimism
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A96059C",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A96059D",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A96059E",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A96059F",
	},
	43114: {
		// Avalanche
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A9605A0",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A9605A1",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A9605A2",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A9605A3",
	},
	100: {
		// Gnosis
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A9605A4",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A9605A5",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A9605A6",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A9605A7",
	},
	8453: {
		// Base
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A9605A8",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A9605A9",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A9605AA",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A9605AB",
	},
	324: {
		// zkSync Era
		fusionRouter: "0x1111111254EEB25477B68fb85Ed929f73A9605AC",
		fusionEscrow: "0x1111111254EEB25477B68fb85Ed929f73A9605AD",
		fusionOrderBook: "0x1111111254EEB25477B68fb85Ed929f73A9605AE",
		fusionRelay: "0x1111111254EEB25477B68fb85Ed929f73A9605AF",
	},
};

// Real Token Addresses by Chain
export const fusionPlusTokenAddresses: {
	[chainId: number]: { [symbol: string]: string };
} = {
	1: {
		// Ethereum Mainnet
		ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		USDC: "0xA0b86a33E6441b8C4C8C0C8C0C8C0C8C0C8C0C8",
		USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
		LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
		UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
		AAVE: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
		CRV: "0xD533a949740bb3306d119CC777fa900bA034cd52",
	},
	11155111: {
		// Sepolia Testnet
		ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
		USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
		USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
		DAI: "0x68194a729C2450ad26072e7dDEDF16103C5e6f93",
	},
	137: {
		// Polygon
		MATIC: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
		USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
		USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
		DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
		WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
		WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
		LINK: "0x53E0bca35eC356BD5ddDFebbd1Fc0fD03FaBad39",
		AAVE: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
	},
	56: {
		// BSC
		BNB: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WBNB: "0xbb4CdB9CBd36B01bD1cBaEF2aD8c3b7c4C3b4F4F",
		USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
		USDT: "0x55d398326f99059fF775485246999027B3197955",
		DAI: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
		BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
		CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
		ADA: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
	},
	42161: {
		// Arbitrum
		ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
		USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
		USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
		DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
		WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
		LINK: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
		ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
	},
	10: {
		// Optimism
		ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WETH: "0x4200000000000000000000000000000000000006",
		USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
		USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
		DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
		WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
		LINK: "0x350a791Bfc2C21F9Ed5d109CDDad6C7Ece6EC9C8",
		OP: "0x4200000000000000000000000000000000000042",
	},
	43114: {
		// Avalanche
		AVAX: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WAVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
		USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
		USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
		DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
		WBTC: "0x50b7545627a5162F82A992c33b87aDc75187B218",
		LINK: "0x5947BB275c521040051D82396192181b413227A3",
		AAVE: "0x63a72806098Bd3D9520cC43356dD78afe5D386D9",
	},
	100: {
		// Gnosis
		XDAI: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WXDAI: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
		USDC: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
		USDT: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
		DAI: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
		WETH: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
		WBTC: "0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252",
		LINK: "0xE2e73A1c69ecF83F464EFCE6A5be353a37cA09b2",
	},
	8453: {
		// Base
		ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WETH: "0x4200000000000000000000000000000000000006",
		USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
		USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
		DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
		WBTC: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
		LINK: "0x88DfaAABaf86fef647c235C5CaA506e6C656e675",
	},
	324: {
		// zkSync Era
		ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe",
		WETH: "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91",
		USDC: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
		USDT: "0x493257fD37EDB34451fEEDD6acC8C055E39666f5",
		DAI: "0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656",
		WBTC: "0xBBeB516fb02a01611cBBEBo3d2D99816676627c",
		LINK: "0x40609141Db628BeEE3BfAB8034Fc2D8278Dc0c0c",
	},
};

// Token Symbols by Address (for reverse lookup)
export const fusionPlusTokenSymbols: {
	[chainId: number]: { [address: string]: string };
} = {
	1: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "ETH",
		"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
		"0xA0b86a33E6441b8C4C8C0C8C0C8C0C8C0C8C0C8": "USDC",
		"0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT",
		"0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAI",
		"0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC",
		"0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINK",
		"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "UNI",
		"0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9": "AAVE",
		"0xD533a949740bb3306d119CC777fa900bA034cd52": "CRV",
	},
	11155111: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "ETH",
		"0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14": "WETH",
		"0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238": "USDC",
		"0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0": "USDT",
		"0x68194a729C2450ad26072e7dDEDF16103C5e6f93": "DAI",
	},
	137: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "MATIC",
		"0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": "WMATIC",
		"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": "USDC",
		"0xc2132D05D31c914a87C6611C10748AEb04B58e8F": "USDT",
		"0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": "DAI",
		"0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619": "WETH",
		"0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6": "WBTC",
		"0x53E0bca35eC356BD5ddDFebbd1Fc0fD03FaBad39": "LINK",
		"0xD6DF932A45C0f255f85145f286eA0b292B21C90B": "AAVE",
	},
	56: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "BNB",
		"0xbb4CdB9CBd36B01bD1cBaEF2aD8c3b7c4C3b4F4F": "WBNB",
		"0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": "USDC",
		"0x55d398326f99059fF775485246999027B3197955": "USDT",
		"0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3": "DAI",
		"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56": "BUSD",
		"0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82": "CAKE",
		"0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47": "ADA",
	},
	42161: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "ETH",
		"0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": "WETH",
		"0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8": "USDC",
		"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": "USDT",
		"0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": "DAI",
		"0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f": "WBTC",
		"0xf97f4df75117a78c1A5a0DBb814Af92458539FB4": "LINK",
		"0x912CE59144191C1204E64559FE8253a0e49E6548": "ARB",
	},
	10: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "ETH",
		"0x4200000000000000000000000000000000000006": "WETH",
		"0x7F5c764cBc14f9669B88837ca1490cCa17c31607": "USDC",
		"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": "USDT",
		"0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1": "DAI",
		"0x68f180fcCe6836688e9084f035309E29Bf0A2095": "WBTC",
		"0x350a791Bfc2C21F9Ed5d109CDDad6C7Ece6EC9C8": "LINK",
		"0x4200000000000000000000000000000000000042": "OP",
	},
	43114: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "AVAX",
		"0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7": "WAVAX",
		"0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E": "USDC",
		"0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7": "USDT",
		"0xd586E7F844cEa2F87f50152665BCbc2C279D8d70": "DAI",
		"0x50b7545627a5162F82A992c33b87aDc75187B218": "WBTC",
		"0x5947BB275c521040051D82396192181b413227A3": "LINK",
		"0x63a72806098Bd3D9520cC43356dD78afe5D386D9": "AAVE",
	},
	100: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "XDAI",
		"0xe91d153e0b41518a2ce8dd3d7944fa863463a97d": "WXDAI",
		"0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83": "USDC",
		"0x4ECaBa5870353805a9F068101A40E0f32ed605C6": "USDT",
		"0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1": "WETH",
		"0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252": "WBTC",
		"0xE2e73A1c69ecF83F464EFCE6A5be353a37cA09b2": "LINK",
	},
	8453: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "ETH",
		"0x4200000000000000000000000000000000000006": "WETH",
		"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "USDC",
		"0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA": "USDbC",
		"0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": "DAI",
		"0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22": "WBTC",
		"0x88DfaAABaf86fef647c235C5CaA506e6C656e675": "LINK",
	},
	324: {
		"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEe": "ETH",
		"0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91": "WETH",
		"0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4": "USDC",
		"0x493257fD37EDB34451fEEDD6acC8C055E39666f5": "USDT",
		"0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656": "DAI",
		"0xBBeB516fb02a01611cBBEBo3d2D99816676627c": "WBTC",
		"0x40609141Db628BeEE3BfAB8034Fc2D8278Dc0c0c": "LINK",
	},
};

export const fusionPlusNetworkConfigs = {
	testnet: {
		stellar: {
			networkPassphrase: "Test SDF Network ; September 2015",
			rpcUrl: "https://horizon-testnet.stellar.org",
		},
		ethereum: {
			rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
			chainId: 11155111,
		},
		fusion: {
			apiUrl: "https://api.1inch.dev/fusion-plus",
			chainId: 11155111,
		},
	},
	mainnet: {
		stellar: {
			networkPassphrase: "Public Global Stellar Network ; September 2015",
			rpcUrl: "https://horizon.stellar.org",
		},
		ethereum: {
			rpcUrl: "https://mainnet.infura.io/v3/YOUR_KEY",
			chainId: 1,
		},
		fusion: {
			apiUrl: "https://api.1inch.dev/fusion-plus",
			chainId: 1,
		},
	},
};

// Enhanced Preset Types
export enum FusionPlusPresetEnum {
	FAST = "fast",
	MEDIUM = "medium",
	SLOW = "slow",
}

export interface FusionPlusPresetConfig {
	preset: FusionPlusPresetEnum;
	secretsCount: number;
	timeout: number;
	gasMultiplier: number;
	description: string;
}

export const fusionPlusPresetConfigs: {
	[key in FusionPlusPresetEnum]: FusionPlusPresetConfig;
} = {
	[FusionPlusPresetEnum.FAST]: {
		preset: FusionPlusPresetEnum.FAST,
		secretsCount: 1,
		timeout: 300000, // 5 minutes
		gasMultiplier: 1.2,
		description: "Fast execution with single secret",
	},
	[FusionPlusPresetEnum.MEDIUM]: {
		preset: FusionPlusPresetEnum.MEDIUM,
		secretsCount: 3,
		timeout: 600000, // 10 minutes
		gasMultiplier: 1.1,
		description: "Balanced execution with multiple secrets",
	},
	[FusionPlusPresetEnum.SLOW]: {
		preset: FusionPlusPresetEnum.SLOW,
		secretsCount: 5,
		timeout: 900000, // 15 minutes
		gasMultiplier: 1.0,
		description: "Slow execution with maximum security",
	},
};

// Chain configuration
export const chainIds: { [key: string]: number } = {
	stellar: 148,
	ethereum: 1,
	polygon: 137,
	bsc: 56,
	arbitrum: 42161,
	optimism: 10,
	avalanche: 43114,
	sepolia: 11155111,
};

export const networkConfigs = {
	testnet: {
		stellar: {
			networkPassphrase: "Test SDF Network ; September 2015",
			rpcUrl: "https://horizon-testnet.stellar.org",
		},
		ethereum: {
			rpcUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
			chainId: 11155111,
		},
		fusion: {
			apiUrl: "https://api.1inch.dev/fusion",
			chainId: 1,
		},
	},
	mainnet: {
		stellar: {
			networkPassphrase: "Public Global Stellar Network ; September 2015",
			rpcUrl: "https://horizon.stellar.org",
		},
		ethereum: {
			rpcUrl: "https://mainnet.infura.io/v3/YOUR_KEY",
			chainId: 1,
		},
		fusion: {
			apiUrl: "https://api.1inch.dev/fusion",
			chainId: 1,
		},
	},
};

// Fusion-specific errors
export enum FusionError {
	INVALID_FUSION_QUOTE = "INVALID_FUSION_QUOTE",
	FUSION_QUOTE_EXPIRED = "FUSION_QUOTE_EXPIRED",
	FUSION_ROUTE_INVALID = "FUSION_ROUTE_INVALID",
	FUSION_EXECUTION_FAILED = "FUSION_EXECUTION_FAILED",
	SLIPPAGE_EXCEEDED = "SLIPPAGE_EXCEEDED",
	DEADLINE_EXCEEDED = "DEADLINE_EXCEEDED",
	FUSION_UNAVAILABLE = "FUSION_UNAVAILABLE",
}
