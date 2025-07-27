import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownUp, Shield } from "lucide-react";
import { TokenSelector } from "./token-selector";
import { useBridge } from "@/hooks/use-bridge";
import { useWallet } from "@/hooks/use-wallet";

interface BridgeInterfaceProps {
  onRouteUpdate?: (routeInfo: {
    fromToken: string;
    toToken: string;
    fromNetwork: string;
    toNetwork: string;
    fromAmount: string;
    simulation: any;
    isVisible: boolean;
  }) => void;
}

export function BridgeInterface({ onRouteUpdate }: BridgeInterfaceProps) {
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState("XLM");
  const [toToken, setToToken] = useState("ETH");
  const [fromNetwork, setFromNetwork] = useState("stellar");
  const [toNetwork, setToNetwork] = useState("sepolia");

  const { stellarWallet, sepoliaWallet } = useWallet();
  const { simulation, isSimulating, executeBridge, isExecuting } = useBridge({
    fromToken,
    toToken,
    fromAmount,
    fromNetwork,
    toNetwork,
    walletAddress: stellarWallet.address || sepoliaWallet.address || "",
  });

  const handleSwapNetworks = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
    setFromAmount("");
  };

  const handleMaxClick = () => {
    const balance = fromNetwork === "stellar" ? stellarWallet.balance : sepoliaWallet.balance;
    setFromAmount(balance || "0");
  };

  const canBridge = fromAmount && parseFloat(fromAmount) > 0 && (stellarWallet.isConnected || sepoliaWallet.isConnected);

  // Update route information when relevant data changes
  useEffect(() => {
    if (onRouteUpdate) {
      onRouteUpdate({
        fromToken,
        toToken,
        fromNetwork,
        toNetwork,
        fromAmount,
        simulation,
        isVisible: !!(fromAmount && parseFloat(fromAmount) > 0 && simulation)
      });
    }
  }, [fromToken, toToken, fromNetwork, toNetwork, fromAmount, simulation, onRouteUpdate]);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="text-center">
        <h1 className="text-lg font-bold gradient-text">Bridge</h1>
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-1">
          <Shield className="w-3 h-3 text-green-500" />
          <span>Secure</span>
        </div>
      </div>

      {/* Compact Bridge Card */}
      <Card className="glass-card rounded-xl border border-white/10 w-full max-w-md mx-auto">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* From Section */}
            <div className={`glass-card rounded-lg p-3 border ${fromNetwork === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-muted-foreground">From</label>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>
                    Balance: {fromNetwork === 'stellar' ? stellarWallet.balance || '0' : sepoliaWallet.balance || '0'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxClick}
                    className="text-stellar hover:text-stellar/80 h-auto p-0 text-xs"
                  >
                    MAX
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="sm:w-auto">
                  <TokenSelector
                    selectedToken={fromToken}
                    onTokenSelect={setFromToken}
                    network={fromNetwork}
                  />
                </div>
                
                <Input
                  type="text"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 bg-transparent text-lg font-semibold border-none outline-none text-right"
                  inputMode="decimal"
                />
              </div>
              
              {simulation && (
                <div className="mt-2 text-sm text-muted-foreground">
                  ~${(parseFloat(fromAmount || "0") * 0.99).toFixed(2)} USD
                </div>
              )}
            </div>

            {/* Bridge Direction Indicator */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwapNetworks}
                className="glass-card w-12 h-12 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:bg-white/10 transition-all group touch-manipulation"
              >
                <ArrowDownUp className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-white transition-colors group-hover:rotate-180 transform duration-300" />
              </Button>
            </div>

            {/* To Section */}
            <div className={`glass-card rounded-lg p-3 border ${toNetwork === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-muted-foreground">To</label>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>
                    Balance: {toNetwork === 'stellar' ? stellarWallet.balance || '0' : sepoliaWallet.balance || '0'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="sm:w-auto">
                  <TokenSelector
                    selectedToken={toToken}
                    onTokenSelect={setToToken}
                    network={toNetwork}
                  />
                </div>
                
                <div className="flex-1 text-lg font-semibold text-right flex items-center justify-end">
                  {isSimulating ? (
                    <div className="animate-pulse bg-muted/20 h-8 w-24 rounded"></div>
                  ) : (
                    simulation?.toAmount || "0.0"
                  )}
                </div>
              </div>
              
              {simulation && (
                <div className="mt-2 text-sm text-muted-foreground">
                  ~${(parseFloat(simulation.toAmount) * 2500).toFixed(2)} USD
                </div>
              )}
            </div>

            {/* Bridge Details - Compact */}
            {simulation && (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rate</span>
                  <span>1 {fromToken} = {simulation.rate} {toToken}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fee</span>
                  <span>{simulation.fee} {fromToken}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Time</span>
                  <span>{simulation.estimatedTime}</span>
                </div>
              </div>
            )}

            {/* Bridge Button - Compact */}
            <Button
              onClick={executeBridge}
              disabled={!canBridge || isExecuting}
              className="w-full mt-4 bg-gradient-to-r from-stellar to-ethereum hover:from-stellar/80 hover:to-ethereum/80 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              {isExecuting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <ArrowDownUp className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm">
                {isExecuting ? "Processing..." : "Bridge"}
              </span>
            </Button>

            {!stellarWallet.isConnected && !sepoliaWallet.isConnected && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Connect wallet to bridge
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}