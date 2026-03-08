# GitHub Integration

**Package:** `@modelcontextprotocol/server-github`

## Installation

```bash
npm install --save-dev @modelcontextprotocol/server-github
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes | GitHub PAT with repo, read:user scopes |

## Available Tools (26 tools)

### Repository Operations
- `create_repository`, `fork_repository`, `get_file_contents`, `create_or_update_file`, `push_files`

### Issues
- `create_issue`, `list_issues`, `get_issue`, `update_issue`, `add_issue_comment`, `search_issues`

### Pull Requests
- `create_pull_request`, `list_pull_requests`, `get_pull_request`, `create_pull_request_review`, `merge_pull_request`, `get_pull_request_files`, `get_pull_request_status`, `update_pull_request_branch`

### Search
- `search_repositories`, `search_code`, `search_users`

### Other
- `create_branch`, `list_commits`

## Usage

```json
{
  "name": "@modelcontextprotocol/server-github",
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx" }
}
```
