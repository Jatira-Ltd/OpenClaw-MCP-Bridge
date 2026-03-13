/**
 * MCP Bridge CLI - Interactive TUI Application v2.0
 * 
 * Redesign based on: ~/.openclaw/workspace/mcp-bridge-cli-spec-v2.md
 * 
 * Key features:
 * - Sidebar layout (~18% width for servers)
 * - Status bar with connection count
 * - Tool filter (press 'f')
 * - Modal dialogs for Add Server and Confirm Remove
 * - Enhanced icons
 * - Execution drawer
 * - Arrow keys for panel switching
 * 
 * UX fixes applied:
 * - Better icon (🔗 instead of 🪢)
 * - Wider sidebar (18%)
 * - Clear results/filter on server change
 * - Fixed colors (no pink, green=connected, red=error, blue=hover/select)
 * - Fixed filter input backspace
 * - Full keyboard shortcuts with icons
 */

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput } from 'ink';
import chalk from 'chalk';
import { readMCPConfig, addMCPServer, removeMCPServer } from './lib/config.js';
import { createSession, listTools, callMCPTool, closeServerSession } from './lib/protocol.js';
import { isVerbose } from './lib/logger.js';
import type { MCPServer, MCPTool } from './types/mcp.js';

// CLI flags
const CLI_VERSION = '1.0.0';
const args = process.argv.slice(2);

function showVersion() {
	console.log(`MCP Bridge v${CLI_VERSION}`);
	process.exit(0);
}

function showHelp() {
	console.log(`
🔗 MCP Bridge v${CLI_VERSION}

Usage: mcp-bridge [options] [command]

Options:
  -v, --verbose    Enable verbose output
  -d, --debug      Enable debug output
  --version        Show version number
  --help           Show this help message
`);
	process.exit(0);
}

// Check for command arguments
const commandArgs = args.filter(arg => 
	!arg.startsWith('--') && 
	!arg.startsWith('-') &&
	arg !== '--version' &&
	arg !== '-V' &&
	arg !== '--help' &&
	arg !== '-h' &&
	arg !== '--verbose' &&
	arg !== '-v' &&
	arg !== '--debug' &&
	arg !== '-d'
);

if (commandArgs.length > 0) {
	const { main } = await import('./index.js');
	await main();
	process.exit(0);
}

if (args.includes('--version') || args.includes('-V')) showVersion();
if (args.includes('--help') || args.includes('-h')) showHelp();

const isTTY = process.stdin.isTTY;

// Runtime server status
interface ServerWithStatus {
	name: string;
	endpoint?: string;
	description?: string;
	status: 'disconnected' | 'connecting' | 'connected' | 'error';
	error?: string;
	tools: MCPTool[];
	installedAt: string;
	enabled: boolean;
	config: Record<string, unknown>;
	env: Record<string, string>;
	recommended?: boolean;
}

