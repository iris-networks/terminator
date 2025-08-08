import path from 'path';

// Workspace path for file operations - sandboxed to prevent security issues
export const WORKSPACE_PATH = process.env.WORKSPACE_PATH || path.join(process.cwd(), 'workspace');