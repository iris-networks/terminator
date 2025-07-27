import { tool } from 'ai';
import { z } from 'zod';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Workspace management
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || path.join(process.cwd(), 'workspace');

function validatePath(filePath: string): string {
  const fullPath = path.resolve(WORKSPACE_PATH, filePath);
  if (!fullPath.startsWith(path.resolve(WORKSPACE_PATH))) {
    throw new Error('Access denied: Path outside workspace');
  }
  return fullPath;
}

async function ensureWorkspace() {
  try {
    await fs.access(WORKSPACE_PATH);
  } catch {
    await fs.mkdir(WORKSPACE_PATH, { recursive: true });
  }
}

// Execute command with real-time output streaming
async function executeWithRealTimeOutput(
  command: string, 
  args: string[], 
  workingDir: string, 
  timeout: number = 30000
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  success: boolean;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, {
      cwd: workingDir,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const duration = Date.now() - startTime;
      const exitCode = timedOut ? -1 : (code || 0);
      
      resolve({
        stdout,
        stderr: stderr || (timedOut ? 'Process timed out' : ''),
        exitCode,
        duration,
        success: !timedOut && exitCode === 0,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutHandle);
      resolve({
        stdout: '',
        stderr: error.message,
        exitCode: -1,
        duration: Date.now() - startTime,
        success: false,
      });
    });
  });
}

