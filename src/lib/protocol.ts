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

export interface ServerHealth {
  online: boolean;
  latency?: number;
  error?: string;
}

// Known MCP servers with their command/args configurations
const SERVER_CONFIGS: Record<string, { command: string; args: (config?: Record<string, unknown>) => string[]; cwd?: string }> = {
  '@modelcontextprotocol/server-filesystem': {
    command: 'node',
    args: (cfg) => {
      const basePath = path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js');
      const validatedDirs = validateAllowedDirectories(cfg?.allowedDirectories);
      return [basePath, ...validatedDirs];
    },
    cwd: path.join(process.cwd(), 'node_modules', '@modelcontextprotocol', 'server-filesystem'),
  },
};

// Known working MCP servers that should be prioritized - exported for executor
export const KNOWN_SERVERS = new Set([
  '@modelcontextprotocol/server-filesystem',
  '@modelcontextprotocol/server-brave-search',
  '@modelcontextprotocol/server-puppeteer',
  '@notionhq/mcp-server',
  '@github/mcp-server',
  '@modelcontextprotocol/server-github',
  '@notionhq/notion-mcp-server',
  '@kazuph/mcp-fetch',
  'hyper-mcp-browser',
  'slack-mcp-server',
  'mcp-fal-ai-image',
  'mcp-postgres',
  'ollama-mcp-server',
  'mcp-server-kubernetes',
  '@aashari/mcp-server-atlassian-jira',
  'linear-mcp',
  '@winor30/mcp-server-datadog',
  'chrome-devtools-mcp',
  '@sentry/mcp-server',
  '@mapbox/mcp-server',
  '@upstash/context7-mcp',
  'puppeteer-mcp-server',
  '@modelcontextprotocol/server-memory',
  '@modelcontextprotocol/server-sequential-thinking',
  'figma-mcp',
  'ref-tools-mcp',
  '@apify/actors-mcp-server',
  '@ui5/mcp-server',
  'mcp-server-code-runner',
  '@fast-kit/spec-kit',
  '@azure/mcp',
  '@azure-devops/mcp',
  '@railway/mcp-server',
  '@supabase/mcp-server-supabase',
  '@hubspot/mcp-server',
  '@heroku/mcp-server',
  '@dynatrace-oss/dynatrace-mcp-server',
  '@roychri/mcp-server-asana',
  '@stripe/mcp',
  '@zereight/mcp-gitlab',
  '@structured-world/gitlab-mcp',
]);

/**
 * Validate and sanitize allowed directories to prevent path traversal
 */
function validateAllowedDirectories(directories: unknown): string[] {
  if (!Array.isArray(directories)) {
    // Default to home directory if not specified
    return [process.env.HOME || process.cwd()];
  }
  
  const validated: string[] = [];
  const baseDirs = [process.cwd(), process.env.HOME || '/tmp'];
  
  for (const dir of directories) {
    if (typeof dir !== 'string') continue;
    
    // Resolve the path to absolute
    const absolutePath = path.isAbsolute(dir) ? dir : path.resolve(dir);
    
    // Check if path is within allowed base directories
    const isAllowed = baseDirs.some(base => 
      absolutePath.startsWith(base) || absolutePath === base
    );
    
    // Also allow explicit subdirectories that don't escape
    const normalized = path.normalize(dir);
    if (normalized.includes('..')) {
      console.warn(`Blocked path traversal attempt: ${dir}`);
      continue;
    }
    
    if (isAllowed || !dir.includes('..')) {
      validated.push(absolutePath);
    }
  }
  
  // Return at least one valid directory
  return validated.length > 0 ? validated : [process.env.HOME || process.cwd()];
}

/**
 * Get the command to run for a package with arguments
 */
function getServerCommand(packageName: string, config?: Record<string, unknown>): { command: string; args: string[]; cwd?: string } {
  // Check if there's a custom config for this server
  if (SERVER_CONFIGS[packageName]) {
    const server = SERVER_CONFIGS[packageName];
    return {
      command: server.command,
      args: server.args(config),
      cwd: server.cwd,
    };
  }

  // Check if this is a known server - use npx to run it
  if (KNOWN_SERVERS.has(packageName)) {
    return {
      command: 'npx',
      args: ['-y', packageName],
    };
  }

  // Unknown server - throw error
  throw new Error(`Unknown MCP server: ${packageName}. Only known servers are supported.`);
}

