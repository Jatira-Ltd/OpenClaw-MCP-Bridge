/**
 * Logger module - Structured logging with pino
 */

import pino from 'pino';
import process from 'process';

// Log levels: trace, debug, info, warn, error, fatal
// Default level is 'info'

// Parse log level directly from process.argv (to avoid circular deps)
function getLogLevel(): string {
  if (process.argv.includes('--debug')) {
    return 'trace';
  }
  if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
    return 'debug';
  }
  return process.env.LOG_LEVEL || 'info';
}

// Check if we should use pretty output
function shouldUsePretty(): boolean {
  // Always use pretty output if --verbose or --debug flags are provided
  // (regardless of TTY status)
  if (process.argv.includes('--verbose') || process.argv.includes('--debug') || process.argv.includes('-v')) {
    return true;
  }
  // Fall back to TTY check for default pretty mode
  return process.stdout.isTTY;
}

// Create logger instance
export const logger = pino({
  level: getLogLevel(),
  transport: shouldUsePretty()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'mcp-bridge',
  },
});

// Convenience methods for structured logging
export const log = {
  info: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.info(data, message);
    } else {
      logger.info(message);
    }
  },
  
  error: (message: string, dataOrError?: Record<string, unknown> | Error) => {
    if (dataOrError instanceof Error) {
      logger.error(
        { 
          err: dataOrError, 
          message: dataOrError.message,
          // Don't expose stack traces to users
        },
        message
      );
    } else if (dataOrError) {
      logger.error(dataOrError, message);
    } else {
      logger.error(message);
    }
  },
  
  warn: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.warn(data, message);
    } else {
      logger.warn(message);
    }
  },
  
  debug: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.debug(data, message);
    } else {
      logger.debug(message);
    }
  },
  
  trace: (message: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.trace(data, message);
    } else {
      logger.trace(message);
    }
  },
};

// Check if verbose/debug mode is enabled
export function isVerbose(): boolean {
  return process.argv.includes('--verbose') || process.argv.includes('--debug') || process.argv.includes('-v');
}

// Check if debug mode (more verbose than verbose)
export function isDebug(): boolean {
  return process.argv.includes('--debug');
}
