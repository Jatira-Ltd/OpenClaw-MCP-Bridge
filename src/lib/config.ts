/**
 * Config module - Read/write MCP configuration in mcp-servers.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MCPServer, MCPConfig } from '../types/mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config file location - separate from OpenClaw's config
const CONFIG_PATH = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'mcp-servers.json');

/**
 * Read the MCP config file
 */
export function readMCPConfig(): MCPConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return { version: '1.0', servers: {} };
    }
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read MCP config:', error);
    return { version: '1.0', servers: {} };
  }
}

/**
 * Write the MCP config file
 */
export function writeMCPConfig(mcpConfig: MCPConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(mcpConfig, null, 2));
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
