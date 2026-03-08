# MCP Bridge Shell Completion
# Install: source this file or add to .bashrc/.zshrc

# Bash completion for mcp CLI
_mcp_complete() {
  local cur prev words cword
  _init_completion || return

  # Commands
  local commands="install list remove call status enable disable discover update config"

  # Options
  local options="-h --help -v --verbose --debug --version -s --server -j --json -y --yes"

  # Config subcommands
  local config_cmds="edit migrate"

  # Discover commands
  local discover_cmds=""

  case $prev in
    mcp)
      COMPREPLY=($(compgen -W "$commands" -- "$cur"))
      return
      ;;
    install|remove|enable|disable)
      # Could complete with installed packages (future enhancement)
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

  # Complete commands and options
  if [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "$options" -- "$cur"))
  else
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
  fi
}

# Register completion
complete -F _mcp_complete mcp

# ZSH compdef (if running in zsh)
if [[ -n "$ZSH_VERSION" ]]; then
  compdef _mcp mcp
fi
