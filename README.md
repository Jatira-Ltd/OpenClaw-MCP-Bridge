# MCP Bridge for OpenClaw

[![npm version](https://img.shields.io/npm/v/mcp-bridge-openclaw.svg)](https://www.npmjs.com/package/mcp-bridge-openclaw)
[![npm downloads](https://img.shields.io/npm/dm/mcp-bridge-openclaw.svg)](https://www.npmjs.com/package/mcp-bridge-openclaw)
[![License: MIT](https://img.shields.io/npm/l/mcp-bridge-openclaw.svg)](https://opensource.org/licenses/MIT)

Connect to Model Context Protocol (MCP) servers seamlessly with OpenClaw. MCP Bridge acts as a bridge between OpenClaw and MCP-compatible servers, enabling AI agents to interact with external tools and services.

## Features

- 🔌 **Multi-Server Support** - Connect to multiple MCP servers simultaneously
- 🔄 **Auto-Reconnection** - Automatically reconnects to servers on connection loss
- ⏱️ **Retry Logic** - Configurable retry with exponential backoff
- 📊 **Type Safety** - Full TypeScript support with validated configs
- 🧪 **Test Coverage** - Comprehensive test suite with 85%+ coverage
- 🎯 **CLI & Programmatic** - Use as CLI tool or import as a module
- 🤖 **AI Agent Ready** - Dynamic tool discovery means AI agents can use ANY MCP server without needing a separate skill for each one

## Installation

### From npm (recommended)

```bash
npm install -g mcp-bridge-openclaw
```

### From source

```bash
git clone https://github.com/Jatira-Ltd/OpenClaw-MCP-Bridge.git
cd mcp-bridge
npm install
npm run build:all
npm link
```

### For AI Agents (ClawHub Skill)

AI agents can learn to use MCP Bridge via the ClawHub skill — no manual setup required:

```bash
# Install ClawHub CLI
npm i -g clawhub

# Install the mcp-bridge skill
clawhub install mcp-bridge
```

**Why this matters:**
- The skill teaches AI agents how to connect to MCP servers dynamically
- AI agents discover available tools at runtime — no need for separate skills per MCP server
- One skill unlocks access to 100+ MCP servers (GitHub, Notion, Postgres, Filesystem, etc.)

## Quick Start

### 1. Create a configuration file

Create `mcp-config.json` in your project:

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "env": {}
    },
    "custom-api": {
      "command": "node",
      "args": ["/path/to/your/mcp-server.js"],
      "env": {
        "API_KEY": "your-api-key"
      },
      "retry": {
        "maxAttempts": 3,
        "initialDelayMs": 1000,
        "maxDelayMs": 10000
      }
    }
  }
}
```

### 2. Run the CLI

```bash
mcp-bridge --config mcp-config.json
```

### 3. Programmatic Usage

```typescript
import { MCPBridge } from 'mcp-bridge-openclaw';
import { z } from 'zod';

const bridge = new MCPBridge({
  configPath: './mcp-config.json',
  onServerConnect: (name) => console.log(`Connected to ${name}`),
  onServerDisconnect: (name, error) => console.log(`Disconnected from ${name}`),
});

await bridge.connect();
await bridge.connectToServer('filesystem');

// Call an MCP tool
const result = await bridge.callTool('filesystem', 'read_file', {
  path: '/tmp/example.txt'
});

console.log(result);
await bridge.disconnect();
```

## Real-World Use Cases

### 1. Filesystem Access

Read/write files on your local machine:

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/projects"],
      "env": {}
    }
  }
}
```

**Use case:** Your AI agent can read project files, write code, and manage local resources securely.

---

### 2. GitHub Integration

Connect to GitHub for repository operations:

```json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

**Use case:** Create issues, PRs, search code, and manage repositories directly from your AI assistant.

---

### 3. Memory & Knowledge Base

Persistent memory for your AI agent:

```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    }
  }
}
```

**Use case:** Store conversation history, learned facts, and context across sessions.

---

### Running Multiple Servers

Connect to several MCP servers at once:

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
        "GITHUB_TOKEN": "demo-token"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    }
  }
}
```

