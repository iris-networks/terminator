import { tool } from 'ai';
import { z } from 'zod';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// CodeAct workspace path - sandboxed environment for code execution
const CODEACT_WORKSPACE = process.env.CODEACT_WORKSPACE || path.join(os.homedir(), '.codeact');

// Memory storage for persistent state between executions
class CodeActMemory {
  private memoryPath: string;
  private memory: Record<string, any> = {};
  
  constructor(workspace: string) {
    this.memoryPath = path.join(workspace, '.code_act_memory.json');
    this.loadMemory();
  }
  
  private async loadMemory() {
    try {
      const data = await fs.readFile(this.memoryPath, 'utf-8');
      this.memory = JSON.parse(data);
    } catch (error) {
      // Memory file doesn't exist or is corrupted, start fresh
      this.memory = {};
    }
  }
  
  private async saveMemory() {
    try {
      await fs.writeFile(this.memoryPath, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      console.error('Failed to save CodeAct memory:', error);
    }
  }
  
  async get(key: string): Promise<any> {
    return this.memory[key];
  }
  
  async set(key: string, value: any): Promise<void> {
    this.memory[key] = value;
    await this.saveMemory();
  }
  
  async has(key: string): Promise<boolean> {
    return key in this.memory;
  }
  
  async delete(key: string): Promise<void> {
    delete this.memory[key];
    await this.saveMemory();
  }
  
  async clear(): Promise<void> {
    this.memory = {};
    await this.saveMemory();
  }
}

// Global memory instance
let memoryInstance: CodeActMemory | null = null;

// Initialize CodeAct workspace and memory
async function ensureCodeActWorkspace() {
  try {
    await fs.access(CODEACT_WORKSPACE);
  } catch {
    await fs.mkdir(CODEACT_WORKSPACE, { recursive: true });
  }
  
  // Ensure subdirectories exist
  const subdirs = ['node', 'python', 'shell'];
  for (const subdir of subdirs) {
    const dirPath = path.join(CODEACT_WORKSPACE, subdir);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
  
  // Initialize memory if not already done
  if (!memoryInstance) {
    memoryInstance = new CodeActMemory(CODEACT_WORKSPACE);
  }
}

// Security: Validate paths to prevent directory traversal
function validateWorkspacePath(filePath: string, subdir: string): string {
  const workspaceSubdir = path.join(CODEACT_WORKSPACE, subdir);
  const fullPath = path.resolve(workspaceSubdir, filePath);
  
  if (!fullPath.startsWith(path.resolve(workspaceSubdir))) {
    throw new Error('Access denied: Path outside workspace');
  }
  
  return fullPath;
}

// Execute code with timeout and real-time output
async function executeCode(
  command: string,
  args: string[],
  workingDir: string,
  timeout: number = 30000
): Promise<{ output: string; error: string; exitCode: number; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let error = '';
    let timedOut = false;
    
    const child = spawn(command, args, {
      cwd: workingDir,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Set up timeout
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);
    
    // Collect output
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code, signal) => {
      clearTimeout(timeoutHandle);
      const duration = Date.now() - startTime;
      const exitCode = timedOut ? -1 : (code || 0);
      
      resolve({
        output: output.trim(),
        error: timedOut ? 'Execution timed out' : error.trim(),
        exitCode,
        duration
      });
    });
    
    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve({
        output: '',
        error: err.message,
        exitCode: -1,
        duration: Date.now() - startTime
      });
    });
  });
}

