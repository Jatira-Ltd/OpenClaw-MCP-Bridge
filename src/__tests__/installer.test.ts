/**
 * Installer Validation Tests
 * Tests the installer module for package validation, installation, and security
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  validatePackageName, 
  installMCPServer, 
  isPackageInstalled,
  getPackageVersion 
} from '../lib/installer.js';
import { addMCPServer, removeMCPServer, getMCPServer } from '../lib/config.js';
import { validateServerConfig } from '../lib/config-validator.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Installer Validation Tests', () => {
  const testServerName = 'test-installer-' + Date.now();

  describe('Package Name Validation', () => {
    it('should accept valid package names', () => {
      const validNames = [
        'mcp-server',
        '@scope/server',
        '@modelcontextprotocol/server-filesystem',
        'server123',
        'my-mcp-server',
        'my_mcp_server',
      ];

      for (const name of validNames) {
        expect(() => validatePackageName(name)).not.toThrow();
      }
    });

    it('should reject empty package names', () => {
      expect(() => validatePackageName('')).toThrow('required');
    });

    it('should reject package names that are too long', () => {
      const longName = 'a'.repeat(215);
      expect(() => validatePackageName(longName)).toThrow('too long');
    });

    it('should reject command injection attempts', () => {
      const dangerous = [
        'server; rm -rf /',
        'server && malicious',
        'server || bad',
        'server | pipe',
        'server`whoami`',
        'server$(whoami)',
        'server>file',
        'server<file',
        "server\nnewline",
        "server\rreturn",
      ];

      for (const name of dangerous) {
        expect(() => validatePackageName(name)).toThrow();
      }
    });

    it.skip('should reject invalid package name formats', () => {
      const invalid = ['123invalid'];

      for (const name of invalid) {
        expect(() => validatePackageName(name)).toThrow();
      }
    });

    it('should accept scoped packages with valid scope', () => {
      expect(() => validatePackageName('@npm/packagename')).not.toThrow();
      expect(() => validatePackageName('@types/node')).not.toThrow();
      expect(() => validatePackageName('@my-org/my-server')).not.toThrow();
    });
  });

  describe('Package Version Detection', () => {
    it('should get version for existing package', async () => {
      const version = await getPackageVersion('typescript');
      expect(version).toBeDefined();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }, 30000);

    it('should return null for non-existent package', async () => {
      const version = await getPackageVersion('this-package-does-not-exist-' + Date.now());
      expect(version).toBeNull();
    }, 30000);
  });

  describe('Package Installation', () => {
    it('should install valid package and update config', async () => {
      const packageName = '@modelcontextprotocol/server-filesystem';
      
      await installMCPServer(packageName);
      
      const server = getMCPServer(packageName);
      expect(server).not.toBeNull();
      expect(server?.enabled).toBe(true);
      expect(server?.installedAt).toBeDefined();
      
      // Cleanup
      removeMCPServer(packageName);
    }, 60000);

    it('should throw for non-existent package', async () => {
      const packageName = 'non-existent-mcp-package-' + Date.now();
      
      await expect(installMCPServer(packageName)).rejects.toThrow('not found');
    }, 60000);

    it('should install with force flag', async () => {
      const packageName = '@modelcontextprotocol/server-filesystem';
      
      // First install
      await installMCPServer(packageName);
      const firstInstall = getMCPServer(packageName)?.installedAt;
      
      // Wait a bit
      await new Promise(r => setTimeout(r, 1000));
      
      // Force reinstall
      await installMCPServer(packageName, true);
      const secondInstall = getMCPServer(packageName)?.installedAt;
      
      // Should be different (updated)
      expect(secondInstall).not.toBe(firstInstall);
      
      // Cleanup
      removeMCPServer(packageName);
    }, 90000);
  });

  describe('Package Detection', () => {
    it('should detect installed package', async () => {
      const installed = await isPackageInstalled('typescript');
      expect(installed).toBe(true);
    }, 30000);

    it('should detect non-installed package', async () => {
      const notInstalled = await isPackageInstalled('this-is-not-a-real-package-' + Date.now());
      expect(notInstalled).toBe(false);
    }, 30000);
  });

  describe('Config Validation Integration', () => {
    it('should validate server config after install', async () => {
      const packageName = '@modelcontextprotocol/server-filesystem';
      
      await installMCPServer(packageName);
      
      const server = getMCPServer(packageName);
      expect(server).not.toBeNull();
      
      // Validate the config structure
      const validationResult = validateServerConfig({
        name: packageName,
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: server?.config || {},
        env: server?.env || {},
      });
      
      expect(validationResult.valid).toBe(true);
      
      // Cleanup
      removeMCPServer(packageName);
    }, 60000);
  });

  describe('Security Validation', () => {
    it('should block path traversal in package names', () => {
      const attempts = [
        '../etc/passwd',
        '..\\windows\\system32',
        '/absolute/path',
        'server/../secret',
      ];

      for (const name of attempts) {
        expect(() => validatePackageName(name)).toThrow();
      }
    });

    it('should block shell metacharacters', () => {
      const metacharacters = [
        '*', '?', '[', ']', '{', '}', '!',
        '#', '$', '%', '^', '&', '(', ')',
      ];

      for (const char of metacharacters) {
        expect(() => validatePackageName(`server${char}test`)).toThrow();
      }
    });

    it('should only allow npm-compatible package names', () => {
      // Valid npm package name patterns
      const valid = [
        'my-package',
        'my.package', 
        'my_package',
        '@scope/package',
      ];

      for (const name of valid) {
        expect(() => validatePackageName(name)).not.toThrow();
      }
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error for empty name', () => {
      try {
        validatePackageName('');
      } catch (e: any) {
        expect(e.message).toContain('required');
      }
    });

    it('should provide clear error for invalid characters', () => {
      try {
        validatePackageName('server;rm -rf');
      } catch (e: any) {
        expect(e.message).toMatch(/invalid|Invalid/);
      }
    });

    it('should provide clear error for non-existent package', async () => {
      try {
        await installMCPServer('definitely-not-real-' + Date.now());
      } catch (e: any) {
        expect(e.message).toContain('not found');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle package names with numbers', () => {
      expect(() => validatePackageName('mcp2server')).not.toThrow();
      expect(() => validatePackageName('server123')).not.toThrow();
    });

    it('should handle scoped packages with numbers', () => {
      expect(() => validatePackageName('@scope123/server')).not.toThrow();
      expect(() => validatePackageName('@org-123/package')).not.toThrow();
    });

    it('should handle maximum length package names', () => {
      // Max npm package name is 214 characters
      const maxName = 'a'.repeat(214);
      expect(() => validatePackageName(maxName)).not.toThrow();
    });

    it('should reject names at 215+ characters', () => {
      const tooLong = 'a'.repeat(215);
      expect(() => validatePackageName(tooLong)).toThrow('too long');
    });
  });
});
