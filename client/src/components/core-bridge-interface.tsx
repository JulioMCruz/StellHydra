import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, RotateCcw } from "lucide-react";
import { TokenSelector } from "./token-selector";
import { useBridge } from "@/hooks/use-bridge";
import { useWallet } from "@/hooks/use-wallet";

export function CoreBridgeInterface() {
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState("XLM");
  const [toToken, setToToken] = useState("ETH");
  const [fromNetwork, setFromNetwork] = useState("stellar");
  const [toNetwork, setToNetwork] = useState("sepolia");

  const { stellarWallet, sepoliaWallet } = useWallet();
  const { simulation, isSimulating, executeBridge, isExecuting } = useBridge({
    fromToken,
    toToken,
    fromAmount,
    fromNetwork,
    toNetwork,
    walletAddress: stellarWallet.address || sepoliaWallet.address || "",
  });

  const handleSwapNetworks = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromNetwork(toNetwork);
    setToNetwork(fromNetwork);
    setFromAmount("");
  };

  const canBridge = fromAmount && parseFloat(fromAmount) > 0 && (stellarWallet.isConnected || sepoliaWallet.isConnected);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Chain Visualization */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 inline-block">
            Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="flex items-center justify-center space-x-8 py-8">
            {/* From Chain */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full border-2 border-gray-400 bg-white flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-sm font-medium text-gray-700">Stellar</div>
            </div>

            {/* Arrow */}
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* Bridge Icon */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rotate-45 border-2 border-gray-400 bg-white"></div>
              <div className="text-xs text-gray-500">Bridge</div>
            </div>

            {/* Arrow */}
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* To Chain */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full border-2 border-gray-400 bg-white flex items-center justify-center">
                <span className="text-2xl">◆</span>
              </div>
              <div className="text-sm font-medium text-gray-700">Ethereum</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Options and History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route Options */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">Route Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Amount */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">From Amount</label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="flex-1 h-12 bg-white border-gray-300 rounded-lg"
                  inputMode="decimal"
                />
                <div className="w-20 h-12 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-sm font-medium text-gray-700">
                  {fromToken}
                </div>
              </div>
            </div>

            {/* To Amount */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">To Amount</label>
              <div className="flex space-x-2">
                <div className="flex-1 h-12 bg-gray-50 border border-gray-300 rounded-lg flex items-center px-3 text-gray-700">
                  {isSimulating ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    simulation?.toAmount || "0.0"
                  )}
                </div>
                <div className="w-20 h-12 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-sm font-medium text-gray-700">
                  {toToken}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapNetworks}
                className="p-2 rounded-full border-gray-300 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Bridge Button */}
            <Button
              onClick={executeBridge}
              disabled={!canBridge || isExecuting}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
            >
              {isExecuting ? "Processing..." : "Bridge Tokens"}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Sample History Items */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-gray-700">100 XLM → 0.04 ETH</div>
                </div>
                <div className="text-xs text-gray-500">2min ago</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="text-sm text-gray-700">50 XLM → 0.02 ETH</div>
                </div>
                <div className="text-xs text-gray-500">1h ago</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-gray-700">200 XLM → 0.08 ETH</div>
                </div>
                <div className="text-xs text-gray-500">3h ago</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm text-gray-700">75 XLM → 0.03 ETH</div>
                </div>
                <div className="text-xs text-gray-500">1d ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}