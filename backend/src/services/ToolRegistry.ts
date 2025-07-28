import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { BrowserManager } from './BrowserManager.js';
import { PaginatedContentExtractor } from './ContentExtractor.js';

// Workspace path for file operations - sandboxed to prevent security issues
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || path.join(process.cwd(), 'workspace');

// Ensure workspace directory exists
async function ensureWorkspace() {
  try {
    await fs.access(WORKSPACE_PATH);
  } catch {
    await fs.mkdir(WORKSPACE_PATH, { recursive: true });
  }
}

// Path validation to prevent directory traversal attacks
function validatePath(filePath: string): string {
  const fullPath = path.resolve(WORKSPACE_PATH, filePath);
  if (!fullPath.startsWith(path.resolve(WORKSPACE_PATH))) {
    throw new Error('Access denied: Path outside workspace');
  }
  return fullPath;
}

// Web search tool using DuckDuckGo API (no API key required)
export const webSearchTool = tool({
  description: 'Search the web for current information and recent developments',
  parameters: z.object({
    query: z.string().describe('The search query to look up'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, maxResults }) => {
    console.log(`🔍 Web search: "${query}"`);
    
    try {
      // Use DuckDuckGo Instant Answer API for quick results
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Agent-TARS/1.0'
        }
      });

      const data = response.data;
      const results = [];

      // Add abstract if available
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Direct Answer',
          url: data.AbstractURL || 'https://duckduckgo.com',
          snippet: data.Abstract,
          domain: data.AbstractSource || 'duckduckgo.com',
          publishedDate: new Date().toISOString(),
        });
      }

      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Result ? topic.Result.split(' - ')[0] : 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              domain: new URL(topic.FirstURL).hostname,
              publishedDate: new Date().toISOString(),
            });
          }
        }
      }

      // If no results from instant answers, use web search fallback
      if (results.length === 0) {
        // Fallback to web scraping using BrowserManager
        const browserManager = BrowserManager.getInstance();
        
        try {
          // Auto-discover existing browser or prepare for local launch
          const cdpEndpoint = await BrowserManager.discoverBrowser();
          
          // Ensure browser is ready
          if (!browserManager.isLaunchingComplete()) {
            await browserManager.launchBrowser({
              cdpEndpoint: cdpEndpoint || undefined,
              headless: true,
            });
          } else {
            await browserManager.ensureBrowserReady();
          }

          // Get or create a page using the BrowserManager helper method
          const page = await browserManager.getOrCreatePage();
          
          await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          const searchResults = await page.evaluate(() => {
            const results = [];
            const resultElements = document.querySelectorAll('.result');
            
            for (const element of Array.from(resultElements).slice(0, 10)) {
              const titleElement = element.querySelector('.result__title a');
              const snippetElement = element.querySelector('.result__snippet');
              
              if (titleElement && snippetElement) {
                results.push({
                  title: titleElement.textContent?.trim() || '',
                  url: titleElement.href || '',
                  snippet: snippetElement.textContent?.trim() || '',
                  domain: new URL(titleElement.href).hostname,
                  publishedDate: new Date().toISOString(),
                });
              }
            }
            
            return results;
          });

          results.push(...searchResults.slice(0, maxResults));
        } catch (browserError) {
          console.error('Browser search fallback failed:', browserError);
          // If browser fails, continue with empty results
        }
      }

      return {
        query,
        results: results.slice(0, maxResults),
        totalResults: results.length,
        searchTime: Date.now() / 1000,
        source: 'DuckDuckGo'
      };

    } catch (error) {
      console.error('Web search error:', error);
      return {
        query,
        results: [{
          title: 'Search Error',
          url: '',
          snippet: `Unable to perform web search for "${query}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          domain: 'error',
          publishedDate: new Date().toISOString(),
        }],
        totalResults: 1,
        searchTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

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

export const fileWriteTool = tool({
  description: 'Write content to a file on the filesystem',
  parameters: z.object({
    path: z.string().describe('The file path to write to'),
    content: z.string().describe('The content to write to the file'),
    createDirectory: z.boolean().optional().default(false).describe('Create parent directories if they do not exist'),
  }),
  execute: async ({ path: filePath, content, createDirectory }) => {
    console.log(`✍️ Writing to file: ${filePath}`);
    
    try {
      await ensureWorkspace();
      const fullPath = validatePath(filePath);
      
      // Create directories if requested
      if (createDirectory) {
        const dirPath = path.dirname(fullPath);
        await fs.mkdir(dirPath, { recursive: true });
      }

      // Check if file already exists and create backup
      let backupPath = null;
      try {
        await fs.access(fullPath);
        // File exists, create backup
        backupPath = `${fullPath}.backup.${Date.now()}`;
        await fs.copyFile(fullPath, backupPath);
      } catch {
        // File doesn't exist, no backup needed
      }

      // Write content to file
      await fs.writeFile(fullPath, content, 'utf-8');
      
      // Get file stats after writing
      const stats = await fs.stat(fullPath);

      return {
        path: filePath,
        bytesWritten: Buffer.byteLength(content, 'utf-8'),
        success: true,
        timestamp: new Date().toISOString(),
        backup: backupPath,
        size: stats.size
      };

    } catch (error) {
      console.error('File write error:', error);
      return {
        path: filePath,
        bytesWritten: 0,
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

// Command execution tool with real-time output and security controls
export const executeCommandTool = tool({
  description: 'Execute a system command and return the output',
  parameters: z.object({
    command: z.string().describe('The command to execute'),
    workingDirectory: z.string().optional().default('.').describe('The working directory for the command'),
    timeout: z.number().optional().default(30000).describe('Timeout in milliseconds'),
    shell: z.enum(['bash', 'sh', 'zsh', 'cmd', 'powershell']).optional().default('bash').describe('Shell to use for execution')
  }),
  execute: async ({ command, workingDirectory, timeout, shell }) => {
    console.log(`⚡ Executing command: ${command}`);
    
    const startTime = Date.now();
    
    try {
      await ensureWorkspace();
      
      // Validate and resolve working directory
      const resolvedWorkingDir = workingDirectory === '.' 
        ? WORKSPACE_PATH 
        : validatePath(workingDirectory);

      // Security: Block dangerous commands
      const dangerousCommands = ['rm -rf /', 'dd if=', 'mkfs', 'fdisk', 'format', ':(){ :|:& };:'];
      const lowerCommand = command.toLowerCase();
      
      for (const dangerous of dangerousCommands) {
        if (lowerCommand.includes(dangerous)) {
          throw new Error(`Command blocked for security: contains "${dangerous}"`);
        }
      }

      // Determine shell executable based on platform and preference
      let shellExecutable: string;
      let shellArgs: string[];
      
      if (os.platform() === 'win32') {
        if (shell === 'powershell') {
          shellExecutable = 'powershell';
          shellArgs = ['-Command', command];
        } else {
          shellExecutable = 'cmd';
          shellArgs = ['/c', command];
        }
      } else {
        // Unix-like systems
        const availableShells = [shell, 'bash', 'sh', 'zsh'];
        shellExecutable = availableShells.find(s => {
          try {
            require('child_process').execSync(`which ${s}`, { stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        }) || 'sh';
        
        shellArgs = ['-c', command];
      }

      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const child = spawn(shellExecutable, shellArgs, {
          cwd: resolvedWorkingDir,
          env: { 
            ...process.env, 
            PATH: process.env.PATH,
            HOME: os.homedir(),
            USER: os.userInfo().username 
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        // Set up timeout
        const timeoutHandle = setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
          
          // Force kill after 5 seconds if still running
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 5000);
        }, timeout);

        // Collect stdout
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        // Collect stderr
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process completion
        child.on('close', (code, signal) => {
          clearTimeout(timeoutHandle);
          
          const duration = Date.now() - startTime;
          const exitCode = timedOut ? -1 : (code || 0);
          
          resolve({
            command,
            workingDirectory: resolvedWorkingDir,
            shell: shellExecutable,
            output: stdout,
            error: stderr || (timedOut ? 'Command timed out' : null),
            exitCode,
            signal: signal || null,
            duration,
            timestamp: new Date().toISOString(),
            success: !timedOut && exitCode === 0,
            timedOut
          });
        });

        // Handle spawn errors
        child.on('error', (error) => {
          clearTimeout(timeoutHandle);
          
          resolve({
            command,
            workingDirectory: resolvedWorkingDir,
            shell: shellExecutable,
            output: '',
            error: error.message,
            exitCode: -1,
            signal: null,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            success: false,
            timedOut: false
          });
        });
      });

    } catch (error) {
      console.error('Command execution error:', error);
      return {
        command,
        workingDirectory,
        shell,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        signal: null,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        success: false,
        timedOut: false
      };
    }
  },
});

// Browser automation tool using @agent-infra/browser
export const browserActionTool = tool({
  description: 'Perform browser actions like navigating, clicking, typing, extracting content, or taking screenshots',
  parameters: z.object({
    action: z.enum(['navigate', 'click', 'type', 'extract', 'screenshot', 'scroll', 'wait']).describe('The action to perform'),
    url: z.string().optional().describe('URL to navigate to (required for navigate action)'),
    selector: z.string().optional().describe('CSS selector for the element (required for click, type, extract actions)'),
    text: z.string().optional().describe('Text to type (required for type action)'),
    extractType: z.enum(['text', 'html', 'attributes', 'markdown']).optional().default('text').describe('What to extract (for extract action)'),
    waitTime: z.number().optional().default(3000).describe('Time to wait in milliseconds (for wait action)'),
    scrollDirection: z.enum(['up', 'down', 'top', 'bottom']).optional().default('down').describe('Scroll direction (for scroll action)'),
    screenshotType: z.enum(['fullpage', 'viewport']).optional().default('viewport').describe('Screenshot type (for screenshot action)')
  }),
  execute: async ({ action, url, selector, text, extractType, waitTime, scrollDirection, screenshotType }) => {
    console.log(`🌐 Browser action: ${action}`);
    
    const startTime = Date.now();
    const browserManager = BrowserManager.getInstance();
    
    try {
      // Auto-discover existing browser or prepare for local launch
      const cdpEndpoint = await BrowserManager.discoverBrowser();
      
      // Ensure browser is ready
      if (!browserManager.isLaunchingComplete()) {
        await browserManager.launchBrowser({
          cdpEndpoint: cdpEndpoint || undefined,
          headless: true,
        });
      } else {
        await browserManager.ensureBrowserReady();
      }

      // Get or create a page using the BrowserManager helper method
      const page = await browserManager.getOrCreatePage();

      let result: any = { action, success: true, timestamp: new Date().toISOString() };

      switch (action) {
        case 'navigate':
          if (!url) throw new Error('URL is required for navigate action');
          
          await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
          });
          
          result = {
            ...result,
            navigatedTo: url,
            title: await page.title(),
            finalUrl: page.url()
          };
          break;

        case 'click':
          if (!selector) throw new Error('Selector is required for click action');
          
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.click(selector);
          
          result = {
            ...result,
            targetElement: selector,
            clicked: true
          };
          break;

        case 'type':
          if (!selector) throw new Error('Selector is required for type action');
          if (!text) throw new Error('Text is required for type action');
          
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.focus(selector);
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');
          await page.keyboard.up('Meta');
          await page.type(selector, text, { delay: 50 });
          
          result = {
            ...result,
            targetElement: selector,
            inputText: text,
            typed: true
          };
          break;

        case 'extract':
          if (!selector) throw new Error('Selector is required for extract action');
          
          await page.waitForSelector(selector, { timeout: 10000 });
          
          let extractedData;
          switch (extractType) {
            case 'text':
              extractedData = await page.$eval(selector, el => el.textContent?.trim() || '');
              break;
            case 'html':
              extractedData = await page.$eval(selector, el => el.innerHTML);
              break;
            case 'attributes':
              extractedData = await page.$eval(selector, el => {
                const attrs: Record<string, string> = {};
                for (const attr of el.attributes) {
                  attrs[attr.name] = attr.value;
                }
                return attrs;
              });
              break;
            case 'markdown':
              // Simple markdown extraction
              extractedData = await page.$eval(selector, el => {
                // Convert basic HTML elements to markdown
                let content = el.innerHTML;
                content = content.replace(/<h([1-6])>/g, (_, level) => '#'.repeat(parseInt(level)) + ' ');
                content = content.replace(/<\/h[1-6]>/g, '\n\n');
                content = content.replace(/<strong>|<b>/g, '**');
                content = content.replace(/<\/strong>|<\/b>/g, '**');
                content = content.replace(/<em>|<i>/g, '*');
                content = content.replace(/<\/em>|<\/i>/g, '*');
                content = content.replace(/<a[^>]+href="([^"]+)"[^>]*>/g, '[');
                content = content.replace(/<\/a>/g, ']($1)');
                content = content.replace(/<br\s*\/?>/g, '\n');
                content = content.replace(/<p>/g, '');
                content = content.replace(/<\/p>/g, '\n\n');
                content = content.replace(/<[^>]+>/g, ''); // Remove remaining tags
                return content.trim();
              });
              break;
          }
          
          result = {
            ...result,
            targetElement: selector,
            extractType,
            extractedData
          };
          break;

        case 'screenshot':
          await ensureWorkspace();
          const screenshotPath = path.join(WORKSPACE_PATH, `screenshot_${Date.now()}.png`);
          
          await page.screenshot({
            path: screenshotPath,
            fullPage: screenshotType === 'fullpage',
            type: 'png'
          });
          
          result = {
            ...result,
            screenshotPath,
            screenshotType,
            saved: true
          };
          break;

        case 'scroll':
          switch (scrollDirection) {
            case 'top':
              await page.evaluate(() => window.scrollTo(0, 0));
              break;
            case 'bottom':
              await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
              break;
            case 'up':
              await page.evaluate(() => window.scrollBy(0, -500));
              break;
            case 'down':
              await page.evaluate(() => window.scrollBy(0, 500));
              break;
          }
          
          result = {
            ...result,
            scrollDirection,
            scrolled: true
          };
          break;

        case 'wait':
          await page.waitForTimeout(waitTime);
          
          result = {
            ...result,
            waitTime,
            waited: true
          };
          break;

        default:
          throw new Error(`Unknown browser action: ${action}`);
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      console.error('Browser action error:', error);
      
      // Try to recover browser on error
      try {
        await browserManager.recoverBrowser();
      } catch (recoveryError) {
        console.error('Browser recovery failed:', recoveryError);
      }
      
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        ...(url && { attemptedUrl: url }),
        ...(selector && { attemptedSelector: selector }),
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

// Browser get markdown tool with Readability support
export const browserGetMarkdownTool = tool({
  description: 'Get the content of the current page as markdown with pagination support using Mozilla Readability algorithm',
  parameters: z.object({
    page: z.number().optional().default(1).describe('Page number to extract (default: 1), in most cases, you do not need to pass this parameter.'),
  }),
  execute: async ({ page = 1 }) => {
    console.log(`🌐 Getting markdown content (page ${page})`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      
      // Try to discover existing browser first
      const cdpEndpoint = await BrowserManager.discoverBrowser();
      if (cdpEndpoint) {
        await browserManager.launchBrowser({ cdpEndpoint });
      } else {
        await browserManager.launchBrowser();
      }
      
      // Get or create a page using the BrowserManager helper method
      const browserPage = await browserManager.getOrCreatePage();
      
      // Create content extractor instance
      const contentExtractor = new PaginatedContentExtractor();
      
      // Extract content using the paginated extractor
      const result = await contentExtractor.extractContent(browserPage, page);
      
      console.log(`✅ Extracted markdown content: ${result.content.length} characters, page ${result.currentPage}/${result.totalPages}`);
      
      return {
        content: result.content,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          hasMorePages: result.hasMorePages,
        },
        title: result.title,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser get markdown error:', error);
      return {
        status: 'error',
        message: `Failed to extract content: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Individual browser interaction tools (ported from UI-TARS)
export const browserClickTool = tool({
  description: 'Click on an element in the browser using CSS selector',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to click'),
  }),
  execute: async ({ selector }) => {
    console.log(`🖱️ Clicking element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.click(selector);
      
      console.log(`✅ Successfully clicked: ${selector}`);
      return {
        status: 'success',
        message: `Clicked element: ${selector}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser click error:', error);
      return {
        status: 'error',
        message: `Failed to click element: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserHoverTool = tool({
  description: 'Hover over an element in the browser using CSS selector',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to hover over'),
  }),
  execute: async ({ selector }) => {
    console.log(`👆 Hovering over element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.hover(selector);
      
      console.log(`✅ Successfully hovered: ${selector}`);
      return {
        status: 'success',
        message: `Hovered over element: ${selector}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser hover error:', error);
      return {
        status: 'error',
        message: `Failed to hover over element: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserPressKeyTool = tool({
  description: 'Press a key or key combination in the browser',
  parameters: z.object({
    key: z.string().describe('Key to press (e.g., "Enter", "Escape", "Tab", "ctrl+a", "cmd+s")'),
  }),
  execute: async ({ key }) => {
    console.log(`⌨️ Pressing key: ${key}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      // Handle key combinations
      if (key.includes('+')) {
        const keys = key.split('+');
        const modifiers = keys.slice(0, -1);
        const mainKey = keys[keys.length - 1];
        
        // Press modifier keys
        for (const modifier of modifiers) {
          await page.keyboard.down(modifier);
        }
        
        // Press main key
        await page.keyboard.press(mainKey);
        
        // Release modifier keys
        for (const modifier of modifiers.reverse()) {
          await page.keyboard.up(modifier);
        }
      } else {
        await page.keyboard.press(key);
      }
      
      console.log(`✅ Successfully pressed key: ${key}`);
      return {
        status: 'success',
        message: `Pressed key: ${key}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser key press error:', error);
      return {
        status: 'error',
        message: `Failed to press key: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserFormInputFillTool = tool({
  description: 'Fill a form input field with text',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the input field'),
    text: z.string().describe('Text to fill into the input field'),
    clear: z.boolean().optional().default(true).describe('Whether to clear the field first'),
  }),
  execute: async ({ selector, text, clear = true }) => {
    console.log(`📝 Filling input field: ${selector} with "${text}"`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      if (clear) {
        await page.click(selector, { clickCount: 3 }); // Select all text
      }
      
      await page.type(selector, text);
      
      console.log(`✅ Successfully filled input: ${selector}`);
      return {
        status: 'success',
        message: `Filled input field: ${selector} with "${text}"`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser form fill error:', error);
      return {
        status: 'error',
        message: `Failed to fill input field: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Tab management tools (ported from UI-TARS)
export const browserTabListTool = tool({
  description: 'List all open browser tabs',
  parameters: z.object({}),
  execute: async () => {
    console.log('📑 Listing browser tabs');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      const puppeteerBrowser = browser.getBrowser();
      
      const pages = await puppeteerBrowser.pages();
      const tabs = await Promise.all(
        pages.map(async (page, index) => ({
          id: index,
          url: page.url(),
          title: await page.title().catch(() => 'Unknown'),
          active: !page.isClosed()
        }))
      );
      
      console.log(`✅ Found ${tabs.length} tabs`);
      return {
        status: 'success',
        tabs,
        count: tabs.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser tab list error:', error);
      return {
        status: 'error',
        message: `Failed to list tabs: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserNewTabTool = tool({
  description: 'Create a new browser tab',
  parameters: z.object({
    url: z.string().optional().describe('URL to navigate to in the new tab (optional)'),
  }),
  execute: async ({ url }) => {
    console.log(`🆕 Creating new tab${url ? ` and navigating to: ${url}` : ''}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      
      const page = await browser.createPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      if (url) {
        await page.goto(url);
      }
      
      console.log(`✅ Created new tab${url ? ` at: ${url}` : ''}`);
      return {
        status: 'success',
        message: `Created new tab${url ? ` and navigated to: ${url}` : ''}`,
        url: url || 'about:blank',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser new tab error:', error);
      return {
        status: 'error',
        message: `Failed to create new tab: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserCloseTabTool = tool({
  description: 'Close a specific browser tab by index',
  parameters: z.object({
    tabIndex: z.number().describe('Index of the tab to close (0-based)'),
  }),
  execute: async ({ tabIndex }) => {
    console.log(`❌ Closing tab at index: ${tabIndex}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      const puppeteerBrowser = browser.getBrowser();
      
      const pages = await puppeteerBrowser.pages();
      
      if (tabIndex < 0 || tabIndex >= pages.length) {
        throw new Error(`Tab index ${tabIndex} out of range. Available tabs: 0-${pages.length - 1}`);
      }
      
      const pageToClose = pages[tabIndex];
      const url = pageToClose.url();
      
      if (!pageToClose.isClosed()) {
        await pageToClose.close();
      }
      
      console.log(`✅ Closed tab at index ${tabIndex}: ${url}`);
      return {
        status: 'success',
        message: `Closed tab at index ${tabIndex}: ${url}`,
        closedUrl: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser close tab error:', error);
      return {
        status: 'error',
        message: `Failed to close tab: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserSwitchTabTool = tool({
  description: 'Switch to a specific browser tab by index',
  parameters: z.object({
    tabIndex: z.number().describe('Index of the tab to switch to (0-based)'),
  }),
  execute: async ({ tabIndex }) => {
    console.log(`🔄 Switching to tab at index: ${tabIndex}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      const puppeteerBrowser = browser.getBrowser();
      
      const pages = await puppeteerBrowser.pages();
      
      if (tabIndex < 0 || tabIndex >= pages.length) {
        throw new Error(`Tab index ${tabIndex} out of range. Available tabs: 0-${pages.length - 1}`);
      }
      
      const targetPage = pages[tabIndex];
      const url = targetPage.url();
      
      // Bring the target page to front
      await targetPage.bringToFront();
      
      console.log(`✅ Switched to tab at index ${tabIndex}: ${url}`);
      return {
        status: 'success',
        message: `Switched to tab at index ${tabIndex}: ${url}`,
        activeUrl: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser switch tab error:', error);
      return {
        status: 'error',
        message: `Failed to switch tab: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

import { mcpTools, MCPToolRegistry } from './MCPToolRegistry.js';

// Initialize MCP Registry
const mcpRegistry = MCPToolRegistry.getInstance();

// Function to get all tools including MCP tools
export async function getAllTools(): Promise<Record<string, any>> {
  // Initialize MCP registry if not already done
  await mcpRegistry.initialize();
  
  // Get MCP tools
  const mcpToolsAvailable = mcpRegistry.getMCPTools();
  
  // Combine base tools with MCP tools and MCP management tools
  return {
    // Base tools
    web_search: webSearchTool,
    file_read: fileReadTool,
    file_write: fileWriteTool,
    list_files: listFilesTool,
    create_directory: createDirectoryTool,
    execute_command: executeCommandTool,
    browser_action: browserActionTool,
    browser_get_markdown: browserGetMarkdownTool,
    browser_click: browserClickTool,
    browser_hover: browserHoverTool,
    browser_press_key: browserPressKeyTool,
    browser_form_input_fill: browserFormInputFillTool,
    browser_tab_list: browserTabListTool,
    browser_new_tab: browserNewTabTool,
    browser_close_tab: browserCloseTabTool,
    browser_switch_tab: browserSwitchTabTool,
    
    // MCP management tools
    ...mcpTools,
    
    // Dynamic MCP tools from connected servers
    ...mcpToolsAvailable
  };
}

// Export base tools as a tools object for AI SDK (backwards compatibility)
export const tools = {
  web_search: webSearchTool,
  file_read: fileReadTool,
  file_write: fileWriteTool,
  list_files: listFilesTool,
  create_directory: createDirectoryTool,
  execute_command: executeCommandTool,
  browser_action: browserActionTool,
  browser_get_markdown: browserGetMarkdownTool,
  browser_click: browserClickTool,
  browser_hover: browserHoverTool,
  browser_press_key: browserPressKeyTool,
  browser_form_input_fill: browserFormInputFillTool,
  browser_tab_list: browserTabListTool,
  browser_new_tab: browserNewTabTool,
  browser_close_tab: browserCloseTabTool,
  browser_switch_tab: browserSwitchTabTool,
  ...mcpTools
};