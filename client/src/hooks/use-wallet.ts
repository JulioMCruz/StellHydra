import { useState, useEffect } from "react";
import { stellarService, StellarWallet } from "@/lib/stellar";
import { ethereumService, EthereumWallet } from "@/lib/ethereum";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
	const [stellarWallet, setStellarWallet] = useState<StellarWallet>({
		isAvailable: false,
		isConnected: false,
		address: "",
		balance: "0",
	});

	const [sepoliaWallet, setSepoliaWallet] = useState<EthereumWallet>({
		isAvailable: false,
		isConnected: false,
		address: "",
		balance: "0",
		chainId: "",
	});

	const { toast } = useToast();

	useEffect(() => {
		// Check wallet availability on mount
		checkWalletAvailability();
		
		// Set up event listeners for automatic reconnection
		const handleAccountsChanged = (accounts: string[]) => {
			if (accounts.length === 0) {
				// User disconnected
				setSepoliaWallet(ethereumService.disconnect());
			} else {
				// Account changed, update connection
				refreshBalances();
			}
		};

		const handleChainChanged = (chainId: string) => {
			// Chain changed, refresh connection
			refreshBalances();
		};

		// Add MetaMask event listeners
		if (typeof window !== 'undefined' && window.ethereum) {
			window.ethereum.on('accountsChanged', handleAccountsChanged);
			window.ethereum.on('chainChanged', handleChainChanged);
		}

		// Cleanup event listeners
		return () => {
			if (typeof window !== 'undefined' && window.ethereum) {
				window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
				window.ethereum.removeListener('chainChanged', handleChainChanged);
			}
		};
	}, []);

	const checkWalletAvailability = async () => {
		const stellarAvailable = await stellarService.isFreighterAvailable();
		const ethereumAvailable = await ethereumService.isMetaMaskAvailable();

		setStellarWallet((prev) => ({
			...prev,
			isAvailable: true, // Always show as available
		}));
		setSepoliaWallet((prev) => ({
			...prev,
			isAvailable: ethereumAvailable,
		}));
	};

	const connectStellar = async () => {
		try {
			setStellarWallet(prev => ({ ...prev, isConnecting: true }));
			const wallet = await stellarService.connectWallet();
			setStellarWallet(wallet);
			toast({
				title: "Stellar Wallet Connected",
				description: `Connected to ${wallet.address.slice(
					0,
					8
				)}... with ${wallet.selectedWalletId || "unknown wallet"}`,
			});
		} catch (error: any) {
			setStellarWallet(prev => ({ ...prev, isConnecting: false }));
			console.error("Stellar connection error:", error);
			toast({
				title: "Stellar Connection Failed",
				description: error.message || "Please install Freighter or another Stellar wallet",
				variant: "destructive",
			});
		}
	};

	const connectSepolia = async () => {
		try {
			setSepoliaWallet(prev => ({ ...prev, isConnecting: true }));
			const wallet = await ethereumService.connectWallet();
			setSepoliaWallet(wallet);
			toast({
				title: "Sepolia Wallet Connected",
				description: `Connected to ${wallet.address.slice(0, 8)}...`,
			});
		} catch (error: any) {
			setSepoliaWallet(prev => ({ ...prev, isConnecting: false }));
			console.error("Ethereum connection error:", error);
			toast({
				title: "Ethereum Connection Failed",
				description: error.message || "Please install MetaMask and try again",
				variant: "destructive",
			});
		}
	};

	const disconnect = () => {
		setStellarWallet(stellarService.disconnect());
		setSepoliaWallet(ethereumService.disconnect());
		toast({
			title: "Wallets Disconnected",
			description: "All wallets have been disconnected",
		});
	};

	const refreshBalances = async () => {
		if (stellarWallet.isConnected) {
			const balance = await stellarService.getBalance(
				stellarWallet.address
			);
			setStellarWallet((prev) => ({ ...prev, balance }));
		}

		if (sepoliaWallet.isConnected) {
			const balance = await ethereumService.getBalance(
				sepoliaWallet.address
			);
			setSepoliaWallet((prev) => ({ ...prev, balance }));
		}
	};

	return {
		stellarWallet,
		sepoliaWallet,
		connectStellar,
		connectSepolia,
		disconnect,
		refreshBalances,
	};
}
