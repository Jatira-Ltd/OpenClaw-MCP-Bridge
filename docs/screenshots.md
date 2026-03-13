# MCP Bridge CLI Screenshots

The MCP Bridge CLI features an intuitive split-panel interface with sidebar navigation, server management, and tool execution — all in a clean terminal UI.

---

## 1. Sidebar Layout with Servers

The redesigned CLI uses a sidebar-first layout for easy server navigation:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🪢 MCP Bridge                                    v2.0.0        [?]help      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌────── Servers ──────────────────────────────────────────────────────────┐ ║
║  │                                                                           │ ║
║  │  ●  🟢 filesystem              [7 tools]    [■ Disconnect]               │ ║
║  │     └ /Users/jagadeesh/projects                                       │ ║
║  │                                                                           │ ║
║  │  ○  🔴 github                  [— tools]    [▶ Connect]                 │ ║
║  │     └ GITHUB_TOKEN: ***                                              │ ║
║  │                                                                           │ ║
║  │  ○  🟡 memory                 [— tools]    [▶ Connect]                 │ ║
║  │     └ Persistent storage                                              │ ║
║  │                                                                           │ ║
║  │  [+ Add Server]                                                       │ ║
║  └───────────────────────────────────────────────────────────────────────────╝ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
│  ↑↓ Navigate   ↵ Select   a Add   r Refresh   d Delete   q Quit            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Status indicators**: 🟢 Connected (green) | 🔴 Disconnected (red) | 🟡 Connecting (yellow)
- **Server labels**: Show server purpose (e.g., "Persistent storage" for memory)
- **Quick actions**: Connect/Disconnect buttons inline
- **Tool count**: Shows number of available tools when connected

---

## 2. Tools Panel

View and browse all available tools from connected servers:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🪢 MCP Bridge                                    v2.0.0        [?]help      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌─────────────┬────────────────────────────────────────────────────────────┐║
║  │  SERVERS    │  Tools (filesystem)                                    [🔄]  │║
║  │  ─────────  │  ────────────────────────────────────────────────────────   │║
║  │  ● filesystem│  Search: [____________]                                           │║
║  │  ○ github   │                                                              │║
║  │  ○ memory   │  📄 read_file                Read contents from a file       │║
║  │             │  📁 read_directory           List directory contents         │║
║  │  [+ Add]    │  📝 write_file               Write content to a file         │║
║  │             │  🗑️ delete_file              Delete a file                  │║
║  │             │  📤 move_file                Move or rename a file           │║
║  │             │  📋 get_file_info           Get file metadata               │║
║  │             │  🔍 search_files             Search for files               │║
║  │             │                                                            │║
║  │             │  [Showing 7 of 7 tools]                                  │║
║  └─────────────┴────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════╝
│  ↑↓ Navigate   ↵ Select   Tab Switch panel   q Quit                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Search/filter**: Quickly find tools by name
- **Tool icons**: Visual icons for each tool type
- **Tool descriptions**: Show what each tool does
- **Tool count**: "Showing X of Y tools" when filtered

---

## 3. Execute Panel

Execute tools with JSON arguments and view results:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🪢 MCP Bridge                                    v2.0.0        [?]help      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌─────────────┬────────────────────────────────────────────────────────────┐║
║  │  SERVERS    │  Execute                                          [Clear]   │║
║  │  ─────────  │  ────────────────────────────────────────────────────────   │║
║  │  ● filesystem│  ┌─────────────────────────────────────────────────────┐   │║
║  │  ○ github   │  │ Tool: read_file                         [▶ Run]    │   │║
║  │  ○ memory   │  └─────────────────────────────────────────────────────┘   │║
║  │             │                                                             │║
║  │  [+ Add]    │  Args:                                                       │║
║  │             │  ┌─────────────────────────────────────────────────────┐   │║
║  │             │  │ {                                                      │   │║
║  │             │  │   "path": "package.json",                            │   │║
║  │             │  │   "encoding": "utf-8"                                 │   │║
║  │             │  │ }                                                      │   │║
║  │             │  └─────────────────────────────────────────────────────┘   │║
║  │             │                         [▼ Edit]  [📋 Paste from clipboard]│   │║
║  │             │                                                             │║
║  │             │  Result:                                        [📋 Copy] │║
║  │             │  ────────────────────────────────────────────────────────   │║
║  │             │  {                                                          │║
║  │             │    "name": "mcp-bridge-openclaw",                        │║
║  │             │    "version": "1.0.0",                                    │║
║  │             │    "description": "MCP Bridge for OpenClaw",             │║
║  │             │    "main": "dist/index.js",                               │║
║  │             │    "type": "module"                                       │║
║  │             │  }                                                          │║
║  │             │                           [✓ Done in 42ms]                │║
║  └─────────────┴────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════╝
│  ↑↓ Navigate   ↵ Run   e Edit args   c Copy result   q Quit                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

