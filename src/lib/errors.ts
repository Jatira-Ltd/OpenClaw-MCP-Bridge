/**
 * Error handling utilities - User-friendly error messages
 */

import { log } from './logger.js';
import type { ValidationError, ValidationWarning } from './config-validator.js';

// Error codes for categorization
export enum ErrorCode {
  // Configuration errors
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_PERMISSION_DENIED = 'CONFIG_PERMISSION_DENIED',
  
  // Server errors
  SERVER_NOT_FOUND = 'SERVER_NOT_FOUND',
  SERVER_NOT_INSTALLED = 'SERVER_NOT_INSTALLED',
  SERVER_DISABLED = 'SERVER_DISABLED',
  SERVER_START_FAILED = 'SERVER_START_FAILED',
  SERVER_TIMEOUT = 'SERVER_TIMEOUT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  TIMEOUT = 'TIMEOUT',
  
  // Tool errors
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_CALL_FAILED = 'TOOL_CALL_FAILED',
  TOOL_INVALID_ARGS = 'TOOL_INVALID_ARGS',
  
  // Operation errors
  OPERATION_FAILED = 'OPERATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

// Map common error messages to codes
const ERROR_CODE_MAP: Record<string, ErrorCode> = {
  'No MCP servers installed': ErrorCode.SERVER_NOT_FOUND,
  'No active MCP session': ErrorCode.SERVER_NOT_FOUND,
  'Unknown MCP server': ErrorCode.SERVER_NOT_INSTALLED,
  'server not found': ErrorCode.SERVER_NOT_FOUND,
  'not found': ErrorCode.NOT_FOUND,
  'ENOENT': ErrorCode.NOT_FOUND,
  'EACCES': ErrorCode.PERMISSION_DENIED,
  'EPERM': ErrorCode.PERMISSION_DENIED,
  'ECONNREFUSED': ErrorCode.CONNECTION_REFUSED,
  'ETIMEDOUT': ErrorCode.TIMEOUT,
  'timeout': ErrorCode.TIMEOUT,
  'connection': ErrorCode.NETWORK_ERROR,
  'parse error': ErrorCode.INVALID_INPUT,
  'invalid json': ErrorCode.INVALID_INPUT,
};

/**
 * Get error code from error message
 */
export function getErrorCode(error: Error | unknown): ErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  
  for (const [pattern, code] of Object.entries(ERROR_CODE_MAP)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return code;
    }
  }
  
  return ErrorCode.UNKNOWN;
}

/**
 * User-friendly error message
 */
export interface UserError {
  code: ErrorCode;
  message: string;
  suggestion?: string;
  details?: string;
}

/**
 * Get user-friendly error message
 */
export function getUserError(error: Error | unknown): UserError {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : String(error);
  
  // Map error codes to user-friendly messages
  switch (code) {
    case ErrorCode.SERVER_NOT_FOUND:
    case ErrorCode.SERVER_NOT_INSTALLED:
      return {
        code,
        message: 'No MCP servers are configured.',
        suggestion: 'Run "mcp install <package>" to install an MCP server first.',
      };
    
    case ErrorCode.SERVER_DISABLED:
      return {
        code,
        message: 'The requested MCP server is disabled.',
        suggestion: 'Run "mcp enable <package>" to enable the server.',
      };
    
    case ErrorCode.SERVER_START_FAILED:
      return {
        code,
        message: 'Failed to start the MCP server.',
        suggestion: 'Check that the server package is properly installed. Try reinstalling: "mcp install <package>"',
        details: message,
      };
    
    case ErrorCode.SERVER_TIMEOUT:
      return {
        code,
        message: 'The MCP server is not responding.',
        suggestion: 'The server may be busy or unresponsive. Try again in a moment, or restart the server.',
        details: message,
      };
    
    case ErrorCode.TOOL_NOT_FOUND:
      return {
        code,
        message: 'The requested tool was not found.',
        suggestion: 'Run "mcp discover" to see available tools for your installed servers.',
      };
    
    case ErrorCode.TOOL_CALL_FAILED:
      return {
        code,
        message: 'The tool execution failed.',
        suggestion: 'Check the tool arguments are correct. Run "mcp discover" to see available tools.',
        details: message,
      };
    
    case ErrorCode.TOOL_INVALID_ARGS:
      return {
        code,
        message: 'Invalid arguments provided to the tool.',
        suggestion: 'Check the tool\'s input schema and ensure arguments are valid JSON.',
        details: message,
      };
    
    case ErrorCode.CONFIG_NOT_FOUND:
      return {
        code,
        message: 'Configuration file not found.',
        suggestion: 'The MCP configuration may need to be initialized. Try running a command first.',
      };
    
    case ErrorCode.CONFIG_INVALID:
      return {
        code,
        message: 'Configuration file is invalid.',
        suggestion: 'There may be a syntax error in the config file. Check the file format.',
        details: message,
      };
    
    case ErrorCode.PERMISSION_DENIED:
      return {
        code,
        message: 'Permission denied.',
        suggestion: 'Check file permissions or try running with appropriate access rights.',
        details: message,
      };
    
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.CONNECTION_REFUSED:
      return {
        code,
        message: 'Network connection failed.',
        suggestion: 'Check your network connection and try again.',
        details: message,
      };
    
    case ErrorCode.INVALID_INPUT:
      return {
        code,
        message: 'Invalid input provided.',
        suggestion: 'Check your command arguments and try again.',
        details: message,
      };
    
    case ErrorCode.NOT_FOUND:
      return {
        code,
        message: 'The requested resource was not found.',
        suggestion: 'Verify the resource exists and the name is correct.',
        details: message,
      };
    
    case ErrorCode.UNKNOWN:
    default:
      return {
        code: ErrorCode.UNKNOWN,
        message: 'An unexpected error occurred.',
        suggestion: 'Try running the command again. If the problem persists, check the logs with --verbose flag.',
        details: message,
      };
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[], warnings?: ValidationWarning[]): string {
  const lines: string[] = [];
  
  if (errors.length > 0) {
    lines.push('Configuration errors:');
    for (const error of errors) {
      lines.push(`  • ${error.message}`);
      if (error.path !== '/') {
        lines.push(`    Location: ${error.path}`);
      }
    }
  }
  
  if (warnings && warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of warnings) {
      lines.push(`  • ${warning.message}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Handle error with user-friendly output
 * Returns true if error was handled, false if it should propagate
 */
export function handleError(error: unknown, options?: { 
  verbose?: boolean;
  exit?: boolean;
  exitCode?: number;
}): boolean {
  const userError = getUserError(error);
  
  // Always log the error (for debugging)
  log.error('Operation failed', { 
    code: userError.code,
    originalError: error instanceof Error ? error.message : String(error),
  });
  
  // Print user-friendly message
  console.error(`\n❌ ${userError.message}`);
  
  if (userError.suggestion) {
    console.error(`   ${userError.suggestion}`);
  }
  
  if (userError.details && (options?.verbose || process.argv.includes('--verbose'))) {
    console.error(`   Details: ${userError.details}`);
  }
  
  // Exit if requested (default: true for CLI)
  if (options?.exit !== false) {
    process.exit(options?.exitCode ?? 1);
  }
  
  return true;
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: { verbose?: boolean; exit?: boolean }
): T {
  return ((...args: unknown[]) => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error, options);
      // This line never executes due to handleError exiting
      throw error;
    }
  }) as T;
}
