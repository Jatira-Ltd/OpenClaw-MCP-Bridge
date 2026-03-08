/**
 * Update command - Update MCP servers to latest versions
 */

import ora from 'ora';
import chalk from 'chalk';
import { listMCPServers } from '../lib/config.js';
import { installCommand } from './install.js';
import { confirmAction } from '../lib/ui.js';

export async function updateCommand(packageName?: string, skipConfirm = false): Promise<void> {
  const servers = listMCPServers();
  const serverNames = Object.keys(servers);

  if (serverNames.length === 0) {
    console.log(chalk.yellow('No MCP servers installed'));
    console.log('\nRun: mcp install <package> to install an MCP server');
    return;
  }

  if (packageName) {
    // Update specific server
    if (!servers[packageName]) {
      console.error(`Error: Server '${packageName}' not found`);
      console.error('Run "mcp list" to see installed servers');
      process.exit(1);
    }

    const spinner = ora(`Updating ${packageName}...`).start();
    
    try {
      // Re-run install to get latest version (force = true)
      await installCommand(packageName, true);
      spinner.succeed(`Updated ${packageName}`);
      console.log(chalk.green(`✓ ${packageName} has been updated to the latest version`));
    } catch (error) {
      spinner.fail(`Failed to update ${packageName}`);
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  } else {
    // Update all servers - confirm first
    if (!skipConfirm) {
      console.log(chalk.bold('\nUpdate All MCP Servers'));
      const confirmed = await confirmAction(
        `Update all ${serverNames.length} MCP servers?`,
        `This will check and update each server to its latest version.`
      );
      if (!confirmed) {
        console.log(chalk.gray('Operation cancelled'));
        return;
      }
    }

    const spinner = ora('Updating all MCP servers...').start();
    
    let updated = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const name of serverNames) {
      try {
        await installCommand(name, true);
        updated++;
      } catch (error) {
        failed++;
        failures.push(name);
        console.error(chalk.red(`Failed to update ${name}:`), error instanceof Error ? error.message : error);
      }
    }

    spinner.succeed('Update complete');

    console.log(chalk.bold('\nUpdate Results:'));
    console.log('─'.repeat(50));
    console.log(chalk.green(`✓ Updated: ${updated}`));
    
    if (failed > 0) {
      console.log(chalk.red(`✗ Failed: ${failed}`));
      console.log(chalk.gray('Failed servers:'), failures.join(', '));
    }
    
    console.log(chalk.gray(`Total: ${serverNames.length} servers processed`));
  }
}
