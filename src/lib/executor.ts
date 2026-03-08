/**
 * Executor module - Execute MCP tools
 */

import { initializeMCP, listTools, callMCPTool, killCurrentProcess } from './protocol.js';
import { getServerNames, getMCPServer, updateServerTools } from './config.js';
import type { MCPTool } from '../types/mcp.js';

/**
 * Initialize and call a tool
 */
export async function callTool(
  toolName: string, 
  args: Record<string, unknown>,
  packageName?: string
): Promise<unknown> {
  // Find an available MCP server if not specified
  let serverPackage = packageName;
  
  if (!serverPackage) {
    const serverNames = getServerNames();
    if (serverNames.length === 0) {
      throw new Error('No MCP servers installed. Run "mcp install <package>" first.');
    }
    serverPackage = serverNames[0];
  }
  
  // Initialize the MCP connection
  await initializeMCP(serverPackage);
  
  // Discover tools if not cached
  const server = getMCPServer(serverPackage);
  if (!server || server.tools.length === 0) {
    const tools = await listTools();
    updateServerTools(serverPackage, tools.map(t => t.name));
  }
  
  // Call the tool
  const result = await callMCPTool(toolName, args);
  
  // Cleanup
  killCurrentProcess();
  
  return result;
}

/**
 * Get list of tools from a server
 */
export async function discoverTools(packageName?: string): Promise<MCPTool[]> {
  let serverPackage = packageName;
  
  if (!serverPackage) {
    const serverNames = getServerNames();
    if (serverNames.length === 0) {
      throw new Error('No MCP servers installed. Run "mcp install <package>" first.');
    }
    serverPackage = serverNames[0];
  }
  
  await initializeMCP(serverPackage);
  const tools = await listTools();
  killCurrentProcess();
  
  return tools;
}
