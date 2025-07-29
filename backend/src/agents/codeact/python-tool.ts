import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { executeCode } from './execution.js';
import { ensureCodeActWorkspace, validateWorkspacePath, CODEACT_WORKSPACE } from './utils.js';
import { CodeActMemory } from './memory.js';

export const pythonCodeActTool = tool({
  description: 'Execute Python code in a sandboxed environment with package management',
  parameters: z.object({
    code: z.string().describe('Python code to execute'),
    packages: z.array(z.string()).optional().describe('Python packages to install before execution'),
    filename: z.string().optional().default('code.py').describe('Filename for the code file'),
    timeout: z.number().optional().default(30000).describe('Timeout in milliseconds'),
    pythonVersion: z.enum(['python', 'python3']).optional().default('python3').describe('Python interpreter to use'),
    saveToMemory: z.string().optional().describe('Key to save the execution result to memory')
  }),
  execute: async ({ code, packages, filename, timeout, pythonVersion, saveToMemory }) => {
    console.log('🐍 Executing Python code');
    
    try {
      await ensureCodeActWorkspace();
      const pythonWorkspace = path.join(CODEACT_WORKSPACE, 'python');
      const memory = new CodeActMemory(CODEACT_WORKSPACE);
      
      // Install packages if provided
      if (packages && packages.length > 0) {
        console.log(`📦 Installing packages: ${packages.join(', ')}`);
        
        const installResult = await executeCode(
          'pip',
          ['install', ...packages],
          pythonWorkspace,
          60000 // Longer timeout for installations
        );
        
        if (installResult.exitCode !== 0) {
          console.warn('Package installation failed:', installResult.error);
        }
      }
      
      // Write code to file
      const codePath = validateWorkspacePath(filename, 'python');
      await fs.writeFile(codePath, code);
      
      // Execute the code
      const result = await executeCode(pythonVersion, [filename], pythonWorkspace, timeout);
      
      // Save to memory if requested
      if (saveToMemory) {
        await memory.set(saveToMemory, {
          code,
          result,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        language: 'python',
        code,
        filename,
        packages: packages || [],
        pythonVersion,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration: result.duration,
        success: result.exitCode === 0,
        timestamp: new Date().toISOString(),
        savedToMemory: saveToMemory || null
      };
      
    } catch (error) {
      console.error('Python execution error:', error);
      return {
        language: 'python',
        code,
        filename,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        duration: 0,
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  },
});