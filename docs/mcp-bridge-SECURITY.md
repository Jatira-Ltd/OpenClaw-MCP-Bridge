# MCP Bridge Security — Simplified

**Version**: 1.1  
**Date**: March 8, 2026  
**Status**: Final

---

## Overview

MCP Bridge runs on user's machine (self-hosted). Security model is **simplified** — we rely on OS-level file permissions, not encryption.

---

## Security Model

### What We Do

| Aspect | Approach |
|--------|----------|
| **API Keys** | Stored plain in `openclaw.json` |
| **Config Permissions** | User's file permissions protect |
| **Process Isolation** | Each MCP server runs as child process |
| **Timeout** | Auto-kill after 30s idle |

### What We DON'T Do

| Aspect | Why Not |
|--------|---------|
| **No encryption** | User's machine, user controls |
| **No keychain** | Over-engineered for self-hosted |
| **No vault** | Not needed |

---

## Why No Encryption?

```
OpenClaw = Self-hosted on user's machine
Claude Code = Also self-hosted, same approach
```

Claude Code's `claude.json` stores API keys plain. Same model here.

---

## User Responsibilities

1. **File permissions** — Ensure `openclaw.json` is not world-readable
2. **Machine security** — Physical access, OS login
3. **Key management** — User provides their own keys

---

## Comparison

| Model | Our Approach | Claude Code | Smithery |
|-------|--------------|-------------|----------|
| Key Storage | Plain in config | Plain in config | Encrypted |
| Hosting | User's machine | User's machine | Cloud |
| Security | OS permissions | OS permissions | Enterprise |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User's machine compromised | Low | High | User's responsibility |
| Config file leaked | Low | Medium | File permissions |
| MCP server vulnerability | Medium | Low | Process isolation |

---

## Conclusion

**Keep it simple.** MCP Bridge is infrastructure, not a security product. 
Users manage their own keys on their own machines.
