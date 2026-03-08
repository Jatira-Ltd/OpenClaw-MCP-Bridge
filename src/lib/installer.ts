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
export function validatePackageName(packageName: string): void {
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
 * Get the latest version of a package from npm
 */
export async function getPackageVersion(packageName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`, { timeout: 30000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Install an MCP server package via npx
 */
export async function installMCPServer(packageName: string, force = false): Promise<void> {
  // Validate package name before use
  validatePackageName(packageName);
  
  // Check if package exists
  const version = await getPackageVersion(packageName);
  if (!version) {
    throw new Error(`Package '${packageName}' not found in npm registry`);
  }
  
  // Add/update config (force overwrites existing)
  addMCPServer(packageName, {
    installedAt: new Date().toISOString(),
    enabled: true,
    tools: [],
    config: {},
    env: {},
  });
  
  console.log(`${force ? 'Updated' : 'Installed'} ${packageName} v${version}`);
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