```bash
mcp-bridge --config mcp-config.json
```

---

### Quick Reference

| MCP Server | Package | Common Use |
|------------|---------|------------|
| Filesystem | `@modelcontextprotocol/server-filesystem` | Local file ops |
| GitHub | `@modelcontextprotocol/server-github` | Repo management |
| Memory | `@modelcontextprotocol/server-memory` | Persistent context |
| Brave Search | `@modelcontextprotocol/server-brave-search` | Web search |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | Database queries |

Browse more official MCP servers at: https://github.com/modelcontextprotocol/screenshots

---

## Screenshots

### Initial State (No Servers)

```
┌─────────────────────────────────────────────────────────────┐
│  🪢 MCP Bridge                              v1.0.0  [?]help │
├─────────────────────────────────────────────────────────────┤
│  Servers                                         [+ Add]    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  No servers configured. Press 'a' to add your first server.│
│                                                             │
│  Tools                                                     │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Select a connected server to view available tools        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│  a Add server   ? Help   q Quit                            │
└─────────────────────────────────────────────────────────────┘
```

### Connected Server with Tools

```
┌─────────────────────────────────────────────────────────────┐
│  🪢 MCP Bridge                              v1.0.0  [?]help │
├─────────────────────────────────────────────────────────────┤
│  Servers                                         [+ Add]    │
│  ─────────────────────────────────────────────────────────  │
│  ●  filesystem              7 tools      [Disconnect]      │
│  ○  github                  — tools       [Connect]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Tools (filesystem)                              [🔄 Refresh]│
│  ─────────────────────────────────────────────────────────  │
│  📄  read_file        Read contents from a file            │
│  📁  read_directory   List directory contents              │
│  📝  write_file       Write content to a file              │
│  🗑️  delete_file      Delete a file                        │
│  📤  move_file        Move/rename a file                   │
│  📋  get_file_info    Get file metadata                    │
│  🔍  search_files     Search for files matching pattern    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Execute                                              [Clear]│
│  ─────────────────────────────────────────────────────────  │
│  Tool: read_file                                        [▶ Run]│
│  Args: { "path": "" }                                      ││
│                                                             │
│  Result:                                                  [▣]│
│  ─────────────────────────────────────────────────────────  │
│  (No result yet)                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
│  ↑↓ Navigate   ↵ Select   a Add   r Refresh   q Quit     │
└─────────────────────────────────────────────────────────────┘
```

### Successful Execution

```
┌─────────────────────────────────────────────────────────────┐
│  Execute                                              [Clear]│
│  ─────────────────────────────────────────────────────────  │
│  Tool: read_file                        [✓ Done in 42ms]  │
│  Args: { "path": "package.json" }               [▼ Edit]   │
│                                                             │
│  Result:                              [📋 Copy] [🗑 Clear]  │
│  ─────────────────────────────────────────────────────────  │
│  {                                                          │
│    "name": "mcp-bridge-openclaw",                          │
│    "version": "1.0.0",                                     │
│    "description": "MCP Bridge for OpenClaw",               │
│    "main": "dist/index.js",                                │
│    "type": "module"                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│  Execute                                              [Clear]│
│  ─────────────────────────────────────────────────────────  │
│  Tool: read_file                                        [▶ Run]│
│  Args: { "path": "/nonexistent/file.txt" }                │
│                                                             │
│  Result:                                                  [▣]│
│  ─────────────────────────────────────────────────────────  │
│  ⚠️  Error: File not found                                 │
│                                                             │
│  at filesystem.read_file (server.js:142)                   │
│  at process._tickCallback (internal/process/next_tick...   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Server Configuration

Each server in the `servers` object requires:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | Executable path or command |
| `args` | string[] | Yes | Command-line arguments |
| `env` | object | No | Environment variables |
| `retry` | RetryConfig | No | Retry configuration |

### Retry Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxAttempts` | number | 3 | Maximum retry attempts |
| `initialDelayMs` | number | 1000 | Initial delay in ms |
| `maxDelayMs` | number | 10000 | Maximum delay in ms |
| `backoffMultiplier` | number | 2 | Exponential backoff multiplier |

