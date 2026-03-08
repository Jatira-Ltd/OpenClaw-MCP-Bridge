# CLI Flags Reference

Complete reference for the `mcp-bridge` command-line interface.

## Synopsis

```bash
mcp-bridge [options] [command]
```

## Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--config <path>` | `-c` | Path to configuration file | `mcp-config.json` |
| `--server <name>` | `-s` | Connect to specific server(s) only | All servers |
| `--list` | `-l` | List available servers and exit | — |
| `--verbose` | `-v` | Enable verbose logging | `false` |
| `--debug` | `-d` | Enable debug output (includes trace logs) | `false` |
| `--version` | `-V` | Show version number and exit | — |
| `--help` | `-h` | Show help message and exit | — |

## Commands

The CLI operates in two modes:

### Interactive Mode (Default)

When run without flags in a TTY terminal:

```bash
mcp-bridge
```

Opens an interactive terminal UI with:
- Server management panel
- Tools browser panel  
- Execution panel

### Non-Interactive Mode

When run without a TTY or with specific commands:

```bash
# List installed servers
mcp-bridge list

# Install an MCP server
mcp-bridge install <package>

# Remove an MCP server
mcp-bridge remove <package>

# Call an MCP tool
mcp-bridge call <tool> [--args <json>]
```

## Examples

### Basic Usage

```bash
# Connect to all servers in default config
mcp-bridge

# Connect with custom config
mcp-bridge --config ./my-config.json

# Connect with verbose logging
mcp-bridge --verbose --config ./config.json
```

### Server Selection

```bash
# Connect to specific server only
mcp-bridge --server filesystem

# Connect to multiple servers (comma-separated)
mcp-bridge --server filesystem,github

# Connect to multiple servers (multiple flags)
mcp-bridge -s filesystem -s github
```

### Information Commands

```bash
# List available servers
mcp-bridge --list

# Short alias
mcp-bridge -l

# Show version
mcp-bridge --version

# Show help
mcp-bridge --help
```

### Debugging

```bash
# Enable verbose logging
mcp-bridge --verbose

# Enable debug logging (most verbose)
mcp-bridge --debug

# Combine with other options
mcp-bridge --debug --config ./config.json --server filesystem
```

## Configuration File

The `--config` flag specifies the path to your MCP configuration file:

```bash
mcp-bridge --config /path/to/config.json
```

### Config File Format

```json
{
  "servers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "env": {},
      "retry": {
        "maxAttempts": 3,
        "initialDelayMs": 1000,
        "maxDelayMs": 10000
      }
    }
  },
  "logging": {
    "level": "info",
    "pretty": true
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DEBUG` | Enable debug logging (`mcp-bridge:*`) |
| `MCP_CONFIG_PATH` | Default config file path |
| `MCP_LOG_LEVEL` | Log level (trace, debug, info, warn, error) |

### Examples

```bash
# Debug mode via environment
DEBUG=mcp-bridge:* mcp-bridge --config config.json

# Custom log level
MCP_LOG_LEVEL=debug mcp-bridge
```

## Keyboard Shortcuts (Interactive Mode)

When running in interactive TTY mode:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between items |
| `Enter` | Select / Connect / Execute |
| `Tab` | Move between panels |
| `Esc` | Cancel / Go back |
| `a` | Add a new MCP server |
| `r` | Refresh tools for selected server |
| `c` | Copy last execution result |
| `?` | Toggle help panel |
| `q` | Quit MCP Bridge |

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid command-line arguments |
| `3` | Configuration error |
| `4` | Connection error |

## Common Issues

### "Interactive CLI requires a terminal"

When running without a TTY, use non-interactive commands:

```bash
mcp-bridge --list
mcp-bridge install <package>
```

### "Invalid config file"

Validate your JSON:

```bash
# Use a linter or:
cat config.json | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

### "Server failed to start"

Check the command exists:

```bash
which npx
which node
```
