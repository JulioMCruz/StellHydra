import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { BridgeInterface } from "@/components/bridge-interface-new";
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
        <div className="w-full max-w-screen-lg min-w-screen-sm">
          <BridgeInterface 
            onRouteUpdate={setRouteInfo} 
            routeInfo={routeInfo}
            showMobileRouteInfo={showMobileRouteInfo}
            setShowMobileRouteInfo={setShowMobileRouteInfo}
          />
        </div>
      </div>
    </MainLayout>
  );
}
