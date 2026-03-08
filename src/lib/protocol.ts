/**
 * Protocol module - Handle MCP JSON-RPC protocol communication directly
 */

import { spawn, ChildProcess } from 'child_process';
import { getMCPServer } from './config.js';
import type { MCPTool, MCPCapabilities } from '../types/mcp.js';

let currentProcess: ChildProcess | null = null;
let requestId = 1;
let pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();

/**
 * Send a JSON-RPC request to the MCP server
 */
function sendRequest(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!currentProcess || !currentProcess.stdin) {
      return reject(new Error('MCP server process not running'));
    }

    const id = requestId++;
    pendingRequests.set(id, { resolve, reject });

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    });

    currentProcess.stdin.write(request + '\n');

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

/**
 * Spawn an MCP server process
 */
export function spawnMCPServer(packageName: string): ChildProcess {
  // Kill any existing process
  if (currentProcess) {
    killCurrentProcess();
  }

  const proc = spawn('npx', ['-y', packageName], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  currentProcess = proc;
  requestId = 1;
  pendingRequests = new Map();

  proc.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.id && pendingRequests.has(response.id)) {
          const { resolve, reject } = pendingRequests.get(response.id)!;
          pendingRequests.delete(response.id);
          
          if (response.error) {
            reject(new Error(response.error.message || 'MCP Error'));
          } else {
            resolve(response.result);
          }
        }
      } catch (e) {
        // Ignore parse errors for non-JSON output
      }
    }
  });

  proc.stderr?.on('data', (data: Buffer) => {
    console.error('MCP stderr:', data.toString());
  });

  proc.on('error', (error: Error) => {
    console.error('MCP Server error:', error.message);
  });

  proc.on('exit', (code: number | null) => {
    console.log(`MCP Server exited with code ${code}`);
    currentProcess = null;
    currentClient = null;
  });

  return proc;
}

/**
 * Current client state tracker
 */
let currentClient: { initialized: boolean } | null = null;

/**
 * Kill the current MCP server process
 */
export function killCurrentProcess(): void {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
    currentClient = null;
    pendingRequests.clear();
  }
}

/**
 * Initialize MCP server with handshake
 */
export async function initializeMCP(packageName: string): Promise<MCPCapabilities> {
  spawnMCPServer(packageName);
  
  // Wait a bit for the process to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  const result = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'openclaw-mcp-bridge',
      version: '1.0.0',
    },
  }) as { capabilities: MCPCapabilities; serverInfo: { name: string; version: string } };

  currentClient = { initialized: true };

  return result.capabilities;
}

/**
 * List available tools from MCP server
 */
export async function listTools(): Promise<MCPTool[]> {
  const result = await sendRequest('tools/list', {}) as { tools: MCPTool[] };
  return result.tools || [];
}

/**
 * Call an MCP tool
 */
export async function callMCPTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  const result = await sendRequest('tools/call', {
    name: toolName,
    arguments: args,
  });

  return result;
}

/**
 * Get the current process
 */
export function getCurrentProcess(): ChildProcess | null {
  return currentProcess;
}
