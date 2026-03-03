#!/bin/bash
# Log token usage to TOKENS_USAGE.md
# Usage: ./log_tokens.sh "model" input output total "notes"

MODEL=${1:-MiniMax-M2.5}
INPUT=${2:-0}
OUTPUT=${3:-0}
TOTAL=${4:-0}
NOTES=${5:-"-"}
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M')

ENTRY="| $TIME | $MODEL | $INPUT | $OUTPUT | $TOTAL | $NOTES |"

# Check if today's date section exists
if ! grep -q "## $DATE" ~/.openclaw/workspace/TOKENS_USAGE.md 2>/dev/null; then
    echo "" >> ~/.openclaw/workspace/TOKENS_USAGE.md
    echo "### $DATE" >> ~/.openclaw/workspace/TOKENS_USAGE.md
    echo "| Time | Model | Input | Output | Total | Notes |" >> ~/.openclaw/workspace/TOKENS_USAGE.md
    echo "|:-----|-------|------:|-------:|------:|-------|" >> ~/.openclaw/workspace/TOKENS_USAGE.md
fi

# Add entry
sed -i "s/| Time | Model | Input | Output | Total | Notes |/$ENTRY\n| Time | Model | Input | Output | Total | Notes |/" ~/.openclaw/workspace/TOKENS_USAGE.md

echo "Logged: $ENTRY"
