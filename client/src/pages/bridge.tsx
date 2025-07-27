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
      <div className="flex justify-center items-start min-h-full p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-5xl">
          {/* Bridge Interface */}
          <div className="w-full lg:w-auto lg:max-w-md mx-auto lg:mx-0">
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
          
          {/* Desktop Route Information Panel */}
          <div className="hidden lg:block">
            <RouteInfoPanel {...routeInfo} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
