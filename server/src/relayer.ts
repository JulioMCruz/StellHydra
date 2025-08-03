import { EventEmitter } from 'events';
import { bridgeOrchestrator, AtomicSwapState, EscrowDetails } from './bridge-orchestrator';

export interface RelayerConfig {
  monitoringInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  enableAutoRelay: boolean;
  gasLimitMultiplier: number;
}

export interface RelayTask {
  id: string;
  type: 'create_escrow' | 'lock_escrow' | 'reveal_secret' | 'complete_escrow' | 'refund_escrow';
  swapId: string;
  chain: 'stellar' | 'ethereum';
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  scheduledAt: number;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface RelayerMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  averageExecutionTime: number;
  successRate: number;
  lastProcessedAt: number;
}

export class AtomicSwapRelayer extends EventEmitter {
  private config: RelayerConfig;
  private taskQueue: RelayTask[] = [];
  private processing = false;
  private metrics: RelayerMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingTasks: 0,
    averageExecutionTime: 0,
    successRate: 0,
    lastProcessedAt: 0,
  };
  private executionTimes: number[] = [];

  constructor(config: Partial<RelayerConfig> = {}) {
    super();
    
    this.config = {
      monitoringInterval: config.monitoringInterval || 5000, // 5 seconds
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 10000, // 10 seconds
      enableAutoRelay: config.enableAutoRelay ?? true,
      gasLimitMultiplier: config.gasLimitMultiplier || 1.2,
    };

    this.initialize();
  }

  private initialize() {
    // Listen to bridge orchestrator events
    bridgeOrchestrator.on('escrowsCreated', (data) => {
      this.handleEscrowsCreated(data);
    });

    bridgeOrchestrator.on('escrowsLocked', (data) => {
      this.handleEscrowsLocked(data);
    });

    bridgeOrchestrator.on('swapCompleted', (data) => {
      this.handleSwapCompleted(data);
    });

    bridgeOrchestrator.on('swapTimeout', (data) => {
      this.handleSwapTimeout(data);
    });

    bridgeOrchestrator.on('error', (data) => {
      this.handleBridgeError(data);
    });

    // Start monitoring if auto-relay is enabled
    if (this.config.enableAutoRelay) {
      this.startMonitoring();
    }

    console.log('✅ Atomic Swap Relayer initialized with contract integration');
  }

  /**
   * Start monitoring and processing tasks
   */
  startMonitoring() {
    if (this.processing) {
      console.log('⚠️ Relayer is already monitoring');
      return;
    }

    this.processing = true;
    console.log('🔄 Starting relayer monitoring...');
    this.processTaskQueue();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.processing = false;
    console.log('⏹️ Relayer monitoring stopped');
  }

  /**
   * Process the task queue continuously
   */
  private async processTaskQueue() {
    while (this.processing) {
      try {
        await this.processPendingTasks();
        await new Promise(resolve => setTimeout(resolve, this.config.monitoringInterval));
      } catch (error) {
        console.error('❌ Error in task queue processing:', error);
        await new Promise(resolve => setTimeout(resolve, this.config.monitoringInterval));
      }
    }
  }

  /**
   * Process all pending tasks
   */
  private async processPendingTasks() {
    const pendingTasks = this.taskQueue.filter(task => 
      task.status === 'pending' && 
      task.scheduledAt <= Date.now()
    );

    if (pendingTasks.length === 0) {
      return;
    }

    console.log(`📋 Processing ${pendingTasks.length} pending tasks`);

    // Sort by priority and creation time
    pendingTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.createdAt - b.createdAt;
    });

    // Process tasks sequentially to avoid conflicts
    for (const task of pendingTasks.slice(0, 5)) { // Process max 5 tasks at a time
      await this.processTask(task);
    }

    this.updateMetrics();
  }

  /**
   * Process individual task
   */
  private async processTask(task: RelayTask) {
    const startTime = Date.now();
    task.status = 'processing';
    task.attempts++;

    try {
      console.log(`⚡ Processing task ${task.id} (${task.type}) - Attempt ${task.attempts}`);

      switch (task.type) {
        case 'create_escrow':
          await this.processCreateEscrow(task);
          break;
        case 'lock_escrow':
          await this.processLockEscrow(task);
          break;
        case 'reveal_secret':
          await this.processRevealSecret(task);
          break;
        case 'complete_escrow':
          await this.processCompleteEscrow(task);
          break;
        case 'refund_escrow':
          await this.processRefundEscrow(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = 'completed';
      this.metrics.completedTasks++;
      
      const executionTime = Date.now() - startTime;
      this.executionTimes.push(executionTime);
      
      console.log(`✅ Task ${task.id} completed in ${executionTime}ms`);
      this.emit('taskCompleted', task);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Task ${task.id} failed:`, errorMessage);
      
      task.error = errorMessage;

      // Retry logic
      if (task.attempts < task.maxAttempts) {
        task.status = 'pending';
        task.scheduledAt = Date.now() + this.config.retryDelay;
        console.log(`🔄 Retrying task ${task.id} in ${this.config.retryDelay}ms`);
      } else {
        task.status = 'failed';
        this.metrics.failedTasks++;
        console.error(`💀 Task ${task.id} permanently failed after ${task.attempts} attempts`);
        this.emit('taskFailed', task);
      }
    }

    this.metrics.lastProcessedAt = Date.now();
  }

  /**
   * Create and add a new relay task
   */
  addTask(
    type: RelayTask['type'],
    swapId: string,
    chain: 'stellar' | 'ethereum',
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium',
    delay: number = 0
  ): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: RelayTask = {
      id: taskId,
      type,
      swapId,
      chain,
      priority,
      attempts: 0,
      maxAttempts: this.config.retryAttempts,
      createdAt: Date.now(),
      scheduledAt: Date.now() + delay,
      data,
      status: 'pending',
    };

    this.taskQueue.push(task);
    this.metrics.totalTasks++;
    this.metrics.pendingTasks++;

    console.log(`📝 Added task ${taskId} (${type}) for swap ${swapId}`);
    this.emit('taskAdded', task);

    return taskId;
  }

  /**
   * Handle escrows created event
   */
  private handleEscrowsCreated(data: { swapId: string; stellarEscrow: EscrowDetails; ethereumEscrow: EscrowDetails }) {
    console.log(`🎯 Handling escrows created for swap ${data.swapId}`);
    
    // Add monitoring tasks for both escrows
    this.addTask('lock_escrow', data.swapId, 'stellar', { escrowId: data.stellarEscrow.id }, 'high', 1000);
    this.addTask('lock_escrow', data.swapId, 'ethereum', { escrowId: data.ethereumEscrow.id }, 'high', 1000);
  }

  /**
   * Handle escrows locked event
   */
  private handleEscrowsLocked(data: { swapId: string; swap: AtomicSwapState }) {
    console.log(`🔒 Handling escrows locked for swap ${data.swapId}`);
    
    // Add tasks to reveal secrets and complete escrows
    if (data.swap.stellarEscrow) {
      this.addTask('complete_escrow', data.swapId, 'stellar', { 
        escrowId: data.swap.stellarEscrow.id,
        secret: data.swap.secret 
      }, 'high', 2000);
    }
    
    if (data.swap.ethereumEscrow) {
      this.addTask('complete_escrow', data.swapId, 'ethereum', { 
        escrowId: data.swap.ethereumEscrow.id,
        secret: data.swap.secret 
      }, 'high', 2000);
    }
  }

  /**
   * Handle swap completed event
   */
  private handleSwapCompleted(data: { swapId: string; swap: AtomicSwapState }) {
    console.log(`🎉 Swap ${data.swapId} completed successfully`);
    
    // Clean up completed tasks for this swap
    this.cleanupSwapTasks(data.swapId);
  }

  /**
   * Handle swap timeout event
   */
  private handleSwapTimeout(data: { swapId: string; swap: AtomicSwapState }) {
    console.log(`⏰ Swap ${data.swapId} timed out, initiating refunds`);
    
    // Add refund tasks for both chains
    if (data.swap.stellarEscrow) {
      this.addTask('refund_escrow', data.swapId, 'stellar', { 
        escrowId: data.swap.stellarEscrow.id 
      }, 'high', 0);
    }
    
    if (data.swap.ethereumEscrow) {
      this.addTask('refund_escrow', data.swapId, 'ethereum', { 
        escrowId: data.swap.ethereumEscrow.id 
      }, 'high', 0);
    }
  }

  /**
   * Handle bridge orchestrator errors
   */
  private handleBridgeError(data: { swapId: string; error: string; chain?: string }) {
    console.error(`🚨 Bridge error for swap ${data.swapId}: ${data.error}`);
    
    // Cancel pending tasks for this swap if it's a critical error
    if (data.error.includes('CRITICAL') || data.error.includes('FATAL')) {
      const cancelledCount = this.cancelSwapTasks(data.swapId);
      console.log(`❌ Cancelled ${cancelledCount} tasks due to critical error`);
    }
  }

  /**
   * Process create escrow task
   */
  private async processCreateEscrow(task: RelayTask) {
    // This would be called if we need to relay escrow creation
    // For MVP, escrows are created directly by the orchestrator
    console.log(`📦 Processing create escrow for ${task.chain}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
  }

  /**
   * Process lock escrow task
   */
  private async processLockEscrow(task: RelayTask) {
    console.log(`🔒 Processing lock escrow for ${task.chain}`);
    
    try {
      // Bridge orchestrator handles the actual contract calls
      // This task represents monitoring/verification of the lock operation
      const swap = bridgeOrchestrator.getSwap(task.swapId);
      if (!swap) {
        throw new Error(`Swap ${task.swapId} not found`);
      }

      // Verify the escrow is in the correct state for locking
      if (task.chain === 'ethereum') {
        if (!swap.ethereumEscrow || swap.ethereumEscrow.status !== 'created') {
          throw new Error(`Ethereum escrow not ready for locking`);
        }
      } else if (task.chain === 'stellar') {
        if (!swap.stellarEscrow || swap.stellarEscrow.status !== 'created') {
          throw new Error(`Stellar escrow not ready for locking`);
        }
      }
      
      console.log(`✅ ${task.chain} escrow ${task.data.escrowId} lock verification completed`);
    } catch (error) {
      console.error(`❌ Failed to verify ${task.chain} escrow lock:`, error);
      throw error;
    }
  }

  /**
   * Process reveal secret task
   */
  private async processRevealSecret(task: RelayTask) {
    console.log(`🔑 Processing reveal secret for ${task.chain}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Process complete escrow task
   */
  private async processCompleteEscrow(task: RelayTask) {
    console.log(`✅ Processing complete escrow for ${task.chain}`);
    
    try {
      // Verify the swap is in the correct state for completion
      const swap = bridgeOrchestrator.getSwap(task.swapId);
      if (!swap) {
        throw new Error(`Swap ${task.swapId} not found`);
      }

      // Verify the escrow is locked before completing
      if (task.chain === 'ethereum') {
        if (!swap.ethereumEscrow || swap.ethereumEscrow.status !== 'locked') {
          throw new Error(`Ethereum escrow not ready for completion`);
        }
      } else if (task.chain === 'stellar') {
        if (!swap.stellarEscrow || swap.stellarEscrow.status !== 'locked') {
          throw new Error(`Stellar escrow not ready for completion`);
        }
      }

      // Bridge orchestrator handles the actual contract completion calls
      // This task represents monitoring/verification of the completion
      console.log(`🎉 ${task.chain} escrow ${task.data.escrowId} completion verification completed`);
    } catch (error) {
      console.error(`❌ Failed to verify ${task.chain} escrow completion:`, error);
      throw error;
    }
  }

  /**
   * Process refund escrow task
   */
  private async processRefundEscrow(task: RelayTask) {
    console.log(`🔄 Processing refund escrow for ${task.chain}`);
    
    try {
      // Verify the swap is in a valid state for refunding
      const swap = bridgeOrchestrator.getSwap(task.swapId);
      if (!swap) {
        throw new Error(`Swap ${task.swapId} not found`);
      }

      // Check if the swap is eligible for refunding (timeout or failure)
      const isTimeout = Date.now() > swap.timelock * 1000;
      const isFailed = swap.status === 'failed' || swap.status === 'timeout';
      
      if (!isTimeout && !isFailed) {
        throw new Error(`Swap ${task.swapId} not eligible for refund yet`);
      }

      // Trigger refund through the bridge orchestrator
      await bridgeOrchestrator.refundSwap(task.swapId);
      
      console.log(`🔄 ${task.chain} escrow ${task.data.escrowId} refund initiated successfully`);
    } catch (error) {
      console.error(`❌ Failed to initiate ${task.chain} escrow refund:`, error);
      throw error;
    }
  }

  /**
   * Clean up tasks for a completed swap
   */
  private cleanupSwapTasks(swapId: string) {
    const tasksToRemove = this.taskQueue.filter(task => 
      task.swapId === swapId && 
      (task.status === 'completed' || task.status === 'failed')
    );

    this.taskQueue = this.taskQueue.filter(task => 
      !(task.swapId === swapId && (task.status === 'completed' || task.status === 'failed'))
    );

    console.log(`🧹 Cleaned up ${tasksToRemove.length} tasks for swap ${swapId}`);
  }

  /**
   * Update metrics
   */
  private updateMetrics() {
    this.metrics.pendingTasks = this.taskQueue.filter(t => t.status === 'pending').length;
    this.metrics.successRate = this.metrics.totalTasks > 0 
      ? (this.metrics.completedTasks / this.metrics.totalTasks) * 100 
      : 0;
    
    if (this.executionTimes.length > 0) {
      this.metrics.averageExecutionTime = this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
    }

    // Keep only last 100 execution times to avoid memory issues
    if (this.executionTimes.length > 100) {
      this.executionTimes = this.executionTimes.slice(-100);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): RelayerMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get current task queue status
   */
  getTaskQueueStatus() {
    const statusCounts = this.taskQueue.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.taskQueue.length,
      byStatus: statusCounts,
      byChain: this.taskQueue.reduce((acc, task) => {
        acc[task.chain] = (acc[task.chain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: this.taskQueue.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get pending tasks for a specific swap
   */
  getSwapTasks(swapId: string): RelayTask[] {
    return this.taskQueue.filter(task => task.swapId === swapId);
  }

  /**
   * Cancel all pending tasks for a swap
   */
  cancelSwapTasks(swapId: string): number {
    const cancelledTasks = this.taskQueue.filter(task => 
      task.swapId === swapId && task.status === 'pending'
    );

    this.taskQueue = this.taskQueue.filter(task => 
      !(task.swapId === swapId && task.status === 'pending')
    );

    console.log(`❌ Cancelled ${cancelledTasks.length} tasks for swap ${swapId}`);
    return cancelledTasks.length;
  }

  /**
   * Health check for the relayer
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const queueStatus = this.getTaskQueueStatus();
    
    return {
      status: this.processing ? 'running' : 'stopped',
      healthy: metrics.successRate > 80 && queueStatus.total < 100,
      metrics,
      queueStatus,
      lastHeartbeat: Date.now(),
    };
  }
}

// Singleton instance
export const atomicSwapRelayer = new AtomicSwapRelayer();