import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Clock, Shield, ArrowRight, Zap } from "lucide-react";

interface RouteInfoPanelProps {
  fromToken: string;
  toToken: string;
  fromNetwork: string;
  toNetwork: string;
  fromAmount: string;
  simulation?: {
    toAmount: string;
    rate: string;
    fee: string;
    estimatedTime: string;
    minimumReceived: string;
  } | null;
  isVisible: boolean;
}

export function RouteInfoPanel({
  fromToken,
  toToken,
  fromNetwork,
  toNetwork,
  fromAmount,
  simulation,
  isVisible
}: RouteInfoPanelProps) {
  if (!isVisible || !simulation || !fromAmount || parseFloat(fromAmount) === 0) {
    return (
      <div className="w-full lg:w-80 opacity-0 pointer-events-none">
        {/* Invisible placeholder to maintain layout space */}
      </div>
    );
  }

  const getNetworkColor = (network: string) => {
    return network === 'stellar' ? 'text-stellar' : 'text-ethereum';
  };

  const getNetworkBadge = (network: string) => {
    return network === 'stellar' ? 'Stellar' : 'Ethereum';
  };

  return (
    <Card className="w-full lg:w-80 glass-card border border-white/10 rounded-xl animate-in slide-in-from-right-2 duration-300 shadow-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Cross-Chain Route
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Route Visualization */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">
            2 hops • Via Bridge Protocol
          </div>
          
          {/* From Network */}
          <div className="flex items-center gap-3 p-3 glass-card rounded-lg border border-white/5">
            <div className="w-8 h-8 rounded-full bg-stellar/20 flex items-center justify-center">
              <span className="text-xs font-bold text-stellar">S</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{fromToken}</div>
              <div className="text-xs text-muted-foreground">
                Amount: {fromAmount}
              </div>
              <Badge variant="outline" className={`text-xs ${getNetworkColor(fromNetwork)}`}>
                {getNetworkBadge(fromNetwork)}
              </Badge>
            </div>
          </div>

          {/* Bridge Step */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 glass-card rounded-full border border-white/10">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs">Bridge Protocol</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* To Network */}
          <div className="flex items-center gap-3 p-3 glass-card rounded-lg border border-white/5">
            <div className="w-8 h-8 rounded-full bg-ethereum/20 flex items-center justify-center">
              <span className="text-xs font-bold text-ethereum">E</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{toToken}</div>
              <div className="text-xs text-muted-foreground">
                Amount: {simulation.toAmount}
              </div>
              <Badge variant="outline" className={`text-xs ${getNetworkColor(toNetwork)}`}>
                {getNetworkBadge(toNetwork)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Route Details */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Route Summary</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Hops</div>
              <div className="text-sm font-medium">2</div>
              <Badge variant="secondary" className="text-xs">Cross-chain</Badge>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Time</div>
              <div className="text-sm font-medium">{simulation.estimatedTime}</div>
              <Badge variant="outline" className="text-xs text-yellow-400">
                <Clock className="w-3 h-3 mr-1" />
                Standard
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Bridge Fee</div>
              <div className="text-sm font-medium">{simulation.fee} {fromToken}</div>
              <Badge variant="outline" className="text-xs text-green-400">
                Competitive
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Rate</div>
              <div className="text-sm font-medium">1:{simulation.rate}</div>
              <Badge variant="outline" className="text-xs text-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Security Info */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Security</div>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Shield className="w-3 h-3" />
            <span>Cross-chain bridge verified</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Minimum received: {simulation.minimumReceived} {toToken}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}