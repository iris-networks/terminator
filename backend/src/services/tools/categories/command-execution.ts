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
import { spawn } from 'child_process';
import os from 'os';
import { WORKSPACE_PATH } from '../core/constants.js';
import { ensureWorkspace, validatePath } from '../core/security.js';
import type { CommandResult } from '../core/types.js';

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
    
    try {
      await ensureWorkspace();
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

      // Determine shell and arguments based on platform
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
        // Unix-like systems - try to find the requested shell
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

      return new Promise<CommandResult>((resolve) => {
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let exitCode = 0;
        let signal: string | null = null;
        let timedOut = false;

        // Spawn the process
        const child = spawn(shellExecutable, shellArgs, {
          cwd: resolvedWorkingDir,
          env: { 
            ...process.env, 
            PATH: process.env.PATH,
            HOME: os.homedir(),
            USER: os.userInfo().username 
          },
          stdio: ['pipe', 'pipe', 'pipe']
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

        // Collect output
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code, sig) => {
          clearTimeout(timeoutHandle);
          exitCode = code || 0;
          signal = sig;
          
          const duration = Date.now() - startTime;
          
          const result: CommandResult = {
            success: !timedOut && exitCode === 0,
            output: stdout,
            error: stderr || (timedOut ? 'Command timed out' : undefined),
            exitCode
          };

          // Extended result with metadata
          const extendedResult = {
            ...result,
            command,
            workingDirectory: resolvedWorkingDir,
            shell: shellExecutable,
            signal: signal || null,
            duration,
            timestamp: new Date().toISOString(),
            timedOut
          };

          resolve(extendedResult);
        });

        child.on('error', (error) => {
          clearTimeout(timeoutHandle);
          
          const result: CommandResult = {
            success: false,
            output: '',
            error: error.message,
            exitCode: -1
          };

          const extendedResult = {
            ...result,
            command,
            workingDirectory: resolvedWorkingDir,
            shell: shellExecutable,
            signal: null,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            timedOut: false
          };

          resolve(extendedResult);
        });
      });

    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        command,
        workingDirectory,
        shell,
        signal: null,
        duration: 0,
        timestamp: new Date().toISOString(),
        timedOut: false
      };
    }
  },
});