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
  }, []);

  const checkWalletAvailability = async () => {
    const stellarAvailable = await stellarService.isFreighterAvailable();
    const ethereumAvailable = await ethereumService.isMetaMaskAvailable();

    setStellarWallet(prev => ({ ...prev, isAvailable: stellarAvailable }));
    setSepoliaWallet(prev => ({ ...prev, isAvailable: ethereumAvailable }));
  };

  const connectStellar = async () => {
    try {
      const wallet = await stellarService.connectWallet();
      setStellarWallet(wallet);
      toast({
        title: "Stellar Wallet Connected",
        description: `Connected to ${wallet.address.slice(0, 8)}...`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const connectSepolia = async () => {
    try {
      const wallet = await ethereumService.connectWallet();
      setSepoliaWallet(wallet);
      toast({
        title: "Sepolia Wallet Connected",
        description: `Connected to ${wallet.address.slice(0, 8)}...`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
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
      const balance = await stellarService.getBalance(stellarWallet.address);
      setStellarWallet(prev => ({ ...prev, balance }));
    }

    if (sepoliaWallet.isConnected) {
      const balance = await ethereumService.getBalance(sepoliaWallet.address);
      setSepoliaWallet(prev => ({ ...prev, balance }));
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
