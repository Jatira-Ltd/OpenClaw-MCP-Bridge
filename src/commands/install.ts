/**
 * Install command - Install an MCP server package
 */

import ora from 'ora';
import { installMCPServer } from '../lib/installer.js';

export async function installCommand(packageName: string): Promise<void> {
  const spinner = ora(`Installing ${packageName}...`).start();
  
  try {
    await installMCPServer(packageName);
    spinner.succeed(`Installed ${packageName}`);
  } catch (error) {
    spinner.fail(`Failed to install ${packageName}`);
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
