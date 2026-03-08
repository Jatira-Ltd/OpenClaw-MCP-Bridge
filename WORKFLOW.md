# Anvi Workflow — MCP Bridge Development

**Project:** MCP Bridge  
**Lead:** Anvi (project-lead-1)  
**Reviewer:** Aryan  
**Tester:** Zayn  
**Repo:** https://github.com/Jatira-Ltd/OpenClaw-MCP-Bridge

---

## How Anvi Works (Autonomous)

Anvi is given the **entire project** and works through it autonomously:

```
You → Myra: "Launch Anvi for MCP Bridge"
Myra → Spawns Anvi with full context

Anvi (autonomous):
1. Reads docs, creates task plan
2. Works through tasks 1-7 (POC) 
3. Creates branches, commits, pushes
4. Opens PRs for review
5. Reports to Myra every 30 min
6. Only asks when blocked
```

---

## Directory Structure

| Purpose | Path |
|---------|------|
| **Code (git repo)** | ~/OpenClaw-MCP-Bridge/ |
| **Project Management** | ~/.openclaw/workspaces/project-lead-1/ |

---

## Git Workflow

### 1. Create Branch

```bash
# Navigate to code directory
cd ~/OpenClaw-MCP-Bridge

# From main branch, create feature branch
git checkout -b mcp-bridge/[feature-name]

# Examples:
# git checkout -b mcp-bridge/setup
# git checkout -b mcp-bridge/config
# git checkout -b mcp-bridge/spawn
```

### 2. Develop & Commit

```bash
# Make changes, then commit
git add .
git commit -m "feat: [description]"

# Commit message format:
# feat: add project setup
# fix: resolve process issue
# chore: update dependencies
```

### 3. Push Branch

```bash
# Push branch to remote
git push -u origin mcp-bridge/[feature-name]
```

### 4. Open Pull Request

```bash
# Create PR
gh pr create --title "feat: [feature name]" --body "Description"
```

---

## POC Task List (Priority)

| # | Task | Branch | Status |
|---|------|--------|--------|
| 1 | Project Setup | mcp-bridge/setup | ⬜ |
| 2 | Config Read/Write | mcp-bridge/config | ⬜ |
| 3 | MCP Spawn | mcp-bridge/spawn | ⬜ |
| 4 | Protocol Handshake | mcp-bridge/handshake | ⬜ |
| 5 | Tool Discovery | mcp-bridge/discovery | ⬜ |
| 6 | Tool Execution | mcp-bridge/execution | ⬜ |
| 7 | End-to-End Test | mcp-bridge/e2e | ⬜ |

See POC_TASKS.md for detailed breakdown.

---

## Code Review & Testing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANVI'S AUTONOMOUS WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Start POC:                                                              │
│     - Read docs (POC_TASKS.md, ENGINEERING.md)                            │
│     - Create task plan                                                      │
│                                                                              │
│  2. Work through tasks 1-7 autonomously:                                   │
│     - Create branch for each task                                          │
│     - Implement feature                                                     │
│     - Commit & push                                                        │
│     - Open PR                                                              │
│                                                                              │
│  3. Wait for:                                                              │
│     ├── Aryan reviews PR                                                   │
│     └── Zayn writes/tests                                                 │
│                                                                              │
│  4. If changes requested:                                                  │
│     ├── Fix in SAME branch                                                 │
│     ├── Commit & push                                                      │
│     └── PR updates                                                         │
│                                                                              │
│  5. If both approve:                                                      │
│     ├── Merge PR                                                           │
│     ├── Checkout main & pull                                               │
│     └── Continue with next task                                           │
│                                                                              │
│  6. Report to Myra every 30 min:                                          │
│     📍 Anvi Update:                                                        │
│     - Completed: [what]                                                    │
│     - Working on: [what]                                                  │
│     - Next: [what]                                                        │
│     - Blockers: [none/describe]                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Progress Updates (Every 30 min)

When reporting to Myra, use:

```
📍 Anvi Update:
- Completed: [task name or feature]
- Working on: [current task]
- Next: [upcoming task]
- Blockers: [none or describe issue]
```

---

## Notes

- **One task = one branch = one PR**
- **Don't commit to main ever**
- **Always wait for both Aryan + Zayn approval**
- **Fixes go in same branch**
- **After merge, always pull main before next task**
- **Code in ~/OpenClaw-MCP-Bridge/**
- **Project mgmt in ~/.openclaw/workspaces/project-lead-1/**
