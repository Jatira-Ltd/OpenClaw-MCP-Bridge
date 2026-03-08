/**
 * Executor module - Execute MCP tools
 */

import { initializeMCP, listTools, callMCPTool, closeSession } from './protocol.js';
import { getServerNames, getMCPServer, updateServerTools } from './config.js';
import type { MCPTool } from '../types/mcp.js';

// Known working MCP servers that should be prioritized
const KNOWN_SERVERS = new Set([
  '@modelcontextprotocol/server-filesystem',
  '@modelcontextprotocol/server-brave-search',
  '@modelcontextprotocol/server-puppeteer',
  '@notionhq/mcp-server',
  '@github/mcp-server',
]);

/**
 * Find the best available MCP server
 * Prioritizes: 1) explicitly specified, 2) known servers with tools, 3) any server with tools
 */
function findBestServer(packageName?: string): string | undefined {
  const serverNames = getServerNames();
  
  if (serverNames.length === 0) {
    return undefined;
  }

  // If explicitly specified, use it
  if (packageName) {
    return serverNames.includes(packageName) ? packageName : undefined;
  }

  // Try to find a known server first (these are guaranteed to work)
  for (const name of serverNames) {
    if (KNOWN_SERVERS.has(name)) {
      return name;
    }
  }

  // Fall back to first server (but not test servers)
  for (const name of serverNames) {
    if (!name.startsWith('test-')) {
      return name;
    }
  }

  // Last resort: return first server
  return serverNames[0];
}

/**
 * Initialize and call a tool
 */
export async function callTool(
  toolName: string, 
  args: Record<string, unknown>,
  packageName?: string
): Promise<unknown> {
  // Find an available MCP server
  let serverPackage = findBestServer(packageName);
  
  if (!serverPackage) {
    throw new Error('No MCP servers installed. Run "mcp install <package>" first.');
  }
  
  try {
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
    
    return result;
  } finally {
    // Cleanup - always close session
    await closeSession();
  }
}

/**
 * Get list of tools from a server
 */
export async function discoverTools(packageName?: string): Promise<MCPTool[]> {
  const serverPackage = findBestServer(packageName);
  
  if (!serverPackage) {
    throw new Error('No MCP servers installed. Run "mcp install <package>" first.');
  }
  
  try {
    await initializeMCP(serverPackage);
    const tools = await listTools();
    return tools;
  } finally {
    // Cleanup - always close session
    await closeSession();
  }
}
