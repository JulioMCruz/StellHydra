/**
 * Retry utility for handling transient failures in bridge operations
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and temporary failures
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'CONNECTION_ERROR',
      'SERVER_ERROR',
      'RATE_LIMITED',
      'INSUFFICIENT_FUNDS', // Temporary - might have funds later
      'NONCE_TOO_LOW',
      'REPLACEMENT_UNDERPRICED',
    ];
    
    return retryableErrors.some(errorType => 
      error.message?.includes(errorType) || 
      error.code?.includes(errorType) ||
      error.name?.includes(errorType)
    );
  }
};

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: Error;
  
  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  operationName: string = 'operation'
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      console.log(`🔄 Attempting ${operationName} (attempt ${attempt}/${config.maxRetries + 1})`);
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded after ${attempt} attempts`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      console.warn(`⚠️  ${operationName} failed on attempt ${attempt}:`, error);
      
      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries + 1) {
        break;
      }
      
      // Check if we should retry this error
      if (config.retryCondition && !config.retryCondition(error)) {
        console.log(`🚫 ${operationName} failed with non-retryable error`);
        throw error;
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff with max delay
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw new RetryError(
    `${operationName} failed after ${config.maxRetries + 1} attempts`,
    config.maxRetries + 1,
    lastError!
  );
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly timeoutMs: number = 60000, // 1 minute
    private readonly monitoringWindowMs: number = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.timeoutMs) {
        this.state = 'HALF_OPEN';
        console.log(`🔧 Circuit breaker for ${operationName} entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker OPEN for ${operationName}. Retry after ${this.timeoutMs}ms`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
        console.log(`✅ Circuit breaker for ${operationName} reset to CLOSED`);
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error(`🚨 Circuit breaker OPEN for ${operationName} after ${this.failures} failures`);
      }
      
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // Reset failure count if outside monitoring window
    if (this.lastFailureTime - this.monitoringWindowMs > this.timeoutMs) {
      this.failures = 1;
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Operation timeout utility
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string = 'operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Queue-based operation limiter
 */
export class OperationQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;

  constructor(private readonly maxConcurrent: number = 3) {}

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const operation = this.queue.shift()!;
    
    try {
      await operation();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  getStatus(): { queueLength: number; running: number } {
    return {
      queueLength: this.queue.length,
      running: this.running,
    };
  }
}