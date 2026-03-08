/**
 * Remove command - Remove an MCP server
 */

import ora from 'ora';
import { removeMCPServer } from '../lib/config.js';

export async function removeCommand(packageName: string): Promise<void> {
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
