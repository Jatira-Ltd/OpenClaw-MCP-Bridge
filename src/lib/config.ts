/**
 * Config module - Read/write MCP configuration in mcp-servers.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MCPServer, MCPConfig } from '../types/mcp.js';
import { validateMCPConfig, safeValidateMCPConfig } from './config-validator.js';
import { log, isVerbose } from './logger.js';
import { handleError } from './errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config file location - separate from OpenClaw's config
const CONFIG_PATH = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'mcp-servers.json');

/**
 * Check if verbose/debug mode is enabled
 */
function isDebugMode(): boolean {
  return isVerbose();
}

/**
 * Read the MCP config file with validation
 */
export function readMCPConfig(): MCPConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      log.info('No config file found, using defaults');
      return { version: '1.0', servers: {} };
    }
    
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const rawConfig = JSON.parse(content);
    
    // Validate config on load
    const validation = validateMCPConfig(rawConfig);
    
    if (!validation.valid) {
      log.warn('Config validation issues found', { 
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message),
      });
      
      if (isDebugMode()) {
        console.error('\n⚠️  Configuration warnings:');
        for (const error of validation.errors) {
          console.error(`   Error: ${error.message} (${error.path})`);
        }
        for (const warning of validation.warnings) {
          console.error(`   Warning: ${warning.message} (${warning.path})`);
        }
        console.error('');
      }
      
      // Try to use safe validation which returns defaults on failure
      const safeResult = safeValidateMCPConfig(rawConfig);
      if (!safeResult.isValid) {
        log.error('Config is corrupt, resetting to defaults');
        console.error('\n⚠️  Configuration file appears corrupt. Resetting to defaults.\n');
        return { version: '1.0', servers: {} };
      }
      
      return safeResult.config;
    }
    
    // Log warnings even if valid
    if (validation.warnings.length > 0 && isDebugMode()) {
      console.error('\n⚠️  Configuration warnings:');
      for (const warning of validation.warnings) {
        console.error(`   Warning: ${warning.message} (${warning.path})`);
      }
      console.error('');
    }
    
    return rawConfig;
  } catch (error) {
    // Handle JSON parse errors (corrupt config file)
    if (error instanceof SyntaxError) {
      log.error('Config file has invalid JSON', { error: error.message });
      console.error('\n⚠️  Configuration file contains invalid JSON.');
      console.error('   The file may have been corrupted. Starting with empty config.\n');
      return { version: '1.0', servers: {} };
    }
    
    // Re-throw other errors
    handleError(error, { exit: false });
    return { version: '1.0', servers: {} };
  }
}

/**
 * Write the MCP config file with validation
 */
export function writeMCPConfig(mcpConfig: MCPConfig): void {
  // Validate before writing
  const validation = validateMCPConfig(mcpConfig);
  
  if (!validation.valid) {
    log.warn('Attempted to write invalid config', { 
      errors: validation.errors.map(e => e.message),
    });
    throw new Error(`Cannot write invalid config: ${validation.errors[0]?.message}`);
  }
  
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Backup existing config before overwriting
  if (fs.existsSync(CONFIG_PATH)) {
    const backupPath = `${CONFIG_PATH}.backup`;
    try {
      fs.copyFileSync(CONFIG_PATH, backupPath);
      log.debug('Config backed up', { backupPath });
    } catch (err) {
      log.warn('Failed to backup config', { error: err instanceof Error ? err.message : String(err) });
    }
  }
  
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(mcpConfig, null, 2));
  log.info('Config saved', { path: CONFIG_PATH, servers: Object.keys(mcpConfig.servers || {}).length });
}

/**
 * List all installed MCP servers
 */
export function listMCPServers(): Record<string, MCPServer> {
  const mcpConfig = readMCPConfig();
  return mcpConfig.servers || {};
}

/**
 * Get server names (all keys)
 */
export function getServerNames(): string[] {
  return Object.keys(listMCPServers());
}

/**
 * Get a specific MCP server config
 */
export function getMCPServer(name: string): MCPServer | null {
  const servers = listMCPServers();
  if (!name) {
    // Return null when no name specified - caller should handle
    return null;
  }
  return servers[name] || null;
}

/**
 * Add or update an MCP server
 */
export function addMCPServer(name: string, serverConfig: Partial<MCPServer>): void {
  const mcpConfig = readMCPConfig();
  
  if (!mcpConfig.servers) {
    mcpConfig.servers = {};
  }
  
  mcpConfig.servers[name] = {
    installedAt: new Date().toISOString(),
    enabled: true,
    tools: [],
    config: {},
    env: {},
    ...serverConfig,
  };
  
  writeMCPConfig(mcpConfig);
}

/**
 * Remove an MCP server
 */
export function removeMCPServer(name: string): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    delete mcpConfig.servers[name];
    writeMCPConfig(mcpConfig);
  } else {
    throw new Error(`Server ${name} not found`);
  }
}

/**
 * Update server tools after discovery
 */
export function updateServerTools(name: string, tools: string[]): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    mcpConfig.servers[name].tools = tools;
    writeMCPConfig(mcpConfig);
  }
}

/**
 * Enable an MCP server
 */
export function enableMCPServer(name: string): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    mcpConfig.servers[name].enabled = true;
    writeMCPConfig(mcpConfig);
  } else {
    throw new Error(`Server ${name} not found`);
  }
}

/**
 * Disable an MCP server
 */
export function disableMCPServer(name: string): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    mcpConfig.servers[name].enabled = false;
    writeMCPConfig(mcpConfig);
  } else {
    throw new Error(`Server ${name} not found`);
  }
}

/**
 * Update last used timestamp
 */
export function updateLastUsed(name: string): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    mcpConfig.servers[name].lastUsedAt = new Date().toISOString();
    writeMCPConfig(mcpConfig);
  }
}

/**
 * Update server configuration
 */
export function updateServerConfig(name: string, config: Record<string, unknown>): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    mcpConfig.servers[name].config = {
      ...mcpConfig.servers[name].config,
      ...config,
    };
    writeMCPConfig(mcpConfig);
  } else {
    throw new Error(`Server ${name} not found`);
  }
}

/**
 * Update server environment variables
 */
export function updateServerEnv(name: string, env: Record<string, string>): void {
  const mcpConfig = readMCPConfig();
  
  if (mcpConfig.servers && mcpConfig.servers[name]) {
    mcpConfig.servers[name].env = {
      ...mcpConfig.servers[name].env,
      ...env,
    };
    writeMCPConfig(mcpConfig);
  } else {
    throw new Error(`Server ${name} not found`);
  }
}
