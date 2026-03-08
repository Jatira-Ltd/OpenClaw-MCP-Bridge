/**
 * Logger module - Structured logging with pino
 */

import pino from 'pino';
import process from 'process';

// Log levels: trace, debug, info, warn, error, fatal
// Default level is 'info'

// Parse log level from environment or CLI argument
function getLogLevel(): string {
  if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
    return 'debug';
  }
  if (process.argv.includes('--debug')) {
    return 'trace';
  }
  return process.env.LOG_LEVEL || 'info';
}

// Create logger instance
export const logger = pino({
  level: getLogLevel(),
  transport: process.argv.includes('--verbose') || process.argv.includes('--debug')
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
  return process.argv.includes('--verbose') || process.argv.includes('--debug');
}
