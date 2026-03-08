#!/bin/bash
# Build script for CLI

esbuild src/cli.tsx \
  --bundle \
  --platform=node \
  --outfile=dist/cli.cjs \
  --external:child_process \
  --format=cjs \
  --loader:.tsx=tsx \
  --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"
