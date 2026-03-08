/**
 * MCP Bridge for OpenClaw
 * Entry point
 */

import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { callCommand } from './commands/call.js';
import { closeSession } from './lib/protocol.js';

interface MCPServer {
  installedAt: string;
  enabled: boolean;
  tools: string[];
  config: Record<string, unknown>;
  env: Record<string, string>;
}

interface MCPConfig {
  version: string;
  servers: Record<string, MCPServer>;
}

interface OpenClawConfig {
  mcp?: MCPConfig;
}

function showHelp() {
  console.log(`
MCP Bridge for OpenClaw

Usage: mcp <command> [options]

Commands:
  install <package>    Install an MCP server package
  list                 List installed MCP servers
  remove <package>    Remove an MCP server
  call <tool> [args]   Call an MCP tool

Options:
  -s, --server <name>  Specify MCP server to use (for call command)

Examples:
  mcp install @notionhq/mcp-server
  mcp list
  mcp call read_file '{ "path": "/tmp/test.txt" }'
  mcp call read_file '{ "path": "/tmp/test.txt" }' -s @modelcontextprotocol/server-filesystem
  `);
}

/**
 * Parse command line arguments with support for flags
 */
function parseArgs(args: string[]): { 
  command: string;
  rest: string[];
  server?: string;
} {
  const command = args[0] || '';
  const rest: string[] = [];
  let server: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-s' || arg === '--server') {
      // Next argument is server name
      if (i + 1 < args.length) {
        server = args[i + 1];
        i++; // Skip the server name
      }
    } else if (arg.startsWith('--server=')) {
      server = arg.split('=')[1];
    } else {
      rest.push(arg);
    }
  }

  return { command, rest, server };
}

/**
 * Safely parse JSON with validation
 */
function safeJsonParse(input: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Input must be a JSON object');
    }
    return parsed;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
    throw e;
  }
}

export async function main() {
  const args = process.argv.slice(2);
  const { command, rest, server } = parseArgs(args);

  switch (command) {
    case 'install': {
      const packageName = rest[0];
      if (!packageName) {
        console.error('Error: Package name required');
        console.error('Usage: mcp install <package>');
        process.exit(1);
      }
      await installCommand(packageName);
      break;
    }
    case 'list': {
      await listCommand();
      break;
    }
    case 'remove': {
      const packageName = rest[0];
      if (!packageName) {
        console.error('Error: Package name required');
        console.error('Usage: mcp remove <package>');
        process.exit(1);
      }
      await removeCommand(packageName);
      break;
    }
    case 'call': {
      const toolName = rest[0];
      const toolArgs = rest[1] ? safeJsonParse(rest[1]) : {};
      if (!toolName) {
        console.error('Error: Tool name required');
        console.error('Usage: mcp call <tool> [args]');
        process.exit(1);
      }
      await callCommand(toolName, toolArgs, server);
      break;
    }
    default: {
      showHelp();
    }
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  try {
    await closeSession();
    console.log('Cleanup complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

// Register signal handlers for proper cleanup
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Run if called directly
main().catch(console.error);
