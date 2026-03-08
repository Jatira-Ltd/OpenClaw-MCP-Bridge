# MCP Bridge POC — Concrete Task List

**Project:** MCP Bridge  
**Goal:** Call one MCP tool end-to-end  
**Estimated Time:** 2-3 hours

---

## POC Tasks (In Order)

| # | Task | Branch | Description | Status |
|---|------|--------|-------------|--------|
| 1 | Project Setup | `mcp-bridge/setup` | Create package.json, tsconfig, dependencies | ⬜ |
| 2 | Config Read/Write | `mcp-bridge/config` | Read/write MCP config in openclaw.json | ⬜ |
| 3 | MCP Spawn | `mcp-bridge/spawn` | Spawn @modelcontextprotocol/server-filesystem via npx | ⬜ |
| 4 | Protocol Handshake | `mcp-bridge/handshake` | Send initialize request, receive capabilities | ⬜ |
| 5 | Tool Discovery | `mcp-bridge/discovery` | Call tools/list, parse tool schema | ⬜ |
| 6 | Tool Execution | `mcp-bridge/execution` | Call tools/call with args, get result | ⬜ |
| 7 | End-to-End Test | `mcp-bridge/e2e` | Full test: spawn → discover → call file | ⬜ |

---

## Task Details

### Task 1: Project Setup
```
Create:
- package.json (name: @openclaw/mcp-bridge)
- tsconfig.json
- src/index.ts (entry point)
- Dependencies: @modelcontextprotocol/sdk, ora, chalk

Commands:
npm init -y
npm install @modelcontextprotocol/sdk ora chalk
npm install -D typescript @types/node
```

### Task 2: Config Read/Write
```
Create src/lib/config.ts:
- readMCPConfig(): MCPConfig
- writeMCPConfig(config: MCPConfig): void
- addServer(name, config): void
- removeServer(name): void

Test with: node -e "console.log(readMCPConfig())"
```

### Task 3: MCP Spawn
```
Create src/lib/executor.ts:
- spawnServer(packageName): ChildProcess
- killServer(process): void

Test: spawn npx process, verify it starts
```

### Task 4: Protocol Handshake
```
Create src/lib/protocol.ts:
- sendInitialize(process): Promise<Capabilities>
- Listen for responses on stdout

Test: Send initialize, receive capabilities
```

### Task 5: Tool Discovery
```
Extend protocol.ts:
- listTools(process): Promise<Tool[]>

Test: Call tools/list on filesystem server
Expected tools: read_file, write_file, list_directory
```

### Task 6: Tool Execution
```
Extend protocol.ts:
- callTool(process, toolName, args): Promise<Result>

Test: Call read_file on a test file
```

### Task 7: End-to-End Test
```
Create test file: ~/test.txt
Run full flow:
1. Spawn server
2. Initialize
3. List tools
4. Read test.txt
5. Return content

Success = returns file content
```

---

## Deliverable

**POC Success Criteria:**
- [ ] Can spawn any MCP server via npx
- [ ] Can discover available tools
- [ ] Can call a tool and get result
- [ ] Works with @modelcontextprotocol/server-filesystem (no auth needed)

---

## After POC (Full MVP)

| # | Task |
|---|------|
| 8 | CLI Commands (install, list, call, remove) |
| 9 | Error Handling |
| 10 | Process Management (timeouts, cleanup) |
| 11 | Package as OpenClaw Skill |
| 12 | Test with Notion MCP (requires API key) |

---

## Notes

- Use filesystem MCP server for POC (no auth needed)
- Focus on getting ONE tool call working first
- Don't over-engineer — just make it work
- Document issues as they arise
