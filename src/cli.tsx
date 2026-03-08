/**
 * MCP Bridge CLI - Interactive TUI Application
 * 
 * Based on Reva's design spec at ~/.openclaw/workspace/mcp-bridge-cli-spec.md
 */

import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import chalk from 'chalk';
import enquirer from 'enquirer';
import { readMCPConfig, writeMCPConfig, listMCPServers, addMCPServer, removeMCPServer, getMCPServer } from './lib/config.js';
import { createSession, listTools, callMCPTool, closeSession } from './lib/protocol.js';
import type { MCPServer, MCPTool } from './types/mcp.js';

// Extend MCPServer type for runtime use
interface ServerWithStatus extends MCPServer {
	name: string;
	endpoint?: string;
	status: 'disconnected' | 'connecting' | 'connected' | 'error';
	error?: string;
	tools?: MCPTool[];
}

// Color palette from spec
const colors = {
	bg: '#0d1117',
	surface: '#161b22',
	border: '#30363d',
	textPrimary: '#f0f6fc',
	textSecondary: '#8b949e',
	textMuted: '#484f58',
	accent: '#58a6ff',
	success: '#3fb950',
	warning: '#d29922',
	error: '#f85149',
	purple: '#a371f7',
};

// Tool icons
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
	default: '⚙️',
};

function getToolIcon(toolName: string): string {
	return toolIcons[toolName] || toolIcons.default;
}

// Custom confirm prompt
async function confirm(message: string): Promise<boolean> {
	const { confirmed } = await enquirer.prompt({
		type: 'confirm',
		name: 'confirmed',
		message,
		initial: false,
	});
	return confirmed;
}

// Custom input prompt
async function input(message: string, initial?: string): Promise<string> {
	const { value } = await enquirer.prompt({
		type: 'input',
		name: 'value',
		message,
		initial,
	});
	return value;
}

// Help Panel Component
function HelpPanel({ onClose }: { onClose: () => void }) {
	useInput((input) => {
		if (input === 'q' || input === '\u001b') { // q or escape
			onClose();
		}
	});

	return (
		<Box flexDirection="column" borderStyle="round" borderColor={colors.accent} padding={1}>
			<Box>
				<Text bold color={colors.accent}>  🪢 MCP Bridge — Help </Text>
			</Box>
			<Text key="divider" color={colors.textMuted}>{"─".repeat(60)}</Text>
			
			<Box flexDirection="column" marginY={1}>
				<Text bold color={colors.textPrimary}>  Navigation</Text>
				<Text color={colors.textSecondary}>  ↑/↓       Navigate between items</Text>
				<Text color={colors.textSecondary}>  Enter     Select / Connect / Execute</Text>
				<Text color={colors.textSecondary}>  Tab       Move between panels</Text>
				<Text color={colors.textSecondary}>  Esc       Cancel / Go back</Text>
			</Box>
			
			<Box flexDirection="column" marginY={1}>
				<Text bold color={colors.textPrimary}>  Actions</Text>
				<Text color={colors.textSecondary}>  a         Add a new MCP server</Text>
				<Text color={colors.textSecondary}>  r         Refresh tools for selected server</Text>
				<Text color={colors.textSecondary}>  c         Copy last execution result</Text>
				<Text color={colors.textSecondary}>  ?         Toggle this help panel</Text>
				<Text color={colors.textSecondary}>  q         Quit MCP Bridge</Text>
			</Box>
			
			<Text key="divider" color={colors.textMuted}>{"─".repeat(60)}</Text>
			
			<Text color={colors.textMuted}>  MCP Bridge v0.1.0  •  TypeScript + Node.js + Ink</Text>
		</Box>
	);
}

