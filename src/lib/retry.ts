/**
 * Retry utility - Exponential backoff for unreliable operations
 */

import { log } from './logger.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: ((error: Error) => boolean) | RegExp;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: () => true,
  onRetry: undefined,
};

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);
  // Add jitter (±10%) to prevent thundering herd
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * 
 * @example
 * const result = await withRetry(async () => {
 *   return await someUnreliableOperation();
 * }, { maxRetries: 3, initialDelayMs: 1000 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const isRetryable = typeof opts.retryableErrors === 'function'
        ? opts.retryableErrors(lastError)
        : opts.retryableErrors instanceof RegExp
          ? opts.retryableErrors.test(lastError.message)
          : true;
      
      // Don't retry if not retryable or we've exhausted retries
      if (!isRetryable || attempt >= opts.maxRetries) {
        log.error(`Operation failed after ${attempt} retries`, { 
          attempt, 
          maxRetries: opts.maxRetries,
          error: lastError.message 
        });
        throw lastError;
      }
      
      const delayMs = calculateDelay(attempt, opts);
      
      log.warn(`Retrying operation (attempt ${attempt + 1}/${opts.maxRetries + 1}) after ${delayMs}ms`, {
        attempt: attempt + 1,
        maxRetries: opts.maxRetries + 1,
        delayMs,
        error: lastError.message,
      });
      
      // Call onRetry hook if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, lastError, delayMs);
      }
      
      await sleep(delayMs);
    }
  }
  
  // This should never be reached but TypeScript needs it
  throw lastError!;
}

/**
 * Retry options builder for common use cases
 */
export const retryStrategies = {
  // For network operations - more aggressive
  network: {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    retryableErrors: (error: Error) => {
      // Retry on network errors, timeouts, 5xx errors
      const message = error.message.toLowerCase();
      return (
        message.includes('econnrefused') ||
        message.includes('etimedout') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('503') ||
        message.includes('502')
      );
    },
  },
  
  // For file operations - less aggressive
  fileSystem: {
    maxRetries: 2,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    backoffMultiplier: 2,
    retryableErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('eacces') ||
        message.includes('eperm') ||
        message.includes('ebusy') ||
        message.includes('enoent')
      );
    },
  },
  
  // For MCP operations - moderate
  mcp: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
    retryableErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('server unavailable') ||
        message.includes('503')
      );
    },
  },
};