/**
 * Filter environment variables to only pass necessary ones
 */
function getFilteredEnv(): NodeJS.ProcessEnv {
  const allowedVars = [
    'PATH',
    'HOME',
    'USER',
    'TMPDIR',
    'TMP',
    'NODE_ENV',
    'LANG',
    'LC_ALL',
  ];
  
  const filtered: NodeJS.ProcessEnv = {};
  for (const key of allowedVars) {
    if (process.env[key]) {
      filtered[key] = process.env[key];
    }
  }
  return filtered;
}

/**
 * MCP Session - manages a single MCP server connection
 */
export class MCPSession {
  private process: ChildProcess;
  packageName: string;
  private config?: Record<string, unknown>;
  private requestId = 1;
  private pendingRequests: Map<number, PendingRequest> = new Map();
  public initialized = false;
  private ready = false;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private exitedPromise: Promise<void>;
  private exitedResolve!: () => void;

  constructor(packageName: string, config?: Record<string, unknown>) {
    this.packageName = packageName;
    this.config = config;
    
    // Create promises for tracking state
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
    this.exitedPromise = new Promise((resolve) => {
      this.exitedResolve = resolve;
    });
    
    const { command, args, cwd } = getServerCommand(packageName, config);
    console.log(`Starting MCP server: ${command} ${args.join(' ')}`);
    
    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      env: getFilteredEnv(),
    });

    // Handle process exit
    this.process.on('exit', () => {
      this.exitedResolve();
      this.ready = false;
    });

    this.process.on('error', (err) => {
      console.error('MCP process error:', err);
      this.exitedResolve();
      this.ready = false;
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
      if (!this.process.killed && this.process.exitCode === null) {
        this.ready = true;
        this.readyResolve();
        console.log('MCP process ready');
      }
    }, 1500);
  }

  /**
   * Wait for the process to be ready
   */
  async waitForReady(timeoutMs = 5000): Promise<void> {
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout waiting for MCP server to be ready')), timeoutMs);
    });
    await Promise.race([this.readyPromise, timeout]);
  }

  /**
   * Send a JSON-RPC request
   */
  private async sendRequest(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    // Wait for ready state
    await this.waitForReady();
    
    if (this.process.killed || this.process.exitCode !== null) {
      throw new Error('MCP server process is not running');
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
    await this.waitForReady();

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
   * Close the session and wait for process to exit
   */
  async close(timeoutMs = 5000): Promise<void> {
    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Session closed'));
    }
    this.pendingRequests.clear();
    
    this.initialized = false;
    this.ready = false;
    
    if (this.process && !this.process.killed && this.process.exitCode === null) {
      this.process.kill('SIGTERM');
      
      // Wait for process to exit with timeout
      const timeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          // Force kill if still running
          if (!this.process.killed && this.process.exitCode === null) {
            try {
              this.process.kill('SIGKILL');
            } catch (e) {
              // Ignore errors
            }
          }
          resolve();
        }, timeoutMs);
      });
      
      await Promise.race([this.exitedPromise, timeout]);
    }
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
    await currentSession.close();
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
export async function closeSession(): Promise<void> {
  if (currentSession) {
    await currentSession.close();
    currentSession = null;
  }
}

/**
 * Get health status for an MCP server
 */
export async function getServerHealth(packageName: string, config?: Record<string, unknown>): Promise<ServerHealth> {
  const startTime = Date.now();
  
  try {
    // Create a temporary session to check health
    const session = new MCPSession(packageName, config);
    
    // Wait for process to start
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 5000);
      
      // Check if process started successfully
      session.waitForReady(3000).then(() => {
        clearTimeout(timeout);
        resolve();
      }).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    
    // Try to initialize
    await session.initialize();
    const latency = Date.now() - startTime;
    
    // Clean up
    await session.close();
    
    return {
      online: true,
      latency,
    };
  } catch (error) {
    return {
      online: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
