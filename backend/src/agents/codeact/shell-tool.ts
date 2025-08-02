/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { tool } from 'ai';
import { z } from 'zod';
import path from 'path';
import { executeCode } from './execution.js';
import { ensureCodeActWorkspace, CODEACT_WORKSPACE } from './utils.js';
import { CodeActMemory } from './memory.js';

export const shellCodeActTool = tool({
  description: 'Execute shell commands in a sandboxed environment',
  parameters: z.object({
    command: z.string().describe('Shell command to execute'),
    shell: z.enum(['bash', 'sh', 'zsh']).optional().default('bash').describe('Shell to use'),
    timeout: z.number().optional().default(30000).describe('Timeout in milliseconds'),
    saveToMemory: z.string().optional().describe('Key to save the execution result to memory')
  }),
  execute: async ({ command, shell, timeout, saveToMemory }) => {
    console.log(`🐚 Executing shell command: ${command}`);
    
    try {
      await ensureCodeActWorkspace();
      const shellWorkspace = path.join(CODEACT_WORKSPACE, 'shell');
      const memory = new CodeActMemory(CODEACT_WORKSPACE);
      
      // Security: Block dangerous commands
      const dangerousCommands = [
        'rm -rf /',
        'dd if=',
        'mkfs',
        'fdisk',
        'format',
        ':(){ :|:& };:',
        'sudo',
        'su -'
      ];
      
      const lowerCommand = command.toLowerCase();
      for (const dangerous of dangerousCommands) {
        if (lowerCommand.includes(dangerous)) {
          throw new Error(`Command blocked for security: contains "${dangerous}"`);
        }
      }
      
      // Execute the command
      const result = await executeCode(shell, ['-c', command], shellWorkspace, timeout);
      
      // Save to memory if requested
      if (saveToMemory) {
        await memory.set(saveToMemory, {
          command,
          result,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        language: 'shell',
        command,
        shell,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration: result.duration,
        success: result.exitCode === 0,
        timestamp: new Date().toISOString(),
        savedToMemory: saveToMemory || null
      };
      
    } catch (error) {
      console.error('Shell execution error:', error);
      return {
        language: 'shell',
        command,
        shell,
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