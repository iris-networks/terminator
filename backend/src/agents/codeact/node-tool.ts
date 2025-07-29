import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { executeCode } from './execution.js';
import { ensureCodeActWorkspace, validateWorkspacePath, CODEACT_WORKSPACE } from './utils.js';
import { CodeActMemory } from './memory.js';

export const nodeCodeActTool = tool({
  description: 'Execute Node.js/JavaScript code in a sandboxed environment with dependency management',
  parameters: z.object({
    code: z.string().describe('Node.js/JavaScript code to execute'),
    dependencies: z.array(z.string()).optional().describe('NPM packages to install before execution'),
    filename: z.string().optional().default('code.mjs').describe('Filename for the code file'),
    timeout: z.number().optional().default(30000).describe('Timeout in milliseconds'),
    saveToMemory: z.string().optional().describe('Key to save the execution result to memory')
  }),
  execute: async ({ code, dependencies, filename, timeout, saveToMemory }) => {
    console.log('🟢 Executing Node.js code');
    
    try {
      await ensureCodeActWorkspace();
      const nodeWorkspace = path.join(CODEACT_WORKSPACE, 'node');
      const memory = new CodeActMemory(CODEACT_WORKSPACE);
      
      // Install dependencies if provided
      if (dependencies && dependencies.length > 0) {
        console.log(`📦 Installing dependencies: ${dependencies.join(', ')}`);
        
        const installResult = await executeCode(
          'npm',
          ['install', ...dependencies],
          nodeWorkspace,
          60000 // Longer timeout for installations
        );
        
        if (installResult.exitCode !== 0) {
          console.warn('Dependency installation failed:', installResult.error);
        }
      }
      
      // Write code to file
      const codePath = validateWorkspacePath(filename, 'node');
      await fs.writeFile(codePath, code);
      
      // Execute the code
      const result = await executeCode('node', [filename], nodeWorkspace, timeout);
      
      // Save to memory if requested
      if (saveToMemory) {
        await memory.set(saveToMemory, {
          code,
          result,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        language: 'node',
        code,
        filename,
        dependencies: dependencies || [],
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration: result.duration,
        success: result.exitCode === 0,
        timestamp: new Date().toISOString(),
        savedToMemory: saveToMemory || null
      };
      
    } catch (error) {
      console.error('Node.js execution error:', error);
      return {
        language: 'node',
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