import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownUp, Shield, Info, Rocket, ChevronDown, Route, Zap } from "lucide-react";
import { SiEthereum } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TokenSelector } from "./token-selector";
import { useBridge } from "@/hooks/use-bridge";
import { useWallet } from "@/hooks/use-wallet";
import { RouteInfoPanel } from "./route-info-panel";

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
  routeInfo?: {
    fromToken: string;
    toToken: string;
    fromNetwork: string;
    toNetwork: string;
    fromAmount: string;
    simulation: any;
    isVisible: boolean;
  };
  showMobileRouteInfo?: boolean;
  setShowMobileRouteInfo?: (show: boolean) => void;
}

export function BridgeInterface({ 
  onRouteUpdate, 
  routeInfo, 
  showMobileRouteInfo, 
  setShowMobileRouteInfo 
}: BridgeInterfaceProps) {
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState("XLM");
  const [toToken, setToToken] = useState("ETH");
  const [fromNetwork, setFromNetwork] = useState("stellar");
  const [toNetwork, setToNetwork] = useState("sepolia");
  const [selectedRoute, setSelectedRoute] = useState<"direct" | "multi-hop">("direct");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className="relative">
      {/* Collapse Toggle Button - Outside main container */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute right-20 top-4 z-[100] w-10 h-10 bg-gradient-to-r from-stellar to-ethereum hover:from-stellar/80 hover:to-ethereum/80 rounded-xl border-2 border-white/40 shadow-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm hover:scale-110"
      >
        {isSidebarCollapsed ? (
          <ArrowDownUp className="w-4 h-4 text-white" />
        ) : (
          <Route className="w-4 h-4 text-white" />
        )}
      </button>

      {/* Integrated Swapper with Sidebar Layout */}
      <Card className="glass-card rounded-xl border border-white/10 w-full max-w-4xl mx-auto relative overflow-visible">
        <CardContent className="p-0 overflow-visible">
          <div className="flex h-[600px] overflow-visible">
            {/* Main Swapper Content */}
            <div className="flex-1 p-4 overflow-visible">
              <div className="space-y-4">


                {/* From Section */}
                <div className={`glass-card rounded-lg p-3 border ${fromNetwork === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-muted-foreground">From</label>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Balance: {fromNetwork === "stellar" ? stellarWallet.balance : sepoliaWallet.balance || "0"}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleMaxClick}
                        className="h-6 px-2 text-xs hover:bg-white/10"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
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
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSwapNetworks}
                    className="group h-10 w-10 rounded-full glass-card border border-white/10 hover:bg-white/10 hover:scale-105 transition-all"
                  >
                    <ArrowDownUp className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors group-hover:rotate-180 transform duration-300" />
                  </Button>
                </div>

                {/* To Section */}
                <div className={`glass-card rounded-lg p-3 border ${toNetwork === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-muted-foreground">To</label>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Balance: {toNetwork === "stellar" ? stellarWallet.balance : sepoliaWallet.balance || "0"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
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
            </div>

            {/* Right Sidebar Panel - Route Selection */}
            <div className={`${isSidebarCollapsed ? 'w-12' : 'w-80'} bg-stellar/10 rounded-r-xl border-l border-white/10 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out relative`}>

              <div className={`${isSidebarCollapsed ? 'hidden' : 'block'} p-4 space-y-4 overflow-y-auto flex-1`}>
                {/* Route Selection Dropdown */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Select Route</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-stellar/10 border-stellar/30 hover:bg-stellar/20 text-white"
                      >
                        <div className="flex items-center space-x-2">
                          {selectedRoute === "direct" ? (
                            <Route className="w-4 h-4 text-stellar" />
                          ) : (
                            <Zap className="w-4 h-4 text-ethereum" />
                          )}
                          <div className="text-left">
                            <div className="text-xs font-medium">
                              {selectedRoute === "direct" ? "Direct Bridge" : "Multi-hop"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {selectedRoute === "direct" ? "Stellar → Ethereum" : "Via DEX Aggregator"}
                            </div>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 bg-background/95 backdrop-blur-sm border-white/10">
                      <DropdownMenuLabel className="text-white">Route Options</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => setSelectedRoute("direct")}
                        className="focus:bg-stellar/20 focus:text-white cursor-pointer"
                      >
                        <Route className="w-4 h-4 mr-3 text-stellar" />
                        <div>
                          <div className="font-medium text-white">Direct Bridge</div>
                          <div className="text-xs text-muted-foreground">Stellar → Ethereum</div>
                          <div className="text-xs text-green-400 mt-1">Fastest • Lower fees</div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedRoute("multi-hop")}
                        className="focus:bg-ethereum/20 focus:text-white cursor-pointer"
                      >
                        <Zap className="w-4 h-4 mr-3 text-ethereum" />
                        <div>
                          <div className="font-medium text-white">Multi-hop</div>
                          <div className="text-xs text-muted-foreground">Via DEX Aggregator</div>
                          <div className="text-xs text-blue-400 mt-1">Better rates • More liquidity</div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Chain Visualization */}
                <div className="text-center p-4 bg-background/20 rounded-lg border border-white/10">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Chain</div>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-stellar/20 flex items-center justify-center">
                      <img src="/stellar-logo.webp" alt="Stellar" className="w-6 h-6 object-contain" />
                    </div>
                    <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
                    <div className="w-4 h-4 border border-white/30 rotate-45"></div>
                    <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
                    <div className="w-8 h-8 rounded-full bg-ethereum/20 flex items-center justify-center">
                      <SiEthereum className="w-4 h-4 text-ethereum" />
                    </div>
                  </div>
                </div>

                {/* Additional Info Panel */}
                <div className="bg-background/20 rounded-lg p-3 border border-white/10">
                  <h4 className="text-xs font-medium text-white mb-2">Additional Info</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Network Status</span>
                      <span className="text-green-400">Live</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Volume</span>
                      <span>$2.4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Routes</span>
                      <span>12</span>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
                  <h4 className="text-xs font-medium text-white mb-2">Recent Transactions</h4>
                  <div className="space-y-2">
                    {/* Transaction Item 1 */}
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-stellar/20 flex items-center justify-center">
                            <img src="/stellar-logo.webp" alt="Stellar" className="w-4 h-4 object-contain" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white flex items-center space-x-1">
                              <img src="/stellar-logo.webp" alt="XLM" className="w-3 h-3 object-contain" />
                              <span>→</span>
                              <img src="/ethereum-logo.svg" alt="ETH" className="w-3 h-3 object-contain" />
                            </div>
                            <div className="text-xs text-muted-foreground">2h ago</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-green-400">✓</div>
                          <div className="text-xs text-muted-foreground">100</div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Item 2 */}
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-ethereum/20 flex items-center justify-center">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" fill="#627eea"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white flex items-center space-x-1">
                              <img src="/ethereum-logo.svg" alt="ETH" className="w-3 h-3 object-contain" />
                              <span>→</span>
                              <img src="/stellar-logo.webp" alt="XLM" className="w-3 h-3 object-contain" />
                            </div>
                            <div className="text-xs text-muted-foreground">1d ago</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-green-400">✓</div>
                          <div className="text-xs text-muted-foreground">0.5</div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Item 3 */}
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-stellar/20 flex items-center justify-center">
                            <img src="/stellar-logo.webp" alt="Stellar" className="w-4 h-4 object-contain" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white flex items-center space-x-1">
                              <img src="/stellar-logo.webp" alt="XLM" className="w-3 h-3 object-contain" />
                              <span>→</span>
                              <img src="/ethereum-logo.svg" alt="ETH" className="w-3 h-3 object-contain" />
                            </div>
                            <div className="text-xs text-muted-foreground">3d ago</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-yellow-400">⏳</div>
                          <div className="text-xs text-muted-foreground">250</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Collapsed State Icon */}
              {isSidebarCollapsed && (
                <div className="p-2 flex flex-col items-center space-y-3 mt-12">
                  <div className="w-6 h-6 rounded bg-stellar/20 flex items-center justify-center">
                    <Route className="w-3 h-3 text-stellar" />
                  </div>
                  <div className="w-6 h-6 rounded bg-background/20 flex items-center justify-center">
                    <img src="/stellar-logo.webp" alt="Stellar" className="w-4 h-4 object-contain" />
                  </div>
                  <div className="w-6 h-6 rounded bg-ethereum/20 flex items-center justify-center">
                    <SiEthereum className="w-3 h-3 text-ethereum" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Information Panel - Pops from far right side */}
      <div className="hidden lg:block absolute left-full top-0 ml-4 z-30">
        {routeInfo?.isVisible && (
          <>
            <div className="absolute right-full top-6 w-4 h-0.5 bg-gradient-to-r from-white/20 to-transparent"></div>
            <RouteInfoPanel {...routeInfo} />
          </>
        )}
      </div>

      {/* Mobile Route Info Toggle */}
      {routeInfo?.isVisible && (
        <div className="mt-4 lg:hidden">
          <Button
            variant="outline"
            onClick={() => setShowMobileRouteInfo?.(!showMobileRouteInfo)}
            className="w-full glass-card border-white/10"
          >
            <Info className="w-4 h-4 mr-2" />
            {showMobileRouteInfo ? "Hide" : "Show"} Route Details
          </Button>
          
          {showMobileRouteInfo && (
            <div className="mt-4">
              <RouteInfoPanel {...routeInfo} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}