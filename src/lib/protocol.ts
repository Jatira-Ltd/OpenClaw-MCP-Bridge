/**
 * Protocol module - Simple MCP session manager
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import type { MCPTool, MCPCapabilities } from '../types/mcp.js';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Get the command to run for a package with arguments
 */
function getServerCommand(packageName: string, config?: Record<string, unknown>): { command: string; args: string[]; cwd?: string } {
  const knownServers: Record<string, { command: string; args: (config?: Record<string, unknown>) => string[]; cwd?: string }> = {
    '@modelcontextprotocol/server-filesystem': {
      command: 'node',
      args: (cfg) => {
        const basePath = path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js');
        const dirs = Array.isArray(cfg?.allowedDirectories) ? cfg.allowedDirectories : [process.env.HOME || process.cwd()];
        return [basePath, ...dirs];
      },
      cwd: path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'server-filesystem'),
    },
  };

  if (knownServers[packageName]) {
    const server = knownServers[packageName];
    return {
      command: server.command,
      args: server.args(config),
      cwd: server.cwd,
    };
  }

  return { command: 'npx', args: ['-y', packageName] };
}

/**
 * MCP Session - manages a single MCP server connection
 */
export class MCPSession {
  private process: ChildProcess;
  private packageName: string;
  private config?: Record<string, unknown>;
  private requestId = 1;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  public initialized = false;
  private ready = false;

  constructor(packageName: string, config?: Record<string, unknown>) {
    this.packageName = packageName;
    this.config = config;
    
    const { command, args, cwd } = getServerCommand(packageName, config);
    console.log(`Starting MCP server: ${command} ${args.join(' ')}`);
    
    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      env: { ...process.env },
    });

    // Setup stdout handler
    this.process.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          
          if (response.id && this.pendingRequests.has(response.id)) {
            const { resolve, reject } = this.pendingRequests.get(response.id)!;
            this.pendingRequests.delete(response.id);
            
            if (response.error) {
              reject(new Error(response.error.message || 'MCP Error'));
            } else {
              resolve(response.result);
            }
          }
        } catch (e) {
          // Ignore non-JSON
        }
      }
    });

    // Mark as ready after a short delay
    setTimeout(() => {
      this.ready = true;
      console.log('MCP process ready');
    }, 1500);
  }

  /**
   * Send a JSON-RPC request
   */
  private async sendRequest(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.ready || this.process.killed) {
      throw new Error('MCP server not ready');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });

      const request = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });

      this.process.stdin?.write(request + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Initialize the MCP session
   */
  async initialize(): Promise<MCPCapabilities> {
    if (this.initialized) {
      console.log('Already initialized');
      return {} as MCPCapabilities;
    }

    // Wait for ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'openclaw-mcp-bridge',
        version: '1.0.0',
      },
    }) as { capabilities: MCPCapabilities; serverInfo: { name: string; version: string } };

    console.log('MCP initialized:', result.serverInfo.name, result.serverInfo.version);
    this.initialized = true;
    return result.capabilities;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    const result = await this.sendRequest('tools/list', {}) as { tools: MCPTool[] };
    return result.tools || [];
  }

  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest('tools/call', { name, arguments: args });
  }

  /**
   * Close the session
   */
  close(): void {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
    this.pendingRequests.clear();
    this.initialized = false;
    this.ready = false;
  }
}

// Module-level session for convenience
let currentSession: MCPSession | null = null;

/**
 * Create and initialize a new MCP session
 */
export async function createSession(packageName: string, config?: Record<string, unknown>): Promise<MCPSession> {
  // Close existing session if any
  if (currentSession) {
    currentSession.close();
  }

  currentSession = new MCPSession(packageName, config);
  await currentSession.initialize();
  return currentSession;
}

/**
 * Get current session
 */
export function getCurrentSession(): MCPSession | null {
  return currentSession;
}

/**
 * Close current session
 */
export function closeSession(): void {
  if (currentSession) {
    currentSession.close();
    currentSession = null;
  }
}

// Backward compatibility exports
export function spawnMCPServer(packageName: string): ChildProcess {
  const session = new MCPSession(packageName);
  return session as unknown as ChildProcess;
}

export function killCurrentProcess(): void {
  closeSession();
}

export async function initializeMCP(packageName: string, config?: Record<string, unknown>): Promise<MCPCapabilities> {
  const session = await createSession(packageName, config);
  return session.initialize();
}

export async function listTools(): Promise<MCPTool[]> {
  if (!currentSession) {
    throw new Error('No active MCP session');
  }
  return currentSession.listTools();
}

export async function callMCPTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  if (!currentSession) {
    throw new Error('No active MCP session');
  }
  return currentSession.callTool(toolName, args);
}

export function getCurrentProcess(): ChildProcess | null {
  return currentSession ? (currentSession as unknown as ChildProcess) : null;
}

export function isInitialized(): boolean {
  return currentSession?.initialized ?? false;
}
