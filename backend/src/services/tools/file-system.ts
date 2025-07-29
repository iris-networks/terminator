import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { ensureWorkspace, validatePath, WORKSPACE_PATH } from './utils/workspace.js';

// File read tool with security and error handling
export const fileReadTool = tool({
  description: 'Read the contents of a file from the filesystem',
  parameters: z.object({
    path: z.string().describe('The file path to read'),
  }),
  execute: async ({ path: filePath }) => {
    console.log(`📖 Reading file: ${filePath}`);
    
    try {
      await ensureWorkspace();
      const fullPath = validatePath(filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats
      const stats = await fs.stat(fullPath);
      
      // Check if it's a file (not a directory)
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      // Check file size (limit to 10MB for safety)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        throw new Error(`File too large: ${filePath} (${stats.size} bytes, max ${maxSize} bytes)`);
      }

      // Read file content
      const content = await fs.readFile(fullPath, 'utf-8');
      
      return {
        path: filePath,
        content,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        encoding: 'utf-8',
        type: path.extname(filePath) || 'text/plain',
        success: true
      };

    } catch (error) {
      console.error('File read error:', error);
      return {
        path: filePath,
        content: '',
        size: 0,
        lastModified: new Date().toISOString(),
        encoding: 'utf-8',
        type: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// List files and directories tool
export const listFilesTool = tool({
  description: 'List files and directories in a given path',
  parameters: z.object({
    path: z.string().optional().default('.').describe('The directory path to list'),
    showHidden: z.boolean().optional().default(false).describe('Whether to show hidden files'),
    recursive: z.boolean().optional().default(false).describe('Whether to list recursively')
  }),
  execute: async ({ path: dirPath, showHidden, recursive }) => {
    console.log(`📁 Listing files in: ${dirPath}`);
    
    try {
      await ensureWorkspace();
      const fullPath = dirPath === '.' ? WORKSPACE_PATH : validatePath(dirPath);
      
      // Check if directory exists
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${dirPath}`);
      }

      const listRecursively = async (currentPath: string, relativePath: string = ''): Promise<any[]> => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        const results = [];

        for (const entry of entries) {
          if (!showHidden && entry.name.startsWith('.')) continue;

          const fullEntryPath = path.join(currentPath, entry.name);
          const relativeEntryPath = path.join(relativePath, entry.name);
          const entryStats = await fs.stat(fullEntryPath);

          const fileInfo = {
            name: entry.name,
            path: relativeEntryPath || entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: entryStats.size,
            lastModified: entryStats.mtime.toISOString(),
            permissions: (entryStats.mode & parseInt('777', 8)).toString(8)
          };

          results.push(fileInfo);

          if (recursive && entry.isDirectory()) {
            const subEntries = await listRecursively(fullEntryPath, relativeEntryPath);
            results.push(...subEntries);
          }
        }

        return results;
      };

      const files = await listRecursively(fullPath);

      return {
        path: dirPath,
        files,
        totalFiles: files.filter(f => f.type === 'file').length,
        totalDirectories: files.filter(f => f.type === 'directory').length,
        showHidden,
        recursive,
        success: true
      };

    } catch (error) {
      console.error('List files error:', error);
      return {
        path: dirPath,
        files: [],
        totalFiles: 0,
        totalDirectories: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Create directory tool
export const createDirectoryTool = tool({
  description: 'Create a new directory',
  parameters: z.object({
    path: z.string().describe('The directory path to create'),
    recursive: z.boolean().optional().default(true).describe('Create parent directories if they do not exist')
  }),
  execute: async ({ path: dirPath, recursive }) => {
    console.log(`📁 Creating directory: ${dirPath}`);
    
    try {
      await ensureWorkspace();
      const fullPath = validatePath(dirPath);
      
      await fs.mkdir(fullPath, { recursive });
      
      return {
        path: dirPath,
        created: true,
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Create directory error:', error);
      return {
        path: dirPath,
        created: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});