### Full Configuration Example

```json
{
  "servers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "env": {
        "DEBUG": "true"
      },
      "retry": {
        "maxAttempts": 5,
        "initialDelayMs": 500,
        "maxDelayMs": 30000,
        "backoffMultiplier": 1.5
      }
    }
  },
  "logging": {
    "level": "info",
    "pretty": true
  }
}
```

## CLI Reference

```
mcp-bridge [options]

Options:
  --config <path>     Path to configuration file (default: "mcp-config.json")
  --server <name>    Connect to specific server(s) only
  --list             List available servers and exit
  --verbose          Enable verbose logging
  --help             Show this help message
  --version          Show version number
```

### Examples

```bash
# Connect to all servers in config
mcp-bridge --config ./my-config.json

# Connect to specific server
mcp-bridge --config ./config.json --server filesystem

# List available servers
mcp-bridge --config ./config.json --list

# Verbose mode for debugging
mcp-bridge --config ./config.json --verbose
```

## Programmatic API

### MCPBridge Class

```typescript
new MCPBridge(options: BridgeOptions)
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `configPath` | string | Path to config file |
| `config` | BridgeConfig | Inline config object |
| `onServerConnect` | (name: string) => void | Server connected callback |
| `onServerDisconnect` | (name: string, error?: Error) => void | Server disconnected callback |
| `onError` | (error: Error) => void | Global error handler |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | Promise<void> | Connect to all configured servers |
| `connectToServer(name: string)` | Promise<void> | Connect to specific server |
| `disconnect()` | Promise<void> | Disconnect all servers |
| `disconnectFromServer(name: string)` | Promise<void> | Disconnect specific server |
| `callTool(server: string, tool: string, args?: object)` | Promise<any> | Call a tool on a server |
| `listTools(server?: string)` | Promise<Tool[]> | List available tools |
| `listResources(server?: string)` | Promise<Resource[]> | List available resources |

## Troubleshooting

### Common Issues

#### 1. "Server failed to start"

**Cause**: The server command doesn't exist or has wrong permissions.

**Solution**:
```bash
# Verify the command exists
which npx
which node

# Check if the script is executable
chmod +x /path/to/your/server.js
```

#### 2. "Connection timeout"

**Cause**: Server taking too long to start.

**Solution**:
```json
{
  "servers": {
    "slow-server": {
      "command": "node",
      "args": ["server.js"],
      "retry": {
        "maxAttempts": 5,
        "initialDelayMs": 2000
      }
    }
  }
}
```

#### 3. "Environment variable not found"

**Cause**: Missing required env vars.

**Solution**:
```json
{
  "servers": {
    "api-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "your-key-here",
        "DATABASE_URL": "postgres://..."
      }
    }
  }
}
```

#### 4. "Module not found" errors

**Cause**: Missing dependencies.

**Solution**:
```bash
cd /path/to/mcp-server
npm install
```

### Debug Mode

Enable verbose logging:

```bash
mcp-bridge --config config.json --verbose
```

Or set environment variable:

```bash
DEBUG=mcp-bridge:* mcp-bridge --config config.json
```

### Validation Errors

The config validator provides detailed error messages:

```
✗ Invalid config at mcp-config.json:
  - servers.my-server.command: Required
  - servers.my-server.args: Must be an array
```

### Getting Help

- Report issues: https://github.com/Jatira-Ltd/OpenClaw-MCP-Bridge/issues
- Check logs with `--verbose` for detailed error information

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build:all

# Run CLI locally
npm run dev -- --config ./test-config.json
```

## License

MIT
