# MCP Integrations

This directory contains documentation for all MCP (Model Context Protocol) integrations available in OpenClaw MCP Bridge.

## Current Status

- **37 MCP Servers**
- **554 Tools**
- **Target: 500+ tools** ✅

## Available Integrations

### Cloud Platforms

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| AWS | `@awslabs/mcp` | 50+ | EC2, S3, Lambda, RDS, IAM |
| Azure | `@azure/mcp` | 30+ | Storage, CosmosDB, Functions, VMs |
| Azure DevOps | `@azure-devops/mcp` | 30+ | Pipelines, Builds, Releases, Work Items |

### Developer Tools

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| GitHub | `@modelcontextprotocol/server-github` | 27 | Repository, Issues, PRs |
| GitLab | `@zereight/mcp-gitlab` | 30 | Projects, MRs, CI/CD |
| GitLab Advanced | `@structured-world/gitlab-mcp` | 40+ | Advanced GitLab features |
| Kubernetes | `mcp-server-kubernetes` | 40+ | Pods, Services, Deployments |
| Chrome DevTools | `chrome-devtools-mcp` | 20+ | Browser automation |

### Project Management

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Jira | `@aashari/mcp-server-atlassian-jira` | 15+ | Issues, Projects, Sprints |
| Linear | `linear-mcp` | 15+ | Issues, Projects, Teams |
| Asana | `@roychri/mcp-server-asana` | 20+ | Tasks, Projects, Workspaces |
| Notion | `@notionhq/notion-mcp-server` | 22 | Pages, Databases, Blocks |

### Database & Storage

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| PostgreSQL | `mcp-postgres` | 2 | Query, Execute |
| Supabase | `@supabase/mcp-server-supabase` | 15+ | Tables, Queries, Auth |
| Memory | `@modelcontextprotocol/server-memory` | 10+ | Knowledge graph |

### Monitoring & Observability

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Sentry | `@sentry/mcp-server` | 15+ | Issues, Releases, Events |
| Datadog | `@winor30/mcp-server-datadog` | 20+ | Monitors, Metrics, Incidents |
| Dynatrace | `@dynatrace-oss/dynatrace-mcp-server` | 20+ | Entities, Metrics, Problems |

### Communication

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Slack | `slack-mcp-server` | 5+ | Messages, Channels, Files |

### AI/ML

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Ollama | `ollama-mcp-server` | 9 | LLM, Chat, Models |
| Sequential Thinking | `@modelcontextprotocol/server-sequential-thinking` | 6 | Reasoning tools |
| FAL AI | `mcp-fal-ai-image` | 1 | Image generation |

### Design & Creative

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Figma | `figma-mcp` | 9 | Files, Components, Styles |

### Payments & Commerce

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Stripe | `@stripe/mcp` | 32 | Customers, Charges, Subscriptions |

### Deployment Platforms

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Heroku | `@heroku/mcp-server` | 20+ | Apps, Dynos, Releases |
| Railway | `@railway/mcp-server` | 15+ | Projects, Deployments |
| Apify | `@apify/actors-mcp-server` | 15+ | Actors, Datasets, Storage |

### CRM & Marketing

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| HubSpot | `@hubspot/mcp-server` | 20+ | Contacts, Companies, Deals |

### Other Integrations

| Integration | Package | Tools | Description |
|-------------|---------|-------|-------------|
| Browser | `hyper-mcp-browser` | 2 | Web browsing |
| Puppeteer | `puppeteer-mcp-server` | 25+ | Browser automation |
| Fetch | `@kazuph/mcp-fetch` | 1 | Web fetching |
| Filesystem | `@modelcontextprotocol/server-filesystem` | 6 | File operations |
| Code Runner | `mcp-server-code-runner` | 6 | Execute code |
| Mapbox | `@mapbox/mcp-server` | 10+ | Geocoding, Directions |
| Context7 | `@upstash/context7-mcp` | 3 | Documentation search |
| SAP UI5 | `@ui5/mcp-server` | 8 | SAP development |
| Spec Kit | `@fast-kit/spec-kit` | 9 | Requirements management |
| Ref Tools | `ref-tools-mcp` | 9 | Reference documentation |

## Adding New Integrations

1. Install the npm package: `npm install --save-dev <package>`
2. Add to mcp-servers.json with tool definitions
3. Document in this directory
4. Commit changes

## Environment Variables

Each integration may require specific environment variables. See individual integration docs for details. Common variables:
- API keys (GitHub, Stripe, etc.)
- Database connection strings
- Cloud provider credentials

## Testing

Run discovery to test integrations:
```bash
mcp discover
```
