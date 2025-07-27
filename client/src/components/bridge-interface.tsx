import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownUp, Shield } from "lucide-react";
import { TokenSelector } from "./token-selector";
import { useBridge } from "@/hooks/use-bridge";
import { useWallet } from "@/hooks/use-wallet";

export function BridgeInterface() {
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

  return (
    <div className="space-y-6">
      {/* Bridge Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Cross-Chain Bridge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bridge tokens between Stellar and Ethereum networks
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-green-500" />
          <span>Secure Protocol</span>
        </div>
      </div>

      {/* Main Bridge Card */}
      <Card className="glass-card rounded-2xl border border-white/10">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* From Section */}
            <div className={`glass-card rounded-xl p-4 border ${fromNetwork === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
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
              
              <div className="flex items-center space-x-4">
                <TokenSelector
                  selectedToken={fromToken}
                  onTokenSelect={setFromToken}
                  network={fromNetwork}
                />
                
                <Input
                  type="text"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-semibold border-none outline-none text-right"
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
                className="glass-card w-12 h-12 rounded-full border border-white/20 hover:bg-white/10 transition-all group"
              >
                <ArrowDownUp className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors group-hover:rotate-180 transform duration-300" />
              </Button>
            </div>

            {/* To Section */}
            <div className={`glass-card rounded-xl p-4 border ${toNetwork === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-muted-foreground">To</label>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>
                    Balance: {toNetwork === 'stellar' ? stellarWallet.balance || '0' : sepoliaWallet.balance || '0'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <TokenSelector
                  selectedToken={toToken}
                  onTokenSelect={setToToken}
                  network={toNetwork}
                />
                
                <div className="flex-1 text-2xl font-semibold text-right">
                  {isSimulating ? (
                    <div className="animate-pulse bg-muted/20 h-8 rounded"></div>
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

            {/* Bridge Details */}
            {simulation && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span>1 {fromToken} = {simulation.rate} {toToken}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Bridge Fee</span>
                  <span>{simulation.fee} {fromToken} + Gas</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Estimated Time</span>
                  <span>{simulation.estimatedTime}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Minimum Received</span>
                  <span>{simulation.minimumReceived} {toToken}</span>
                </div>
              </div>
            )}

            {/* Bridge Button */}
            <Button
              onClick={executeBridge}
              disabled={!canBridge || isExecuting}
              className="w-full mt-6 bg-gradient-to-r from-stellar to-ethereum hover:from-stellar/80 hover:to-ethereum/80 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isExecuting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <ArrowDownUp className="w-4 h-4 mr-2" />
              )}
              {isExecuting ? "Processing..." : "Bridge Tokens"}
            </Button>

            {!stellarWallet.isConnected && !sepoliaWallet.isConnected && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Connect your wallet to start bridging
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}