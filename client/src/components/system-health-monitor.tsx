import { useAtomicSwapHealth } from "@/hooks/use-atomic-swap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Shield,
  Clock,
  Gauge
} from "lucide-react";

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'unhealthy':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getHealthColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'degraded':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'unhealthy':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getCircuitBreakerIcon = (state: string) => {
  switch (state) {
    case 'CLOSED':
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    case 'OPEN':
      return <XCircle className="w-3 h-3 text-red-500" />;
    case 'HALF_OPEN':
      return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    default:
      return <Activity className="w-3 h-3 text-gray-500" />;
  }
};

export function SystemHealthMonitor() {
  const { data: health, isLoading, error } = useAtomicSwapHealth();

  if (isLoading) {
    return (
      <Card className="glass-card rounded-xl border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500 animate-pulse" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading health status...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card className="glass-card rounded-xl border border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            System Health
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-auto">
              ERROR
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-400 text-sm">
            Failed to fetch system health status
          </div>
        </CardContent>
      </Card>
    );
  }

  const { orchestrator, relayer, timestamp } = health;

  return (
    <Card className="glass-card rounded-xl border border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getHealthIcon(orchestrator.status)}
          System Health
          <Badge className={getHealthColor(orchestrator.status)}>
            {orchestrator.status.toUpperCase()}
          </Badge>
          <div className="ml-auto text-xs text-muted-foreground">
            Last updated: {new Date(timestamp).toLocaleTimeString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bridge Orchestrator Health */}
        <div className="glass-card rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Bridge Orchestrator
            </h4>
            <Badge className={getHealthColor(orchestrator.status)}>
              {orchestrator.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ethereum Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ethereum</span>
                <div className="flex items-center gap-2">
                  {orchestrator.ethereum.connected ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs">
                    {orchestrator.ethereum.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Contract</span>
                <div className="flex items-center gap-2">
                  {orchestrator.ethereum.contractInitialized ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs">
                    {orchestrator.ethereum.contractInitialized ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Circuit Breaker</span>
                <div className="flex items-center gap-1">
                  {getCircuitBreakerIcon(orchestrator.ethereum.circuitBreakerState)}
                  <span className="text-xs">{orchestrator.ethereum.circuitBreakerState}</span>
                </div>
              </div>

              {orchestrator.ethereum.lastError && (
                <div className="text-xs text-red-400 mt-1">
                  Error: {orchestrator.ethereum.lastError}
                </div>
              )}
            </div>

            {/* Stellar Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Stellar</span>
                <div className="flex items-center gap-2">
                  {orchestrator.stellar.connected ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs">
                    {orchestrator.stellar.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Escrow Client</span>
                <div className="flex items-center gap-2">
                  {orchestrator.stellar.escrowClientInitialized ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs">
                    {orchestrator.stellar.escrowClientInitialized ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Circuit Breaker</span>
                <div className="flex items-center gap-1">
                  {getCircuitBreakerIcon(orchestrator.stellar.circuitBreakerState)}
                  <span className="text-xs">{orchestrator.stellar.circuitBreakerState}</span>
                </div>
              </div>

              {orchestrator.stellar.lastError && (
                <div className="text-xs text-red-400 mt-1">
                  Error: {orchestrator.stellar.lastError}
                </div>
              )}
            </div>
          </div>

          {/* Operation Statistics */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{orchestrator.activeSwaps}</div>
                <div className="text-xs text-muted-foreground">Active Swaps</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{orchestrator.queueStatus.running}</div>
                <div className="text-xs text-muted-foreground">Running Ops</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{orchestrator.queueStatus.queueLength}</div>
                <div className="text-xs text-muted-foreground">Queued Ops</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {Math.max(3 - orchestrator.queueStatus.running, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Relayer Health */}
        {relayer && (
          <div className="glass-card rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Relayer Service
              </h4>
              <Badge className={getHealthColor(relayer.status)}>
                {relayer.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{relayer.totalTasks || 0}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{relayer.completedTasks || 0}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{relayer.pendingTasks || 0}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {relayer.successRate ? `${relayer.successRate.toFixed(1)}%` : '0%'}
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>

            {relayer.successRate !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Success Rate</span>
                  <span>{relayer.successRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={relayer.successRate} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* System Metrics */}
        <div className="glass-card rounded-lg p-4 border border-white/10">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4" />
            Performance Metrics
          </h4>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-400">
                {orchestrator.ethereum.connected && orchestrator.stellar.connected ? '100' : 
                 orchestrator.ethereum.connected || orchestrator.stellar.connected ? '50' : '0'}%
              </div>
              <div className="text-xs text-muted-foreground">Network Connectivity</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-400">
                {orchestrator.ethereum.circuitBreakerState === 'CLOSED' && 
                 orchestrator.stellar.circuitBreakerState === 'CLOSED' ? '100' : 
                 orchestrator.ethereum.circuitBreakerState === 'CLOSED' || 
                 orchestrator.stellar.circuitBreakerState === 'CLOSED' ? '50' : '0'}%
              </div>
              <div className="text-xs text-muted-foreground">Circuit Health</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}