/**
 * List command - List installed MCP servers
 */

import ora from 'ora';
import { listMCPServers } from '../lib/config.js';

export async function listCommand(): Promise<void> {
  const spinner = ora('Loading MCP servers...').start();
  
  try {
    const servers = listMCPServers();
    
    if (Object.keys(servers).length === 0) {
      spinner.info('No MCP servers installed');
      console.log('\nRun: mcp install <package> to install an MCP server');
      return;
    }
    
    spinner.succeed('MCP servers:');
    
    for (const [name, server] of Object.entries(servers)) {
      console.log(`\n${name}`);
      console.log(`  Enabled: ${server.enabled}`);
      console.log(`  Installed: ${server.installedAt}`);
      console.log(`  Tools: ${server.tools.join(', ') || 'None discovered yet'}`);
    }
  } catch (error) {
    spinner.fail('Failed to list MCP servers');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
