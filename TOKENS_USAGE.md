# Token Usage Log

## Format
Each entry: `[timestamp] | model | input_tokens | output_tokens | total | context_tokens | session_notes`

## Usage
Add new entries using:
```bash
echo "[$(date '+%Y-%m-%d %H:%M:%S')] | MiniMax-M2.5 | 150k | 55k | 205k | current | Homepage fixes" >> TOKENS_USAGE.md
```

## History


### 2026-03-03

| Time | Model | Input | Output | Total | Notes |
|------|-------|-------|--------|-------|-------|
| 13:19 | MiniMax-M2.5 | 119k | - | 205k | Current session - various fixes |
