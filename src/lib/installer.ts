/**
 * Installer module - Install MCP server packages via npx
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { addMCPServer } from './config.js';

const execAsync = promisify(exec);

/**
 * Install an MCP server package via npx
 */
export async function installMCPServer(packageName: string): Promise<void> {
  // Verify the package exists by running npx
  const { stdout, stderr } = await execAsync(`npx -y ${packageName} --version`, {
    timeout: 60000,
  });
  
  // Add to config
  addMCPServer(packageName, {
    installedAt: new Date().toISOString(),
    enabled: true,
    tools: [],
    config: {},
    env: {},
  });
  
  console.log(`Installed ${packageName}: ${stdout.trim()}`);
}

/**
 * Check if a package is installed
 */
export async function isPackageInstalled(packageName: string): Promise<boolean> {
  try {
    await execAsync(`npm list ${packageName}`, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