// Main App Component
function App() {
	const [servers, setServers] = useState<ServerWithStatus[]>([]);
	const [selectedServerIndex, setSelectedServerIndex] = useState(0);
	const [selectedToolIndex, setSelectedToolIndex] = useState(0);
	const [showHelp, setShowHelp] = useState(false);
	const [view, setView] = useState<'servers' | 'tools' | 'execute'>('servers');
	const [lastResult, setLastResult] = useState<string | null>(null);
	const [executionError, setExecutionError] = useState<string | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const [toolArgs, setToolArgs] = useState('{}');
	const [focusedPanel, setFocusedPanel] = useState<0 | 1 | 2>(0); // 0=servers, 1=tools, 2=execute

	const loadServers = useCallback(() => {
		const mcpConfig = readMCPConfig();
		const serverList = mcpConfig.servers || {};
		const serverArray = Object.entries(serverList).map(([name, config]) => ({
			name,
			...config,
			status: 'disconnected' as const,
			tools: [],
		}));
		setServers(serverArray);
	}, []);

	// Load servers on mount
	useEffect(() => {
		loadServers();
	}, [loadServers]);

	// Add server
	const handleAddServer = useCallback(async () => {
		try {
			const name = await input('Server name:');
			if (!name || !/^[a-zA-Z0-9-]+$/.test(name)) {
				console.log(chalk.red('Invalid server name. Use alphanumeric and dashes only.'));
				return;
			}
			if (name.length > 30) {
				console.log(chalk.red('Server name must be 30 characters or less.'));
				return;
			}
			
			const endpoint = await input('Endpoint URL (e.g., http://localhost:3000):');
			try {
				new URL(endpoint);
			} catch {
				console.log(chalk.red('Invalid endpoint URL.'));
				return;
			}

			const description = await input('Description (optional):');
			
			// Add server to config
			addMCPServer(name, {
				config: { endpoint },
			} as Partial<MCPServer>);
			
			loadServers();
			console.log(chalk.green(`✓ Server "${name}" added successfully`));
		} catch (e) {
			// User cancelled
		}
	}, [loadServers]);

	// Connect to server
	const handleConnect = useCallback(async (index: number) => {
		const server = servers[index];
		if (!server) return;

		// Update status to connecting
		setServers(prev => prev.map((s, i) => 
			i === index ? { ...s, status: 'connecting', error: undefined } : s
		));

		try {
			// Use the endpoint from config or package name
			const endpoint = server.config?.endpoint as string || server.name;
			
			// For now, we use the package name approach from the POC
			await createSession(server.name, server.config as Record<string, unknown>);
			
			const tools = await listTools();
			
			setServers(prev => prev.map((s, i) => 
				i === index ? { ...s, status: 'connected', tools } : s
			));
		} catch (error) {
			setServers(prev => prev.map((s, i) => 
				i === index ? { 
					...s, 
					status: 'error', 
					error: error instanceof Error ? error.message : 'Connection failed' 
				} : s
			));
		}
	}, [servers]);

	// Disconnect from server
	const handleDisconnect = useCallback(async (index: number) => {
		closeSession();
		setServers(prev => prev.map((s, i) => 
			i === index ? { ...s, status: 'disconnected', tools: [] } : s
		));
		setLastResult(null);
		setExecutionError(null);
	}, []);

	// Remove server
	const handleRemove = useCallback(async (index: number) => {
		const server = servers[index];
		if (!server) return;

		const confirmed = await confirm(`Remove "${server.name}"? This will disconnect and delete all cached tools.`);
		if (!confirmed) return;

		// Disconnect if connected
		if (server.status === 'connected') {
			closeSession();
		}

		removeMCPServer(server.name);
		loadServers();
		setLastResult(null);
		setExecutionError(null);
	}, [servers, loadServers]);

	// Refresh tools
	const handleRefreshTools = useCallback(async () => {
		const connectedServer = servers.find(s => s.status === 'connected');
		if (!connectedServer) return;

		setServers(prev => prev.map((s, i) => 
			i === selectedServerIndex ? { ...s, status: 'connecting' } : s
		));

		try {
			closeSession();
			await createSession(connectedServer.name, connectedServer.config as Record<string, unknown>);
			const tools = await listTools();
			
			setServers(prev => prev.map((s, i) => 
				i === selectedServerIndex ? { ...s, status: 'connected', tools } : s
			));
		} catch (error) {
			setServers(prev => prev.map((s, i) => 
				i === selectedServerIndex ? { 
					...s, 
					status: 'error', 
					error: error instanceof Error ? error.message : 'Refresh failed' 
				} : s
			));
		}
	}, [servers, selectedServerIndex]);

	// Execute tool
	const handleExecute = useCallback(async () => {
		const connectedServer = servers.find(s => s.status === 'connected');
		if (!connectedServer || !connectedServer.tools) return;

		const selectedTool = connectedServer.tools[selectedToolIndex];
		if (!selectedTool) return;

		setIsExecuting(true);
		setExecutionError(null);
		setLastResult(null);

		try {
			let args = {};
			try {
				args = JSON.parse(toolArgs);
			} catch {
				setExecutionError('Invalid JSON in arguments');
				setIsExecuting(false);
				return;
			}

			const result = await callMCPTool(selectedTool.name, args);
			setLastResult(JSON.stringify(result, null, 2));
		} catch (error) {
			setExecutionError(error instanceof Error ? error.message : 'Execution failed');
		} finally {
			setIsExecuting(false);
		}
	}, [servers, selectedToolIndex, toolArgs]);

	// Copy result to clipboard (using pbcopy)
	const handleCopy = useCallback(() => {
		if (!lastResult) return;
		const { execSync } = require('child_process');
		try {
			execSync(`echo "${lastResult.replace(/"/g, '\\"')}" | pbcopy`);
			console.log(chalk.green('✓ Result copied to clipboard'));
		} catch {
			console.log(chalk.red('Failed to copy to clipboard'));
		}
	}, [lastResult]);

	// Keyboard input handler
	useInput((input, key) => {
		if (showHelp) {
			if (input === '?' || input === 'q' || key.escape) {
				setShowHelp(false);
			}
			return;
		}

		// Global quit
		if (input === 'q' || (key.ctrl && input === 'c')) {
			process.exit(0);
		}

		// Toggle help
		if (input === '?') {
			setShowHelp(true);
			return;
		}

		// Panel navigation with Tab
		if (key.tab) {
			setFocusedPanel(prev => (prev + 1) % 3 as 0 | 1 | 2);
			return;
		}

		// Arrow key navigation based on focused panel
		if (key.upArrow) {
			if (focusedPanel === 0) {
				setSelectedServerIndex(prev => Math.max(0, prev - 1));
			} else if (focusedPanel === 1) {
				const connectedServer = servers.find(s => s.status === 'connected');
				const toolCount = connectedServer?.tools?.length || 0;
				setSelectedToolIndex(prev => Math.max(0, prev - 1));
			}
		} else if (key.downArrow) {
			if (focusedPanel === 0) {
				setSelectedServerIndex(prev => Math.min(servers.length - 1, prev + 1));
			} else if (focusedPanel === 1) {
				const connectedServer = servers.find(s => s.status === 'connected');
				const toolCount = connectedServer?.tools?.length || 0;
				setSelectedToolIndex(prev => Math.min(toolCount - 1, prev + 1));
			}
		}

		// Enter to select/connect/execute
		if (key.return) {
			if (focusedPanel === 0) {
				// Connect/disconnect on enter
				const server = servers[selectedServerIndex];
				if (server.status === 'disconnected' || server.status === 'error') {
					handleConnect(selectedServerIndex);
				} else if (server.status === 'connected') {
					handleDisconnect(selectedServerIndex);
				}
			} else if (focusedPanel === 1) {
				// Select tool and focus execution
				setFocusedPanel(2);
			} else if (focusedPanel === 2) {
				// Execute
				handleExecute();
			}
		}

		// Action shortcuts
		if (input === 'a') {
			handleAddServer();
			loadServers();
		}
		if (input === 'r') {
			handleRefreshTools();
		}
		if (input === 'c' && lastResult) {
			handleCopy();
		}
	});

	// Get connected server
	const connectedServer = servers.find(s => s.status === 'connected');
	const selectedServer = servers[selectedServerIndex];
	const selectedTool = connectedServer?.tools?.[selectedToolIndex];

	// Render help panel
	if (showHelp) {
		return <HelpPanel onClose={() => setShowHelp(false)} />;
	}

	// Render main app
	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box borderStyle="bold" borderColor={colors.border} paddingX={1}>
				<Text bold color={colors.accent}> 🪢 MCP Bridge </Text>
				<Text color={colors.textMuted}> v0.1.0 </Text>
				<Text color={colors.textMuted}> [?]help </Text>
			</Box>

			{/* Servers Panel */}
			<Box flexDirection="column" borderStyle="bold" borderColor={focusedPanel === 0 ? colors.accent : colors.border} paddingX={1}>
				<Box justifyContent="space-between">
					<Text bold color={colors.textPrimary}> Servers </Text>
					<Text color={colors.accent}>[+ Add] </Text>
				</Box>
				<Text key="divider" color={colors.textMuted}>{"─".repeat(60)}</Text>
				
				{servers.length === 0 ? (
					<Text key="no-servers" color={colors.textMuted}>No servers configured. Press 'a' to add your first server.</Text>
				) : (
					servers.map((server, index) => (
						<Box key={`server-${server.name}-${index}`} flexDirection="column">
							<Box>
								<Text color={server.status === 'connected' ? colors.success : 
									server.status === 'connecting' ? colors.warning : 
									server.status === 'error' ? colors.error : colors.textMuted}>
									{index === selectedServerIndex && focusedPanel === 0 ? '→ ' : '  '}
									{server.status === 'connected' ? '●' : 
									 server.status === 'connecting' ? '◐' : '○'}
								</Text>
								<Text color={colors.textPrimary}> {server.name} </Text>
								<Text color={colors.textSecondary}>
									{server.status === 'connected' && server.tools ? `${server.tools.length} tools` : '— tools'}
								</Text>
								{server.status === 'connected' && (
									<Text color={colors.textSecondary}> [Disconnect]</Text>
								)}
								{(server.status === 'disconnected' || server.status === 'error') && (
									<Text color={colors.accent}> [Connect]</Text>
								)}
								<Text color={colors.error}> [Remove]</Text>
							</Box>
							{server.status === 'error' && server.error && (
								<Text color={colors.error}>&nbsp;&nbsp;&nbsp;⚠ {server.error}</Text>
							)}
							{server.status === 'connecting' && (
								<Text color={colors.warning}>&nbsp;&nbsp;&nbsp;◐ Connecting...</Text>
							)}
						</Box>
					))
				)}
			</Box>

			{/* Tools Panel */}
			<Box flexDirection="column" borderStyle="bold" borderColor={focusedPanel === 1 ? colors.accent : colors.border} paddingX={1}>
				<Box justifyContent="space-between">
					<Text bold color={colors.textPrimary}>
						{connectedServer ? `Tools (${connectedServer.name})` : 'Tools'}
					</Text>
					{connectedServer && <Text color={colors.accent}>[🔄 Refresh]</Text>}
				</Box>
				<Text key="divider" color={colors.textMuted}>{"─".repeat(60)}</Text>
				
				{!connectedServer ? (
					<Text key="no-connected" color={colors.textMuted}>Select a connected server to view available tools</Text>
				) : connectedServer.tools && connectedServer.tools.length > 0 ? (
					connectedServer.tools.map((tool, index) => (
						<Box key={`tool-${tool.name}-${index}`}>
							<Text color={index === selectedToolIndex && focusedPanel === 1 ? colors.accent : colors.textSecondary}>
								{index === selectedToolIndex && focusedPanel === 1 ? '→ ' : '  '}
							</Text>
							<Text color={colors.purple}>{getToolIcon(tool.name)} </Text>
							<Text bold color={colors.purple}>{tool.name}</Text>
							<Text color={colors.textSecondary}> {tool.description?.substring(0, 35) || ''}</Text>
						</Box>
					))
				) : (
					<Text color={colors.textMuted}>No tools available</Text>
				)}
			</Box>

			{/* Execution Panel */}
			<Box flexDirection="column" borderStyle="bold" borderColor={focusedPanel === 2 ? colors.accent : colors.border} paddingX={1}>
				<Box justifyContent="space-between">
					<Text bold color={colors.textPrimary}> Execute </Text>
					<Text color={colors.textMuted}>[Clear]</Text>
				</Box>
				<Text key="divider" color={colors.textMuted}>{"─".repeat(60)}</Text>
				
				<Box>
					<Text color={colors.textSecondary}>Tool: </Text>
					<Text color={colors.purple}>{selectedTool?.name || '—'}</Text>
					<Text color={colors.textSecondary}> [▶ Run]</Text>
				</Box>
				
				<Box>
					<Text color={colors.textSecondary}>Args: </Text>
					<Text color={colors.warning}>{toolArgs}</Text>
				</Box>

				{/* Result */}
				<Box flexDirection="column">
					<Box justifyContent="space-between">
						<Text color={colors.textSecondary}>Result: </Text>
						{lastResult && (
							<Text color={colors.accent}>[📋 Copy]</Text>
						)}
					</Box>
					<Text key="divider" color={colors.textMuted}>{"─".repeat(60)}</Text>
					
					{isExecuting ? (
						<Text color={colors.warning}>◐ Executing...</Text>
					) : executionError ? (
						<Text color={colors.error}>⚠️ Error: {executionError}</Text>
					) : lastResult ? (
						<Text color={colors.textPrimary}>{lastResult}</Text>
					) : (
						<Text key="no-result" color={colors.textMuted}>(No result yet)</Text>
					)}
				</Box>
			</Box>

			{/* Footer */}
			<Box borderStyle="bold" borderColor={colors.border} paddingX={1}>
				<Text color={colors.textMuted}>
					↑↓ Navigate | ↵ Select | Tab Panels | a Add | r Refresh | c Copy | ? Help | q Quit
				</Text>
			</Box>
		</Box>
	);
}

// Run the app
render(<App />);
