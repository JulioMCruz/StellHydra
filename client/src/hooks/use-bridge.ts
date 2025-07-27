import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BridgeParams {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromNetwork: string;
  toNetwork: string;
  walletAddress: string;
}

interface BridgeSimulation {
  fromAmount: string;
  toAmount: string;
  rate: string;
  fee: string;
  dexSource: string;
  estimatedTime: string;
  priceImpact: string;
  minimumReceived: string;
}

export function useBridge(params: BridgeParams) {
  const [simulation, setSimulation] = useState<BridgeSimulation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate bridge transaction
  const { 
    mutate: simulateBridge, 
    isPending: isSimulating 
  } = useMutation({
    mutationFn: async (simulationParams: BridgeParams) => {
      const response = await apiRequest("POST", "/api/bridge/simulate", simulationParams);
      return response.json();
    },
    onSuccess: (data) => {
      setSimulation(data);
    },
    onError: (error: any) => {
      console.error("Simulation failed:", error);
      setSimulation(null);
    },
  });

  // Execute bridge transaction
  const { 
    mutate: executeBridge, 
    isPending: isExecuting 
  } = useMutation({
    mutationFn: async () => {
      if (!simulation || !params.walletAddress) {
        throw new Error("Missing simulation or wallet address");
      }

      // Create transaction record
      const transactionData = {
        walletAddress: params.walletAddress,
        fromNetwork: params.fromNetwork,
        toNetwork: params.toNetwork,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: simulation.toAmount,
        status: "pending",
        dexSource: simulation.dexSource,
        fee: simulation.fee,
        estimatedTime: simulation.estimatedTime,
      };

      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: (transaction) => {
      toast({
        title: "Bridge Transaction Initiated",
        description: `Bridging ${params.fromAmount} ${params.fromToken} to ${params.toToken}`,
      });

      // Invalidate transactions query to refresh history
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transactions/wallet", params.walletAddress] 
      });

      // Simulate transaction progress
      setTimeout(() => {
        updateTransactionStatus(transaction.id, "confirming");
        
        setTimeout(() => {
          updateTransactionStatus(transaction.id, "completed", `tx_${Date.now()}`);
        }, 30000); // Complete after 30 seconds
      }, 5000); // Start confirming after 5 seconds
    },
    onError: (error: any) => {
      toast({
        title: "Bridge Failed",
        description: error.message || "Failed to execute bridge transaction",
        variant: "destructive",
      });
    },
  });

  const updateTransactionStatus = async (txId: string, status: string, txHash?: string) => {
    try {
      await apiRequest("PATCH", `/api/transactions/${txId}/status`, { 
        status, 
        txHash 
      });
      
      // Invalidate queries to refresh transaction history
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transactions/wallet", params.walletAddress] 
      });

      if (status === "completed") {
        toast({
          title: "Bridge Completed",
          description: "Your tokens have been successfully bridged!",
        });
      }
    } catch (error) {
      console.error("Failed to update transaction status:", error);
    }
  };

  // Auto-simulate when parameters change
  useEffect(() => {
    if (
      params.fromAmount && 
      parseFloat(params.fromAmount) > 0 && 
      params.fromToken && 
      params.toToken &&
      params.fromNetwork &&
      params.toNetwork
    ) {
      const timeoutId = setTimeout(() => {
        simulateBridge(params);
      }, 500); // Debounce simulation calls

      return () => clearTimeout(timeoutId);
    } else {
      setSimulation(null);
    }
  }, [params.fromAmount, params.fromToken, params.toToken, params.fromNetwork, params.toNetwork]);

  return {
    simulation,
    isSimulating,
    executeBridge: () => executeBridge(),
    isExecuting,
  };
}
