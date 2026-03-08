/**
 * Disable command - Disable an MCP server
 */

import chalk from 'chalk';
import { disableMCPServer, getMCPServer } from '../lib/config.js';
import { confirmAction } from '../lib/ui.js';

export async function disableCommand(packageName: string, skipConfirm = false): Promise<void> {
  if (!packageName) {
    console.error('Error: Package name required');
    console.error('Usage: mcp disable <package>');
    process.exit(1);
  }

  const server = getMCPServer(packageName);
  if (!server) {
    console.error(`Error: Server '${packageName}' not found`);
    console.error('Run "mcp list" to see installed servers');
    process.exit(1);
  }

  if (!server.enabled) {
    console.log(chalk.yellow(`Server '${packageName}' is already disabled`));
    return;
  }

  // Confirmation prompt
  if (!skipConfirm) {
    const confirmed = await confirmAction(
      `Disable MCP server '${packageName}'?`,
      'This will stop the server from being used until re-enabled.'
    );
    if (!confirmed) {
      console.log(chalk.gray('Operation cancelled'));
      return;
    }
  }

  disableMCPServer(packageName);
  console.log(chalk.green(`✓ Server '${packageName}' disabled`));
}
