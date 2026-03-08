/**
 * List command - List installed MCP servers
 */

import ora from 'ora';
import chalk from 'chalk';
import { listMCPServers } from '../lib/config.js';

export interface ServerInfo {
  name: string;
  enabled: boolean;
  installedAt: string;
  tools: string[];
}

export async function listCommand(jsonOutput = false): Promise<void> {
  const spinner = ora('Loading MCP servers...').start();
  
  try {
    const servers = listMCPServers();
    
    if (Object.keys(servers).length === 0) {
      spinner.info('No MCP servers installed');
      if (jsonOutput) {
        console.log(JSON.stringify({ servers: [], message: 'No MCP servers installed' }, null, 2));
      } else {
        console.log('\nRun: mcp install <package> to install an MCP server');
      }
      return;
    }
    
    spinner.succeed();
    
    const serverList: ServerInfo[] = Object.entries(servers).map(([name, server]) => ({
      name,
      enabled: server.enabled,
      installedAt: server.installedAt,
      tools: server.tools,
    }));
    
    if (jsonOutput) {
      console.log(JSON.stringify({ servers: serverList }, null, 2));
      return;
    }
    
    console.log(chalk.bold('\nInstalled MCP Servers:'));
    console.log('─'.repeat(60));
    
    for (const server of serverList) {
      const status = server.enabled ? chalk.green('✓ enabled') : chalk.gray('○ disabled');
      console.log(`\n${chalk.cyan(server.name)} ${status}`);
      console.log(`  ${chalk.gray('Installed:')} ${server.installedAt}`);
      console.log(`  ${chalk.gray('Tools:')} ${server.tools.join(', ') || chalk.italic('None discovered yet')}`);
    }
    
    console.log('\n' + '─'.repeat(60));
  } catch (error) {
    spinner.fail('Failed to list MCP servers');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
