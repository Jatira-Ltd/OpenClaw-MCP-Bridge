/**
 * Discover module - Discover available tools from MCP servers
 */

import { initializeMCP, listTools, killCurrentProcess } from './protocol.js';
import { getServerNames, updateServerTools } from './config.js';
import type { MCPTool } from '../types/mcp.js';

/**
 * Discover tools from an MCP server
 */
export async function discoverTools(
  packageName: string,
  saveToConfig: boolean = true
): Promise<MCPTool[]> {
  // Initialize MCP connection
  await initializeMCP(packageName);
  
  // List tools
  const tools = await listTools();
  
  // Save to config if requested
  if (saveToConfig) {
    updateServerTools(
      packageName,
      tools.map(t => t.name)
    );
  }
  
  // Cleanup
  killCurrentProcess();
  
  return tools;
}

/**
 * Discover tools from all installed servers
 */
export async function discoverAllTools(): Promise<Record<string, MCPTool[]>> {
  const serverNames = getServerNames();
  const results: Record<string, MCPTool[]> = {};
  
  for (const name of serverNames) {
    try {
      const tools = await discoverTools(name, true);
      results[name] = tools;
    } catch (error) {
      console.error(`Failed to discover tools for ${name}:`, error);
      results[name] = [];
    }
  }
  
  return results;
}
