/**
 * Status command - Show connection health and latency for MCP servers
 */

import ora from 'ora';
import chalk from 'chalk';
import { listMCPServers, readMCPConfig } from '../lib/config.js';
import { getServerHealth, createSession } from '../lib/protocol.js';

export interface ServerStatus {
  name: string;
  status: 'online' | 'offline';
  latency?: number;
  toolsCount: number;
  enabled: boolean;
  lastUsed?: string;
}

export async function statusCommand(jsonOutput = false): Promise<void> {
  const spinner = ora('Checking MCP server status...').start();
  
  try {
    const servers = listMCPServers();
    
    if (Object.keys(servers).length === 0) {
      spinner.info('No MCP servers installed');
      console.log('\nRun: mcp install <package> to install an MCP server');
      return;
    }
    
    const statuses: ServerStatus[] = [];
    
    for (const [name, server] of Object.entries(servers)) {
      let serverStatus: ServerStatus = {
        name,
        status: server.enabled ? 'offline' : 'offline',
        toolsCount: server.tools.length,
        enabled: server.enabled,
        lastUsed: server.lastUsedAt,
      };
      
      // Only check health for enabled servers
      if (server.enabled) {
        try {
          const health = await getServerHealth(name, server.config);
          serverStatus = {
            ...serverStatus,
            status: health.online ? 'online' : 'offline',
            latency: health.latency,
          };
        } catch (error) {
          serverStatus.status = 'offline';
        }
      }
      
      statuses.push(serverStatus);
    }
    
    spinner.succeed();
    
    if (jsonOutput) {
      console.log(JSON.stringify(statuses, null, 2));
      return;
    }
    
    // Display as table
    console.log('\n' + chalk.bold('MCP Server Status'));
    console.log('─'.repeat(70));
    console.log(
      chalk.white('Server') + ' '.repeat(35) +
      chalk.white('Status') + ' '.repeat(10) +
      chalk.white('Latency') + ' '.repeat(8) +
      chalk.white('Tools')
    );
    console.log('─'.repeat(70));
    
    for (const s of statuses) {
      const name = s.name.length > 35 ? s.name.substring(0, 32) + '...' : s.name;
      const statusColor = s.status === 'online' ? chalk.green : chalk.red;
      const statusText = s.status === 'online' ? 'online' : 'offline';
      const latencyText = s.latency ? `${s.latency}ms` : '-';
      const toolsText = s.toolsCount.toString();
      const enabledText = s.enabled ? '' : ' (disabled)';
      
      console.log(
        chalk.cyan(name) + ' '.repeat(40 - name.length) +
        statusColor(statusText) + ' '.repeat(16 - statusText.length) +
        (s.latency ? chalk.yellow(latencyText) : chalk.gray(latencyText)) + ' '.repeat(14 - latencyText.length) +
        chalk.white(toolsText) + enabledText
      );
    }
    
    console.log('─'.repeat(70));
    const online = statuses.filter(s => s.status === 'online').length;
    console.log(chalk.gray(`${online}/${statuses.length} servers online`));
    
  } catch (error) {
    spinner.fail('Failed to check MCP server status');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
