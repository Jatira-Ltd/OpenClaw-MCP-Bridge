# MCP Bridge for OpenClaw — Engineering Design Document

**Version**: 1.1  
**Date**: March 8, 2026  
**Status**: Ready for Implementation

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER (Telegram/Discord)                        │
│  "Create a Notion page called 'Q1 Planning'"                                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPENCLAW CORE                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     MCP BRIDGE SKILL                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────── │  │
│  │  │  Installer  │  │  Discovery─────┐    │  │         Executor             │   │  │
│  │  │             │  │             │  │  ┌────────────────────────┐  │   │  │
│  │  │ npm install │  │ List tools  │  │  │ Process Manager        │  │   │  │
│  │  │ Config save │  │ Parse schema│  │  │ - Spawn                │  │   │  │
│  │  │             │  │             │  │  │ - Communicate (stdio) │  │   │  │
│  │  │             │  │             │  │  │ - Kill                 │  │   │  │
│  │  └─────────────┘  └─────────────┘  │  └────────────────────────┘  │   │  │
│  │                                     └─────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
        ┌───────────────────┐           ┌───────────────────┐
        │  @notionhq/mcp    │           │  @filesystem/mcp  │
        │  (npx process)    │           │  (npx process)    │
        └─────────┬─────────┘           └─────────┬─────────┘
                  │                             │
                  ▼                             ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   NOTION API       │           │   Local Files     │
        └───────────────────┘           └───────────────────┘
```

### 1.2 How It Works

1. User runs `mcp install @notionhq/mcp-server`
2. Bridge downloads server via `npx -y`
3. Bridge spawns process and runs MCP handshake
4. Bridge discovers available tools
5. User calls tool via natural language
6. Bridge sends JSON-RPC to MCP server
7. Result returned to user

---

## 2. Key Design Decisions

### 2.1 No Encryption

Unlike the original design, we simplify:

| Aspect | Decision | Reason |
|--------|----------|--------|
| **API Keys** | Stored plain in config | User's machine, user manages |
| **Security** | File permissions only | Same as Claude Code |
| **No Keychain** | Not needed | Self-hosted, user-controlled |

**Why?** OpenClaw runs on user's machine. User is responsible for their own keys. No central server = no central key management needed.

### 2.2 Process Model

```
User runs mcp command
         │
         ▼
┌─────────────────────────────────┐
│  Spawn: npx -y @package        │
│  (child process)               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Initialize handshake           │
│  - Send: initialize request    │
│  - Receive: capabilities       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Discover tools                 │
│  - Send: tools/list            │
│  - Receive: tool definitions   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Tool call (when needed)       │
│  - Send: tools/call            │
│  - Receive: result             │
└─────────────────────────────────┘
         │
         ▼
Auto-kill after 30s idle
```

---

## 3. Data Models

### 3.1 Config Schema (openclaw.json)

```json
{
  "mcp": {
    "version": "1.0",
    "servers": {
      "@notionhq/mcp-server": {
        "installedAt": "2026-03-08T10:00:00Z",
        "enabled": true,
        "tools": ["create_page", "search", "query_database"],
        "config": {
          "rootPageId": "abc123"
        },
        "env": {
          "NOTION_API_KEY": "secret-xxx"
        }
      }
    }
  }
}
```

**Note:** API keys stored in plain text. User is responsible for file permissions.

---

## 4. File Structure

```
mcp-bridge/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── install.ts        # mcp install @package
│   │   ├── list.ts           # mcp list
│   │   ├── remove.ts         # mcp remove @package
│   │   └── call.ts           # mcp call <tool> <args>
│   ├── lib/
│   │   ├── installer.ts      # npm/npx installation
│   │   ├── discover.ts       # Tool discovery
│   │   ├── executor.ts       # Process spawning
│   │   ├── protocol.ts       # JSON-RPC handling
│   │   └── config.ts         # Config read/write
│   └── types/
│       └── mcp.ts            # TypeScript interfaces
├── package.json
├── tsconfig.json
├── SKILL.md                   # OpenClaw skill definition
└── README.md
```

---

## 5. Implementation Priority

| Step | Task | Estimated Time |
|------|------|----------------|
| 1 | Project setup (package.json, tsconfig) | 10 min |
| 2 | Config read/write | 15 min |
| 3 | MCP server spawn + handshake | 30 min |
| 4 | Tool discovery (tools/list) | 15 min |
| 5 | Tool execution (tools/call) | 20 min |
| 6 | CLI commands | 20 min |
| 7 | Test end-to-end | 30 min |

**Total POC: ~2.5 hours**

---

## 6. MCP Protocol Basics

### 6.1 Initialize Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "openclaw-mcp-bridge",
      "version": "1.0.0"
    }
  }
}
```

### 6.2 Tools/List Request

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

### 6.3 Tools/Call Request

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "create_page",
    "arguments": {
      "title": "Q1 Planning",
      "parent": "root"
    }
  }
}
```

---

## 7. Error Handling

| Error | Handling |
|-------|----------|
| Package not found | Show npm error, suggest correct name |
| MCP server crash | Auto-restart on next call |
| Tool not found | List available tools for user |
| Timeout | Kill process, show timeout error |

---

## 8. Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "ora": "^7.0.0",
    "chalk": "^4.1.2"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## 9. Related Documents

- `mcp-bridge-PRD.md` — Product requirements
- `mcp-bridge-SECURITY.md` — Security design (simplified)
- `mcp-bridge-BUSINESS.md` — Cost & revenue analysis