// Enhanced color palette - FIXED COLORS
const colors = {
	bg: '#0a0e14',
	panelBg: '#111820',
	border: '#1e2a38',
	textPrimary: '#e6edf3',
	textSecondary: '#7d8590',
	textMuted: '#3d4a5c',
	accentCyan: '#39c5cf',
	accentBlue: '#58a6ff',       // NEW: For hover/selection
	accentGreen: '#2dd4bf',       // For connected status
	accentAmber: '#fbbf24',       // For connecting/loading
	accentRed: '#f87171',         // For errors
	accentPurple: '#a78bfa',      // For tools
	hoverBg: '#1a2332',
};
// Token links for auth services
const tokenLinks: Record<string, { name: string; url: string }> = {
	github: { name: 'GitHub', url: 'https://github.com/settings/tokens' },
	gitlab: { name: 'GitLab', url: 'https://gitlab.com/-/profile/personal_access_tokens' },
	jira: { name: 'Atlassian', url: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
	notion: { name: 'Notion', url: 'https://www.notion.so/my-integrations' },
	slack: { name: 'Slack', url: 'https://api.slack.com/apps' },
	linear: { name: 'Linear', url: 'https://linear.app/settings/api-keys' },
};

// Button icons
const buttonIcons = {
	add: '➕', connect: '🔗', disconnect: '🔌',
	remove: '🗑️', refresh: '🔄', copy: '📋',
};


// Tool icons - IMPROVED default
const toolIcons: Record<string, string> = {
	read_file: '📄',
	read_directory: '📁',
	write_file: '📝',
	delete_file: '🗑️',
	move_file: '📤',
	get_file_info: '📋',
	search_files: '🔍',
	create_directory: '📂',
	get_env: '🔧',
	http_request: '🌐',
	auth: '🔐',
	default: '🛠️',
};

function getToolIcon(toolName: string): string {
	if (toolIcons[toolName]) return toolIcons[toolName];
	for (const [key, icon] of Object.entries(toolIcons)) {
		if (toolName.includes(key)) return icon;
	}
	return toolIcons.default;
}

// Status icons
const statusIcons = {
	connected: '●',
	disconnected: '○',
	connecting: '◐',
	error: '⚠',
};

// Popular pre-loaded MCP servers (shown when config is empty)
const popularServers: { name: string; endpoint: string; description: string; recommended?: boolean }[] = [
	{ name: "Filesystem", endpoint: "npx://@modelcontextprotocol/server-filesystem", description: "Read/write local files", recommended: true },
	{ name: "Memory", endpoint: "npx://@modelcontextprotocol/server-memory", description: "Persistent knowledge graph", recommended: true },
	{ name: "GitHub", endpoint: "npx://@modelcontextprotocol/server-github", description: "GitHub API integration", recommended: true },
	{ name: "Brave Search", endpoint: "npx://@modelcontextprotocol/server-brave-search", description: "Web search via Brave", recommended: true },
];

function clampIndex(index: number, maxIndex: number): number {
	return Math.max(0, Math.min(index, maxIndex));
}

type ModalType = 'none' | 'help' | 'add-server' | 'confirm-remove' | 'auth-error';
type FocusedPanel = 'servers' | 'tools' | 'execute';

interface ExecutionResult {
	success: boolean;
	result?: unknown;
	error?: string;
	timestamp: number;
}

function Divider({ width = 50 }: { width?: number }) {
	return <Text color={colors.textMuted}>{'─'.repeat(width)}</Text>;
}

// ==================== MODAL COMPONENTS ====================

function HelpModal({ onClose }: { onClose: () => void }) {
	useInput((input: string, key: any) => {
		if (input === 'q' || key.escape) onClose();
	});

	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box flexDirection="column" borderStyle="round" borderColor={colors.accentBlue}>
				<Box justifyContent="space-between" paddingX={1}>
					<Text bold color={colors.accentBlue}>  🔗 MCP Bridge — Help </Text>
					<Text color={colors.textMuted}>[ESC]</Text>
				</Box>
				<Box paddingX={1}><Divider width={60} /></Box>
				
				<Box paddingX={1}>
					<Box flexDirection="column" width={26} marginRight={2}>
						<Text bold color={colors.textPrimary}>  Navigation</Text>
						<Text color={colors.textSecondary}>  ↑↓  Navigate lists</Text>
						<Text color={colors.textSecondary}>  ←→  Switch panels</Text>
						<Text color={colors.textSecondary}>  Tab  Cycle panels</Text>
						<Text color={colors.textSecondary}>  Esc  Cancel/Back</Text>
					</Box>
					<Box flexDirection="column" width={26}>
						<Text bold color={colors.textPrimary}>  Server Actions</Text>
						<Text color={colors.textSecondary}>  [+{buttonIcons.add} Add | a]</Text>
						<Text color={colors.textSecondary}>  [🔗 Connect | c]</Text>
						<Text color={colors.textSecondary}>  [🔌 Disc | d]</Text>
						<Text color={colors.textSecondary}>  [🗑️ Rem | x]</Text>
						<Text color={colors.textSecondary}>  [🔄 Ref | r]</Text>
					</Box>
				</Box>
				
				<Box paddingX={1} marginTop={1}>
					<Box flexDirection="column" width={26} marginRight={2}>
						<Text bold color={colors.textPrimary}>  Execution</Text>
						<Text color={colors.textSecondary}>  ↵   Execute</Text>
						<Text color={colors.textSecondary}>  [Filter | f]</Text>
						<Text color={colors.textSecondary}>  [📋 Cpy | y]</Text>
					</Box>
					<Box flexDirection="column" width={26}>
						<Text bold color={colors.textPrimary}>  General</Text>
						<Text color={colors.textSecondary}>  ?    Help</Text>
						<Text color={colors.textSecondary}>  q    Quit</Text>
					</Box>
				</Box>
				
				<Box paddingX={1}><Divider width={60} /></Box>
				<Box paddingX={1}>
					<Text color={colors.textMuted}>  MCP Bridge v{CLI_VERSION}  •  Node.js + Ink + React</Text>
				</Box>
			</Box>
		</Box>
	);
}

