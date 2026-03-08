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

// Check if verbose/debug mode is enabled
function isDebugOrVerbose(): boolean {
  return process.argv.includes('--verbose') || process.argv.includes('--debug') || process.argv.includes('-v');
}

// Create logger options - always use pino.destination in non-TTY for debug/verbose
function createLoggerOptions(): pino.LoggerOptions {
  const options: pino.LoggerOptions = {
    level: getLogLevel(),
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: 'mcp-bridge',
    },
  };

  // In non-TTY mode with debug/verbose, ensure we write to stdout
  if (!process.stdout.isTTY && isDebugOrVerbose()) {
    // Use destination to stdout to ensure output in non-TTY
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  return options;
}

// Create logger instance
export const logger = pino(createLoggerOptions());

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
