import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Mock mode for demo purposes
const MOCK_MODE = true; // Set to true to enable mock responses

// Mock data generators
const generateMockSwapId = () => `mock_swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateMockSwapStatus = (swapId: string, status: string = 'initiated'): any => {
  const baseData = {
    success: true,
    swap: {
      swapId,
      status,
      fromChain: 'stellar',
      toChain: 'ethereum',
      fromToken: 'XLM',
      toToken: 'ETH',
      fromAmount: '100',
      toAmount: '0.05',
      userAddress: 'GDXT7PYMOITTDNJIF64JMSBR...',
      timelock: 3600,
      createdAt: Date.now(),
      stellarEscrow: status !== 'initiated' ? {
        id: `stellar_escrow_${swapId}`,
        status: status === 'completed' ? 'completed' : status === 'refunded' ? 'refunded' : 'locked',
        amount: '100',
        token: 'XLM'
      } : undefined,
      ethereumEscrow: status === 'escrows_created' || status === 'escrows_locked' || status === 'completed' || status === 'refunded' ? {
        id: `ethereum_escrow_${swapId}`,
        status: status === 'completed' ? 'completed' : status === 'refunded' ? 'refunded' : 'locked',
        amount: '0.05',
        token: 'ETH'
      } : undefined,
    },
    relayerTasks: [
      {
        id: `task_${swapId}_1`,
        type: 'create_stellar_escrow',
        chain: 'stellar',
        status: status === 'initiated' ? 'pending' : 'completed',
        attempts: 1,
        createdAt: Date.now()
      },
      {
        id: `task_${swapId}_2`,
        type: 'create_ethereum_escrow',
        chain: 'ethereum',
        status: status === 'initiated' ? 'pending' : status === 'escrows_created' ? 'pending' : 'completed',
        attempts: 1,
        createdAt: Date.now()
      }
    ]
  };

  if (status === 'completed') {
    baseData.swap.completedAt = Date.now();
  }

  if (status === 'refunded') {
    baseData.swap.refundedAt = Date.now();
    baseData.relayerTasks.push({
      id: `task_${swapId}_refund`,
      type: 'process_refund',
      chain: 'stellar',
      status: 'completed',
      attempts: 1,
      createdAt: Date.now()
    });
  }

  return baseData;
};

const mockSwaps = new Map<string, any>();

const mockApiCall = async (endpoint: string, method: string, data?: any): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  if (endpoint === '/api/atomic-swap/initiate' && method === 'POST') {
    const swapId = generateMockSwapId();
    const mockSwap = generateMockSwapStatus(swapId, 'initiated');
    mockSwaps.set(swapId, mockSwap);
    
    // Simulate progression through states
    setTimeout(() => {
      if (mockSwaps.has(swapId)) {
        mockSwaps.set(swapId, generateMockSwapStatus(swapId, 'escrows_created'));
      }
    }, 3000);
    
    setTimeout(() => {
      if (mockSwaps.has(swapId)) {
        mockSwaps.set(swapId, generateMockSwapStatus(swapId, 'escrows_locked'));
      }
    }, 6000);

    return { swapId, ...mockSwap.swap };
  }

  if (endpoint.startsWith('/api/atomic-swap/status/') && method === 'GET') {
    const swapId = endpoint.split('/').pop();
    if (mockSwaps.has(swapId!)) {
      return mockSwaps.get(swapId!);
    }
    return generateMockSwapStatus(swapId!, 'initiated');
  }

  if (endpoint.startsWith('/api/atomic-swap/complete/') && method === 'POST') {
    const swapId = endpoint.split('/').pop();
    const completedSwap = generateMockSwapStatus(swapId!, 'completed');
    mockSwaps.set(swapId!, completedSwap);
    return { success: true, message: 'Swap completed successfully' };
  }

  if (endpoint.startsWith('/api/atomic-swap/refund/') && method === 'POST') {
    const swapId = endpoint.split('/').pop();
    const refundedSwap = generateMockSwapStatus(swapId!, 'refunded');
    mockSwaps.set(swapId!, refundedSwap);
    return { success: true, message: 'Swap refunded successfully' };
  }

  if (endpoint === '/api/atomic-swap/all' && method === 'GET') {
    const swaps = Array.from(mockSwaps.values()).map(swap => swap.swap);
    return { success: true, swaps, count: swaps.length };
  }

  if (endpoint === '/api/atomic-swap/relayer/metrics' && method === 'GET') {
    return {
      success: true,
      metrics: {
        totalTasks: 42,
        completedTasks: 38,
        pendingTasks: 4,
        failedTasks: 0,
        successRate: 95.2,
        averageExecutionTime: 2150
      }
    };
  }

  if (endpoint === '/api/atomic-swap/health' && method === 'GET') {
    return {
      success: true,
      orchestrator: {
        status: 'healthy',
        activeSwaps: 3,
        queueStatus: {
          running: 2,
          queueLength: 1
        },
        ethereum: {
          connected: true,
          contractInitialized: true,
          circuitBreakerState: 'CLOSED',
          lastError: null
        },
        stellar: {
          connected: true,
          escrowClientInitialized: true,
          circuitBreakerState: 'CLOSED',
          lastError: null
        }
      },
      relayer: {
        status: 'healthy',
        totalTasks: 42,
        completedTasks: 38,
        pendingTasks: 4,
        successRate: 95.2
      },
      timestamp: Date.now()
    };
  }

  throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
};

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
      if (MOCK_MODE) {
        return await mockApiCall("/api/atomic-swap/initiate", "POST", swapRequest);
      }
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
      if (MOCK_MODE) {
        return await mockApiCall(`/api/atomic-swap/complete/${swapId}`, "POST", {});
      }
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
      if (MOCK_MODE) {
        return await mockApiCall(`/api/atomic-swap/refund/${swapId}`, "POST", {});
      }
      const response = await apiRequest("POST", `/api/atomic-swap/refund/${swapId}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Swap Refunded",
        description: "Swap has been refunded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["atomic-swap-status", activeSwapId] });
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
      if (MOCK_MODE) {
        return await mockApiCall(`/api/atomic-swap/status/${swapId}`, "GET");
      }
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
      if (MOCK_MODE) {
        return await mockApiCall("/api/atomic-swap/all", "GET");
      }
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
      if (MOCK_MODE) {
        return await mockApiCall("/api/atomic-swap/relayer/metrics", "GET");
      }
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
      if (MOCK_MODE) {
        return await mockApiCall("/api/atomic-swap/health", "GET");
      }
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
      if (MOCK_MODE) {
        // Return a simulation result for testing
        return {
          success: true,
          simulation: {
            estimatedTime: 45,
            gasEstimate: {
              stellar: '0.001',
              ethereum: '0.003'
            },
            successProbability: 98.5,
            recommendedTimelock: 3600
          }
        };
      }
      const response = await apiRequest("GET", "/api/atomic-swap/simulate");
      return response.json();
    },
    enabled: false, // Only fetch when explicitly requested
  });
}