/**
 * Config Migration Utility
 * Handles migrating config between versions
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import { readMCPConfig, writeMCPConfig } from './config.js';
import { log } from './logger.js';

const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'mcp-servers.json');
const BACKUP_DIR = path.join(os.homedir(), '.openclaw', 'backups');

/**
 * Create a backup of the config file
 */
export function backupConfig(): string {
  if (!fs.existsSync(CONFIG_PATH)) {
    return '';
  }

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `mcp-servers.${timestamp}.json`);

  fs.copyFileSync(CONFIG_PATH, backupPath);
  log.info('Config backup created', { backupPath });

  return backupPath;
}

/**
 * List available backups
 */
export function listBackups(): string[] {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('mcp-servers.') && f.endsWith('.json'))
    .sort()
    .reverse();
}

/**
 * Restore from a backup
 */
export function restoreFromBackup(backupFile: string): boolean {
  const backupPath = path.join(BACKUP_DIR, backupFile);
  
  if (!fs.existsSync(backupPath)) {
    console.error(chalk.red(`Error: Backup file not found: ${backupFile}`));
    return false;
  }

  try {
    // Validate backup is valid JSON
    const content = fs.readFileSync(backupPath, 'utf-8');
    JSON.parse(content);

    // Backup current config first
    backupConfig();

    // Restore
    fs.copyFileSync(backupPath, CONFIG_PATH);
    console.log(chalk.green(`✓ Restored from backup: ${backupFile}`));
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to restore backup:'), error);
    return false;
  }
}

/**
 * Migrate config to a new version
 */
export function migrateConfig(): { migrated: boolean; fromVersion: string; toVersion: string } {
  const config = readMCPConfig();
  const currentVersion = config.version || '1.0';
  const targetVersion = '1.1';

  if (currentVersion === targetVersion) {
    return { migrated: false, fromVersion: currentVersion, toVersion: targetVersion };
  }

  console.log(chalk.bold('\n📦 Config Migration'));
  console.log(chalk.gray(`Migrating from v${currentVersion} to v${targetVersion}...`));

  // Create backup first
  backupConfig();
  console.log(chalk.gray('  ✓ Backup created'));

  let migrations = 0;

  // Migration: v1.0 -> v1.1
  if (currentVersion === '1.0') {
    // Add lastUsedAt field to servers if not present
    if (config.servers) {
      for (const [name, server] of Object.entries(config.servers)) {
        if (!server.lastUsedAt) {
          server.lastUsedAt = server.installedAt;
          migrations++;
        }
      }
    }
  }

  // Update version
  config.version = targetVersion;
  writeMCPConfig(config);

  console.log(chalk.green(`  ✓ Applied ${migrations} migrations`));
  console.log(chalk.green('✓ Migration complete'));

  return { migrated: true, fromVersion: currentVersion, toVersion: targetVersion };
}

/**
 * Check if migration is needed and prompt user
 */
export async function checkAndMigrate(skipConfirm = false): Promise<void> {
  const config = readMCPConfig();
  const currentVersion = config.version || '1.0';
  
  // If already at latest version, nothing to do
  if (currentVersion === '1.1') {
    return;
  }

  console.log(chalk.yellow(`⚠️  Config version (${currentVersion}) is outdated`));
  
  if (skipConfirm) {
    // Skip confirmation - just run migration
    migrateConfig();
  } else {
    // Prompt user for confirmation
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise<void>((resolve) => {
      rl.question(chalk.bold('Run migration now? (y/N) '), (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          migrateConfig();
        } else {
          console.log(chalk.gray('Migration skipped'));
        }
        resolve();
      });
    });
  }
}

/**
 * Run migration manually (CLI command)
 */
export async function runMigrationCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'backup': {
      const backupPath = backupConfig();
      if (backupPath) {
        console.log(chalk.green(`✓ Backup created: ${path.basename(backupPath)}`));
      } else {
        console.log(chalk.yellow('No config file to backup'));
      }
      break;
    }

    case 'restore': {
      const backupFile = args[1];
      if (!backupFile) {
        console.error(chalk.red('Error: Backup filename required'));
        console.log('Usage: mcp config migrate restore <filename>');
        console.log('\nAvailable backups:');
        const backups = listBackups();
        if (backups.length === 0) {
          console.log(chalk.gray('  No backups found'));
        } else {
          for (const backup of backups) {
            console.log(`  ${backup}`);
          }
        }
        process.exit(1);
      }
      restoreFromBackup(backupFile);
      break;
    }

    case 'list': {
      const backups = listBackups();
      console.log(chalk.bold('Available Backups:'));
      if (backups.length === 0) {
        console.log(chalk.gray('  No backups found'));
      } else {
        for (const backup of backups) {
          console.log(`  ${backup}`);
        }
      }
      break;
    }

    case 'run': {
      const result = migrateConfig();
      if (result.migrated) {
        console.log(chalk.green(`✓ Migrated from v${result.fromVersion} to v${result.toVersion}`));
      } else {
        console.log(chalk.gray('Config is already at latest version'));
      }
      break;
    }

    default: {
      console.log(chalk.bold('Config Migration Utility'));
      console.log('\nUsage: mcp config migrate <command>');
      console.log('\nCommands:');
      console.log('  backup              Create a backup of current config');
      console.log('  restore <filename>  Restore from a backup');
      console.log('  list                List available backups');
      console.log('  run                 Run pending migrations');
      console.log('\nExamples:');
      console.log('  mcp config migrate backup');
      console.log('  mcp config migrate list');
      console.log('  mcp config migrate restore mcp-servers.2024-01-15T10-30-00.000Z.json');
    }
  }
}
