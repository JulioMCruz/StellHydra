import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export function WalletConnection() {
  const { stellarWallet, sepoliaWallet, connectStellar, connectSepolia, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Network Indicators */}
      <div className="flex items-center space-x-2">
        <Badge 
          variant="outline" 
          className={`network-indicator px-3 py-1 text-xs font-medium ${
            stellarWallet.isConnected 
              ? 'bg-stellar/20 border-stellar/30 text-stellar' 
              : 'bg-muted/20 border-muted-foreground/30 text-muted-foreground'
          }`}
        >
          {stellarWallet.isConnected ? 'Stellar ✓' : 'Stellar'}
        </Badge>
        <Badge 
          variant="outline" 
          className={`network-indicator px-3 py-1 text-xs font-medium ${
            sepoliaWallet.isConnected 
              ? 'bg-ethereum/20 border-ethereum/30 text-ethereum' 
              : 'bg-muted/20 border-muted-foreground/30 text-muted-foreground'
          }`}
        >
          {sepoliaWallet.isConnected ? 'Sepolia ✓' : 'Sepolia'}
        </Badge>
      </div>
      
      {/* Wallet Button */}
      {stellarWallet.isConnected || sepoliaWallet.isConnected ? (
        <div className="glass-card px-4 py-2 rounded-xl border border-white/20 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            <span>
              {stellarWallet.isConnected && formatAddress(stellarWallet.address)}
              {stellarWallet.isConnected && sepoliaWallet.isConnected && " | "}
              {sepoliaWallet.isConnected && formatAddress(sepoliaWallet.address)}
            </span>
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => {
            connectStellar();
            connectSepolia();
          }}
          className="glass-card px-4 py-2 rounded-xl hover:bg-white/10 transition-all border border-white/20 text-sm font-medium bg-transparent"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      )}
    </div>
  );
}