- **One-click run**: Execute selected tool instantly
- **JSON editor**: Edit arguments with syntax highlighting concept
- **Quick paste**: Paste JSON from clipboard
- **Copy result**: One-click copy to clipboard
- **Execution time**: Shows "Done in Xms" for performance

---

## 4. Error Handling

Clear error messages with stack traces:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🪢 MCP Bridge                                    v2.0.0        [?]help      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌─────────────┬────────────────────────────────────────────────────────────┐║
║  │  SERVERS    │  Execute                                          [Clear]   │║
║  │  ─────────  │  ────────────────────────────────────────────────────────   │║
║  │  ● filesystem│  ┌─────────────────────────────────────────────────────┐   │║
║  │  ○ github   │  │ Tool: read_file                         [▶ Run]    │   │║
║  │  ○ memory   │  └─────────────────────────────────────────────────────┘   │║
║  │             │                                                             │║
║  │  [+ Add]    │  Args:                                                       │║
║  │             │  ┌─────────────────────────────────────────────────────┐   │║
║  │             │  │ { "path": "/nonexistent/file.txt" }                 │   │║
║  │             │  └─────────────────────────────────────────────────────┘   │║
║  │             │                                                             │║
║  │             │  Result:                                        [📋 Copy] │║
║  │             │  ────────────────────────────────────────────────────────   │║
║  │             │                                                             │║
║  │             │  ⚠️  Error: File not found                                 │║
║  │             │                                                             │║
║  │             │    at filesystem.read_file (server.js:142)                │║
║  │             │    at process._tickCallback (internal/process/...          │║
║  │             │                                                             │║
║  └─────────────┴────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════╝
│  ↑↓ Navigate   ↵ Run   ? Help   q Quit                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Initial State (No Servers)

When first starting with no configured servers:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🪢 MCP Bridge                                    v2.0.0        [?]help      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ┌─────────────┬────────────────────────────────────────────────────────────┐║
║  │  SERVERS    │  Tools                                             [🔄]     │║
║  │  ─────────  │  ────────────────────────────────────────────────────────   │║
║  │             │                                                             │║
║  │  No servers │  Select a connected server to view available tools         │║
║  │  configured │                                                             │║
║  │             │                                                             │║
║  │  [+ Add]    │                                                             │║
║  │             │                                                             │║
║  │             │                                                             │║
║  │  ─────────  │                                                             │║
║  │  HELP       │                                                             │║
║  │  ─────────  │                                                             │║
║  │  ? Help     │                                                             │║
║  │  q Quit     │                                                             │║
║  └─────────────┴────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════╝
│  a Add server   ? Help   q Quit                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `↑/↓` | Navigate list |
| `↵` | Select / Run |
| `Tab` | Switch panel (Sidebar ↔ Tools ↔ Execute) |
| `a` | Add new server |
| `d` | Delete selected server |
| `r` | Refresh tools |
| `e` | Edit arguments |
| `c` | Copy result |
| `?` | Show help |
| `q` | Quit |

---

## Color Scheme

The CLI uses ANSI colors for visual hierarchy:

- **Green** (`🟢`): Connected/Success
- **Red** (`🔴`): Disconnected/Error
- **Yellow** (`🟡`): Connecting/Pending
- **Cyan** (`📄`): File operations
- **Magenta** (`📝`): Write operations
- **Blue** (`🔍`): Search operations
