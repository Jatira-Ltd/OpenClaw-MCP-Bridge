/**
 * Enable command - Enable an MCP server
 */

import chalk from 'chalk';
import { enableMCPServer, getMCPServer } from '../lib/config.js';

export async function enableCommand(packageName: string): Promise<void> {
  if (!packageName) {
    console.error('Error: Package name required');
    console.error('Usage: mcp enable <package>');
    process.exit(1);
  }

  const server = getMCPServer(packageName);
  if (!server) {
    console.error(`Error: Server '${packageName}' not found`);
    console.error('Run "mcp list" to see installed servers');
    process.exit(1);
  }

  if (server.enabled) {
    console.log(chalk.yellow(`Server '${packageName}' is already enabled`));
    return;
  }

  enableMCPServer(packageName);
  console.log(chalk.green(`✓ Server '${packageName}' enabled`));
}
