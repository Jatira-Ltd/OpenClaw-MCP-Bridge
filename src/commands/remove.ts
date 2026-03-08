/**
 * Remove command - Remove an MCP server
 */

import ora from 'ora';
import chalk from 'chalk';
import { removeMCPServer, getMCPServer } from '../lib/config.js';
import { confirmAction } from '../lib/ui.js';

export async function removeCommand(packageName: string, skipConfirm = false): Promise<void> {
  // Verify server exists
  const server = getMCPServer(packageName);
  if (!server) {
    console.error(`Error: Server '${packageName}' not found`);
    console.error('Run "mcp list" to see installed servers');
    process.exit(1);
  }

  // Confirmation prompt
  if (!skipConfirm) {
    console.log(chalk.bold(`\nRemove MCP Server: ${packageName}`));
    const confirmed = await confirmAction(
      `Are you sure you want to remove '${packageName}'?`,
      `This will:\n  • Uninstall the package\n  • Remove all configuration\n  • Delete cached tools`
    );
    if (!confirmed) {
      console.log(chalk.gray('Operation cancelled'));
      return;
    }
  }

  const spinner = ora(`Removing ${packageName}...`).start();
  
  try {
    removeMCPServer(packageName);
    spinner.succeed(`Removed ${packageName}`);
  } catch (error) {
    spinner.fail(`Failed to remove ${packageName}`);
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
