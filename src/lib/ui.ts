/**
 * UI module - User interface utilities (prompts, progress, etc.)
 */

import readline from 'readline';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

/**
 * Create a confirmation prompt for destructive actions
 * @param message - The main prompt message
 * @param details - Optional details about what will happen
 * @returns true if confirmed, false otherwise
 */
export async function confirmAction(message: string, details?: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (details) {
      console.log(chalk.gray(details));
    }
    
    rl.question(chalk.yellow(`${message} [y/N] `), (answer) => {
      rl.close();
      const confirmed = answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes';
      resolve(confirmed);
    });
  });
}

/**
 * Progress indicator for multi-step operations
 */
export class ProgressTracker {
  private spinner: Ora | null = null;
  private steps: string[] = [];
  private currentStep = 0;
  private startTime: number;

  constructor(steps: string[]) {
    this.steps = steps;
    this.startTime = Date.now();
  }

  /**
   * Start the progress tracker with a spinner
   */
  start(message?: string): void {
    this.spinner = ora(message || 'Processing...').start();
  }

  /**
   * Advance to the next step
   */
  next(stepMessage?: string): void {
    this.currentStep++;
    if (this.spinner) {
      const progress = `[${this.currentStep}/${this.steps.length}]`;
      this.spinner.text = stepMessage 
        ? `${progress} ${stepMessage}` 
        : this.steps[this.currentStep - 1] || 'Processing...';
    }
  }

  /**
   * Mark the current step as complete with optional message
   */
  complete(message?: string): void {
    if (this.spinner) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      this.spinner.succeed(message || `Completed in ${elapsed}s`);
    }
  }

  /**
   * Mark as failed with error message
   */
  fail(message: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
    }
  }

  /**
   * Get the current progress percentage
   */
  getPercent(): number {
    return Math.round((this.currentStep / this.steps.length) * 100);
  }
}

/**
 * Create a simple spinner for long operations
 */
export function createSpinner(message: string): Ora {
  return ora({
    text: message,
    spinner: 'dots',
  }).start();
}

/**
 * Print a formatted success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green('✓') + ' ' + message);
}

/**
 * Print a formatted error message
 */
export function printError(message: string): void {
  console.error(chalk.red('✗') + ' ' + message);
}

/**
 * Print a formatted warning message
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow('⚠') + ' ' + message);
}

/**
 * Print a formatted info message
 */
export function printInfo(message: string): void {
  console.log(chalk.blue('ℹ') + ' ' + message);
}
