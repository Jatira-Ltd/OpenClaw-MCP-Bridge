# Anvi Workflow — MCP Bridge Development

**Project:** MCP Bridge  
**Lead:** Anvi (project-lead-1)  
**Reviewer:** Aryan  
**Tester:** Zayn  
**Repo:** https://github.com/Jatira-Ltd/OpenClaw-MCP-Bridge

---

## Git Workflow

### 1. Create Branch

```bash
# From main branch, create feature branch
git checkout -b mcp-bridge/[feature-name]

# Examples:
# git checkout -b mcp-bridge/project-setup
# git checkout -b mcp-bridge/mcp-server-spawn
# git checkout -b mcp-bridge/tool-discovery
```

### 2. Develop & Commit

```bash
# Make changes, then commit
git add .
git commit -m "feat: [description]"

# Commit message format:
# feat: add project setup (package.json, tsconfig)
# fix: resolve process timeout issue
# chore: update dependencies
```

### 3. Push Branch

```bash
# Push branch to remote
git push -u origin mcp-bridge/[feature-name]
```

### 4. Open Pull Request

```bash
# Create PR (via GitHub CLI or manually)
gh pr create --title "feat: [feature name]" --body "Description"
```

---

## Code Review & Testing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANVI'S WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Create branch                                                           │
│     git checkout -b mcp-bridge/[feature]                                    │
│                                                                              │
│  2. Develop & commit                                                        │
│     git add . && git commit -m "feat: [description]"                       │
│                                                                              │
│  3. Push & open PR                                                          │
│     git push -u origin mcp-bridge/[feature]                                │
│     → Creates PR for review                                                 │
│                                                                              │
│  4. Wait for:                                                               │
│     ├── Aryan reviews PR                                                    │
│     └── Zayn writes/tests                                                   │
│                                                                              │
│  5. If changes requested:                                                   │
│     ├── Anvi fixes in SAME branch                                           │
│     ├── Commit fixes: git add . && git commit -m "fix: [fix]"              │
│     ├── Push: git push                                                      │
│     └── PR updates automatically                                           │
│                                                                              │
│  6. If both approve:                                                       │
│     ├── Merge PR (via GitHub or CLI)                                       │
│     ├── git checkout main                                                   │
│     ├── git pull origin main                                                │
│     └── Continue with next task                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Steps

### Step 1: Start New Feature

```bash
# Ensure on main and up to date
git checkout main
git pull origin main

# Create new branch
git checkout -b mcp-bridge/[feature-name]
```

### Step 2: Make Changes

Write code, create files, etc.

### Step 3: Commit

```bash
# Check what changed
git status

# Stage files
git add [files]  # or git add .

# Commit with message
git commit -m "feat: add [feature]"
```

### Step 4: Push & Create PR

```bash
# Push branch
git push -u origin mcp-bridge/[feature-name]

# Create PR (do this ONCE,后续 pushes auto-update PR)
gh pr create --title "feat: [title]" --body "Description"
```

### Step 5: Wait for Reviews

- **Aryan** reviews code quality
- **Zayn** writes/runs tests
- You may get comments/change requests

### Step 6: If Changes Needed

```bash
# Make fixes
git add .
git commit -m "fix: address [comment]"
git push
# PR automatically updates
```

### Step 7: Merge (After Approval)

```bash
# Via GitHub UI or CLI after both approve
gh pr merge [PR-number]

# Or locally:
git checkout main
git pull origin main
```

---

## Task Checklist (MCP Bridge)

| Task | Branch | PR | Review | Tests | Merged? |
|------|--------|-----|--------|-------|---------|
| 1. Project setup | mcp-bridge/setup | - | - | - | - |
| 2. Config read/write | mcp-bridge/config | - | - | - | - |
| 3. MCP spawn + handshake | mcp-bridge/spawn | - | - | - | - |
| 4. Tool discovery | mcp-bridge/discovery | - | - | - | - |
| 5. Tool execution | mcp-bridge/execution | - | - | - | - |
| 6. CLI commands | mcp-bridge/cli | - | - | - | - |
| 7. End-to-end test | mcp-bridge/e2e | - | - | - | - |
| 8. Package as skill | mcp-bridge/package | - | - | - | - |

---

## Communication

### Progress Updates (Every 30 min)

```
📍 Anvi Update:
- Completed: [what]
- Working on: [what]  
- Next: [what]
- Blockers: [none/describe]
```

### When Opening PR

```
📋 PR Opened: [feature-name]
- Branch: mcp-bridge/[name]
- Description: [what it does]
- Ready for: @Aryan (review), @Zayn (tests)
```

### When Merged

```
✅ Merged: [feature-name]
- Next task: [next feature]
```

---

## Notes

- **One feature = one branch = one PR**
- **Don't commit to main ever**
- **Always wait for both Aryan + Zayn approval**
- **Fixes go in same branch, not new branches**
- **After merge, always pull main before starting next**

---

## Repo Setup (For Myra)

When Jagadeesh creates the GitHub repo, Myra will run:

```bash
cd ~/OpenClaw-MCP-Bridge
git remote add origin https://github.com/Jatira-Ltd/OpenClaw-MCP-Bridge.git
git branch -M main
git push -u origin main
```
