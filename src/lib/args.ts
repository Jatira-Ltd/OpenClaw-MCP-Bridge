/**
 * Args module - Centralized argument parsing
 * Exports parsed arguments so all modules can access them consistently
 */

import process from 'process';

export interface ParsedArgs {
  command: string;
  rest: string[];
  server?: string;
  options: Record<string, string | boolean>;
  verbose: boolean;
  debug: boolean;
}

/**
 * Parse command line arguments with support for flags
 */
export function parseArgs(args: string[] = process.argv.slice(2)): ParsedArgs {
  let command = args[0] || '';
  const rest: string[] = [];
  let server: string | undefined;
  const options: Record<string, string | boolean> = {};
  let verbose = false;
  let debug = false;

  // Handle global flags first (before command)
  let processedFlags = true;
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg === '--version') {
      options.version = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--debug') {
      options.debug = true;
      debug = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      verbose = true;
    } else if (arg === '-s' || arg === '--server') {
      if (i + 1 < args.length) {
        server = args[i + 1];
        i++;
      }
    } else if (arg.startsWith('--server=')) {
      server = arg.split('=')[1];
    } else {
      // This is the command or a positional argument
      processedFlags = false;
      break;
    }
    i++;
  }

  // If we processed all args as flags, return early
  if (processedFlags && args.length > 0) {
    return { command: '', rest: [], server, options, verbose, debug };
  }

  // Re-parse without global flags
  const remainingArgs = i < args.length ? args.slice(i) : [];
  command = remainingArgs[0] || '';

  for (let j = 1; j < remainingArgs.length; j++) {
    const arg = remainingArgs[j];
    
    if (arg === '-s' || arg === '--server') {
      if (j + 1 < remainingArgs.length) {
        server = remainingArgs[j + 1];
        j++;
      }
    } else if (arg.startsWith('--server=')) {
      server = arg.split('=')[1];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--')) {
      // Handle --key=value format
      if (arg.includes('=')) {
        const idx = arg.indexOf('=');
        const key = arg.substring(2, idx);
        const value = arg.substring(idx + 1);
        options[key] = value;
      } else {
        // Boolean flags like --list
        options[arg.substring(2)] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flags
      options[arg.substring(1)] = true;
    } else {
      rest.push(arg);
    }
  }

  return { command, rest, server, options, verbose, debug };
}

// Cache the parsed args
let cachedArgs: ParsedArgs | null = null;

/**
 * Get cached parsed args (for use throughout the application)
 */
export function getParsedArgs(): ParsedArgs {
  if (!cachedArgs) {
    cachedArgs = parseArgs();
  }
  return cachedArgs;
}

/**
 * Reset cached args (useful for testing)
 */
export function resetParsedArgs(): void {
  cachedArgs = null;
}
