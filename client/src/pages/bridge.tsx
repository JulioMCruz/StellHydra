import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { BridgeInterface } from "@/components/bridge-interface";
import { RouteInfoPanel } from "@/components/route-info-panel";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export default function Bridge() {
  const [routeInfo, setRouteInfo] = useState<{
    fromToken: string;
    toToken: string;
    fromNetwork: string;
    toNetwork: string;
    fromAmount: string;
    simulation: any;
    isVisible: boolean;
  }>({
    fromToken: "XLM",
    toToken: "ETH",
    fromNetwork: "stellar",
    toNetwork: "ethereum",
    fromAmount: "",
    simulation: null,
    isVisible: false
  });

  const [showMobileRouteInfo, setShowMobileRouteInfo] = useState(false);

  return (
    <MainLayout>
      <div className="flex justify-center items-start min-h-full p-4 lg:p-6 lg:pr-80">
        <div className="relative">
          {/* Bridge Interface Container */}
          <div className="w-full max-w-md">
            <BridgeInterface onRouteUpdate={setRouteInfo} />
            
            {/* Mobile Route Info Toggle */}
            {routeInfo.isVisible && (
              <div className="mt-4 lg:hidden">
                <Button
                  variant="outline"
                  onClick={() => setShowMobileRouteInfo(!showMobileRouteInfo)}
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

          {/* Desktop Route Information Panel - Floating from the right */}
          <div className="hidden lg:block absolute left-full top-0 ml-4 z-20">
            {/* Connector line */}
            {routeInfo.isVisible && (
              <div className="absolute right-full top-6 w-4 h-0.5 bg-gradient-to-r from-white/20 to-transparent"></div>
            )}
            <RouteInfoPanel {...routeInfo} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
