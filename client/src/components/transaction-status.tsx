import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { Transaction } from "@shared/schema";
import { useWallet } from "@/hooks/use-wallet";

export function TransactionStatus() {
  const { stellarWallet, sepoliaWallet } = useWallet();
  const walletAddress = stellarWallet.address || sepoliaWallet.address;

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/wallet", walletAddress],
    enabled: !!walletAddress,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'confirming':
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'confirming':
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'confirming':
        return 'Confirming (2/3)';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card rounded-2xl border border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3 glass-card rounded-lg border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-muted/20 rounded-full"></div>
                    <div className="h-4 bg-muted/20 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-muted/20 rounded w-16"></div>
                </div>
                <div className="h-3 bg-muted/20 rounded w-32 mb-1"></div>
                <div className="h-3 bg-muted/20 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-2xl border border-white/10">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-yellow-500" />
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {transactions?.slice(0, 3).map((tx) => (
            <div key={tx.id} className="p-3 glass-card rounded-lg border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === 'pending' || tx.status === 'confirming' ? 'animate-pulse' : ''
                  } ${
                    tx.status === 'completed' ? 'bg-green-500' :
                    tx.status === 'confirming' || tx.status === 'pending' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    Bridge {tx.fromToken} → {tx.toToken}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(tx.createdAt!)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {tx.fromAmount} {tx.fromToken} → {tx.toAmount ? `${tx.toAmount} ${tx.toToken}` : 'Processing...'}
              </div>
              <div className={`text-xs mt-1 ${getStatusColor(tx.status)}`}>
                {getStatusIcon(tx.status)} {getStatusText(tx.status)}
              </div>
            </div>
          ))}

          {!transactions?.length && walletAddress && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No transactions yet
            </div>
          )}

          {!walletAddress && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Connect wallet to view transactions
            </div>
          )}
        </div>
        
        {transactions?.length && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-stellar hover:text-stellar/80 text-sm font-medium"
          >
            View All Transactions <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
