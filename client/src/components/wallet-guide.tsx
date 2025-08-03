import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Chrome } from "lucide-react";

export function WalletGuide() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🦺 Wallet Setup Guide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          To use StellHydra cross-chain bridge, you'll need wallets for both Stellar and Ethereum networks.
        </div>

        {/* Stellar Wallets */}
        <div className="space-y-3">
          <h3 className="font-semibold text-stellar">🌟 Stellar Wallets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg bg-stellar/5 border-stellar/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Freighter</div>
                  <div className="text-xs text-muted-foreground">Most popular Stellar wallet</div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a 
                    href="https://freighter.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Install</span>
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg bg-stellar/5 border-stellar/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">xBull</div>
                  <div className="text-xs text-muted-foreground">Advanced Stellar wallet</div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a 
                    href="https://xbull.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Install</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ethereum Wallets */}
        <div className="space-y-3">
          <h3 className="font-semibold text-ethereum">⟠ Ethereum Wallets</h3>
          <div className="p-3 border rounded-lg bg-ethereum/5 border-ethereum/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">MetaMask</div>
                <div className="text-xs text-muted-foreground">Most popular Ethereum wallet</div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a 
                  href="https://metamask.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Install</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3">
          <h3 className="font-semibold">📋 Setup Instructions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="font-medium text-stellar">1.</span>
              <span>Install Freighter or xBull for Stellar transactions</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-ethereum">2.</span>
              <span>Install MetaMask for Ethereum/Sepolia transactions</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-muted-foreground">3.</span>
              <span>Make sure you're on Testnet (Stellar) and Sepolia (Ethereum)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-muted-foreground">4.</span>
              <span>Get test tokens from faucets before using the bridge</span>
            </div>
          </div>
        </div>

        {/* Faucet Links */}
        <div className="space-y-3">
          <h3 className="font-semibold">🚰 Test Token Faucets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://laboratory.stellar.org/account-creator" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Stellar Testnet Faucet</span>
              </a>
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://sepolia-faucet.pk910.de" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Sepolia ETH Faucet</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          💡 Tip: Refresh the page after installing wallets if they don't appear immediately
        </div>
      </CardContent>
    </Card>
  );
}