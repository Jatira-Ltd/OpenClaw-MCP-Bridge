# MCP Bridge for OpenClaw

Connect to Model Context Protocol (MCP) servers seamlessly with OpenClaw. MCP Bridge acts as a bridge between OpenClaw and MCP-compatible servers, enabling AI agents to interact with external tools and services.

## Features

- 🔌 **Multi-Server Support** - Connect to multiple MCP servers simultaneously
- 🔄 **Auto-Reconnection** - Automatically reconnects to servers on connection loss
- ⏱️ **Retry Logic** - Configurable retry with exponential backoff
- 📊 **Type Safety** - Full TypeScript support with validated configs
- 🧪 **Test Coverage** - Comprehensive test suite with 85%+ coverage
- 🎯 **CLI & Programmatic** - Use as CLI tool or import as a module

## Installation

### From npm (recommended)

```bash
npm install -g @openclaw/mcp-bridge
```

### From source

```bash
git clone https://github.com/openclaw/mcp-bridge.git
cd mcp-bridge
npm install
npm run build:all
npm link
```

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
import { MCPBridge } from '@openclaw/mcp-bridge';
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

- Report issues: https://github.com/openclaw/mcp-bridge/issues
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
