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

  const allConnected = stellarWallet.isConnected && sepoliaWallet.isConnected;
  const someConnected = stellarWallet.isConnected || sepoliaWallet.isConnected;
  const isConnecting = stellarWallet.isConnecting || sepoliaWallet.isConnecting;

  return (
    <div className="flex items-center space-x-3">
      {/* Network Indicators */}
      <div className="flex items-center space-x-2">
        <Badge 
          variant="outline" 
          className={`network-indicator px-3 py-1 text-xs font-medium ${
            stellarWallet.isConnected 
              ? 'bg-stellar/20 border-stellar/30 text-stellar' 
              : stellarWallet.isConnecting
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500'
              : 'bg-muted/20 border-muted-foreground/30 text-muted-foreground'
          }`}
        >
          {stellarWallet.isConnected ? 'Stellar ✓' : stellarWallet.isConnecting ? 'Stellar...' : 'Stellar'}
        </Badge>
        <Badge 
          variant="outline" 
          className={`network-indicator px-3 py-1 text-xs font-medium ${
            sepoliaWallet.isConnected 
              ? 'bg-ethereum/20 border-ethereum/30 text-ethereum' 
              : sepoliaWallet.isConnecting
              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500'
              : 'bg-muted/20 border-muted-foreground/30 text-muted-foreground'
          }`}
        >
          {sepoliaWallet.isConnected ? 'Sepolia ✓' : sepoliaWallet.isConnecting ? 'Sepolia...' : 'Sepolia'}
        </Badge>
      </div>
      
      {/* Wallet Controls */}
      {someConnected ? (
        <div className="flex items-center space-x-2">
          {/* Connected Address Display */}
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
          
          {/* Connect Missing Wallets */}
          {!allConnected && (
            <div className="flex space-x-1">
              {!stellarWallet.isConnected && (
                <Button 
                  size="sm"
                  onClick={connectStellar}
                  disabled={stellarWallet.isConnecting}
                  className="text-xs px-2 py-1 h-8 bg-stellar/20 hover:bg-stellar/30 border-stellar/30"
                >
                  {stellarWallet.isConnecting ? "..." : "Stellar"}
                </Button>
              )}
              {!sepoliaWallet.isConnected && (
                <Button 
                  size="sm"
                  onClick={connectSepolia}
                  disabled={sepoliaWallet.isConnecting}
                  className="text-xs px-2 py-1 h-8 bg-ethereum/20 hover:bg-ethereum/30 border-ethereum/30"
                >
                  {sepoliaWallet.isConnecting ? "..." : "Sepolia"}
                </Button>
              )}
            </div>
          )}
          
          {/* Disconnect Button */}
          {allConnected && (
            <Button 
              size="sm"
              onClick={disconnect}
              variant="outline"
              className="text-xs px-2 py-1 h-8"
            >
              Disconnect
            </Button>
          )}
        </div>
      ) : (
        <div className="flex space-x-2">
          <Button 
            onClick={connectStellar}
            disabled={isConnecting}
            className="glass-card px-3 py-2 rounded-xl hover:bg-stellar/20 transition-all border border-stellar/30 text-sm font-medium bg-stellar/10"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {stellarWallet.isConnecting ? "Connecting..." : "Stellar"}
          </Button>
          <Button 
            onClick={connectSepolia}
            disabled={isConnecting}
            className="glass-card px-3 py-2 rounded-xl hover:bg-ethereum/20 transition-all border border-ethereum/30 text-sm font-medium bg-ethereum/10"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {sepoliaWallet.isConnecting ? "Connecting..." : "Sepolia"}
          </Button>
        </div>
      )}
    </div>
  );
}
