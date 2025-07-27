import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export function AccountBalances() {
  const { stellarWallet, sepoliaWallet } = useWallet();

  return (
    <Card className="glass-card rounded-2xl border border-white/10">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-ethereum" />
          Balances
        </h3>
        
        <div className="space-y-4">
          {/* Stellar Balance */}
          <div className="p-4 glass-card rounded-lg border border-stellar/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-stellar flex items-center justify-center">
                  <span className="text-xs font-bold text-white">XLM</span>
                </div>
                <span className="font-medium">Stellar</span>
              </div>
              <span className="text-sm text-muted-foreground">Network</span>
            </div>
            <div className="text-xl font-bold">
              {stellarWallet.isConnected ? `${stellarWallet.balance || '0'} XLM` : 'Not Connected'}
            </div>
            {stellarWallet.isConnected && (
              <div className="text-sm text-muted-foreground">
                ≈ ${((parseFloat(stellarWallet.balance || '0')) * 0.99).toFixed(2)}
              </div>
            )}
          </div>

          {/* Sepolia Balance */}
          <div className="p-4 glass-card rounded-lg border border-ethereum/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-ethereum flex items-center justify-center">
                  <span className="text-xs font-bold text-white">ETH</span>
                </div>
                <span className="font-medium">Sepolia</span>
              </div>
              <span className="text-sm text-muted-foreground">Testnet</span>
            </div>
            <div className="text-xl font-bold">
              {sepoliaWallet.isConnected ? `${sepoliaWallet.balance || '0'} ETH` : 'Not Connected'}
            </div>
            {sepoliaWallet.isConnected && (
              <div className="text-sm text-muted-foreground">
                ≈ ${((parseFloat(sepoliaWallet.balance || '0')) * 2500).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {!stellarWallet.isConnected && !sepoliaWallet.isConnected && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Connect your wallets to view balances
          </div>
        )}
      </CardContent>
    </Card>
  );
}
