import express from 'express';
import { bridgeOrchestrator, AtomicSwapRequest } from '../src/bridge-orchestrator';
import { atomicSwapRelayer } from '../src/relayer';

const router = express.Router();

// Enable CORS for all routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * POST /api/atomic-swap/initiate
 * Initiate a new atomic swap
 */
router.post('/initiate', async (req, res) => {
  try {
    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      userAddress,
      counterpartyAddress,
      timelock
    } = req.body;

    // Validate required fields
    if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !toAmount || !userAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'fromAmount', 'toAmount', 'userAddress']
      });
    }

    // Validate chain values
    if (!['stellar', 'ethereum'].includes(fromChain) || !['stellar', 'ethereum'].includes(toChain)) {
      return res.status(400).json({
        error: 'Invalid chain values. Must be "stellar" or "ethereum"'
      });
    }

    // Ensure cross-chain swap
    if (fromChain === toChain) {
      return res.status(400).json({
        error: 'Cross-chain swap required. fromChain and toChain must be different'
      });
    }

    const swapRequest: AtomicSwapRequest = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      userAddress,
      counterpartyAddress: counterpartyAddress || userAddress, // Default to same address
      timelock: timelock || 3600 // Default 1 hour
    };

    console.log('🚀 Initiating atomic swap:', swapRequest);

    const swapId = await bridgeOrchestrator.initiateAtomicSwap(swapRequest);

    res.json({
      success: true,
      swapId,
      message: 'Atomic swap initiated successfully',
      swapRequest
    });

  } catch (error) {
    console.error('❌ Failed to initiate atomic swap:', error);
    res.status(500).json({
      error: 'Failed to initiate atomic swap',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/atomic-swap/status/:swapId
 * Get swap status
 */
router.get('/status/:swapId', async (req, res) => {
  try {
    const { swapId } = req.params;
    
    const swap = bridgeOrchestrator.getSwapStatus(swapId);
    
    if (!swap) {
      return res.status(404).json({
        error: 'Swap not found',
        swapId
      });
    }

    // Get relayer tasks for this swap
    const relayerTasks = atomicSwapRelayer.getSwapTasks(swapId);

    res.json({
      success: true,
      swap,
      relayerTasks: relayerTasks.map(task => ({
        id: task.id,
        type: task.type,
        chain: task.chain,
        status: task.status,
        attempts: task.attempts,
        createdAt: task.createdAt,
        error: task.error
      }))
    });

  } catch (error) {
    console.error('❌ Failed to get swap status:', error);
    res.status(500).json({
      error: 'Failed to get swap status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/atomic-swap/all
 * Get all swaps (for debugging/monitoring)
 */
router.get('/all', async (req, res) => {
  try {
    const swaps = bridgeOrchestrator.getAllSwaps();
    
    res.json({
      success: true,
      swaps: swaps.map(swap => ({
        swapId: swap.swapId,
        status: swap.status,
        createdAt: swap.createdAt,
        completedAt: swap.completedAt,
        stellarEscrow: swap.stellarEscrow ? {
          id: swap.stellarEscrow.id,
          status: swap.stellarEscrow.status,
          amount: swap.stellarEscrow.amount,
          token: swap.stellarEscrow.token
        } : null,
        ethereumEscrow: swap.ethereumEscrow ? {
          id: swap.ethereumEscrow.id,
          status: swap.ethereumEscrow.status,
          amount: swap.ethereumEscrow.amount,
          token: swap.ethereumEscrow.token
        } : null,
        error: swap.error
      })),
      count: swaps.length
    });

  } catch (error) {
    console.error('❌ Failed to get all swaps:', error);
    res.status(500).json({
      error: 'Failed to get all swaps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/atomic-swap/complete/:swapId
 * Manually complete a swap (for testing)
 */
router.post('/complete/:swapId', async (req, res) => {
  try {
    const { swapId } = req.params;
    
    await bridgeOrchestrator.completeSwap(swapId);
    
    res.json({
      success: true,
      message: 'Swap completion initiated',
      swapId
    });

  } catch (error) {
    console.error('❌ Failed to complete swap:', error);
    res.status(500).json({
      error: 'Failed to complete swap',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/atomic-swap/refund/:swapId
 * Refund a failed or timed-out swap
 */
router.post('/refund/:swapId', async (req, res) => {
  try {
    const { swapId } = req.params;
    
    await bridgeOrchestrator.refundSwap(swapId);
    
    res.json({
      success: true,
      message: 'Swap refund initiated',
      swapId
    });

  } catch (error) {
    console.error('❌ Failed to refund swap:', error);
    res.status(500).json({
      error: 'Failed to refund swap',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/atomic-swap/health
 * Health check for the atomic swap system
 */
router.get('/health', async (req, res) => {
  try {
    const [orchestratorHealth, relayerHealth] = await Promise.all([
      bridgeOrchestrator.healthCheck(),
      Promise.resolve(atomicSwapRelayer.getHealthStatus())
    ]);

    const overallHealth = orchestratorHealth.status === 'healthy' && relayerHealth.healthy;

    res.json({
      success: true,
      status: overallHealth ? 'healthy' : 'unhealthy',
      orchestrator: orchestratorHealth,
      relayer: relayerHealth,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/atomic-swap/relayer/metrics
 * Get relayer performance metrics
 */
router.get('/relayer/metrics', async (req, res) => {
  try {
    const metrics = atomicSwapRelayer.getMetrics();
    const queueStatus = atomicSwapRelayer.getTaskQueueStatus();

    res.json({
      success: true,
      metrics,
      queueStatus,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Failed to get relayer metrics:', error);
    res.status(500).json({
      error: 'Failed to get relayer metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/atomic-swap/relayer/task
 * Add a custom relayer task (for testing)
 */
router.post('/relayer/task', async (req, res) => {
  try {
    const { type, swapId, chain, data, priority, delay } = req.body;

    if (!type || !swapId || !chain) {
      return res.status(400).json({
        error: 'Missing required fields: type, swapId, chain'
      });
    }

    const taskId = atomicSwapRelayer.addTask(type, swapId, chain, data, priority, delay);

    res.json({
      success: true,
      taskId,
      message: 'Task added to relayer queue'
    });

  } catch (error) {
    console.error('❌ Failed to add relayer task:', error);
    res.status(500).json({
      error: 'Failed to add relayer task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/atomic-swap/simulate
 * Simulate an atomic swap for testing (creates mock data)
 */
router.get('/simulate', async (req, res) => {
  try {
    const mockSwapRequest: AtomicSwapRequest = {
      fromChain: 'ethereum',
      toChain: 'stellar',
      fromToken: 'ETH',
      toToken: 'XLM',
      fromAmount: '0.1',
      toAmount: '100',
      userAddress: '0x742d35Cc6634C0532925a3b8D88C2F2a1e9C7e93',
      counterpartyAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
      timelock: 3600
    };

    console.log('🧪 Simulating atomic swap for testing');

    // Don't actually initiate the swap in simulation mode
    const mockSwapId = `sim_swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      simulation: true,
      swapId: mockSwapId,
      swapRequest: mockSwapRequest,
      message: 'Atomic swap simulation prepared (not executed)',
      note: 'Use POST /api/atomic-swap/initiate to execute a real swap'
    });

  } catch (error) {
    console.error('❌ Failed to simulate atomic swap:', error);
    res.status(500).json({
      error: 'Failed to simulate atomic swap',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;