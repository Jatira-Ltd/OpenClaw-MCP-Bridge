## Summary

This PR addresses 6 security vulnerabilities in the MCP Bridge:

### Fixed Issues

1. **Command Injection in installer.ts (CRITICAL)**
   - Package name is now validated with strict regex before use in shell commands
   - Blocks dangerous characters like backticks, $, ;, |, etc.

2. **Path Traversal in protocol.ts (CRITICAL)**
   - Added validateAllowedDirectories() to sanitize directory paths
   - Blocks path traversal attempts with ..
   - Only allows paths within cwd or HOME

3. **Unrestricted npx fallback (HIGH)**
   - Removed fallback to npx -y for unknown packages
   - Only known servers in KNOWN_SERVERS map can be used
   - Unknown packages now throw an error

4. **Env var exposure (MEDIUM)**
   - Added getFilteredEnv() to only pass necessary variables
   - Only PATH, HOME, USER, TMPDIR, TMP, NODE_ENV, LANG, LC_ALL are passed

5. **JSON.parse vulnerability (HIGH)**
   - Added safeJsonParse() with try/catch and type validation
   - Proper error messages for invalid JSON

6. **Process cleanup (MEDIUM)**
   - Added SIGTERM/SIGINT handlers for graceful shutdown
   - Added uncaughtException/unhandledRejection handlers
   - Proper child process cleanup on exit