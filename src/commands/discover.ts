/**
 * Discover command - Discover available tools from MCP servers
 */

import ora from 'ora';
import chalk from 'chalk';
import { discoverTools, discoverAllTools } from '../lib/discover.js';
import { listMCPServers } from '../lib/config.js';

export async function discoverCommand(packageName?: string, jsonOutput = false): Promise<void> {
  const spinner = ora();

  try {
    const servers = listMCPServers();
    const serverNames = Object.keys(servers);

    if (serverNames.length === 0) {
      console.log(chalk.yellow('No MCP servers installed'));
      console.log('\nRun: mcp install <package> to install an MCP server');
      return;
    }

    if (packageName) {
      // Discover tools for a specific server
      if (!servers[packageName]) {
        console.error(`Error: Server '${packageName}' not found`);
        console.error('Run "mcp list" to see installed servers');
        process.exit(1);
      }

      spinner.start(`Discovering tools from ${packageName}...`);
      const tools = await discoverTools(packageName);
      spinner.succeed(`Discovered ${tools.length} tools from ${packageName}`);

      if (jsonOutput) {
        console.log(JSON.stringify({ server: packageName, tools }, null, 2));
        return;
      }

      console.log(chalk.bold(`\nTools available in ${packageName}:`));
      console.log('─'.repeat(50));
      
      if (tools.length === 0) {
        console.log(chalk.gray('No tools discovered'));
      } else {
        for (const tool of tools) {
          const desc = tool.description ? ` - ${tool.description}` : '';
          console.log(chalk.cyan(`  ${tool.name}`) + chalk.gray(desc));
        }
      }
    } else {
      // Discover tools from all servers
      spinner.start('Discovering tools from all servers...');
      const results = await discoverAllTools();
      spinner.succeed('Discovery complete');

      if (jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      console.log(chalk.bold('\nDiscovered Tools:'));
      console.log('─'.repeat(50));

      let totalTools = 0;
      for (const [server, tools] of Object.entries(results)) {
        const toolCount = tools.length;
        totalTools += toolCount;
        console.log(chalk.cyan(`\n${server}:`) + chalk.gray(` (${toolCount} tools)`));
        
        if (tools.length === 0) {
          console.log(chalk.gray('  No tools available'));
        } else {
          for (const tool of tools.slice(0, 5)) {
            console.log(chalk.white(`  - ${tool.name}`));
          }
          if (tools.length > 5) {
            console.log(chalk.gray(`  ... and ${tools.length - 5} more`));
          }
        }
      }

      console.log('\n' + '─'.repeat(50));
      console.log(chalk.gray(`Total: ${totalTools} tools across ${Object.keys(results).length} servers`));
    }
  } catch (error) {
    spinner.fail('Discovery failed');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
