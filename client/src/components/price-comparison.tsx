import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Star, Coins, Layers } from "lucide-react";
import { DexPrice } from "@shared/schema";

export function PriceComparison() {
  const { data: prices, isLoading } = useQuery<DexPrice[]>({
    queryKey: ["/api/dex-prices/XLM/ETH"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getDexIcon = (dexName: string) => {
    switch (dexName.toLowerCase()) {
      case 'stellarx':
        return <Star className="w-4 h-4 text-stellar" />;
      case 'stellarterm':
        return <Coins className="w-4 h-4 text-ethereum" />;
      case 'allbridge':
        return <Layers className="w-4 h-4 text-purple-500" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getPriceChange = (rate: string, baseRate?: string) => {
    if (!baseRate) return "+0.08%";
    const current = parseFloat(rate);
    const base = parseFloat(baseRate);
    const change = ((current - base) / base) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card rounded-2xl border border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-stellar" />
            Best Prices
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3 glass-card rounded-lg border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted/20"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted/20 rounded w-20"></div>
                      <div className="h-3 bg-muted/20 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 bg-muted/20 rounded w-16"></div>
                    <div className="h-3 bg-muted/20 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestRate = prices?.[0]?.rate;

  return (
    <Card className="glass-card rounded-2xl border border-white/10">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-stellar" />
          Best Prices
        </h3>
        
        <div className="space-y-3">
          {prices?.map((price, index) => (
            <div
              key={price.id}
              className="flex items-center justify-between p-3 glass-card rounded-lg border border-white/5 hover:bg-white/5 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center">
                  {getDexIcon(price.dexName)}
                </div>
                <div>
                  <div className="font-medium text-white">{price.dexName}</div>
                  <div className="text-xs text-muted-foreground">
                    {index === 0 ? "Best Rate" : "Alternative"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">{price.rate}</div>
                <div className={`text-xs ${
                  index === 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {getPriceChange(price.rate, bestRate)}
                </div>
              </div>
            </div>
          ))}
          
          {!prices?.length && (
            <div className="text-center py-4 text-muted-foreground">
              No price data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
