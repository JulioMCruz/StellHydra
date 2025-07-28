import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface TokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  network: string;
}

export function TokenSelector({ selectedToken, onTokenSelect, network }: TokenSelectorProps) {
  const getTokens = () => {
    if (network === "stellar") {
      return [
        { symbol: "XLM", name: "Stellar Lumens", color: "bg-stellar", logo: "/stellar-logo.webp" },
        { symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
        { symbol: "yXLM", name: "yXLM", color: "bg-yellow-500" },
      ];
    } else {
      return [
        { symbol: "ETH", name: "Ethereum", color: "bg-ethereum", logo: "/ethereum-logo.svg" },
        { symbol: "USDC", name: "USD Coin", color: "bg-blue-500" },
        { symbol: "WETH", name: "Wrapped ETH", color: "bg-purple-500" },
      ];
    }
  };

  const tokens = getTokens();
  const currentToken = tokens.find(token => token.symbol === selectedToken) || tokens[0];

  return (
    <Button
      variant="ghost"
      className="flex items-center space-x-2 glass-card px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all"
    >
      <div className={`w-6 h-6 rounded-full ${currentToken.color} flex items-center justify-center`}>
        {currentToken.logo ? (
          <img src={currentToken.logo} alt={currentToken.symbol} className="w-4 h-4 object-contain" />
        ) : (
          <span className="text-xs font-bold text-white">
            {currentToken.symbol.slice(0, 2)}
          </span>
        )}
      </div>
      <span className="font-medium">{currentToken.symbol}</span>
      <ChevronDown className="w-3 h-3" />
    </Button>
  );
}
