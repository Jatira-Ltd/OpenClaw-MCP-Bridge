/**
 * Installer module - Install MCP server packages via npx
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { addMCPServer } from './config.js';

const execAsync = promisify(exec);

// Strict validation for npm package names
// Package names must match: @scope/name or name, alphanumeric with hyphens/underscores
const PACKAGE_NAME_REGEX = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/**
 * Validate package name to prevent command injection
 */
function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new Error('Package name is required');
  }
  
  if (packageName.length > 214) {
    throw new Error('Package name too long');
  }
  
  if (!PACKAGE_NAME_REGEX.test(packageName)) {
    throw new Error('Invalid package name format');
  }
  
  // Block dangerous patterns
  const dangerous = ['&&', '||', ';', '|', '`', '$(', '>', '<', '\n', '\r'];
  if (dangerous.some(d => packageName.includes(d))) {
    throw new Error('Package name contains invalid characters');
  }
}

/**
 * Install an MCP server package via npx
 */
export async function installMCPServer(packageName: string): Promise<void> {
  // Validate package name before use
  validatePackageName(packageName);
  
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
  // Validate before checking
  validatePackageName(packageName);
  
  try {
    await execAsync(`npm list ${packageName}`, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
