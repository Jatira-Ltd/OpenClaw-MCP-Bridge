# MCP Bridge Examples

Real-world examples for using MCP Bridge in various scenarios.

## Example 1: File System Operations

Connect to the filesystem MCP server to enable file operations.

### Configuration

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
      "env": {}
    }
  }
}
```

### Programmatic Usage

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';

const bridge = new MCPBridge({
  configPath: './config.json'
});

await bridge.connect();

// Read a file
const content = await bridge.callTool('filesystem', 'read_file', {
  path: '/home/user/projects/package.json'
});

console.log('Package.json:', content);

// List directory
const files = await bridge.callTool('filesystem', 'list_directory', {
  path: '/home/user/projects'
});

console.log('Files:', files);

// Write a file
await bridge.callTool('filesystem', 'write_file', {
  path: '/home/user/projects/output.txt',
  content: 'Hello from MCP Bridge!'
});

await bridge.disconnect();
```

## Example 2: Multiple Servers

Connect to multiple MCP servers simultaneously.

### Configuration

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    },
    "postgres": {
      "command": "node",
      "args": ["/path/to/postgres-mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgres://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

### Programmatic Usage

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';

const bridge = new MCPBridge({
  configPath: './multi-server-config.json',
  onServerConnect: (name) => console.log(`✓ Connected to ${name}`),
  onServerDisconnect: (name, error) => {
    if (error) {
      console.log(`✗ Disconnected from ${name}: ${error.message}`);
    } else {
      console.log(`✓ Disconnected from ${name}`);
    }
  }
});

await bridge.connect();

// Use filesystem
const files = await bridge.callTool('filesystem', 'list_directory', {
  path: '/tmp'
});

// Use GitHub (if token configured)
const issues = await bridge.callTool('github', 'list_issues', {
  owner: 'openclaw',
  repo: 'mcp-bridge'
});

// Use Postgres
const users = await bridge.callTool('postgres', 'query', {
  sql: 'SELECT * FROM users LIMIT 10'
});

await bridge.disconnect();
```

## Example 3: Error Handling & Retry

Configure retry logic for unreliable servers.

### Configuration

```json
{
  "servers": {
    "unstable-api": {
      "command": "node",
      "args": ["/path/to/unstable-api-server.js"],
      "env": {
        "API_URL": "https://api.example.com"
      },
      "retry": {
        "maxAttempts": 5,
        "initialDelayMs": 1000,
        "maxDelayMs": 30000,
        "backoffMultiplier": 2
      }
    }
  }
}
```

### Programmatic Usage with Error Handling

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';

const bridge = new MCPBridge({
  configPath: './config.json',
  onError: (error) => {
    console.error('Bridge error:', error.message);
  }
});

await bridge.connect();

try {
  const result = await bridge.callTool('unstable-api', 'fetch_data', {
    id: 123
  });
  console.log('Result:', result);
} catch (error) {
  if (error.message.includes('max attempts')) {
    console.error('Server is unavailable after all retry attempts');
    // Fallback logic here
  } else {
    throw error;
  }
}

await bridge.disconnect();
```

## Example 4: Using Tools List

Discover available tools before calling them.

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';

const bridge = new MCPBridge({
  configPath: './config.json'
});

await bridge.connect();

// List all tools from all servers
const allTools = await bridge.listTools();
console.log('Available tools:');
for (const [server, tools] of Object.entries(allTools)) {
  console.log(`\n${server}:`);
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${tool.description}`);
  }
}

// List tools from specific server
const fsTools = await bridge.listTools('filesystem');
console.log('Filesystem tools:', fsTools);

await bridge.disconnect();
```

## Example 5: Selective Server Connection

Only connect to specific servers from your config.

### CLI

```bash
# Only start filesystem server
mcp-bridge --config config.json --server filesystem

# Multiple servers (comma-separated)
mcp-bridge --config config.json --server filesystem,github
```

### Programmatic

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';

const bridge = new MCPBridge({
  configPath: './config.json'
});

// Only connect to specific server
await bridge.connectToServer('filesystem');

const files = await bridge.callTool('filesystem', 'list_directory', {
  path: '/tmp'
});

// Later, connect to another if needed
await bridge.connectToServer('github');

await bridge.disconnect();
```

## Example 6: Environment Variables

Securely pass environment variables.

### Configuration

```json
{
  "servers": {
    "secure-api": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "sk-live-xxxxx",
        "DATABASE_URL": "postgres://...",
        "WEBHOOK_SECRET": "whsec_xxx"
      }
    }
  }
}
```

### Using .env files

Create a `.env` file:

```
MCP_API_KEY=sk-live-xxxxx
MCP_DATABASE_URL=postgres://...
```

Load in your application:

```typescript
import dotenv from 'dotenv';
import { MCPBridge } from 'mcp-bridge-openclaw';
import { readFileSync } from 'fs';

dotenv.config();

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

// Inject env vars from process.env
for (const [name, serverConfig] of Object.entries(config.servers)) {
  if (!serverConfig.env) serverConfig.env = {};
  serverConfig.env.API_KEY = process.env.MCP_API_KEY;
  serverConfig.env.DATABASE_URL = process.env.MCP_DATABASE_URL;
}

const bridge = new MCPBridge({ config });
await bridge.connect();
```

## Example 7: Custom MCP Server

Create and connect to your own MCP server.

### Server Implementation

```typescript
// my-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define your tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'greet',
        description: 'Greet a user',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name to greet' },
          },
          required: ['name'],
        },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'greet') {
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${args.name}!`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Run Your Server

```json
{
  "servers": {
    "my-server": {
      "command": "npx",
      "args": ["ts-node", "my-server.ts"],
      "env": {}
    }
  }
}
```

## Example 8: Integration with AI Agents

Use MCP Bridge with AI agents for tool-augmented conversations.

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';

class ToolEnabledAgent {
  private bridge: MCPBridge;
  private availableTools: Map<string, any> = new Map();

  constructor(configPath: string) {
    this.bridge = new MCPBridge({
      configPath,
      onServerConnect: async (name) => {
        const tools = await this.bridge.listTools(name);
        for (const tool of tools) {
          this.availableTools.set(tool.name, { ...tool, server: name });
        }
      }
    });
  }

  async initialize() {
    await this.bridge.connect();
    console.log(`Initialized with ${this.availableTools.size} tools`);
  }

  async executeTask(userRequest: string) {
    // In a real implementation, you'd use an LLM to:
    // 1. Decide which tool to call
    // 2. Extract parameters
    // 3. Call the tool
    // 4. Process the result

    // Example: Simple keyword matching
    if (userRequest.toLowerCase().includes('list files')) {
      const result = await this.bridge.callTool('filesystem', 'list_directory', {
        path: '/tmp'
      });
      return result;
    }

    return 'No suitable tool found for this request';
  }

  async shutdown() {
    await this.bridge.disconnect();
  }
}

// Usage
const agent = new ToolEnabledAgent('./config.json');
await agent.initialize();
const result = await agent.executeTask('list files in /tmp');
console.log(result);
await agent.shutdown();
```
