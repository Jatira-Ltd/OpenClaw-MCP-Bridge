/**
 * Config Schema Validation Module
 * Uses Zod for runtime validation of MCP configuration
 */

import { z } from 'zod';
import { log } from './logger.js';

// MCP Server schema
export const MCPServerSchema = z.object({
  installedAt: z.string().datetime(),
  enabled: z.boolean(),
  tools: z.array(z.string()),
  config: z.record(z.string(), z.unknown()),
  env: z.record(z.string(), z.string()),
  lastUsedAt: z.string().datetime().optional(),
});

// MCP Config schema
export const MCPConfigSchema = z.object({
  version: z.string(),
  servers: z.record(z.string(), MCPServerSchema),
});

// Config validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

/**
 * Validate the entire MCP config
 */
export function validateMCPConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (config === null || config === undefined) {
    errors.push({
      path: '/',
      message: 'Configuration is null or undefined',
    });
    return { valid: false, errors, warnings };
  }
  
  // Check if it's an object
  if (typeof config !== 'object') {
    errors.push({
      path: '/',
      message: `Configuration must be an object, got: ${typeof config}`,
    });
    return { valid: false, errors, warnings };
  }
  
  // Try to parse and validate
  try {
    const parsed = MCPConfigSchema.parse(config);
    
    // Additional business logic validations
    for (const [serverName, server] of Object.entries(parsed.servers)) {
      // Warn if no tools discovered
      if (server.tools.length === 0) {
        warnings.push({
          path: `/servers/${serverName}/tools`,
          message: `Server '${serverName}' has no tools discovered`,
        });
      }
      
      // Warn if installedAt is in the future
      const installedDate = new Date(server.installedAt);
      if (installedDate > new Date()) {
        warnings.push({
          path: `/servers/${serverName}/installedAt`,
          message: `Server '${serverName}' has future installedAt date`,
        });
      }
      
      // Validate config values
      if (server.config) {
        for (const [key, value] of Object.entries(server.config)) {
          if (typeof value === 'string' && value.includes('..')) {
            warnings.push({
              path: `/servers/${serverName}/config/${key}`,
              message: `Config '${key}' contains path traversal sequence '..'`,
            });
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors, warnings };
  } catch (e) {
    if (e instanceof z.ZodError) {
      for (const issue of e.issues) {
        const path = issue.path.join('/');
        errors.push({
          path: path ? `/${path}` : '/',
          message: issue.message,
        });
      }
    } else {
      errors.push({
        path: '/',
        message: `Unknown validation error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    
    return { valid: false, errors, warnings };
  }
}

/**
 * Validate a single server configuration
 */
export function validateServerConfig(server: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (server === null || server === undefined) {
    errors.push({
      path: '/',
      message: 'Server configuration is null or undefined',
    });
    return { valid: false, errors, warnings };
  }
  
  try {
    const parsed = MCPServerSchema.parse(server);
    
    // Additional validations
    if (!parsed.installedAt) {
      errors.push({
        path: '/installedAt',
        message: 'installedAt is required',
      });
    }
    
    if (!parsed.config || typeof parsed.config !== 'object') {
      warnings.push({
        path: '/config',
        message: 'config should be an object',
      });
    }
    
    return { valid: errors.length === 0, errors, warnings };
  } catch (e) {
    if (e instanceof z.ZodError) {
      for (const issue of e.issues) {
        const path = issue.path.join('/');
        errors.push({
          path: path ? `/${path}` : '/',
          message: issue.message,
        });
      }
    } else {
      errors.push({
        path: '/',
        message: `Unknown validation error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    
    return { valid: false, errors, warnings };
  }
}

/**
 * Safe validate - returns default config if validation fails
 */
export function safeValidateMCPConfig(config: unknown): { 
  config: ReturnType<typeof MCPConfigSchema.parse>; 
  isValid: boolean 
} {
  try {
    const parsed = MCPConfigSchema.parse(config);
    return { config: parsed, isValid: true };
  } catch (e) {
    log.warn('Config validation failed, using defaults', {
      error: e instanceof Error ? e.message : String(e),
    });
    
    // Return default config structure
    return {
      config: MCPConfigSchema.parse({ version: '1.0', servers: {} }),
      isValid: false,
    };
  }
}
