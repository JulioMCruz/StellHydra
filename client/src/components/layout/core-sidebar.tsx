import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Route, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DexPrice } from "@shared/schema";

interface CoreSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CoreSidebar({ isCollapsed, onToggle }: CoreSidebarProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>("best");

  const { data: prices } = useQuery<DexPrice[]>({
    queryKey: ["/api/dex-prices/XLM/ETH"],
    refetchInterval: 30000,
  });

  const routeOptions = [
    { id: "best", label: "Best Rate", icon: "⭐" },
    { id: "fastest", label: "Fastest", icon: "⚡" },
    { id: "cheapest", label: "Cheapest", icon: "💰" },
    { id: "secure", label: "Most Secure", icon: "🔒" },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 h-full bg-blue-100 border-r border-blue-300 flex flex-col">
        <div className="p-3 border-b border-blue-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full p-2 hover:bg-blue-200 text-blue-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 p-2 space-y-2">
          <div className="w-8 h-8 bg-blue-200 rounded-lg mx-auto"></div>
          <div className="w-8 h-8 bg-blue-200 rounded-lg mx-auto"></div>
          <div className="w-8 h-8 bg-blue-200 rounded-lg mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-blue-100 border-r border-blue-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-blue-300 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-blue-900">Select Routes</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-blue-200 text-blue-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Route Selection Buttons */}
      <div className="p-4 space-y-3">
        {routeOptions.map((route) => (
          <Button
            key={route.id}
            variant={selectedRoute === route.id ? "default" : "outline"}
            className={`w-full justify-start h-12 ${
              selectedRoute === route.id 
                ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-600" 
                : "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300"
            }`}
            onClick={() => setSelectedRoute(route.id)}
          >
            <span className="mr-3 text-base">{route.icon}</span>
            <span className="font-medium">{route.label}</span>
            {route.id === "best" && prices && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {prices[0]?.rate || "1.0"} ETH
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Additional Info Section */}
      <div className="flex-1 m-4 bg-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Additional Info
        </h3>
        
        <div className="space-y-3 text-sm text-blue-800">
          {selectedRoute === "best" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span className="font-medium">1 XLM = {prices?.[0]?.rate || "0.0004"} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Bridge Fee:</span>
                <span className="font-medium">0.1%</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Time:</span>
                <span className="font-medium">2-5 min</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage:</span>
                <span className="font-medium">0.5%</span>
              </div>
            </div>
          )}
          
          {selectedRoute === "fastest" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Est. Time:</span>
                <span className="font-medium">30 sec</span>
              </div>
              <div className="flex justify-between">
                <span>Priority Fee:</span>
                <span className="font-medium">+0.2%</span>
              </div>
            </div>
          )}
          
          {selectedRoute === "cheapest" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Fees:</span>
                <span className="font-medium">0.05%</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Time:</span>
                <span className="font-medium">5-10 min</span>
              </div>
            </div>
          )}
          
          {selectedRoute === "secure" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Security Score:</span>
                <span className="font-medium">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span>Validator Count:</span>
                <span className="font-medium">145</span>
              </div>
            </div>
          )}
          
          <div className="pt-2 mt-3 border-t border-blue-300">
            <div className="text-xs text-blue-600">
              Real-time data from {prices?.length || 3} DEX sources
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}