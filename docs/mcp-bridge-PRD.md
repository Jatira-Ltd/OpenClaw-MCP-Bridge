# MCP Bridge for OpenClaw — PRD

**Project**: OpenClaw MCP Bridge  
**Version**: 1.1  
**Date**: March 8, 2026  
**Status**: Ready for Build

---

## 🎯 Problem Statement

OpenClaw users cannot access the 500+ MCP server tools. They must either:
1. Use Claude Code separately (non-interactive, slow)
2. Wait for custom skill development (weeks per integration)

---

## 🎯 Solution

Native MCP Bridge — lets OpenClaw directly install, discover, and execute MCP server tools without spawning Claude Code.

---

## 👥 Target Users

| User | Need |
|------|------|
| OpenClaw power users | Connect to Notion, Slack, Linear, etc. |
| Developers | Use MCP tools via natural language |
| Teams | Shared MCP configurations |

---

## ✅ MVP Features

| Feature | Description |
|---------|-------------|
| **MCP Install** | `mcp install @package` — download & setup |
| **Tool Discovery** | Auto-discover tools from installed servers |
| **Tool Execution** | Call any tool and return results |
| **Config Storage** | Store API keys in user's openclaw.json |
| **Process Management** | Spawn/kill MCP servers safely |

---

## 📋 Commands

| Command | Example |
|---------|---------|
| `mcp install @notionhq/mcp-server` | Install Notion MCP |
| `mcp list` | Show installed servers + tools |
| `mcp tools` | List all available tools |
| `mcp call <tool> <args>` | Call a specific tool |
| `mcp remove @package` | Uninstall |

---

## 💰 Pricing Model

| Tier | Price | Description |
|------|-------|-------------|
| **Free** | $0 | Unlimited servers, unlimited calls |

**Note:** MCP Bridge is **free** infrastructure. Revenue is generated through ClawHub premium skills (skill-github-pro, skill-notion-pro, etc.).

See: `docs/mcp-bridge-BUSINESS.md` for full business analysis.

---

## 🔐 Security Model

- API keys stored in user's `openclaw.json` (file permissions only)
- No encryption — user manages their own keys
- Similar to Claude Code's `claude.json` approach
- See: `docs/mcp-bridge-SECURITY.md` for details

---

##| Phase | Duration | Deliverable |
 🚀 Launch Timeline

|-------|----------|-------------|
| POC | 2-3 days | Call 1 tool |
| MVP | 1 week | Full install/execute |
| Launch | 2 weeks | Publish to ClawHub |

---

## 📊 Success Metrics

| Metric | Target (Month 1) |
|--------|------------------|
| Installations | 50 |
| Active users | 20 |
| ClawHub skill sales | 10 |

---

## ⚠️ Risks

| Risk | Mitigation |
|------|------------|
| MCP protocol changes | Use official SDK |
| User API key exposure | Rely on file permissions |
| Process leaks | Auto-timeout (30s) |

---

## ✅ Next Steps

1. Build POC (this week) — Anvi is leading
2. Test with 3 users
3. Launch on ClawHub as free skill

---

## 📚 Related Documents

- `mcp-bridge-ENGINEERING.md` — Technical architecture
- `mcp-bridge-SECURITY.md` — Security design
- `mcp-bridge-BUSINESS.md` — Cost & revenue analysis
