/**
 * Config edit command - Edit MCP server configuration
 */

import chalk from 'chalk';
import { readMCPConfig, writeMCPConfig } from '../lib/config.js';

interface ConfigEditOptions {
  server?: string;
  key?: string;
  value?: string;
  list?: boolean;
  remove?: string;
  json?: boolean;
}

export async function configEditCommand(options: ConfigEditOptions): Promise<void> {
  const { server, key, value, list: listConfig, remove, json: jsonOutput } = options;

  // If no args, show help
  if (!server && !listConfig) {
    console.log(chalk.bold('MCP Config Editor'));
    console.log('\nUsage:');
    console.log('  mcp config edit --server <name> --key <key> --value <value>  Set a config value');
    console.log('  mcp config edit --server <name> --list                      List all config');
    console.log('  mcp config edit --server <name> --remove <key>              Remove a config key');
    console.log('  mcp config edit --list                                       List all servers');
    console.log('\nOptions:');
    console.log('  --json  Output in JSON format');
    return;
  }

  // List all servers if --list without --server
  if (listConfig && !server) {
    const mcpConfig = readMCPConfig();
    
    const serversList = Object.entries(mcpConfig.servers || {}).map(([name, srv]) => ({
      name,
      enabled: srv.enabled,
      toolsCount: srv.tools.length,
      configKeys: Object.keys(srv.config || {}),
      envVars: Object.keys(srv.env || {}),
    }));

    if (jsonOutput) {
      console.log(JSON.stringify({ servers: serversList }, null, 2));
      return;
    }

    console.log(chalk.bold('MCP Servers Configuration'));
    console.log('─'.repeat(50));
    
    if (serversList.length === 0) {
      console.log(chalk.gray('No servers configured'));
      return;
    }

    for (const srv of serversList) {
      console.log(chalk.cyan(`\n${srv.name}:`));
      console.log(`  enabled: ${srv.enabled}`);
      console.log(`  tools: ${srv.toolsCount}`);
      console.log(`  config keys: ${srv.configKeys.join(', ') || '(none)'}`);
      console.log(`  env vars: ${srv.envVars.join(', ') || '(none)'}`);
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
    const configData = {
      server,
      config: serverConfig.config || {},
      env: serverConfig.env || {},
    };

    if (jsonOutput) {
      console.log(JSON.stringify(configData, null, 2));
      return;
    }

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
    let removed = false;
    if (serverConfig.config && serverConfig.config[remove] !== undefined) {
      delete serverConfig.config[remove];
      removed = true;
    } else if (serverConfig.env && serverConfig.env[remove] !== undefined) {
      delete serverConfig.env[remove];
      removed = true;
    }

    if (removed) {
      writeMCPConfig(mcpConfig);
      if (jsonOutput) {
        console.log(JSON.stringify({ success: true, message: `Removed '${remove}' from '${server}'` }, null, 2));
      } else {
        console.log(chalk.green(`✓ Removed config key '${remove}' from '${server}'`));
      }
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

  if (jsonOutput) {
    console.log(JSON.stringify({ success: true, server, key, value: parsedValue }, null, 2));
  } else {
    console.log(chalk.green(`✓ Set ${key} = ${value} for '${server}'`));
  }
}
