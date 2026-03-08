#!/bin/bash

# MCP Bridge Installation Script
# Usage: curl -sL https://raw.githubusercontent.com/openclaw/mcp-bridge/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="openclaw/mcp-bridge"
BIN_NAME="mcp-bridge"
INSTALL_DIR="${HOME}/.local/bin"
NPM_PACKAGE="@openclaw/mcp-bridge"

echo -e "${BLUE}MCP Bridge Installer${NC}"
echo "======================"

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64)     echo "x64";;
        aarch64|arm64) echo "arm64";;
        *)          echo "x64";;
    esac
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        echo "Please install Node.js and npm from https://nodejs.org"
        exit 1
    fi
}

# Check if mcp-bridge is already installed
check_existing() {
    if command -v mcp-bridge &> /dev/null; then
        CURRENT_VERSION=$(mcp-bridge --version 2>/dev/null || echo "unknown")
        echo -e "${YELLOW}MCP Bridge is already installed (version: ${CURRENT_VERSION})${NC}"
        read -p "Do you want to update it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Exiting."
            exit 0
        fi
    fi
}

# Install via npm
install_npm() {
    echo -e "${GREEN}Installing MCP Bridge via npm...${NC}"
    
    # Check for global install or user install
    if [ "$1" = "--global" ]; then
        npm install -g $NPM_PACKAGE
    else
        # User-level install
        npm install -g $NPM_PACKAGE --prefix="${HOME}/.local"
    fi
    
    # Ensure install directory is in PATH
    ensure_path
}

# Ensure PATH includes installation directory
ensure_path() {
    SHELL_RC=""
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        SHELL_RC="$HOME/.bashrc"
    fi
    
    # Check if .local/bin is in PATH
    if [[ ":$PATH:" != *":${HOME}/.local/bin:"* ]]; then
        echo ""
        echo -e "${YELLOW}IMPORTANT: Add the following to your ${SHELL_RC}:${NC}"
        echo ""
        echo 'export PATH="$HOME/.local/bin:$PATH"'
        echo ""
    fi
}

# Install from source
install_from_source() {
    echo -e "${GREEN}Installing MCP Bridge from source...${NC}"
    
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    echo "Cloning repository..."
    git clone "https://github.com/${REPO}.git" .
    
    echo "Installing dependencies..."
    npm install
    
    echo "Building..."
    npm run build:all
    
    # Create bin directory
    mkdir -p "${HOME}/.local/bin"
    
    # Copy CLI binary
    cp dist/cli.js "${HOME}/.local/bin/${BIN_NAME}"
    chmod +x "${HOME}/.local/bin/${BIN_NAME}"
    
    # Clean up
    cd ~
    rm -rf "$TEMP_DIR"
    
    ensure_path
    
    echo -e "${GREEN}MCP Bridge installed successfully!${NC}"
}

# Verify installation
verify() {
    if command -v mcp-bridge &> /dev/null; then
        echo ""
        echo -e "${GREEN}✓ MCP Bridge installed successfully!${NC}"
        echo ""
        echo "Run 'mcp-bridge --help' to get started"
    else
        echo ""
        echo -e "${RED}Installation failed${NC}"
        echo "Please restart your terminal or source your shell config"
        exit 1
    fi
}

# Main
main() {
    INSTALL_METHOD="npm"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --npm)
                INSTALL_METHOD="npm"
                shift
                ;;
            --source)
                INSTALL_METHOD="source"
                shift
                ;;
            --global)
                NPM_GLOBAL="--global"
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --npm      Install via npm (default)"
                echo "  --source   Install from source"
                echo "  --global   Install globally (requires sudo)"
                echo "  -h, --help Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    check_npm
    
    if [ "$INSTALL_METHOD" = "source" ]; then
        install_from_source
    else
        install_npm "$NPM_GLOBAL"
    fi
    
    verify
}

main "$@"
