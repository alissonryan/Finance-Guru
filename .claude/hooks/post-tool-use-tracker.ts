#!/usr/bin/env bun

/**
 * Post-tool-use hook that tracks edited files and their repos
 * This runs after Edit, MultiEdit, or Write tools complete successfully
 *
 * Refactored to use Bun runtime for improved performance.
 */

import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ToolInput {
  file_path?: string;
}

interface HookInput {
  tool_name: string;
  tool_input: ToolInput;
  session_id?: string;
}

function getProjectRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function detectRepo(filePath: string, projectRoot: string): string {
  // Remove project root from path
  const relativePath = filePath.replace(projectRoot + '/', '');

  // Extract first directory component
  const firstDir = relativePath.split('/')[0];

  // Common project directory patterns
  switch (firstDir) {
    // Frontend variations
    case 'frontend':
    case 'client':
    case 'web':
    case 'app':
    case 'ui':
      return firstDir;

    // Backend variations
    case 'backend':
    case 'server':
    case 'api':
    case 'src':
    case 'services':
      return firstDir;

    // Database
    case 'database':
    case 'prisma':
    case 'migrations':
      return firstDir;

    // Package/monorepo structure
    case 'packages': {
      const parts = relativePath.split('/');
      if (parts.length >= 2) {
        return `packages/${parts[1]}`;
      }
      return firstDir;
    }

    // Examples directory
    case 'examples': {
      const parts = relativePath.split('/');
      if (parts.length >= 2) {
        return `examples/${parts[1]}`;
      }
      return firstDir;
    }

    default:
      // Check if it's a source file in root
      if (!relativePath.includes('/')) {
        return 'root';
      }
      return 'unknown';
  }
}

function getBuildCommand(repo: string, projectRoot: string): string {
  const repoPath = join(projectRoot, repo);
  const packageJsonPath = join(repoPath, 'package.json');

  // Check if package.json exists and has a build script
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.scripts && packageJson.scripts.build) {
      // Detect package manager (prefer pnpm, then npm, then yarn)
      if (existsSync(join(repoPath, 'pnpm-lock.yaml'))) {
        return `cd ${repoPath} && pnpm build`;
      } else if (existsSync(join(repoPath, 'package-lock.json'))) {
        return `cd ${repoPath} && npm run build`;
      } else if (existsSync(join(repoPath, 'yarn.lock'))) {
        return `cd ${repoPath} && yarn build`;
      } else {
        return `cd ${repoPath} && npm run build`;
      }
    }
  }

  // Special case for database with Prisma
  if (repo === 'database' || repo.includes('prisma')) {
    if (existsSync(join(repoPath, 'schema.prisma')) ||
        existsSync(join(repoPath, 'prisma', 'schema.prisma'))) {
      return `cd ${repoPath} && npx prisma generate`;
    }
  }

  // No build command found
  return '';
}

function getTscCommand(repo: string, projectRoot: string): string {
  const repoPath = join(projectRoot, repo);
  const tsconfigPath = join(repoPath, 'tsconfig.json');

  // Check if tsconfig.json exists
  if (existsSync(tsconfigPath)) {
    // Check for Vite/React-specific tsconfig
    if (existsSync(join(repoPath, 'tsconfig.app.json'))) {
      return `cd ${repoPath} && npx tsc --project tsconfig.app.json --noEmit`;
    } else {
      return `cd ${repoPath} && npx tsc --noEmit`;
    }
  }

  // No TypeScript config found
  return '';
}

function main() {
  // Read stdin (tool info)
  let inputData = '';
  process.stdin.setEncoding('utf-8');

  // Handle both piped and direct execution
  if (process.stdin.isTTY) {
    // Direct execution (testing) - exit cleanly
    process.exit(0);
  } else {
    // Piped input from Claude Code
    process.stdin.on('data', chunk => {
      inputData += chunk;
    });

    process.stdin.on('end', () => {
      processHook(inputData);
    });
  }
}

function processHook(inputData: string) {
  try {
    const toolInfo: HookInput = JSON.parse(inputData);
    const projectRoot = getProjectRoot();

    // Extract relevant data
    const toolName = toolInfo.tool_name;
    const filePath = toolInfo.tool_input?.file_path;
    const sessionId = toolInfo.session_id || 'default';

    // Skip if not an edit tool or no file path
    if (!['Edit', 'MultiEdit', 'Write'].includes(toolName) || !filePath) {
      process.exit(0);
    }

    // Skip markdown files
    if (filePath.match(/\.(md|markdown)$/)) {
      process.exit(0);
    }

    // Create cache directory in project
    const cacheDir = join(projectRoot, '.claude', 'tsc-cache', sessionId);
    mkdirSync(cacheDir, { recursive: true });

    // Detect repo
    const repo = detectRepo(filePath, projectRoot);

    // Skip if unknown repo
    if (repo === 'unknown' || !repo) {
      process.exit(0);
    }

    // Log edited file
    const timestamp = Math.floor(Date.now() / 1000);
    const logEntry = `${timestamp}:${filePath}:${repo}\n`;
    appendFileSync(join(cacheDir, 'edited-files.log'), logEntry);

    // Update affected repos list
    const affectedReposPath = join(cacheDir, 'affected-repos.txt');
    const existingRepos = existsSync(affectedReposPath)
      ? readFileSync(affectedReposPath, 'utf-8').split('\n').filter(r => r.length > 0)
      : [];

    if (!existingRepos.includes(repo)) {
      appendFileSync(affectedReposPath, `${repo}\n`);
    }

    // Store build commands
    const commandsTmpPath = join(cacheDir, 'commands.txt.tmp');
    const buildCmd = getBuildCommand(repo, projectRoot);
    const tscCmd = getTscCommand(repo, projectRoot);

    if (buildCmd) {
      appendFileSync(commandsTmpPath, `${repo}:build:${buildCmd}\n`);
    }

    if (tscCmd) {
      appendFileSync(commandsTmpPath, `${repo}:tsc:${tscCmd}\n`);
    }

    // Remove duplicates from commands
    if (existsSync(commandsTmpPath)) {
      const commands = readFileSync(commandsTmpPath, 'utf-8')
        .split('\n')
        .filter(cmd => cmd.length > 0);

      const uniqueCommands = [...new Set(commands)].sort().join('\n') + '\n';
      writeFileSync(join(cacheDir, 'commands.txt'), uniqueCommands);
    }

    // Exit cleanly
    process.exit(0);

  } catch (err) {
    // Silently fail - this is just tracking, not critical
    process.exit(0);
  }
}

main();
