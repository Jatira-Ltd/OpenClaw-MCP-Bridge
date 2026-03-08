/**
 * Config edit command - Edit MCP server configuration
 */

import chalk from 'chalk';
import { readMCPConfig, writeMCPConfig, getMCPServer } from '../lib/config.js';

interface ConfigEditOptions {
  server?: string;
  key?: string;
  value?: string;
  list?: boolean;
  remove?: string;
}

export async function configEditCommand(options: ConfigEditOptions): Promise<void> {
  const { server, key, value, list: listConfig, remove } = options;

  // If no args, show help
  if (!server && !listConfig) {
    console.log(chalk.bold('MCP Config Editor'));
    console.log('\nUsage:');
    console.log('  mcp config edit --server <name> --key <key> --value <value>  Set a config value');
    console.log('  mcp config edit --server <name> --list                      List all config');
    console.log('  mcp config edit --server <name> --remove <key>              Remove a config key');
    console.log('  mcp config edit --list                                       List all servers');
    return;
  }

  // List all servers if --list without --server
  if (listConfig && !server) {
    const mcpConfig = readMCPConfig();
    console.log(chalk.bold('MCP Servers Configuration'));
    console.log('─'.repeat(50));
    
    if (Object.keys(mcpConfig.servers || {}).length === 0) {
      console.log(chalk.gray('No servers configured'));
      return;
    }

    for (const [name, srv] of Object.entries(mcpConfig.servers || {})) {
      console.log(chalk.cyan(`\n${name}:`));
      console.log(`  enabled: ${srv.enabled}`);
      console.log(`  tools: ${srv.tools.length}`);
      console.log(`  config keys: ${Object.keys(srv.config || {}).join(', ') || '(none)'}`);
      console.log(`  env vars: ${Object.keys(srv.env || {}).join(', ') || '(none)'}`);
    }
    return;
  }

  if (!server) {
    console.error('Error: --server is required');
    process.exit(1);
  }

  const mcpConfig = readMCPConfig();
  
  if (!mcpConfig.servers || !mcpConfig.servers[server]) {
    console.error(`Error: Server '${server}' not found`);
    console.error('Run "mcp list" to see installed servers');
    process.exit(1);
  }

  const serverConfig = mcpConfig.servers[server];

  // List config
  if (listConfig) {
    console.log(chalk.bold(`Configuration for ${server}:`));
    console.log('─'.repeat(50));
    
    if (Object.keys(serverConfig.config || {}).length === 0) {
      console.log(chalk.gray('No configuration set'));
    } else {
      for (const [k, v] of Object.entries(serverConfig.config || {})) {
        console.log(chalk.cyan(`${k}:`), JSON.stringify(v));
      }
    }
    
    console.log(chalk.bold('\nEnvironment Variables:'));
    if (Object.keys(serverConfig.env || {}).length === 0) {
      console.log(chalk.gray('No environment variables set'));
    } else {
      for (const [k, v] of Object.entries(serverConfig.env || {})) {
        console.log(chalk.cyan(`${k}:`), v);
      }
    }
    return;
  }

  // Remove a key
  if (remove) {
    if (serverConfig.config && serverConfig.config[remove] !== undefined) {
      delete serverConfig.config[remove];
      writeMCPConfig(mcpConfig);
      console.log(chalk.green(`✓ Removed config key '${remove}' from '${server}'`));
    } else if (serverConfig.env && serverConfig.env[remove] !== undefined) {
      delete serverConfig.env[remove];
      writeMCPConfig(mcpConfig);
      console.log(chalk.green(`✓ Removed env var '${remove}' from '${server}'`));
    } else {
      console.error(`Error: Key '${remove}' not found in config or env`);
      process.exit(1);
    }
    return;
  }

  // Set a value
  if (!key || value === undefined) {
    console.error('Error: Both --key and --value are required');
    console.error('Usage: mcp config edit --server <name> --key <key> --value <value>');
    process.exit(1);
  }

  // Try to parse value as JSON, otherwise use as string
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }

  if (!serverConfig.config) {
    serverConfig.config = {};
  }
  serverConfig.config[key] = parsedValue;
  
  writeMCPConfig(mcpConfig);
  console.log(chalk.green(`✓ Set ${key} = ${value} for '${server}'`));
}
