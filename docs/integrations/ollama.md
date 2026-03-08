# Ollama Integration

**Package:** `ollama-mcp-server`

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `OLLAMA_HOST` | No | http://localhost:11434 |

## Available Tools (9 tools)

| Tool | Description |
|------|-------------|
| `list` | List all models |
| `show` | Show model info |
| `create` | Create a model |
| `pull` | Pull a model |
| `push` | Push a model |
| `cp` | Copy a model |
| `rm` | Remove a model |
| `run` | Run model with prompt |
| `chat_completion` | Chat completion API |

## Usage

Requires Ollama running locally: `ollama serve`
