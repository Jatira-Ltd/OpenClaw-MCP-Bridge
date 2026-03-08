/**
 * MCP Bridge for OpenClaw
 * Entry point
 */

import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { callCommand } from './commands/call.js';

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
  remove <package>     Remove an MCP server
  call <tool> [args]   Call an MCP tool

Examples:
  mcp install @notionhq/mcp-server
  mcp list
  mcp call read_file { "path": "/tmp/test.txt" }
  `);
}

export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'install': {
      const packageName = args[1];
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
      const packageName = args[1];
      if (!packageName) {
        console.error('Error: Package name required');
        console.error('Usage: mcp remove <package>');
        process.exit(1);
      }
      await removeCommand(packageName);
      break;
    }
    case 'call': {
      const toolName = args[1];
      const toolArgs = args[2] ? JSON.parse(args[2]) : {};
      if (!toolName) {
        console.error('Error: Tool name required');
        console.error('Usage: mcp call <tool> [args]');
        process.exit(1);
      }
      await callCommand(toolName, toolArgs);
      break;
    }
    default: {
      showHelp();
    }
  }
}

// Run if called directly
main().catch(console.error);
