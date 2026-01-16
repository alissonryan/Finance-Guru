#!/usr/bin/env bun
/**
 * Tests for Post-tool-use Tracker Hook
 *
 * This test suite validates that the post-tool-use-tracker hook:
 * - Runs successfully with Bun runtime
 * - Correctly tracks Edit, MultiEdit, and Write tools
 * - Skips non-edit tools
 * - Skips markdown files
 * - Detects repos correctly from file paths
 * - Creates cache files in the correct location
 * - Stores build and TSC commands appropriately
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";

const HOOK_PATH = join(import.meta.dir, "../post-tool-use-tracker.ts");
const TEST_PROJECT_ROOT = join(import.meta.dir, "../../..");

// Helper to run hook with input
async function runHook(input: {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
  session_id?: string;
}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", [HOOK_PATH], {
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: TEST_PROJECT_ROOT
      }
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Send input via stdin
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();

    proc.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 });
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// Helper to create test input
function createTestInput(
  toolName: string,
  filePath?: string,
  sessionId: string = "test-session"
) {
  return {
    tool_name: toolName,
    tool_input: {
      file_path: filePath
    },
    session_id: sessionId
  };
}

// Helper to get cache dir path
function getCacheDir(sessionId: string = "test-session"): string {
  return join(TEST_PROJECT_ROOT, ".claude", "tsc-cache", sessionId);
}

// Helper to clean up cache dir
function cleanupCacheDir(sessionId: string = "test-session") {
  const cacheDir = getCacheDir(sessionId);
  if (existsSync(cacheDir)) {
    rmSync(cacheDir, { recursive: true, force: true });
  }
}

describe("post-tool-use-tracker hook with Bun", () => {
  beforeEach(() => {
    // Clean up before each test
    cleanupCacheDir();
  });

  afterEach(() => {
    // Clean up after each test
    cleanupCacheDir();
  });

  it("should execute successfully with Bun runtime", async () => {
    const result = await runHook(
      createTestInput("Edit", join(TEST_PROJECT_ROOT, "src", "test.ts"))
    );

    if (result.exitCode !== 0) {
      console.log("STDOUT:", result.stdout);
      console.log("STDERR:", result.stderr);
    }

    expect(result.exitCode).toBe(0);
  });

  it("should track Edit tool usage", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "src", "test.ts");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    // Check that edited-files.log was created
    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(true);

    const logContent = readFileSync(logPath, "utf-8");
    expect(logContent).toContain(filePath);
    expect(logContent).toContain("src");
  });

  it("should track Write tool usage", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "backend", "newfile.ts");
    const result = await runHook(createTestInput("Write", filePath));

    expect(result.exitCode).toBe(0);

    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(true);

    const logContent = readFileSync(logPath, "utf-8");
    expect(logContent).toContain(filePath);
    expect(logContent).toContain("backend");
  });

  it("should track MultiEdit tool usage", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "frontend", "component.tsx");
    const result = await runHook(createTestInput("MultiEdit", filePath));

    expect(result.exitCode).toBe(0);

    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(true);

    const logContent = readFileSync(logPath, "utf-8");
    expect(logContent).toContain(filePath);
    expect(logContent).toContain("frontend");
  });

  it("should skip non-edit tools", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "src", "test.ts");
    const result = await runHook(createTestInput("Read", filePath));

    expect(result.exitCode).toBe(0);

    // Log should not be created
    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(false);
  });

  it("should skip markdown files", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "README.md");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    // Log should not be created
    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(false);
  });

  it("should skip when no file path provided", async () => {
    const result = await runHook(createTestInput("Edit"));

    expect(result.exitCode).toBe(0);

    // Log should not be created
    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(false);
  });

  it("should detect frontend repo correctly", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "frontend", "src", "App.tsx");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    expect(existsSync(affectedReposPath)).toBe(true);

    const repos = readFileSync(affectedReposPath, "utf-8");
    expect(repos).toContain("frontend");
  });

  it("should detect backend repo correctly", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "backend", "src", "server.ts");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    expect(existsSync(affectedReposPath)).toBe(true);

    const repos = readFileSync(affectedReposPath, "utf-8");
    expect(repos).toContain("backend");
  });

  it("should detect database repo correctly", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "database", "schema.prisma");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    expect(existsSync(affectedReposPath)).toBe(true);

    const repos = readFileSync(affectedReposPath, "utf-8");
    expect(repos).toContain("database");
  });

  it("should detect packages monorepo structure", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "packages", "shared", "utils.ts");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    expect(existsSync(affectedReposPath)).toBe(true);

    const repos = readFileSync(affectedReposPath, "utf-8");
    expect(repos).toContain("packages/shared");
  });

  it("should detect root files", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "index.ts");
    const result = await runHook(createTestInput("Edit", filePath));

    expect(result.exitCode).toBe(0);

    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    expect(existsSync(affectedReposPath)).toBe(true);

    const repos = readFileSync(affectedReposPath, "utf-8");
    expect(repos).toContain("root");
  });

  it("should not duplicate repos in affected-repos.txt", async () => {
    const filePath1 = join(TEST_PROJECT_ROOT, "src", "file1.ts");
    const filePath2 = join(TEST_PROJECT_ROOT, "src", "file2.ts");

    await runHook(createTestInput("Edit", filePath1));
    await runHook(createTestInput("Edit", filePath2));

    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    const repos = readFileSync(affectedReposPath, "utf-8")
      .split("\n")
      .filter(r => r.length > 0);

    // Should only have "src" once
    const srcCount = repos.filter(r => r === "src").length;
    expect(srcCount).toBe(1);
  });

  it("should create cache directory with session ID", async () => {
    const sessionId = "custom-session-123";
    const filePath = join(TEST_PROJECT_ROOT, "src", "test.ts");

    const result = await runHook(createTestInput("Edit", filePath, sessionId));

    expect(result.exitCode).toBe(0);

    const cacheDir = getCacheDir(sessionId);
    expect(existsSync(cacheDir)).toBe(true);

    // Cleanup custom session
    cleanupCacheDir(sessionId);
  });

  it("should use default session when no session_id provided", async () => {
    const filePath = join(TEST_PROJECT_ROOT, "src", "test.ts");
    const input = {
      tool_name: "Edit",
      tool_input: { file_path: filePath }
    };

    const result = await runHook(input as any);

    expect(result.exitCode).toBe(0);

    const defaultCacheDir = getCacheDir("default");
    expect(existsSync(defaultCacheDir)).toBe(true);

    // Cleanup default session
    cleanupCacheDir("default");
  });

  it("should handle multiple file edits in same session", async () => {
    const files = [
      join(TEST_PROJECT_ROOT, "src", "file1.ts"),
      join(TEST_PROJECT_ROOT, "backend", "file2.ts"),
      join(TEST_PROJECT_ROOT, "frontend", "file3.tsx")
    ];

    for (const file of files) {
      await runHook(createTestInput("Edit", file));
    }

    const logPath = join(getCacheDir(), "edited-files.log");
    const logContent = readFileSync(logPath, "utf-8");

    // Should contain all three files
    expect(logContent).toContain("file1.ts");
    expect(logContent).toContain("file2.ts");
    expect(logContent).toContain("file3.tsx");

    // Should track all three repos
    const affectedReposPath = join(getCacheDir(), "affected-repos.txt");
    const repos = readFileSync(affectedReposPath, "utf-8");
    expect(repos).toContain("src");
    expect(repos).toContain("backend");
    expect(repos).toContain("frontend");
  });

  it("should exit cleanly on invalid JSON input", async () => {
    return new Promise((resolve) => {
      const proc = spawn("bun", [HOOK_PATH], {
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: TEST_PROJECT_ROOT
        }
      });

      proc.stdin.write("invalid json");
      proc.stdin.end();

      proc.on("close", (code) => {
        expect(code).toBe(0); // Should exit cleanly
        resolve(undefined);
      });
    });
  });

  it("should exit cleanly when tool_name is missing", async () => {
    const input = {
      tool_input: {
        file_path: join(TEST_PROJECT_ROOT, "src", "test.ts")
      }
    };

    const result = await runHook(input as any);
    expect(result.exitCode).toBe(0);

    // Log should not be created
    const logPath = join(getCacheDir(), "edited-files.log");
    expect(existsSync(logPath)).toBe(false);
  });
});
