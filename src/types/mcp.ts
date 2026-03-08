/**
 * MCP TypeScript Interfaces
 */

export interface MCPServer {
  installedAt: string;
  enabled: boolean;
  tools: string[];
  config: Record<string, unknown>;
  env: Record<string, string>;
}

export interface MCPConfig {
  version: string;
  servers: Record<string, MCPServer>;
}

export interface OpenClawConfig {
  mcp?: MCPConfig;
  [key: string]: unknown;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: object;
}

export interface MCPToolListResponse {
  tools: MCPTool[];
}

export interface MCPCapabilities {
  tools?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

export interface MCPClientInfo {
  name: string;
  version: string;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}
