/**
 * Call command - Call an MCP tool
 */

import ora from 'ora';
import { callTool } from '../lib/executor.js';

export async function callCommand(toolName: string, args: Record<string, unknown>): Promise<void> {
  const spinner = ora(`Calling ${toolName}...`).start();
  
  try {
    const result = await callTool(toolName, args);
    spinner.succeed(`Result from ${toolName}:`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    spinner.fail(`Failed to call ${toolName}`);
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
