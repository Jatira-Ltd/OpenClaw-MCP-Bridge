/**
 * Install command - Install an MCP server package
 */

import ora from 'ora';
import { installMCPServer } from '../lib/installer.js';

export async function installCommand(packageName: string, force = false): Promise<void> {
  const action = force ? `Updating ${packageName}...` : `Installing ${packageName}...`;
  const spinner = ora(action).start();
  
  try {
    await installMCPServer(packageName, force);
    spinner.succeed(force ? `Updated ${packageName}` : `Installed ${packageName}`);
  } catch (error) {
    // If update fails (e.g., already at latest), just succeed if it's an update
    if (force) {
      spinner.succeed(`${packageName} is already up to date`);
    } else {
      spinner.fail(`Failed to ${force ? 'update' : 'install'} ${packageName}`);
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}
