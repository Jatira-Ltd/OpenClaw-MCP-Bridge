/**
 * MCP Bridge for OpenClaw
 * Entry point
 */

import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { callCommand } from './commands/call.js';
import { statusCommand } from './commands/status.js';
import { enableCommand } from './commands/enable.js';
import { disableCommand } from './commands/disable.js';
import { discoverCommand } from './commands/discover.js';
import { configEditCommand } from './commands/config-edit.js';
import { updateCommand } from './commands/update.js';
import { closeSession } from './lib/protocol.js';
import { readMCPConfig } from './lib/config.js';

const PKG_VERSION = '1.0.0';

function showHelp() {
  console.log(`
MCP Bridge for OpenClaw v${PKG_VERSION}

Usage: mcp <command> [options]

Commands:
  install <package>    Install an MCP server package
  list                 List installed MCP servers
  remove <package>    Remove an MCP server
  call <tool> [args]   Call an MCP tool
  status               Show MCP server status
  enable <package>    Enable an MCP server
  disable <package>   Disable an MCP server
  discover [server]    Discover tools from MCP servers
  update [package]     Update MCP server(s) to latest version
  config               Manage MCP server configuration

Configuration Commands:
  mcp config edit --server <name> --list              List server config
  mcp config edit --server <name> --key <k> --value <v>  Set config
  mcp config edit --server <name> --remove <key>      Remove config

Options:
  -s, --server <name>  Specify MCP server to use (for call command)
  --version            Show version information
  --help               Show this help message

Examples:
  mcp install @notionhq/mcp-server
  mcp list
  mcp status
  mcp discover
  mcp discover @notionhq/mcp-server
  mcp enable @notionhq/mcp-server
  mcp disable @notionhq/mcp-server
  mcp update
  mcp update @notionhq/mcp-server
  mcp config edit --server @notionhq/mcp-server --key apiKey --value "xxx"
  mcp config edit --server @notionhq/mcp-server --list
  mcp call read_file '{ "path": "/tmp/test.txt" }'
  `);
}

/**
 * Parse command line arguments with support for flags
 */
function parseArgs(args: string[]): { 
  command: string;
  rest: string[];
  server?: string;
  options: Record<string, string | boolean>;
} {
  let command = args[0] || '';
  const rest: string[] = [];
  let server: string | undefined;
  const options: Record<string, string | boolean> = {};

  // Handle global flags first (before command)
  let processedFlags = true;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--version') {
      options.version = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '-s' || arg === '--server') {
      if (i + 1 < args.length) {
        server = args[i + 1];
        i++;
      }
    } else if (arg.startsWith('--server=')) {
      server = arg.split('=')[1];
    } else {
      // This is the command or a positional argument
      processedFlags = false;
      break;
    }
  }

  // If we processed all args as flags, return early
  if (processedFlags && args.length > 0) {
    return { command: '', rest: [], server, options };
  }

  // Re-parse without global flags
  const remainingArgs = processedFlags ? [] : args;
  command = remainingArgs[0] || '';

  for (let i = 1; i < remainingArgs.length; i++) {
    const arg = remainingArgs[i];
    
    if (arg === '-s' || arg === '--server') {
      if (i + 1 < remainingArgs.length) {
        server = remainingArgs[i + 1];
        i++;
      }
    } else if (arg.startsWith('--server=')) {
      server = arg.split('=')[1];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--')) {
      // Handle --key=value format
      if (arg.includes('=')) {
        const idx = arg.indexOf('=');
        const key = arg.substring(2, idx);
        const value = arg.substring(idx + 1);
        options[key] = value;
      } else {
        // Boolean flags like --list
        options[arg.substring(2)] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flags
      options[arg.substring(1)] = true;
    } else {
      rest.push(arg);
    }
  }

  return { command, rest, server, options };
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
  const { command, rest, server, options } = parseArgs(args);

  // Handle global flags
  if (options.version || command === 'version') {
    console.log(`MCP Bridge for OpenClaw v${PKG_VERSION}`);
    return;
  }

  if (!command || options.help || command === 'help') {
    showHelp();
    return;
  }

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
    case 'status': {
      await statusCommand(!!options.json);
      break;
    }
    case 'enable': {
      const packageName = rest[0];
      if (!packageName) {
        console.error('Error: Package name required');
        console.error('Usage: mcp enable <package>');
        process.exit(1);
      }
      await enableCommand(packageName);
      break;
    }
    case 'disable': {
      const packageName = rest[0];
      if (!packageName) {
        console.error('Error: Package name required');
        console.error('Usage: mcp disable <package>');
        process.exit(1);
      }
      await disableCommand(packageName);
      break;
    }
    case 'discover': {
      const packageName = rest[0];
      await discoverCommand(packageName, !!options.json);
      break;
    }
    case 'update': {
      const packageName = rest[0];
      await updateCommand(packageName);
      break;
    }
    case 'config': {
      // Handle: mcp config edit [options]
      const subCommand = rest[0];
      
      if (subCommand === 'edit') {
        await configEditCommand({
          server: server,
          key: options.key as string | undefined,
          value: options.value as string | undefined,
          list: !!options.list,
          remove: options.remove as string | undefined,
        });
      } else {
        // Default to config edit with no args (shows help)
        await configEditCommand({});
      }
      break;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      console.error('Run "mcp --help" for usage information');
      process.exit(1);
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
