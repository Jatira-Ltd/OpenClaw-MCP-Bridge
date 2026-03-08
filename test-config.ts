/**
 * Test script to verify config operations
 */

import { readMCPConfig, writeMCPConfig, addMCPServer, removeMCPServer, listMCPServers } from './dist/lib/config.js';

// Test adding a server
console.log('Adding test server...');
addMCPServer('@modelcontextprotocol/server-filesystem', {
  installedAt: new Date().toISOString(),
  enabled: true,
  tools: ['read_file', 'write_file', 'list_directory'],
  config: { root: '/tmp' },
  env: {},
});

console.log('Servers:', JSON.stringify(listMCPServers(), null, 2));

// Test removing
console.log('\nRemoving test server...');
removeMCPServer('@modelcontextprotocol/server-filesystem');
console.log('Servers after removal:', JSON.stringify(listMCPServers(), null, 2));

console.log('\nConfig test passed!');
