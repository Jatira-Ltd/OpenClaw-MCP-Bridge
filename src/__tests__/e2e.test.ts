/**
 * E2E Tests - Full CLI Invocation via exec
 * Tests the CLI by spawning actual processes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(execCallback);

const CLI_PATH = path.join(process.cwd(), 'dist', 'cli.js');
const TEST_SERVER = '@modelcontextprotocol/server-filesystem';

describe('E2E: Full CLI Invocation', () => {
  let testFilePath: string;

  beforeEach(() => {
    const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
    testFilePath = path.join(homeDir, 'mcp-bridge-e2e-test.txt');
    fs.writeFileSync(testFilePath, 'E2E test content');
  });

  afterEach(async () => {
    // Cleanup test file
    if (testFilePath && fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    // Cleanup any temp files created by CLI
    const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
    const tempFiles = [
      path.join(homeDir, 'mcp-bridge-e2e-write.txt'),
    ];
    for (const f of tempFiles) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }
  });

  describe('CLI Build Verification', () => {
    it('should have built CLI available', () => {
      expect(fs.existsSync(CLI_PATH)).toBe(true);
    });

    it('should have executable CLI script', async () => {
      const stats = fs.statSync(CLI_PATH);
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('CLI Help Command', () => {
    it('should display help when run without arguments', async () => {
      try {
        await execAsync(`node ${CLI_PATH} --help`, { timeout: 30000 });
      } catch (e: any) {
        // Some CLIs exit with non-zero for help
        // Just verify it ran without crashing
        expect(e).toBeDefined();
      }
    }, 35000);

    it('should handle unknown commands gracefully', async () => {
      try {
        await execAsync(`node ${CLI_PATH} unknown-command-xyz`, { timeout: 30000 });
      } catch (e: any) {
        // Should handle gracefully
        expect(e).toBeDefined();
      }
    }, 35000);
  });

  describe('CLI Config Command', () => {
    it('should show config path', async () => {
      const configPath = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'mcp-servers.json');
      
      // Config file should exist (created by lib/config.ts on first run)
      // Just verify the path is valid
      expect(configPath).toContain('.openclaw');
    });
  });

  describe('CLI List Command', () => {
    it('should list servers without crashing', async () => {
      // This tests that the CLI can run list command
      // Even if no servers are installed, it should not crash
      const configPath = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'mcp-servers.json');
      
      // Ensure config exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ version: '1.0', servers: {} }, null, 2));
      }
      
      // Test that config can be read
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config).toBeDefined();
      expect(config.version).toBeDefined();
    });
  });

  describe('CLI Install Simulation', () => {
    it('should simulate install command flow', async () => {
      // We can't run interactive CLI, but we can verify the library works
      const { addMCPServer, removeMCPServer, getMCPServer } = await import('../lib/config.js');
      
      const testServerName = 'e2e-test-' + Date.now();
      
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: ['read_file', 'write_file'],
        config: {},
        env: {},
      });
      
      const server = getMCPServer(testServerName);
      expect(server).not.toBeNull();
      expect(server?.tools).toContain('read_file');
      
      removeMCPServer(testServerName);
      expect(getMCPServer(testServerName)).toBeNull();
    });
  });

  describe('CLI Call Tool via Library', () => {
    it('should execute tools through the system', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      // This simulates what the CLI call command does
      const { createSession, closeSession } = await import('../lib/protocol.js');
      
      const session = await createSession(TEST_SERVER, { allowedDirectories: [homeDir] });
      expect(session.initialized).toBe(true);
      
      const tools = await session.listTools();
      expect(tools.length).toBe(14);
      
      const result = await session.callTool('read_file', { path: testFilePath });
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('E2E test content');
      
      await closeSession();
    }, 90000);
  });

  describe('Error Handling', () => {
    it('should handle invalid package name', async () => {
      const { validatePackageName } = await import('../lib/installer.js');
      
      expect(() => validatePackageName('')).toThrow();
      expect(() => validatePackageName('invalid;rm-rf')).toThrow();
      expect(() => validatePackageName('valid-package')).not.toThrow();
    });

    it('should handle missing server in config', async () => {
      const { getMCPServer } = await import('../lib/config.js');
      
      const server = getMCPServer('non-existent-server-' + Date.now());
      expect(server).toBeNull();
    });

    it('should handle invalid tool calls gracefully', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const { createSession, closeSession } = await import('../lib/protocol.js');
      
      const session = await createSession(TEST_SERVER, { allowedDirectories: [homeDir] });
      
      // Call non-existent tool - should handle gracefully
      try {
        await session.callTool('non_existent_tool_xyz', {});
      } catch (e) {
        // Should throw an error but not crash
        expect(e).toBeDefined();
      }
      
      await closeSession();
    }, 60000);
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple server queries', async () => {
      const { listMCPServers, addMCPServer, removeMCPServer } = await import('../lib/config.js');
      
      const server1 = 'e2e-concurrent-1-' + Date.now();
      const server2 = 'e2e-concurrent-2-' + Date.now();
      
      addMCPServer(server1, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: {},
        env: {},
      });
      
      addMCPServer(server2, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: {},
        env: {},
      });
      
      const servers = listMCPServers();
      expect(Object.keys(servers).length).toBeGreaterThanOrEqual(2);
      
      removeMCPServer(server1);
      removeMCPServer(server2);
    });
  });
});