function AuthErrorModal({ serverName, missingVars, onClose }: { serverName: string; missingVars: string[]; onClose: () => void }) {
	useInput((input: string, key: any) => {
		if (input === 'q' || key.escape || key.return) onClose();
	});
	const serviceName = Object.keys(tokenLinks).find(k => serverName.toLowerCase().includes(k));
	const tokenInfo = serviceName ? tokenLinks[serviceName] : null;
	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box flexDirection="column" borderStyle="round" borderColor={colors.accentRed}>
				<Box justifyContent="space-between" paddingX={1}>
					<Text bold color={colors.accentRed}>  🔐 Auth Required </Text>
					<Text color={colors.textMuted}>[ESC]</Text>
				</Box>
				<Text color={colors.textSecondary}>Server: {serverName}</Text>
				<Text color={colors.accentAmber}>Missing: {missingVars.join(', ')}</Text>
				{tokenInfo && <Text color={colors.accentBlue}>{tokenInfo.url}</Text>}
				<Text color={colors.textMuted}>[Enter/Esc] close</Text>
			</Box>
		</Box>
	);
}

function AddServerModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, endpoint: string, description: string) => void }) {
	const [name, setName] = useState('');
	const [endpoint, setEndpoint] = useState('');
	const [description, setDescription] = useState('');
	const [field, setField] = useState<'name' | 'endpoint' | 'description'>('name');
	const [error, setError] = useState('');

	useInput((input: string, key: any) => {
		if (key.escape) { onClose(); return; }
		
		if (key.return) {
			if (!name.trim()) { setError('Name required'); return; }
			if (!/^[a-zA-Z0-9-]+$/.test(name)) { setError('Name: alphanumeric + dashes'); return; }
			if (name.length > 30) { setError('Name: max 30 chars'); return; }
			if (!endpoint.trim()) { setError('Endpoint required'); return; }
			try { new URL(endpoint); } catch { setError('Invalid URL'); return; }
			onAdd(name.trim(), endpoint.trim(), description.trim());
			onClose();
			return;
		}

		if (key.tab) {
			if (field === 'name') setField('endpoint');
			else if (field === 'endpoint') setField('description');
			else setField('name');
			return;
		}

		// FIXED: Handle backspace properly
		if (key.backspace || key.delete) {
			if (field === 'name') setName(prev => prev.slice(0, -1));
			else if (field === 'endpoint') setEndpoint(prev => prev.slice(0, -1));
			else setDescription(prev => prev.slice(0, -1));
			setError('');
			return;
		}

		if (input && input.length === 1 && !key.ctrl && !key.meta) {
			if (field === 'name') setName(prev => prev + input);
			else if (field === 'endpoint') setEndpoint(prev => prev + input);
			else setDescription(prev => prev + input);
			setError('');
		}
	});

	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box flexDirection="column" borderStyle="round" borderColor={colors.accentBlue}>
				<Box justifyContent="space-between" paddingX={1}>
					<Text bold color={colors.accentBlue}>  {buttonIcons.add} Add Server </Text>
					<Text color={colors.textMuted}>[ESC]</Text>
				</Box>
				<Box paddingX={1}><Divider width={50} /></Box>
				
				<Box paddingX={1} flexDirection="column">
					<Text color={colors.textSecondary}>Name:     {name || '________________'}</Text>
					<Text color={colors.textMuted}>(alphanumeric + dashes)</Text>
				</Box>
				
				<Box paddingX={1} flexDirection="column" marginTop={1}>
					<Text color={colors.textSecondary}>Endpoint: {endpoint || 'http://localhost:3000'}</Text>
					<Text color={colors.textMuted}>(URL format)</Text>
				</Box>
				
				<Box paddingX={1} flexDirection="column" marginTop={1}>
					<Text color={colors.textSecondary}>Desc:     {description || 'optional'}</Text>
				</Box>

				{error && <Box paddingX={1}><Text color={colors.accentRed}>  ⚠ {error}</Text></Box>}
				
				<Box paddingX={1}><Divider width={50} /></Box>
				<Box paddingX={1}><Text color={colors.textMuted}>[Tab] field  [Enter] add  [Esc] cancel</Text></Box>
			</Box>
		</Box>
	);
}

