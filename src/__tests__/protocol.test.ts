/**
 * Protocol Module Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPSession, createSession, closeSession, getCurrentSession } from '../lib/protocol.js';
import path from 'path';
import fs from 'fs';

// Test constants
const TEST_PACKAGE = '@modelcontextprotocol/server-filesystem';

// Expected tools from the filesystem server
const EXPECTED_TOOLS = [
  'read_file',
  'read_text_file',
  'read_media_file',
  'read_multiple_files',
  'write_file',
  'edit_file',
  'create_directory',
  'list_directory',
  'list_directory_with_sizes',
  'directory_tree',
  'move_file',
  'search_files',
  'get_file_info',
  'list_allowed_directories',
];

describe('Protocol Module', () => {
  afterEach(async () => {
    // Ensure session is closed after each test
    await closeSession();
  });

  describe('MCPSession', () => {
    it('should create a session instance', () => {
      const session = new MCPSession(TEST_PACKAGE, { allowedDirectories: ['/tmp'] });
      expect(session).toBeDefined();
      expect(session.initialized).toBe(false);
      
      // Cleanup
      session.close();
    });

    it('should have correct package name', () => {
      const session = new MCPSession(TEST_PACKAGE);
      expect(session.packageName).toBe(TEST_PACKAGE);
      session.close();
    });
  });

  describe('createSession', () => {
    it('should create and initialize a session', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      
      expect(session).toBeDefined();
      expect(session.initialized).toBe(true);
      
      // Cleanup
      await closeSession();
    }, 60000);

    it('should close existing session before creating new one', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      // Create first session
      const session1 = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      expect(session1.initialized).toBe(true);
      
      // Create second session - should close first
      const session2 = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      expect(session2.initialized).toBe(true);
      
      // Both should reference the same current session
      const current = getCurrentSession();
      expect(current).toBe(session2);
      
      await closeSession();
    }, 60000);
  });

  describe('getCurrentSession', () => {
    it('should return null when no session exists', async () => {
      await closeSession(); // Ensure no session
      expect(getCurrentSession()).toBeNull();
    });

    it('should return current session when exists', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      expect(getCurrentSession()).toBe(session);
      
      await closeSession();
    }, 60000);
  });

  describe('closeSession', () => {
    it('should close existing session', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      expect(getCurrentSession()).not.toBeNull();
      
      await closeSession();
      expect(getCurrentSession()).toBeNull();
    }, 60000);

    it('should be safe to call when no session exists', async () => {
      await closeSession();
      await closeSession(); // Multiple calls should be safe
      expect(getCurrentSession()).toBeNull();
    });
  });

  describe('Tool Discovery', () => {
    it('should discover 14 tools from filesystem server', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      
      const tools = await session.listTools();
      
      // Verify we have 14 tools
      expect(tools.length).toBe(14);
      
      // Verify tool names
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('read_file');
      expect(toolNames).toContain('write_file');
      expect(toolNames).toContain('list_directory');
      expect(toolNames).toContain('create_directory');
      expect(toolNames).toContain('move_file');
      expect(toolNames).toContain('get_file_info');
      
      await closeSession();
    }, 60000);

    it('should return tool with name and inputSchema', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      const tools = await session.listTools();
      
      // Check structure of at least one tool
      const readFileTool = tools.find(t => t.name === 'read_file');
      expect(readFileTool).toBeDefined();
      expect(readFileTool?.name).toBe('read_file');
      expect(readFileTool?.inputSchema).toBeDefined();
      
      await closeSession();
    }, 60000);

    it('should discover all expected tools', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      const tools = await session.listTools();
      
      const toolNames = tools.map(t => t.name);
      
      // Verify all expected tools are present
      for (const expectedTool of EXPECTED_TOOLS) {
        expect(toolNames).toContain(expectedTool);
      }
      
      await closeSession();
    }, 60000);
  });

  describe('Tool Execution', () => {
    let testFilePath: string;

    beforeEach(() => {
      // Create a test file for execution tests
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      testFilePath = path.join(homeDir, 'mcp-bridge-test-exec.txt');
      fs.writeFileSync(testFilePath, 'Test content for execution');
    });

    afterEach(async () => {
      // Cleanup test file
      if (testFilePath && fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      await closeSession();
    });

    it('should execute read_file tool', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      
      const result = await session.callTool('read_file', { path: testFilePath });
      
      expect(result).toBeDefined();
      // Result structure depends on MCP implementation
      expect(JSON.stringify(result)).toContain('Test content');
      
      await closeSession();
    }, 60000);

    it('should execute list_directory tool', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      
      const result = await session.callTool('list_directory', { path: homeDir });
      
      expect(result).toBeDefined();
      
      await closeSession();
    }, 60000);

    it('should execute get_file_info tool', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      
      const result = await session.callTool('get_file_info', { path: testFilePath });
      
      expect(result).toBeDefined();
      
      await closeSession();
    }, 60000);

    it('should execute write_file tool', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      const writeTestPath = path.join(homeDir, 'mcp-bridge-write-test.txt');
      
      try {
        const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
        
        const result = await session.callTool('write_file', { 
          path: writeTestPath, 
          content: 'Written by test' 
        });
        
        expect(result).toBeDefined();
        
        // Verify file was written
        expect(fs.existsSync(writeTestPath)).toBe(true);
        expect(fs.readFileSync(writeTestPath, 'utf-8')).toBe('Written by test');
        
        await closeSession();
      } finally {
        // Cleanup
        if (fs.existsSync(writeTestPath)) {
          fs.unlinkSync(writeTestPath);
        }
      }
    }, 60000);

    it.skip('should execute search_files tool', async () => {
      const homeDir = process.env.HOME || '/Users/jagadeeshkumarchippada';
      
      const session = await createSession(TEST_PACKAGE, { allowedDirectories: [homeDir] });
      
      const result = await session.callTool('search_files', { 
        path: homeDir, 
        pattern: '*.json' 
      });
      
      expect(result).toBeDefined();
      
      await closeSession();
    }, 60000);
  });
});
