import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronLeft, 
  ChevronRight, 
  Route, 
  TrendingUp, 
  History, 
  Network,
  ArrowRight,
  Clock,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DexPrice, Transaction } from "@shared/schema";
import { useWallet } from "@/hooks/use-wallet";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"routes" | "history">("routes");
  const { stellarWallet, sepoliaWallet } = useWallet();
  const walletAddress = stellarWallet.address || sepoliaWallet.address;

  const { data: prices } = useQuery<DexPrice[]>({
    queryKey: ["/api/dex-prices/XLM/ETH"],
    refetchInterval: 30000,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/wallet", walletAddress],
    enabled: !!walletAddress,
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'confirming':
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDexIcon = (dexName: string) => {
    switch (dexName.toLowerCase()) {
      case 'stellarx': return '⭐';
      case 'stellarterm': return '🔄';
      case 'allbridge': return '🌉';
      default: return '💱';
    }
  };

  return (
    <div className={`relative h-full transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
      <div className="h-full glass-card border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-stellar" />
              <span className="font-semibold">Route Analysis</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 hover:bg-white/10"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            {/* Tab Navigation */}
            <div className="p-4 border-b border-white/10">
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === "routes" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("routes")}
                  className="flex-1 h-8"
                >
                  <Route className="w-3 h-3 mr-1" />
                  Routes
                </Button>
                <Button
                  variant={activeTab === "history" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("history")}
                  className="flex-1 h-8"
                >
                  <History className="w-3 h-3 mr-1" />
                  History
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "routes" && (
                <div className="space-y-4">
                  {/* Route Visualization */}
                  <Card className="glass-card border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-stellar" />
                        Bridge Routes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {prices?.map((price, index) => (
                        <div key={price.id} className="p-3 glass-card rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getDexIcon(price.dexName)}</span>
                              <div>
                                <div className="font-medium text-sm">{price.dexName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {index === 0 ? "Best Rate" : `Alternative ${index}`}
                                </div>
                              </div>
                            </div>
                            <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                              {price.rate}
                            </Badge>
                          </div>
                          
                          {/* Route Path */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <div className="w-6 h-6 rounded-full bg-stellar flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">XLM</span>
                              </div>
                              <ArrowRight className="w-3 h-3" />
                              <div className="w-6 h-6 rounded-full bg-ethereum flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">ETH</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div>Fee: {price.fee}%</div>
                              <div>Liquidity: ${price.liquidity}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Market Stats */}
                  <Card className="glass-card border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-ethereum" />
                        Market Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 glass-card rounded border border-stellar/20">
                          <div className="text-lg font-bold text-stellar">$0.99</div>
                          <div className="text-xs text-muted-foreground">XLM/USD</div>
                          <div className="text-xs text-green-400">+2.4%</div>
                        </div>
                        <div className="text-center p-2 glass-card rounded border border-ethereum/20">
                          <div className="text-lg font-bold text-ethereum">$2,501</div>
                          <div className="text-xs text-muted-foreground">ETH/USD</div>
                          <div className="text-xs text-red-400">-0.8%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  {transactions?.slice(0, 10).map((tx) => (
                    <Card key={tx.id} className="glass-card border-white/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(tx.status)} ${
                              tx.status === 'pending' || tx.status === 'confirming' ? 'animate-pulse' : ''
                            }`}></div>
                            <span className="text-sm font-medium">
                              {tx.fromToken} → {tx.toToken}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeAgo(tx.createdAt!)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.fromAmount} {tx.fromToken} → {tx.toAmount ? `${tx.toAmount} ${tx.toToken}` : 'Processing...'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          via {tx.dexSource || 'Bridge'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {!transactions?.length && walletAddress && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No transactions yet
                    </div>
                  )}

                  {!walletAddress && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Connect wallet to view history
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-lg p-0"
              onClick={() => setActiveTab("routes")}
            >
              <Route className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 rounded-lg p-0"
              onClick={() => setActiveTab("history")}
            >
              <History className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}