function ConfirmRemoveModal({ serverName, onConfirm, onCancel }: { serverName: string; onConfirm: () => void; onCancel: () => void }) {
	const [confirm, setConfirm] = useState(false);

	useInput((input: string, key: any) => {
		if (key.escape || input === 'q') { onCancel(); return; }
		if (key.return) { confirm ? onConfirm() : onCancel(); return; }
		if (input === ' ') { setConfirm(prev => !prev); }
	});

	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box flexDirection="column" borderStyle="round" borderColor={colors.accentAmber}>
				<Box justifyContent="space-between" paddingX={1}>
					<Text bold color={colors.accentAmber}>  {buttonIcons.remove} Confirm Remove </Text>
					<Text color={colors.textMuted}>[ESC]</Text>
				</Box>
				<Box paddingX={1}><Divider width={45} /></Box>
				
				<Box paddingX={1} flexDirection="column" marginY={1}>
					<Text color={colors.textPrimary}>Remove "{serverName}"?</Text>
					<Text color={colors.textMuted}>Will disconnect and clear tools.</Text>
				</Box>

				<Box paddingX={1}>
					<Text color={confirm ? colors.accentGreen : colors.textMuted}>
						[{confirm ? '✓' : ' '}] I understand
					</Text>
				</Box>
				
				<Box paddingX={1}><Divider width={45} /></Box>
				<Box paddingX={1}><Text color={colors.textMuted}>[Space] toggle  [Enter] confirm</Text></Box>
			</Box>
		</Box>
	);
}

// ==================== MAIN APP ====================

