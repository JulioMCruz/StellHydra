import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface AtomicSwapRequest {
  fromChain: 'stellar' | 'ethereum';
  toChain: 'stellar' | 'ethereum';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  counterpartyAddress?: string;
  timelock?: number;
}

export interface AtomicSwapStatus {
  swapId: string;
  status: 'initiated' | 'escrows_created' | 'escrows_locked' | 'completed' | 'failed' | 'refunded';
  createdAt: number;
  completedAt?: number;
  stellarEscrow?: {
    id: string;
    status: string;
    amount: string;
    token: string;
  };
  ethereumEscrow?: {
    id: string;
    status: string;
    amount: string;
    token: string;
  };
  error?: string;
}

export interface RelayerTask {
  id: string;
  type: string;
  chain: string;
  status: string;
  attempts: number;
  createdAt: number;
  error?: string;
}

export interface AtomicSwapDetails {
  swap: AtomicSwapStatus;
  relayerTasks: RelayerTask[];
}

export function useAtomicSwap() {
  const [activeSwapId, setActiveSwapId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initiate atomic swap
  const { 
    mutate: initiateSwap, 
    isPending: isInitiating,
    error: initiateError 
  } = useMutation({
    mutationFn: async (swapRequest: AtomicSwapRequest) => {
      const response = await apiRequest("POST", "/api/atomic-swap/initiate", swapRequest);
      return response.json();
    },
    onSuccess: (data) => {
      setActiveSwapId(data.swapId);
      toast({
        title: "Atomic Swap Initiated",
        description: `Swap ${data.swapId} has been initiated successfully`,
      });
      
      // Start polling for status updates
      queryClient.invalidateQueries({ queryKey: ["atomic-swap-status", data.swapId] });
    },
    onError: (error: any) => {
      console.error("Failed to initiate atomic swap:", error);
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to initiate atomic swap",
        variant: "destructive",
      });
    },
  });

  // Complete atomic swap (for testing)
  const { 
    mutate: completeSwap, 
    isPending: isCompleting 
  } = useMutation({
    mutationFn: async (swapId: string) => {
      const response = await apiRequest("POST", `/api/atomic-swap/complete/${swapId}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Swap Completed",
        description: `Swap ${data.swapId} has been completed`,
      });
      queryClient.invalidateQueries({ queryKey: ["atomic-swap-status", data.swapId] });
      queryClient.invalidateQueries({ queryKey: ["atomic-swaps"] });
    },
    onError: (error: any) => {
      toast({
        title: "Completion Failed",
        description: error.message || "Failed to complete swap",
        variant: "destructive",
      });
    },
  });

  // Refund atomic swap
  const { 
    mutate: refundSwap, 
    isPending: isRefunding 
  } = useMutation({
    mutationFn: async (swapId: string) => {
      const response = await apiRequest("POST", `/api/atomic-swap/refund/${swapId}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Swap Refunded",
        description: `Swap ${data.swapId} has been refunded`,
      });
      queryClient.invalidateQueries({ queryKey: ["atomic-swap-status", data.swapId] });
      queryClient.invalidateQueries({ queryKey: ["atomic-swaps"] });
    },
    onError: (error: any) => {
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to refund swap",
        variant: "destructive",
      });
    },
  });

  return {
    initiateSwap,
    isInitiating,
    initiateError,
    completeSwap,
    isCompleting,
    refundSwap,
    isRefunding,
    activeSwapId,
    setActiveSwapId,
  };
}

// Hook to get swap status with polling
export function useAtomicSwapStatus(swapId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["atomic-swap-status", swapId],
    queryFn: async (): Promise<AtomicSwapDetails> => {
      if (!swapId) throw new Error("No swap ID provided");
      const response = await apiRequest("GET", `/api/atomic-swap/status/${swapId}`);
      return response.json();
    },
    enabled: enabled && !!swapId,
    refetchInterval: (data) => {
      // Stop polling if swap is completed, failed, or refunded
      if (data?.swap?.status && ['completed', 'failed', 'refunded'].includes(data.swap.status)) {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    retry: 3,
  });
}

// Hook to get all atomic swaps
export function useAtomicSwaps() {
  return useQuery({
    queryKey: ["atomic-swaps"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/atomic-swap/all");
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Hook to get relayer metrics
export function useRelayerMetrics() {
  return useQuery({
    queryKey: ["relayer-metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/atomic-swap/relayer/metrics");
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

// Hook to get atomic swap system health
export function useAtomicSwapHealth() {
  return useQuery({
    queryKey: ["atomic-swap-health"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/atomic-swap/health");
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds for better monitoring
    retry: 2, // Reduce retries for health checks
    retryDelay: 1000, // Quick retry for health monitoring
  });
}

// Hook to simulate atomic swap (for testing)
export function useAtomicSwapSimulation() {
  return useQuery({
    queryKey: ["atomic-swap-simulation"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/atomic-swap/simulate");
      return response.json();
    },
    enabled: false, // Only fetch when explicitly requested
  });
}