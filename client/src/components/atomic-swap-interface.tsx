import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownUp, Shield, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { TokenSelector } from "./token-selector";
import { useWallet } from "@/hooks/use-wallet";
import { 
  useAtomicSwap, 
  useAtomicSwapStatus, 
  useAtomicSwaps, 
  useRelayerMetrics,
  AtomicSwapRequest 
} from "@/hooks/use-atomic-swap";
import { SystemHealthMonitor } from "./system-health-monitor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
    case 'refunded':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'initiated':
    case 'escrows_created':
    case 'escrows_locked':
      return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'failed':
    case 'refunded':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'initiated':
    case 'escrows_created':
    case 'escrows_locked':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getProgressValue = (status: string) => {
  switch (status) {
    case 'initiated':
      return 25;
    case 'escrows_created':
      return 50;
    case 'escrows_locked':
      return 75;
    case 'completed':
      return 100;
    case 'failed':
    case 'refunded':
      return 0;
    default:
      return 0;
  }
};

export function AtomicSwapInterface() {
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState("XLM");
  const [toToken, setToToken] = useState("ETH");
  const [fromChain, setFromChain] = useState<'stellar' | 'ethereum'>("stellar");
  const [toChain, setToChain] = useState<'stellar' | 'ethereum'>("ethereum");
  const [timelock, setTimelock] = useState("3600");

  const { stellarWallet, sepoliaWallet } = useWallet();
  
  // Debug wallet state
  console.log("AtomicSwapInterface - Stellar wallet state:", stellarWallet);
  console.log("AtomicSwapInterface - Sepolia wallet state:", sepoliaWallet);
  const { 
    initiateSwap, 
    isInitiating, 
    completeSwap, 
    isCompleting, 
    refundSwap, 
    isRefunding,
    activeSwapId,
    setActiveSwapId 
  } = useAtomicSwap();

  const { data: swapStatus, isLoading: isLoadingStatus } = useAtomicSwapStatus(
    activeSwapId, 
    !!activeSwapId
  );

  const { data: allSwaps, isLoading: isLoadingSwaps } = useAtomicSwaps();
  const { data: relayerMetrics } = useRelayerMetrics();

  const handleSwapChains = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromChain(toChain);
    setToChain(fromChain);
    setFromAmount("");
  };

  const handleMaxClick = () => {
    const balance = fromChain === "stellar" ? stellarWallet.balance : sepoliaWallet.balance;
    setFromAmount(balance || "0");
  };

  const handleInitiateSwap = () => {
    const userAddress = fromChain === "stellar" ? stellarWallet.address : sepoliaWallet.address;
    const counterpartyAddress = toChain === "stellar" ? stellarWallet.address : sepoliaWallet.address;
    
    if (!userAddress) {
      return;
    }

    // Calculate estimated toAmount (simplified for MVP)
    const toAmount = (parseFloat(fromAmount) * 0.98).toString(); // 2% fee simulation

    const swapRequest: AtomicSwapRequest = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      userAddress,
      counterpartyAddress,
      timelock: parseInt(timelock),
    };

    initiateSwap(swapRequest);
  };

  const canInitiateSwap = 
    fromAmount && 
    parseFloat(fromAmount) > 0 && 
    fromChain !== toChain &&
    (stellarWallet.isConnected || sepoliaWallet.isConnected);

  return (
    <div className="space-y-6">
      {/* System Health Monitor */}
      <SystemHealthMonitor />

      {/* Main Swap Interface */}
      <Card className="glass-card rounded-xl border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-stellar" />
            Atomic Swap
            <Badge variant="outline" className="ml-auto">
              Cross-Chain HTLC
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Section */}
          <div className={`glass-card rounded-lg p-4 border ${fromChain === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground">From Chain</label>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Balance: {fromChain === 'stellar' ? stellarWallet.balance || '0' : sepoliaWallet.balance || '0'}
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
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  fromChain === 'stellar' ? 'bg-stellar/20' : 'bg-ethereum/20'
                }`}>
                  <span className={`text-xs font-bold ${
                    fromChain === 'stellar' ? 'text-stellar' : 'text-ethereum'
                  }`}>
                    {fromChain === 'stellar' ? 'S' : 'E'}
                  </span>
                </div>
                <span className="text-sm font-medium capitalize">{fromChain}</span>
              </div>
              
              <TokenSelector
                selectedToken={fromToken}
                onTokenSelect={setFromToken}
                network={fromChain}
              />
              
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

          {/* Swap Direction Indicator */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwapChains}
              className="glass-card w-12 h-12 rounded-full border border-white/20 hover:bg-white/10 transition-all group"
            >
              <ArrowDownUp className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors group-hover:rotate-180 transform duration-300" />
            </Button>
          </div>

          {/* To Section */}
          <div className={`glass-card rounded-lg p-4 border ${toChain === 'stellar' ? 'border-stellar/20' : 'border-ethereum/20'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground">To Chain</label>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Balance: {toChain === 'stellar' ? stellarWallet.balance || '0' : sepoliaWallet.balance || '0'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  toChain === 'stellar' ? 'bg-stellar/20' : 'bg-ethereum/20'
                }`}>
                  <span className={`text-xs font-bold ${
                    toChain === 'stellar' ? 'text-stellar' : 'text-ethereum'
                  }`}>
                    {toChain === 'stellar' ? 'S' : 'E'}
                  </span>
                </div>
                <span className="text-sm font-medium capitalize">{toChain}</span>
              </div>
              
              <TokenSelector
                selectedToken={toToken}
                onTokenSelect={setToToken}
                network={toChain}
              />
              
              <div className="flex-1 text-lg font-semibold text-right">
                {fromAmount ? (parseFloat(fromAmount) * 0.98).toFixed(4) : "0.0"}
              </div>
            </div>
          </div>

          {/* Timelock Setting */}
          <div className="glass-card rounded-lg p-4 border border-white/10">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Timelock (seconds)
            </label>
            <Input
              type="number"
              value={timelock}
              onChange={(e) => setTimelock(e.target.value)}
              className="bg-transparent"
              min="300"
              max="86400"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Time limit for completing the swap (300s - 24h)
            </p>
          </div>

          {/* Wallet Status */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Stellar Wallet</span>
              <span className={stellarWallet.isConnected ? "text-green-400" : "text-red-400"}>
                {stellarWallet.isConnected 
                  ? `Connected (${stellarWallet.selectedWalletId || "Unknown"})` 
                  : "Disconnected"
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sepolia Wallet</span>
              <span className={sepoliaWallet.isConnected ? "text-green-400" : "text-red-400"}>
                {sepoliaWallet.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleInitiateSwap}
            disabled={!canInitiateSwap || isInitiating}
            className="w-full bg-gradient-to-r from-stellar to-ethereum hover:from-stellar/80 hover:to-ethereum/80 text-white font-medium py-3 rounded-lg transition-all"
          >
            {isInitiating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            {isInitiating ? "Initiating Atomic Swap..." : "Initiate Atomic Swap"}
          </Button>

          {!stellarWallet.isConnected && !sepoliaWallet.isConnected && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Connect your wallet to initiate atomic swaps
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Active Swap Status */}
      {activeSwapId && swapStatus && (
        <Card className="glass-card rounded-xl border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(swapStatus.swap.status)}
              Swap Status: {activeSwapId}
              <Badge className={getStatusColor(swapStatus.swap.status)}>
                {swapStatus.swap.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{getProgressValue(swapStatus.swap.status)}%</span>
              </div>
              <Progress 
                value={getProgressValue(swapStatus.swap.status)} 
                className="h-2"
              />
            </div>

            {/* Escrow Details */}
            {swapStatus.swap.stellarEscrow && (
              <div className="glass-card rounded-lg p-3 border border-stellar/20">
                <h4 className="text-sm font-medium text-stellar mb-2">Stellar Escrow</h4>
                <div className="text-xs space-y-1">
                  <div>ID: {swapStatus.swap.stellarEscrow.id}</div>
                  <div>Status: {swapStatus.swap.stellarEscrow.status}</div>
                  <div>Amount: {swapStatus.swap.stellarEscrow.amount} {swapStatus.swap.stellarEscrow.token}</div>
                </div>
              </div>
            )}

            {swapStatus.swap.ethereumEscrow && (
              <div className="glass-card rounded-lg p-3 border border-ethereum/20">
                <h4 className="text-sm font-medium text-ethereum mb-2">Ethereum Escrow</h4>
                <div className="text-xs space-y-1">
                  <div>ID: {swapStatus.swap.ethereumEscrow.id}</div>
                  <div>Status: {swapStatus.swap.ethereumEscrow.status}</div>
                  <div>Amount: {swapStatus.swap.ethereumEscrow.amount} {swapStatus.swap.ethereumEscrow.token}</div>
                </div>
              </div>
            )}

            {/* Relayer Tasks */}
            {swapStatus.relayerTasks.length > 0 && (
              <div className="glass-card rounded-lg p-3 border border-white/10">
                <h4 className="text-sm font-medium mb-2">Relayer Tasks</h4>
                <div className="space-y-2">
                  {swapStatus.relayerTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-xs">
                      <span>{task.type} ({task.chain})</span>
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => completeSwap(activeSwapId)}
                disabled={isCompleting || swapStatus.swap.status !== 'escrows_locked'}
                variant="outline"
                className="flex-1"
              >
                {isCompleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Complete Swap
              </Button>
              <Button
                onClick={() => refundSwap(activeSwapId)}
                disabled={isRefunding || swapStatus.swap.status === 'completed'}
                variant="destructive"
                className="flex-1"
              >
                {isRefunding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Refund
              </Button>
            </div>

            {swapStatus.swap.error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{swapStatus.swap.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Relayer Metrics */}
      {relayerMetrics && (
        <Card className="glass-card rounded-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-sm">Relayer Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Success Rate</div>
                <div className="font-semibold">{relayerMetrics.metrics.successRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Tasks</div>
                <div className="font-semibold">{relayerMetrics.metrics.totalTasks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending</div>
                <div className="font-semibold">{relayerMetrics.metrics.pendingTasks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Time</div>
                <div className="font-semibold">{relayerMetrics.metrics.averageExecutionTime.toFixed(0)}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Swaps */}
      {allSwaps && allSwaps.swaps.length > 0 && (
        <Card className="glass-card rounded-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-sm">Recent Swaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allSwaps.swaps.slice(0, 5).map((swap: any) => (
                <div 
                  key={swap.swapId} 
                  className="flex items-center justify-between p-2 glass-card rounded border border-white/10 cursor-pointer hover:bg-white/5"
                  onClick={() => setActiveSwapId(swap.swapId)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(swap.status)}
                    <span className="text-sm font-mono">{swap.swapId.slice(0, 8)}...</span>
                  </div>
                  <Badge className={getStatusColor(swap.status)}>
                    {swap.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}