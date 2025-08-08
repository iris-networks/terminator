import { promises as fs } from 'fs';
import path from 'path';
import { WORKSPACE_PATH } from './constants.js';

// Ensure workspace directory exists
export async function ensureWorkspace(): Promise<void> {
  try {
    await fs.access(WORKSPACE_PATH);
  } catch {
    await fs.mkdir(WORKSPACE_PATH, { recursive: true });
  }
}

// Path validation to prevent directory traversal attacks
export function validatePath(filePath: string): string {
  const fullPath = path.resolve(WORKSPACE_PATH, filePath);
  if (!fullPath.startsWith(path.resolve(WORKSPACE_PATH))) {
    throw new Error('Access denied: Path outside workspace');
  }
  return fullPath;
}