/**
 * Config module - Read/write MCP configuration in openclaw.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { MCPServer, MCPConfig, OpenClawConfig } from '../types/mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config file location
const CONFIG_PATH = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'openclaw.json');

/**
 * Read the full OpenClaw config
 */
export function readOpenClawConfig(): OpenClawConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {};
    }
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read config:', error);
    return {};
  }
}

/**
 * Write the full OpenClaw config
 */
export function writeOpenClawConfig(config: OpenClawConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Get MCP config section
 */
export function readMCPConfig(): MCPConfig {
  const config = readOpenClawConfig();
  return config.mcp || { version: '1.0', servers: {} };
}

/**
 * Write MCP config section
 */
export function writeMCPConfig(mcpConfig: MCPConfig): void {
  const config = readOpenClawConfig();
  config.mcp = mcpConfig;
  writeOpenClawConfig(config);
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