// Node.js CodeAct Tool
export const nodeCodeActTool = tool({
  description: 'Execute Node.js/JavaScript code in a sandboxed environment with dependency management',
  parameters: z.object({
    code: z.string().describe('The Node.js/JavaScript code to execute'),
    installDependencies: z.string().optional().describe('Comma-separated list of npm packages to install'),
    memoryKey: z.string().optional().describe('Key to store/retrieve execution results in memory'),
    saveToFile: z.string().optional().describe('Filename to save the code to (optional)'),
    esm: z.boolean().optional().default(false).describe('Use ES modules (ESM) instead of CommonJS')
  }),
  execute: async ({ code, installDependencies, memoryKey, saveToFile, esm }) => {
    console.log('🟨 NodeCodeAct: Executing JavaScript code');
    
    try {
      await ensureCodeActWorkspace();
      const nodeWorkspace = path.join(CODEACT_WORKSPACE, 'node');
      
      // Install dependencies if specified
      if (installDependencies) {
        const packages = installDependencies.split(',').map(p => p.trim()).filter(p => p);
        
        // Validate package names (basic security)
        const validPackageRegex = /^[a-z0-9@\-_.\/]+$/i;
        const invalidPackages = packages.filter(pkg => !validPackageRegex.test(pkg));
        if (invalidPackages.length > 0) {
          throw new Error(`Invalid package names: ${invalidPackages.join(', ')}`);
        }
        
        console.log(`📦 Installing npm packages: ${packages.join(', ')}`);
        
        // Ensure package.json exists
        const packageJsonPath = path.join(nodeWorkspace, 'package.json');
        try {
          await fs.access(packageJsonPath);
        } catch {
          const packageJson = {
            name: 'codeact-workspace',
            version: '1.0.0',
            type: esm ? 'module' : 'commonjs',
            main: 'index.js'
          };
          await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
        
        // Install packages
        const installResult = await executeCode('npm', ['install', ...packages], nodeWorkspace);
        if (installResult.exitCode !== 0) {
          return {
            success: false,
            output: installResult.output,
            error: `Failed to install packages: ${installResult.error}`,
            type: 'node_codeact',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // Save code to file if requested
      let filename = 'temp_code.js';
      if (saveToFile) {
        filename = saveToFile.endsWith('.js') ? saveToFile : `${saveToFile}.js`;
      }
      
      const codePath = validateWorkspacePath(filename, 'node');
      await fs.writeFile(codePath, code);
      
      // Execute the code
      console.log(`⚡ Running Node.js code: ${filename}`);
      const result = await executeCode('node', [filename], nodeWorkspace);
      
      // Store in memory if key provided
      if (memoryKey && memoryInstance) {
        await memoryInstance.set(memoryKey, {
          code,
          result: result.output,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error || null,
        exitCode: result.exitCode,
        duration: result.duration,
        filename,
        workspace: nodeWorkspace,
        type: 'node_codeact',
        timestamp: new Date().toISOString(),
        memoryKey: memoryKey || null
      };
      
    } catch (error) {
      console.error('NodeCodeAct error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'node_codeact',
        timestamp: new Date().toISOString()
      };
    }
  }
});

// Python CodeAct Tool
export const pythonCodeActTool = tool({
  description: 'Execute Python code in a sandboxed environment with dependency management',
  parameters: z.object({
    code: z.string().describe('The Python code to execute'),
    installDependencies: z.string().optional().describe('Comma-separated list of pip packages to install'),
    memoryKey: z.string().optional().describe('Key to store/retrieve execution results in memory'),
    saveToFile: z.string().optional().describe('Filename to save the code to (optional)')
  }),
  execute: async ({ code, installDependencies, memoryKey, saveToFile }) => {
    console.log('🐍 PythonCodeAct: Executing Python code');
    
    try {
      await ensureCodeActWorkspace();
      const pythonWorkspace = path.join(CODEACT_WORKSPACE, 'python');
      const sitePackagesPath = path.join(pythonWorkspace, 'site-packages');
      
      // Ensure site-packages directory exists
      try {
        await fs.access(sitePackagesPath);
      } catch {
        await fs.mkdir(sitePackagesPath, { recursive: true });
      }
      
      // Install dependencies if specified
      if (installDependencies) {
        const packages = installDependencies.split(',').map(p => p.trim()).filter(p => p);
        
        // Validate package names
        const validPackageRegex = /^[a-z0-9\-_.\[\]>=<~!]+$/i;
        const invalidPackages = packages.filter(pkg => !validPackageRegex.test(pkg));
        if (invalidPackages.length > 0) {
          throw new Error(`Invalid package names: ${invalidPackages.join(', ')}`);
        }
        
        console.log(`📦 Installing pip packages: ${packages.join(', ')}`);
        
        const installArgs = ['install', '--target', sitePackagesPath, ...packages];
        const installResult = await executeCode('pip3', installArgs, pythonWorkspace);
        
        if (installResult.exitCode !== 0) {
          // Try with pip if pip3 fails
          const pip2Result = await executeCode('pip', installArgs, pythonWorkspace);
          if (pip2Result.exitCode !== 0) {
            return {
              success: false,
              output: installResult.output + '\\n' + pip2Result.output,
              error: `Failed to install packages: ${installResult.error}`,
              type: 'python_codeact',
              timestamp: new Date().toISOString()
            };
          }
        }
      }
      
      // Save code to file if requested
      let filename = 'temp_code.py';
      if (saveToFile) {
        filename = saveToFile.endsWith('.py') ? saveToFile : `${saveToFile}.py`;
      }
      
      const codePath = validateWorkspacePath(filename, 'python');
      await fs.writeFile(codePath, code);
      
      // Execute the code with PYTHONPATH set to include site-packages
      console.log(`⚡ Running Python code: ${filename}`);
      const env = {
        ...process.env,
        PYTHONPATH: `${sitePackagesPath}:${process.env.PYTHONPATH || ''}`
      };
      
      const child = spawn('python3', [filename], {
        cwd: pythonWorkspace,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      let timedOut = false;
      const startTime = Date.now();
      
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, 30000);
      
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        error += data.toString();
      });
      
      const result = await new Promise<{ output: string; error: string; exitCode: number; duration: number }>((resolve) => {
        child.on('close', (code) => {
          clearTimeout(timeoutHandle);
          resolve({
            output: output.trim(),
            error: timedOut ? 'Execution timed out' : error.trim(),
            exitCode: timedOut ? -1 : (code || 0),
            duration: Date.now() - startTime
          });
        });
        
        child.on('error', (err) => {
          clearTimeout(timeoutHandle);
          resolve({
            output: '',
            error: err.message,
            exitCode: -1,
            duration: Date.now() - startTime
          });
        });
      });
      
      // Store in memory if key provided
      if (memoryKey && memoryInstance) {
        await memoryInstance.set(memoryKey, {
          code,
          result: result.output,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error || null,
        exitCode: result.exitCode,
        duration: result.duration,
        filename,
        workspace: pythonWorkspace,
        type: 'python_codeact',
        timestamp: new Date().toISOString(),
        memoryKey: memoryKey || null
      };
      
    } catch (error) {
      console.error('PythonCodeAct error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'python_codeact',
        timestamp: new Date().toISOString()
      };
    }
  }
});

// Shell CodeAct Tool
export const shellCodeActTool = tool({
  description: 'Execute shell scripts in a sandboxed environment',
  parameters: z.object({
    code: z.string().describe('The shell script code to execute'),
    shell: z.enum(['bash', 'sh', 'zsh']).optional().default('bash').describe('Shell to use for execution'),
    memoryKey: z.string().optional().describe('Key to store/retrieve execution results in memory'),
    saveToFile: z.string().optional().describe('Filename to save the script to (optional)')
  }),
  execute: async ({ code, shell = 'bash', memoryKey, saveToFile }) => {
    console.log(`🔧 ShellCodeAct: Executing ${shell} script`);
    
    try {
      await ensureCodeActWorkspace();
      const shellWorkspace = path.join(CODEACT_WORKSPACE, 'shell');
      
      // Save code to file if requested
      let filename = 'temp_script.sh';
      if (saveToFile) {
        filename = saveToFile.endsWith('.sh') ? saveToFile : `${saveToFile}.sh`;
      }
      
      const scriptPath = validateWorkspacePath(filename, 'shell');
      await fs.writeFile(scriptPath, code);
      
      // Make script executable
      await fs.chmod(scriptPath, 0o755);
      
      // Execute the script
      console.log(`⚡ Running ${shell} script: ${filename}`);
      const result = await executeCode(shell, [filename], shellWorkspace);
      
      // Store in memory if key provided
      if (memoryKey && memoryInstance) {
        await memoryInstance.set(memoryKey, {
          code,
          result: result.output,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error || null,
        exitCode: result.exitCode,
        duration: result.duration,
        filename,
        shell,
        workspace: shellWorkspace,
        type: 'shell_codeact',
        timestamp: new Date().toISOString(),
        memoryKey: memoryKey || null
      };
      
    } catch (error) {
      console.error('ShellCodeAct error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'shell_codeact',
        timestamp: new Date().toISOString()
      };
    }
  }
});

// CodeAct Memory Tool
export const codeActMemoryTool = tool({
  description: 'Manage persistent memory for CodeAct executions',
  parameters: z.object({
    action: z.enum(['get', 'set', 'delete', 'clear', 'list']).describe('Memory operation to perform'),
    key: z.string().optional().describe('Memory key (required for get/set/delete)'),
    value: z.any().optional().describe('Value to store (required for set)')
  }),
  execute: async ({ action, key, value }) => {
    console.log(`🧠 CodeActMemory: ${action} operation`);
    
    try {
      await ensureCodeActWorkspace();
      
      if (!memoryInstance) {
        throw new Error('Memory not initialized');
      }
      
      switch (action) {
        case 'get':
          if (!key) throw new Error('Key required for get operation');
          const data = await memoryInstance.get(key);
          return {
            success: true,
            action: 'get',
            key,
            value: data,
            found: data !== undefined,
            timestamp: new Date().toISOString()
          };
          
        case 'set':
          if (!key) throw new Error('Key required for set operation');
          if (value === undefined) throw new Error('Value required for set operation');
          await memoryInstance.set(key, value);
          return {
            success: true,
            action: 'set',
            key,
            value,
            timestamp: new Date().toISOString()
          };
          
        case 'delete':
          if (!key) throw new Error('Key required for delete operation');
          await memoryInstance.delete(key);
          return {
            success: true,
            action: 'delete',
            key,
            timestamp: new Date().toISOString()
          };
          
        case 'clear':
          await memoryInstance.clear();
          return {
            success: true,
            action: 'clear',
            timestamp: new Date().toISOString()
          };
          
        case 'list':
          // Return all keys (not values for privacy)
          const memory = (memoryInstance as any).memory;
          const keys = Object.keys(memory);
          return {
            success: true,
            action: 'list',
            keys,
            count: keys.length,
            timestamp: new Date().toISOString()
          };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error('CodeActMemory error:', error);
      return {
        success: false,
        action,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
});

// Export all CodeAct tools
export const codeActTools = {
  node_codeact: nodeCodeActTool,
  python_codeact: pythonCodeActTool,
  shell_codeact: shellCodeActTool,
  codeact_memory: codeActMemoryTool
};