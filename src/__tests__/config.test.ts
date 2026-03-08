/**
 * Config Module Tests
 * Tests MCP configuration read/write operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  readOpenClawConfig,
  writeOpenClawConfig,
  readMCPConfig,
  writeMCPConfig,
  listMCPServers,
  getServerNames,
  getMCPServer,
  addMCPServer,
  removeMCPServer,
  updateServerTools,
} from '../lib/config.js';

// Actual config path used by the module
const CONFIG_PATH = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'openclaw.json');

describe('Config Module', () => {
  let originalConfig: { mcp?: unknown } | null = null;

  beforeEach(() => {
    // Backup existing config if it exists
    if (fs.existsSync(CONFIG_PATH)) {
      originalConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } else {
      originalConfig = null;
    }
  });

  afterEach(() => {
    // Restore original config
    if (originalConfig === null) {
      if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
      }
    } else {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(originalConfig, null, 2));
    }
  });

  describe('MCP Config Operations', () => {
    const testServerName = 'test-mcp-server-' + Date.now();

    afterEach(() => {
      // Cleanup test server if exists
      try {
        const servers = listMCPServers();
        if (servers[testServerName]) {
          removeMCPServer(testServerName);
        }
      } catch {
        // Ignore
      }
    });

    it('should add a new MCP server', () => {
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: ['tool1', 'tool2'],
        config: { root: '/tmp' },
        env: {},
      });

      const servers = listMCPServers();
      expect(servers[testServerName]).toBeDefined();
      expect(servers[testServerName].enabled).toBe(true);
      expect(servers[testServerName].tools).toEqual(['tool1', 'tool2']);
    });

    it('should list all servers', () => {
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: {},
        env: {},
      });

      const servers = listMCPServers();
      expect(Object.keys(servers).length).toBeGreaterThan(0);
    });

    it('should get a specific server', () => {
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: false,
        tools: ['read', 'write'],
        config: { allowedDirectories: ['/home'] },
        env: { NODE_ENV: 'test' },
      });

      const server = getMCPServer(testServerName);
      expect(server).not.toBeNull();
      expect(server?.enabled).toBe(false);
      expect(server?.tools).toEqual(['read', 'write']);
      expect(server?.config.allowedDirectories).toEqual(['/home']);
      expect(server?.env.NODE_ENV).toBe('test');
    });

    it('should return null for non-existent server', () => {
      const server = getMCPServer('non-existent-' + Date.now());
      expect(server).toBeNull();
    });

    it('should update server tools', () => {
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: {},
        env: {},
      });

      updateServerTools(testServerName, ['read_file', 'write_file', 'list_directory']);

      const server = getMCPServer(testServerName);
      expect(server?.tools).toEqual(['read_file', 'write_file', 'list_directory']);
    });

    it('should remove a server', () => {
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: {},
        env: {},
      });

      removeMCPServer(testServerName);

      const server = getMCPServer(testServerName);
      expect(server).toBeNull();
    });

    it('should throw when removing non-existent server', () => {
      expect(() => removeMCPServer('non-existent-' + Date.now()))
        .toThrow('Server non-existent');
    });

    it('should get server names', () => {
      addMCPServer(testServerName, {
        installedAt: new Date().toISOString(),
        enabled: true,
        tools: [],
        config: {},
        env: {},
      });

      const names = getServerNames();
      expect(names).toContain(testServerName);
    });

    it('should read and write MCP config', () => {
      const mcpConfig = {
        version: '1.0',
        servers: {
          [testServerName]: {
            installedAt: new Date().toISOString(),
            enabled: true,
            tools: [],
            config: {},
            env: {},
          },
        },
      };

      writeMCPConfig(mcpConfig);

      const readConfig = readMCPConfig();
      expect(readConfig.version).toBe('1.0');
      expect(readConfig.servers[testServerName]).toBeDefined();
    });

    it('should return default MCP config when none exists', () => {
      // Clear config
      if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
      }

      const config = readMCPConfig();
      expect(config.version).toBe('1.0');
      expect(config.servers).toEqual({});
    });

    it('should read full OpenClaw config', () => {
      const testConfig = { mcp: { version: '1.0', servers: {} } };
      writeOpenClawConfig(testConfig);

      const config = readOpenClawConfig();
      expect(config).toEqual(testConfig);
    });

    it('should write full OpenClaw config', () => {
      const testConfig = { mcp: { version: '1.0', servers: {} }, other: 'data' };
      writeOpenClawConfig(testConfig);

      const config = readOpenClawConfig();
      expect(config.other).toBe('data');
    });
  });
});
