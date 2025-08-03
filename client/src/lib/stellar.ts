import {
	StellarWalletsKit,
	WalletNetwork,
	XBULL_ID,
	FreighterModule,
	xBullModule,
	AlbedoModule,
	RabetModule,
	LobstrModule,
	HanaModule,
	HotWalletModule,
} from "@creit.tech/stellar-wallets-kit";

export interface StellarWallet {
	isAvailable: boolean;
	isConnected: boolean;
	isConnecting?: boolean;
	address: string;
	balance: string;
	selectedWalletId?: string;
}

// Create a singleton instance of the Stellar Wallets Kit
let kit: StellarWalletsKit | null = null;

const initializeKit = () => {
	if (!kit) {
		try {
			kit = new StellarWalletsKit({
				network: WalletNetwork.TESTNET,
				selectedWalletId: XBULL_ID,
				modules: [
					new FreighterModule(),
					new xBullModule(),
					new AlbedoModule(),
					new RabetModule(),
					new LobstrModule(),
					new HanaModule(),
					new HotWalletModule(),
				],
			});
		} catch (error) {
			console.error("Error initializing Stellar Wallets Kit:", error);
			throw error;
		}
	}
	return kit;
};

export const stellarService = {
	async isFreighterAvailable(): Promise<boolean> {
		try {
			// For now, let's assume wallets are available if we're in a browser
			// The actual wallet detection will happen when trying to connect
			return typeof window !== "undefined";
		} catch (error) {
			console.error("Error checking wallet availability:", error);
			return false;
		}
	},

	async connectWallet(): Promise<StellarWallet> {
		try {
			const stellarKit = initializeKit();

			// Return a promise that resolves when wallet is connected
			return new Promise((resolve, reject) => {
				stellarKit.openModal({
					onWalletSelected: async (option) => {
						try {
							await stellarKit.setWallet(option.id);
							
							// Get the connected wallet address
							const { address } = await stellarKit.getAddress();

							// Try to get balance, but handle new accounts
							let balance = "0";
							try {
								balance = await this.getBalance(address);
							} catch (error) {
								console.log("New account or balance fetch failed, using 0");
								balance = "0";
							}

							resolve({
								isAvailable: true,
								isConnected: true,
								address,
								balance,
								selectedWalletId: option.id,
							});
						} catch (error) {
							console.error("Failed to connect selected wallet:", error);
							reject(new Error("Failed to connect selected wallet"));
						}
					},
					onClosed: () => {
						reject(new Error("Wallet connection cancelled"));
					},
					modalTitle: "Connect Stellar Wallet",
					notAvailableText: "No wallets available. Please install Freighter, xBull, or another supported Stellar wallet.",
				});
			});
		} catch (error) {
			console.error("Failed to connect Stellar wallet:", error);
			throw new Error(
				"Failed to connect Stellar wallet. Please ensure you have a Stellar wallet installed."
			);
		}
	},

	async getBalance(address: string): Promise<string> {
		try {
			// Use Stellar SDK to fetch balance directly
			const response = await fetch(
				`https://horizon-testnet.stellar.org/accounts/${address}`
			);

			if (!response.ok) {
				if (response.status === 404) {
					// Account doesn't exist yet (new account)
					return "0";
				}
				throw new Error(`Failed to fetch account: ${response.status}`);
			}

			const account = await response.json();

			// Find XLM balance
			const xlmBalance = account.balances.find(
				(balance: any) => balance.asset_type === "native"
			);

			return xlmBalance ? xlmBalance.balance : "0";
		} catch (error) {
			console.error("Failed to fetch Stellar balance:", error);
			// Return 0 for new accounts or errors
			return "0";
		}
	},

	async submitTransaction(transaction: any): Promise<string> {
		try {
			const stellarKit = initializeKit();
			const { address } = await stellarKit.getAddress();

			// Sign the transaction
			const { signedTxXdr } = await stellarKit.signTransaction(
				transaction,
				{
					address,
					networkPassphrase: WalletNetwork.TESTNET,
				}
			);

			// For now, return a mock transaction hash
			// In a real implementation, you would submit to the Stellar network
			return `stellar_tx_${Date.now()}`;
		} catch (error) {
			console.error("Failed to submit Stellar transaction:", error);
			throw error;
		}
	},

	async signTransaction(transactionXdr: string): Promise<string> {
		try {
			const stellarKit = initializeKit();
			const { address } = await stellarKit.getAddress();

			const { signedTxXdr } = await stellarKit.signTransaction(
				transactionXdr,
				{
					address,
					networkPassphrase: WalletNetwork.TESTNET,
				}
			);

			return signedTxXdr;
		} catch (error) {
			console.error("Failed to sign Stellar transaction:", error);
			throw error;
		}
	},

	async setWallet(walletId: string): Promise<void> {
		try {
			const stellarKit = initializeKit();
			await stellarKit.setWallet(walletId);
		} catch (error) {
			console.error("Failed to set wallet:", error);
			throw error;
		}
	},

	async getSelectedWalletId(): Promise<string | null> {
		try {
			// For now, return a default wallet ID
			return "stellar-wallet";
		} catch (error) {
			console.error("Failed to get selected wallet ID:", error);
			return null;
		}
	},

	async isConnected(): Promise<boolean> {
		try {
			const stellarKit = initializeKit();
			
			// Try to get address - if this fails, wallet is not connected
			try {
				const result = await stellarKit.getAddress();
				return !!result.address;
			} catch (addressError) {
				// This is expected when wallet is not connected
				return false;
			}
		} catch (error) {
			console.error("Error checking wallet connection:", error);
			return false;
		}
	},

	async getConnectedWallet(): Promise<StellarWallet | null> {
		try {
			const stellarKit = initializeKit();
			
			// Try to get address, if it fails the wallet isn't connected
			let address;
			try {
				const result = await stellarKit.getAddress();
				address = result.address;
			} catch (addressError) {
				// Wallet not connected or not available
				return null;
			}
			
			if (!address) {
				return null;
			}

			const balance = await this.getBalance(address);
			const selectedWalletId = await this.getSelectedWalletId();

			return {
				isAvailable: true,
				isConnected: true,
				address,
				balance,
				selectedWalletId: selectedWalletId || undefined,
			};
		} catch (error) {
			console.error("Error getting connected wallet:", error);
			return null;
		}
	},

	disconnect(): StellarWallet {
		return {
			isAvailable: false,
			isConnected: false,
			address: "",
			balance: "0",
			selectedWalletId: undefined,
		};
	},
};
