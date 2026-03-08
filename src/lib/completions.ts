/**
 * Shell Completions module - Generate shell autocomplete scripts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMPLETIONS_DIR = path.join(__dirname, '..', 'scripts', 'completions');

/**
 * Generate bash/zsh completion script
 */
export function generateCompletions(shell: 'bash' | 'zsh' = 'bash'): string {
  const commands = [
    'install', 'list', 'remove', 'call', 'status', 
    'enable', 'disable', 'discover', 'update', 'config'
  ];

  const options = [
    '-h', '--help', '-v', '--verbose', '--debug', '--version',
    '-s', '--server', '-j', '--json', '-y', '--yes'
  ];

  const configSubcommands = ['edit', 'migrate'];

  if (shell === 'bash') {
    return `# MCP Bridge Shell Completion (Bash)
# Source this file or add to ~/.bashrc:
#   source /path/to/scripts/completions/mcp.bash

_mcp_completions() {
  local cur prev words cword
  _init_completion || return

  local commands="${commands.join(' ')}"
  local options="${options.join(' ')}"
  local config_cmds="${configSubcommands.join(' ')}"

  case $prev in
    mcp)
      COMPREPLY=($(compgen -W "$commands" -- "$cur"))
      return
      ;;
    install|remove|enable|disable)
      return
      ;;
    -s|--server)
      return
      ;;
    config)
      COMPREPLY=($(compgen -W "$config_cmds" -- "$cur"))
      return
      ;;
    update|discover|list|status)
      return
      ;;
  esac

  if [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "$options" -- "$cur"))
  else
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
  fi
}

complete -F _mcp_completions mcp
`;
  }

  // ZSH completion
  return `# MCP Bridge Shell Completion (Zsh)
# Add to ~/.zshrc:
#   source /path/to/scripts/completions/mcp.zsh

autoload -U compinit
compdef _mcp mcp

_mcp() {
  local -a commands
  commands=(
    'install:Install an MCP server package'
    'list:List installed MCP servers'
    'remove:Remove an MCP server'
    'call:Call an MCP tool'
    'status:Show MCP server status'
    'enable:Enable an MCP server'
    'disable:Disable an MCP server'
    'discover:Discover tools from MCP servers'
    'update:Update MCP server(s)'
    'config:Manage MCP server configuration'
  )

  local -a options
  options=(
    '-h[Show help]'
    '--help[Show help]'
    '-v[Verbose output]'
    '--verbose[Verbose output]'
    '--debug[Debug output]'
    '--version[Show version]'
    '-s[Specify server]:server:'
    '--server[Specify server]:server:'
    '-j[JSON output]'
    '--json[JSON output]'
    '-y[Skip confirmation]'
    '--yes[Skip confirmation]'
  )

  local -a config_cmds
  config_cmds=(
    'edit:Edit configuration'
    'migrate:Migrate configuration'
  )

  _describe 'command' commands
  _describe 'option' options
  _describe 'config_cmd' config_cmds

  _arguments -s '1:command:($commands)' '*::options:($options)'
}
`;
}

/**
 * Write completion script to file
 */
export function writeCompletions(shell: 'bash' | 'zsh' = 'bash'): void {
  const content = generateCompletions(shell);
  const ext = shell === 'bash' ? 'bash' : 'zsh';
  const filePath = path.join(COMPLETIONS_DIR, `mcp.${ext}`);
  
  fs.writeFileSync(filePath, content);
  console.log(chalk.green(`✓ Written ${shell} completions to: ${filePath}`));
}

/**
 * Run completion command from CLI
 */
export async function runCompletionsCommand(args: string[]): Promise<void> {
  const shell = args[0] as 'bash' | 'zsh' | undefined;

  if (!shell || (shell !== 'bash' && shell !== 'zsh')) {
    console.log(chalk.bold('Shell Completions'));
    console.log('\nUsage: mcp completions <shell>');
    console.log('\nShells:');
    console.log('  bash  Generate bash completions');
    console.log('  zsh   Generate zsh completions');
    console.log('\nExamples:');
    console.log('  mcp completions bash >> ~/.bashrc');
    console.log('  mcp completions zsh >> ~/.zshrc');
    return;
  }

  console.log(generateCompletions(shell));
}
