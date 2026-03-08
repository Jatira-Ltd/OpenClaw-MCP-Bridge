# MCP Bridge Integrations

This document lists all supported MCP server integrations.

## Available Integrations (8 integrations, 67+ tools)

| Integration | Package | Tools | Auth Required |
|------------|---------|-------|---------------|
| GitHub | `@modelcontextprotocol/server-github` | 26 | Yes (GITHUB_TOKEN) |
| Fetch | `@kazuph/mcp-fetch` | 1 | No |
| Browser | `hyper-mcp-browser` | 2 | No |
| Slack | `slack-mcp-server` | TBD | Yes (SLACK_TOKEN) |
| Notion | `@notionhq/notion-mcp-server` | 23 | Yes (NOTION_KEY) |
| Fal AI | `mcp-fal-ai-image` | 1 | Yes (FAL_KEY) |
| Postgres | `mcp-postgres` | 2 | Yes (DATABASE_URL) |
| Ollama | `ollama-mcp-server` | 9 | No (local) |

## Installation

All packages are installed via npm:

```bash
npm install --save-dev @modelcontextprotocol/server-github
npm install --save-dev @kazuph/mcp-fetch
npm install --save-dev hyper-mcp-browser
npm install --save-dev slack-mcp-server
npm install --save-dev @notionhq/notion-mcp-server
npm install --save-dev mcp-fal-ai-image
npm install --save-dev mcp-postgres
npm install --save-dev ollama-mcp-server
```

## Environment Variables

Set these in your shell or `.env` file:

- `GITHUB_TOKEN` - GitHub Personal Access Token
- `NOTION_KEY` - Notion API Key
- `FAL_KEY` - Fal.ai API Key  
- `DATABASE_URL` - PostgreSQL connection string
- `SLACK_TOKEN` - Slack OAuth token
- `OLLAMA_HOST` - Ollama server URL (default: http://localhost:11434)

## Per-Integration Docs

- [GitHub](./github.md)
- [Fetch](./fetch.md)
- [Browser](./browser.md)
- [Slack](./slack.md)
- [Notion](./notion.md)
- [Fal AI](./fal-ai.md)
- [Postgres](./postgres.md)
- [Ollama](./ollama.md)
