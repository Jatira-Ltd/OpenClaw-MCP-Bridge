/**
 * Config Module Tests
 * Tests MCP configuration read/write operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  readMCPConfig,
  writeMCPConfig,
  listMCPServers,
  getServerNames,
  getMCPServer,
  addMCPServer,
  removeMCPServer,
  updateServerTools,
} from '../lib/config.js';

// MCP config path - separate from OpenClaw's config
const MCP_CONFIG_PATH = path.join(process.env.HOME || '/Users/jagadeeshkumarchippada', '.openclaw', 'mcp-servers.json');

describe('Config Module', () => {
  let originalConfig: { version?: string; servers?: unknown } | null = null;

  beforeEach(() => {
    // Backup existing config if it exists
    if (fs.existsSync(MCP_CONFIG_PATH)) {
      originalConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
    } else {
      originalConfig = null;
    }
  });

  afterEach(() => {
    // Restore original config
    if (originalConfig === null) {
      if (fs.existsSync(MCP_CONFIG_PATH)) {
        fs.unlinkSync(MCP_CONFIG_PATH);
      }
    } else {
      fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(originalConfig, null, 2));
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
      if (fs.existsSync(MCP_CONFIG_PATH)) {
        fs.unlinkSync(MCP_CONFIG_PATH);
      }

      const config = readMCPConfig();
      expect(config.version).toBe('1.0');
      expect(config.servers).toEqual({});
    });
  });
});
