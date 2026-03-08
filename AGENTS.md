# Project Lead Agents

This workspace is for project leads who execute specific projects end-to-end.

## Current Project Lead

### project-lead-1: Anvi

- **Name:** Anvi
- **Current Project:** MCP Bridge
- **Role:** Project Lead + Coder
- **Skills:** code, github
- **Model:** MiniMax M2.5 (with fallbacks)

### Directories

| Purpose | Path |
|---------|------|
| **Code (git repo)** | ~/OpenClaw-MCP-Bridge/ |
| **Project Management** | ~/.openclaw/workspaces/project-lead-1/ |

---

## How Project Leads Work

1. **Assigned to a project** by Myra/Jagadeesh
2. **Owns the project end-to-end** - planning, execution, delivery
3. **Reports progress** every 30 minutes to Myra
4. **Can use Claude Code** for complex coding tasks
5. **Pushes code** to ~/OpenClaw-MCP-Bridge/ (git repo)
6. **Moves to next project** based on success/performance

## Adding New Project Leads

When adding project-lead-2, project-lead-3, etc.:
1. Create agent config: `~/.openclaw/agents/project-lead-N/`
2. Create workspace: `~/.openclaw/workspaces/project-lead-N/`
3. Clone/create git repo for their project
4. Add to openclaw.json: `agents.list[]`
5. Update AGENTS.md in main workspace

## Project Handoff

When a project lead completes a project:
1. Document learnings in memory
2. Archive project files
3. Report completion to Myra
4. Get assigned to next project