function App() {
	const [servers, setServers] = useState<ServerWithStatus[]>([]);
	const [selectedServerIndex, setSelectedServerIndex] = useState(0);
	const [tools, setTools] = useState<MCPTool[]>([]);
	const [selectedToolIndex, setSelectedToolIndex] = useState(0);
	const [toolFilter, setToolFilter] = useState('');
	const [filterFocused, setFilterFocused] = useState(false);
	const [toolArgs, setToolArgs] = useState('{}');
	const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
	const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
	const [isExecuting, setIsExecuting] = useState(false);
	const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>('servers');
	const [modal, setModal] = useState<ModalType>('none');	const [terminalSize, setTerminalSize] = useState({ width: process.stdout.columns || 80, height: process.stdout.rows || 24 });

	useEffect(() => {
		const updateSize = () => setTerminalSize({ width: process.stdout.columns || 80, height: process.stdout.rows || 24 });
		updateSize();
		process.stdout.on('resize', updateSize);
		return () => { process.stdout.off('resize', updateSize); };
	}, []);

	const [removeServerName, setRemoveServerName] = useState('');	const [authErrorData, setAuthErrorData] = useState<{ serverName: string; missingVars: string[] } | null>(null);


	const loadServers = useCallback(() => {
		const mcpConfig = readMCPConfig();
		const serverList = mcpConfig.servers || {};
		let serverArray = Object.entries(serverList).map(([name, config]) => ({
			name,
			...config,
			status: 'disconnected' as const,
			tools: [],
		}));
		
		// If no servers configured, show popular servers as recommendations
		if (serverArray.length === 0) {
			serverArray = popularServers.map(server => ({
				name: server.name,
				endpoint: server.endpoint,
				description: server.description,
				recommended: server.recommended,
				status: 'disconnected' as const,
				tools: [],
				installedAt: new Date().toISOString(),
				enabled: true,
				config: {},
				env: {},
			}));
		}
		
		setServers(serverArray);
		setSelectedServerIndex(prev => clampIndex(prev, Math.max(0, serverArray.length - 1)));
	}, []);

	useEffect(() => { loadServers(); }, [loadServers]);

	// FIXED: Clear results and filter when changing servers
	useEffect(() => {
		setLastResult(null);
		setToolFilter('');
		setFilterFocused(false);
		setToolArgs('{}');
		setSelectedToolIndex(0);
	}, [selectedServerIndex]);

	useEffect(() => {
		const server = servers[selectedServerIndex];
		if (server && server.status === 'connected') {
			setTools(server.tools);
			setSelectedToolIndex(0);
		} else {
			setTools([]);
			setSelectedToolIndex(0);
		}
	}, [selectedServerIndex, servers]);

	useEffect(() => {
		setSelectedToolIndex(0);
	}, [toolFilter]);

	const filteredTools = tools.filter(tool => 
		tool.name.toLowerCase().includes(toolFilter.toLowerCase()) ||
		tool.description?.toLowerCase().includes(toolFilter.toLowerCase())
	);

	const serverRequiresAuth = useCallback((server: ServerWithStatus): boolean => {
		const name = server.name.toLowerCase();
		return name.includes('github') || name.includes('gitlab') || name.includes('jira');
	}, []);

	const getRequiredAuthVars = useCallback((server: ServerWithStatus): string[] => {
		const name = server.name.toLowerCase();
		if (name.includes('github')) return ['GITHUB_TOKEN'];
		if (name.includes('gitlab')) return ['GITLAB_TOKEN'];
		if (name.includes('jira')) return ['JIRA_API_TOKEN', 'JIRA_EMAIL'];
		return [];
	}, []);

	const hasAuth = useCallback((server: ServerWithStatus): boolean => {
		const requiredVars = getRequiredAuthVars(server);
		if (requiredVars.length === 0) return true;
		return requiredVars.some(v => process.env[v]);
	}, [getRequiredAuthVars]);

	const handleConnect = useCallback(async (index: number) => {
		const server = servers[index];
		if (!server) return;

		if (serverRequiresAuth(server) && !hasAuth(server)) {
			const requiredVars = getRequiredAuthVars(server);
			setAuthErrorData({ serverName: server.name, missingVars: requiredVars });
			setModal('auth-error');
			return;
		}

		setServers(prev => prev.map((s, i) => 
			i === index ? { ...s, status: 'connecting', error: undefined } : s
		));

		try {
			await createSession(server.name, server.config as Record<string, unknown>);
			const serverTools = await listTools(server.name);
			
			setServers(prev => prev.map((s, i) => 
				i === index ? { ...s, status: 'connected', tools: serverTools } : s
			));
			setSelectedToolIndex(0);
		} catch (error) {
			setServers(prev => prev.map((s, i) => 
				i === index ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Connection failed' } : s
			));
		}
	}, [servers, serverRequiresAuth, hasAuth, getRequiredAuthVars]);

	const handleDisconnect = useCallback(async (index: number) => {
		const server = servers[index];
		if (!server) return;
		await closeServerSession(server.name);
		setServers(prev => prev.map((s, i) => 
			i === index ? { ...s, status: 'disconnected', tools: [] } : s
		));
		setLastResult(null);
		setSelectedToolIndex(0);
	}, [servers]);

	const handleAddServer = useCallback((name: string, endpoint: string, description: string) => {
		addMCPServer(name, { config: { endpoint }, description } as Partial<MCPServer>);
		loadServers();
	}, [loadServers]);

	const handleRemoveServer = useCallback(async () => {
		const server = servers.find((_, i) => i === selectedServerIndex);
		if (!server) return;
		if (server.status === 'connected') await closeServerSession(server.name);
		removeMCPServer(server.name);
		setServers(prevServers => {
			const newServers = prevServers.filter((_, i) => i !== selectedServerIndex);
			setSelectedServerIndex(prev => clampIndex(prev, Math.max(0, newServers.length - 1)));
			return newServers;
		});
		setLastResult(null);
		setSelectedToolIndex(0);
		setModal('none');
	}, [servers, selectedServerIndex]);

	const handleRefreshTools = useCallback(async () => {
		const server = servers[selectedServerIndex];
		if (!server || server.status !== 'connected') return;

		setServers(prev => prev.map((s, i) => 
			i === selectedServerIndex ? { ...s, status: 'connecting' } : s
		));

		try {
			await closeServerSession(server.name);
			await createSession(server.name, server.config as Record<string, unknown>);
			const serverTools = await listTools(server.name);
			setServers(prev => prev.map((s, i) => 
				i === selectedServerIndex ? { ...s, status: 'connected', tools: serverTools } : s
			));
			setSelectedToolIndex(0);
		} catch (error) {
			setServers(prev => prev.map((s, i) => 
				i === selectedServerIndex ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Refresh failed' } : s
			));
		}
	}, [servers, selectedServerIndex]);

	const handleExecute = useCallback(async () => {
		const server = servers[selectedServerIndex];
		if (!server || server.status !== 'connected' || filteredTools.length === 0) return;

		const tool = filteredTools[selectedToolIndex];
		if (!tool) return;

		setIsExecuting(true);
		let result: ExecutionResult = { success: false, timestamp: Date.now() };

		try {
			let args = {};
			try { args = JSON.parse(toolArgs); } catch {
				result = { success: false, error: 'Invalid JSON in arguments', timestamp: Date.now() };
				setLastResult(result);
				setIsExecuting(false);
				return;
			}

			const toolResult = await callMCPTool(tool.name, args, server.name);
			result = { success: true, result: toolResult, timestamp: Date.now() };
			setLastResult(result);
			setExecutionHistory(prev => [result, ...prev].slice(0, 10));
		} catch (error) {
			result = { success: false, error: error instanceof Error ? error.message : 'Execution failed', timestamp: Date.now() };
			setLastResult(result);
		} finally {
			setIsExecuting(false);
		}
	}, [servers, selectedServerIndex, filteredTools, selectedToolIndex, toolArgs]);

	const handleCopy = useCallback(() => {
		if (!lastResult?.result) return;
		const { execFileSync } = require('child_process');
		try {
			const text = typeof lastResult.result === 'string' ? lastResult.result : JSON.stringify(lastResult.result, null, 2);
			execFileSync('pbcopy', { input: text });
		} catch { /* silent */ }
	}, [lastResult]);

	useInput((input: string, key: any) => {
		if (modal !== 'none') return;

		if (input === 'q') process.exit(0);
		if (input === '?') { setModal('help'); return; }
		if (input === 'f' && focusedPanel === 'tools') { setFilterFocused(true); return; }
		if (key.escape && filterFocused) { setFilterFocused(false); setToolFilter(''); return; }

		if (key.upArrow) {
			if (focusedPanel === 'servers') setSelectedServerIndex(prev => Math.max(0, prev - 1));
			else if (focusedPanel === 'tools' && !filterFocused) setSelectedToolIndex(prev => Math.max(0, prev - 1));
			else if (focusedPanel === 'execute') setSelectedToolIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			if (focusedPanel === 'servers') setSelectedServerIndex(prev => Math.min(servers.length - 1, prev + 1));
			else if (focusedPanel === 'tools' && !filterFocused) setSelectedToolIndex(prev => Math.min(filteredTools.length - 1, prev + 1));
			else if (focusedPanel === 'execute') setSelectedToolIndex(prev => Math.min(executionHistory.length - 1, prev + 1));
		}

		if (key.leftArrow) {
			if (focusedPanel === 'tools') { setFocusedPanel('servers'); setFilterFocused(false); }
			else if (focusedPanel === 'execute') setFocusedPanel('tools');
		} else if (key.rightArrow) {
			if (focusedPanel === 'servers') setFocusedPanel('tools');
			else if (focusedPanel === 'tools') setFocusedPanel('execute');
		}

		if (key.tab) {
			if (focusedPanel === 'servers') setFocusedPanel('tools');
			else if (focusedPanel === 'tools') setFocusedPanel('execute');
			else setFocusedPanel('servers');
			setFilterFocused(false);
			return;
		}

		if (key.return) {
			if (focusedPanel === 'servers') {
				const server = servers[selectedServerIndex];
				if (server.status === 'disconnected' || server.status === 'error') handleConnect(selectedServerIndex);
				else if (server.status === 'connected') setFocusedPanel('tools');
			} else if (focusedPanel === 'tools') {
				if (filteredTools.length > 0) setFocusedPanel('execute');
			} else if (focusedPanel === 'execute') {
				handleExecute();
			}
			return;
		}

		// Action shortcuts
		if (input === 'a') { setModal('add-server'); return; }
		if (input === 'c' && focusedPanel === 'servers') {
			const server = servers[selectedServerIndex];
			if (server && (server.status === 'disconnected' || server.status === 'error')) handleConnect(selectedServerIndex);
			return;
		}
		if (input === 'd' && focusedPanel === 'servers') {
			const server = servers[selectedServerIndex];
			if (server && server.status === 'connected') handleDisconnect(selectedServerIndex);
			return;
		}
		if (input === 'x' && focusedPanel === 'servers') {
			const server = servers[selectedServerIndex];
			if (server) { setRemoveServerName(server.name); setModal('confirm-remove'); }
			return;
		}
		if (input === 'r') { handleRefreshTools(); return; }
		if (input === 'y' && lastResult?.result) { handleCopy(); return; }

		// FIXED: Filter input - proper backspace handling
		if (filterFocused) {
			if (key.backspace || key.delete) {
				setToolFilter(prev => prev.slice(0, -1));
				setSelectedToolIndex(0);
				return;
			}
			if (input && input.length === 1 && !key.ctrl && !key.meta) {
				setToolFilter(prev => prev + input);
				setSelectedToolIndex(0);
			}
		}
	});

	const selectedServer = servers[selectedServerIndex];
	const connectedCount = servers.filter(s => s.status === 'connected').length;
	const selectedTool = filteredTools[selectedToolIndex];

	if (modal === 'help') return <HelpModal onClose={() => setModal('none')} />;
	if (modal === 'add-server') return <AddServerModal onClose={() => setModal('none')} onAdd={handleAddServer} />;
	if (modal === 'auth-error' && authErrorData) return <AuthErrorModal serverName={authErrorData.serverName} missingVars={authErrorData.missingVars} onClose={() => setModal('none')} />;
	if (modal === 'confirm-remove') return <ConfirmRemoveModal serverName={removeServerName} onConfirm={handleRemoveServer} onCancel={() => setModal('none')} />;

	// FIXED: Wider sidebar (18% instead of 12%)
	const totalWidth = process.stdout.columns || 80;
	const sidebarWidth = terminalSize.width < 60 ? Math.max(10, Math.floor(terminalSize.width * 0.2)) :
						  Math.max(15, Math.floor(terminalSize.width * 0.18));
	const mainWidth = totalWidth - sidebarWidth;

	const mutedColor = colors.textMuted;
	const selectionColor = colors.accentBlue;

	return (
		<Box flexDirection="column" minHeight={0}>
			{/* Status Bar - Better icon */}
			<Box borderStyle="bold" borderColor={colors.border} paddingX={1}>
				<Text bold color={colors.accentBlue}>🔗 MCP Bridge</Text>
				<Text color={colors.textMuted}> v{CLI_VERSION}</Text>
				<Box flexGrow={1} justifyContent="flex-end">
					<Text color={connectedCount > 0 ? colors.accentGreen : colors.textMuted}>
						◉ {connectedCount}/{servers.length} connected
					</Text>
				</Box>
			</Box>

			{/* Main Content */}
			<Box flexGrow={1} minHeight={0}>
				{/* Server Sidebar - Wider and fixed colors */}
				<Box width={sidebarWidth} flexDirection="column" borderStyle="bold" borderColor={focusedPanel === 'servers' ? colors.accentBlue : colors.border} paddingX={1}>
					<Box justifyContent="space-between" marginBottom={1}>
						<Text bold color={colors.textPrimary}>Servers</Text>
						<Text color={colors.accentBlue}>[+{buttonIcons.add} Add | a]</Text>
					</Box>
					
					{servers.length === 0 ? (
						<Text color={mutedColor}>No servers</Text>
					) : (
						servers.map((server, index) => (
							<Box key={server.name} flexDirection="column">
								<Box>
									<Text color={index === selectedServerIndex && focusedPanel === 'servers' ? selectionColor : mutedColor}>
										{index === selectedServerIndex && focusedPanel === 'servers' ? '▸' : ' '}
									</Text>
									<Text color={
										server.status === 'connected' ? colors.accentGreen :
										server.status === 'connecting' ? colors.accentAmber :
										server.status === 'error' ? colors.accentRed : mutedColor
									}>{statusIcons[server.status]}</Text>
									<Text bold color={index === selectedServerIndex && focusedPanel === 'servers' ? colors.textPrimary : colors.textSecondary}>
										{' '}{server.name}{server.recommended ? ' ⭐' : ''}
									</Text>
								</Box>
								{server.status === 'error' && server.error && (
									<Text color={colors.accentRed}>{'  ⚠ '}{server.error.substring(0, 15)}</Text>
								)}
								{server.status === 'connected' && server.tools.length > 0 && (
									<Text color={mutedColor}>{'  '}{server.tools.length} tools</Text>
								)}
							</Box>
						))
					)}
				</Box>

				{/* Right Side */}
				<Box flexDirection="column" width={mainWidth} minHeight={0}>
					{/* Tools Panel - Full shortcuts */}
					<Box flexDirection="column" borderStyle="bold" borderColor={focusedPanel === 'tools' ? colors.accentBlue : colors.border} paddingX={1} height={10}>
						<Box justifyContent="space-between" marginBottom={1}>
							<Text bold color={colors.textPrimary}>Tools: {selectedServer?.name || '—'}</Text>
							{selectedServer?.status === 'connected' && (
								<Text color={colors.accentBlue}>[🔄 Ref | r] [Filter | f]</Text>
							)}
						</Box>
						
						{selectedServer?.status === 'connected' && (
							<Box marginBottom={1}>
								<Text color={mutedColor}>🔍 </Text>
								<Text color={filterFocused ? colors.accentBlue : colors.textSecondary}>{toolFilter || 'filter...'}</Text>
								{toolFilter && <Text color={mutedColor}> ({filteredTools.length})</Text>}
							</Box>
						)}

						<Box flexDirection="column" overflow="hidden">
							{!selectedServer || selectedServer.status !== 'connected' ? (
								<Text color={mutedColor}>Connect to a server to see tools</Text>
							) : filteredTools.length === 0 ? (
								<Text color={mutedColor}>{toolFilter ? 'No matching tools' : 'No tools available'}</Text>
							) : (
								filteredTools.slice(0, 6).map((tool, index) => (
									<Box key={tool.name}>
										<Text color={index === selectedToolIndex && focusedPanel === 'tools' ? selectionColor : colors.textSecondary}>
											{index === selectedToolIndex && focusedPanel === 'tools' ? '▸' : ' '}
										</Text>
										<Text color={colors.accentPurple}>{getToolIcon(tool.name)}</Text>
										<Text bold color={colors.accentPurple}> {tool.name}</Text>
									</Box>
								))
							)}
						</Box>
					</Box>

					{/* Execution Panel */}
					<Box flexDirection="column" borderStyle="bold" borderColor={focusedPanel === 'execute' ? colors.accentBlue : colors.border} paddingX={1} flexGrow={1} minHeight={0}>
						<Box justifyContent="space-between" marginBottom={1}>
							<Text bold color={colors.textPrimary}>Execute</Text>
							{lastResult && <Text color={colors.accentBlue}>[📋 Cpy | y]</Text>}
						</Box>
						
						<Box>
							<Text color={colors.textSecondary}>Tool: </Text>
							<Text bold color={colors.accentPurple}>{selectedTool?.name || '—'}</Text>
						</Box>

						<Box>
							<Text color={colors.textSecondary}>Args: </Text>
							<Text color={colors.accentAmber}>{toolArgs}</Text>
						</Box>

						{/* Results */}
						<Box flexDirection="column" flexGrow={1} marginTop={1} overflow="hidden">
							{isExecuting ? (
								<Text color={colors.accentAmber}>◐ Executing...</Text>
							) : lastResult ? (
								<Box flexDirection="column" overflow="hidden">
									<Text color={lastResult.success ? colors.accentGreen : colors.accentRed}>
										{lastResult.success ? '✓ Success' : '✕ Error'}
									</Text>
									<Text color={colors.textPrimary}>{typeof lastResult.result === 'string' ? lastResult.result : JSON.stringify(lastResult.result, null, 2)}</Text>
									{lastResult.error && <Text color={colors.accentRed}>{lastResult.error}</Text>}
								</Box>
							) : (
								<Text color={mutedColor}>(Select tool + Enter to execute)</Text>
							)}
						</Box>
					</Box>
				</Box>
			</Box>

			{/* Footer - Full shortcuts with icons */}
			<Box borderStyle="bold" borderColor={colors.border} paddingX={1}>
				<Text color={colors.textMuted}>
				{terminalSize.width < 60 ? '↑↓|←→|↵|a|c|d|x|r|f|y|?' :
				 '↑↓nav|←→panels|↵exec|[+Add|a] [Conn|c] [Disc|d] [Rem|x] [Ref|r] [Filt|f] [Cpy|y] [?|q]'}
			</Text>
			</Box>
		</Box>
	);
}

// Run app
if (!isTTY) {
	render(<Box flexDirection="column" padding={1}>
		<Text bold color="#58a6ff">🔗 MCP Bridge - Non-Interactive Mode</Text>
		<Text color="#7d8590">Run with a terminal for interactive UI</Text>
	</Box>);
} else {
	render(<App />);
}