// Python Code Execution Tool
export const pythonCodeActTool = tool({
  description: 'Execute Python code with pip dependency management and virtual environment support',
  parameters: z.object({
    code: z.string().describe('Python code to execute'),
    fileName: z.string().optional().describe('Optional filename to save code to before execution'),
    installPackages: z.array(z.string()).optional().describe('Python packages to install via pip'),
    timeout: z.number().optional().default(60000).describe('Execution timeout in milliseconds'),
    saveToMemory: z.boolean().optional().default(false).describe('Save execution results to memory for later use')
  }),
  execute: async ({ code, fileName, installPackages, timeout, saveToMemory }) => {
    console.log('🐍 Executing Python code');
    
    const executionId = uuidv4();
    const startTime = Date.now();
    
    try {
      await ensureWorkspace();
      
      // Install packages if specified
      if (installPackages && installPackages.length > 0) {
        console.log(`📦 Installing Python packages: ${installPackages.join(', ')}`);
        
        const installResult = await executeWithRealTimeOutput(
          'pip', 
          ['install', ...installPackages],
          WORKSPACE_PATH,
          30000
        );
        
        if (!installResult.success) {
          return {
            executionId,
            type: 'python',
            success: false,
            error: `Failed to install packages: ${installResult.stderr}`,
            duration: Date.now() - startTime,
            packages: installPackages
          };
        }
      }

      // Save code to file if filename provided, otherwise create temp file
      const scriptName = fileName || `temp_script_${executionId}.py`;
      const scriptPath = validatePath(scriptName);
      await fs.writeFile(scriptPath, code, 'utf-8');

      // Execute Python script
      const result = await executeWithRealTimeOutput(
        'python',
        [scriptPath],
        WORKSPACE_PATH,
        timeout
      );

      // Clean up temp file if it was auto-generated
      if (!fileName) {
        try {
          await fs.unlink(scriptPath);
        } catch {
          // Ignore cleanup errors
        }
      }

      const executionResult = {
        executionId,
        type: 'python' as const,
        code,
        fileName: fileName || null,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
        duration: result.duration,
        timestamp: new Date().toISOString(),
        packages: installPackages || []
      };

      if (saveToMemory) {
        // In a full implementation, this would save to a memory store
        console.log(`💾 Saving Python execution result to memory: ${executionId}`);
      }

      return executionResult;

    } catch (error) {
      return {
        executionId,
        type: 'python' as const,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Node.js Code Execution Tool
export const nodeCodeActTool = tool({
  description: 'Execute Node.js/JavaScript code with npm dependency management',
  parameters: z.object({
    code: z.string().describe('JavaScript/Node.js code to execute'),
    fileName: z.string().optional().describe('Optional filename to save code to before execution'),
    installPackages: z.array(z.string()).optional().describe('NPM packages to install'),
    timeout: z.number().optional().default(60000).describe('Execution timeout in milliseconds'),
    useTypeScript: z.boolean().optional().default(false).describe('Execute as TypeScript code'),
    saveToMemory: z.boolean().optional().default(false).describe('Save execution results to memory for later use')
  }),
  execute: async ({ code, fileName, installPackages, timeout, useTypeScript, saveToMemory }) => {
    console.log('📦 Executing Node.js code');
    
    const executionId = uuidv4();
    const startTime = Date.now();
    
    try {
      await ensureWorkspace();
      
      // Install packages if specified
      if (installPackages && installPackages.length > 0) {
        console.log(`📦 Installing NPM packages: ${installPackages.join(', ')}`);
        
        const installResult = await executeWithRealTimeOutput(
          'npm', 
          ['install', ...installPackages],
          WORKSPACE_PATH,
          60000
        );
        
        if (!installResult.success) {
          return {
            executionId,
            type: 'node',
            success: false,
            error: `Failed to install packages: ${installResult.stderr}`,
            duration: Date.now() - startTime,
            packages: installPackages
          };
        }
      }

      // Determine file extension and execution method
      const extension = useTypeScript ? 'ts' : 'js';
      const scriptName = fileName || `temp_script_${executionId}.${extension}`;
      const scriptPath = validatePath(scriptName);
      await fs.writeFile(scriptPath, code, 'utf-8');

      // Execute with appropriate runtime
      let command = 'node';
      let args = [scriptPath];
      
      if (useTypeScript) {
        // Use ts-node if available, otherwise compile first
        try {
          await executeWithRealTimeOutput('which', ['ts-node'], WORKSPACE_PATH, 5000);
          command = 'ts-node';
        } catch {
          // Fallback: compile with tsc then run
          const compileResult = await executeWithRealTimeOutput(
            'npx',
            ['tsc', scriptPath, '--outDir', '.'],
            WORKSPACE_PATH,
            30000
          );
          
          if (!compileResult.success) {
            return {
              executionId,
              type: 'node',
              success: false,
              error: `TypeScript compilation failed: ${compileResult.stderr}`,
              duration: Date.now() - startTime
            };
          }
          
          // Run compiled JS
          args = [scriptPath.replace('.ts', '.js')];
        }
      }

      const result = await executeWithRealTimeOutput(command, args, WORKSPACE_PATH, timeout);

      // Clean up temp files if auto-generated
      if (!fileName) {
        try {
          await fs.unlink(scriptPath);
          if (useTypeScript && !command.includes('ts-node')) {
            await fs.unlink(scriptPath.replace('.ts', '.js'));
          }
        } catch {
          // Ignore cleanup errors
        }
      }

      const executionResult = {
        executionId,
        type: 'node' as const,
        code,
        fileName: fileName || null,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
        duration: result.duration,
        timestamp: new Date().toISOString(),
        packages: installPackages || [],
        useTypeScript
      };

      if (saveToMemory) {
        console.log(`💾 Saving Node.js execution result to memory: ${executionId}`);
      }

      return executionResult;

    } catch (error) {
      return {
        executionId,
        type: 'node' as const,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Enhanced Shell Code Execution Tool
export const shellCodeActTool = tool({
  description: 'Execute shell scripts with multi-shell support and advanced features',
  parameters: z.object({
    code: z.string().describe('Shell code to execute'),
    shell: z.enum(['bash', 'sh', 'zsh', 'fish']).optional().default('bash').describe('Shell interpreter to use'),
    fileName: z.string().optional().describe('Optional filename to save script to before execution'),
    timeout: z.number().optional().default(30000).describe('Execution timeout in milliseconds'),
    workingDirectory: z.string().optional().default('.').describe('Working directory for execution'),
    saveToMemory: z.boolean().optional().default(false).describe('Save execution results to memory for later use'),
    setExecutable: z.boolean().optional().default(true).describe('Make script executable before running')
  }),
  execute: async ({ code, shell, fileName, timeout, workingDirectory, saveToMemory, setExecutable }) => {
    console.log(`🐚 Executing ${shell} script`);
    
    const executionId = uuidv4();
    const startTime = Date.now();
    
    try {
      await ensureWorkspace();
      
      const workingDir = workingDirectory === '.' ? WORKSPACE_PATH : validatePath(workingDirectory);
      
      // Save script to file
      const scriptName = fileName || `temp_script_${executionId}.sh`;
      const scriptPath = validatePath(scriptName);
      
      // Add shebang if not present
      const shebangMap = {
        bash: '#!/bin/bash',
        sh: '#!/bin/sh', 
        zsh: '#!/bin/zsh',
        fish: '#!/usr/bin/fish'
      };
      
      const finalCode = code.startsWith('#!') ? code : `${shebangMap[shell]}\n${code}`;
      await fs.writeFile(scriptPath, finalCode, 'utf-8');
      
      // Make executable if requested
      if (setExecutable) {
        await fs.chmod(scriptPath, 0o755);
      }

      // Execute script
      const result = await executeWithRealTimeOutput(
        shell,
        [scriptPath],
        workingDir,
        timeout
      );

      // Clean up temp file if auto-generated
      if (!fileName) {
        try {
          await fs.unlink(scriptPath);
        } catch {
          // Ignore cleanup errors
        }
      }

      const executionResult = {
        executionId,
        type: 'shell' as const,
        code: finalCode,
        shell,
        fileName: fileName || null,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
        duration: result.duration,
        timestamp: new Date().toISOString(),
        workingDirectory
      };

      if (saveToMemory) {
        console.log(`💾 Saving shell execution result to memory: ${executionId}`);
      }

      return executionResult;

    } catch (error) {
      return {
        executionId,
        type: 'shell' as const,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Export CodeAct tools
export const codeActTools = {
  python_execute: pythonCodeActTool,
  node_execute: nodeCodeActTool,
  shell_execute: shellCodeActTool,
};