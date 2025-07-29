import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// CodeAct workspace path - sandboxed environment for code execution
export const CODEACT_WORKSPACE = process.env.CODEACT_WORKSPACE || path.join(os.homedir(), '.codeact');

// Ensure CodeAct workspace directory exists with proper structure
export async function ensureCodeActWorkspace(): Promise<void> {
  try {
    await fs.access(CODEACT_WORKSPACE);
  } catch {
    await fs.mkdir(CODEACT_WORKSPACE, { recursive: true });
  }
  
  // Create subdirectories for different languages
  const subdirs = ['node', 'python', 'shell', 'output'];
  for (const subdir of subdirs) {
    const subdirPath = path.join(CODEACT_WORKSPACE, subdir);
    try {
      await fs.access(subdirPath);
    } catch {
      await fs.mkdir(subdirPath, { recursive: true });
    }
  }
  
  // Create package.json for Node.js workspace if it doesn't exist
  const packageJsonPath = path.join(CODEACT_WORKSPACE, 'node', 'package.json');
  try {
    await fs.access(packageJsonPath);
  } catch {
    const packageJson = {
      name: 'codeact-workspace',
      version: '1.0.0',
      type: 'module',
      dependencies: {}
    };
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

// Path validation to prevent directory traversal attacks
export function validateWorkspacePath(filePath: string, subdir: string): string {
  const subdirPath = path.join(CODEACT_WORKSPACE, subdir);
  const fullPath = path.resolve(subdirPath, filePath);
  
  if (!fullPath.startsWith(path.resolve(subdirPath))) {
    throw new Error('Access denied: Path outside workspace');
  }
  
  return fullPath;
}